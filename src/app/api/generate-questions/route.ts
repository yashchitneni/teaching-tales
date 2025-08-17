import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { QuestionGenerationService, SectionQuestionGenInput, SectionQuestionsResult, AIServiceError } from '@/lib/ai';
import { FEATURE_FLAGS } from '@/lib/config';
import { TelemetryService } from '@/lib/services/telemetry-service';

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

/**
 * POST /api/generate-questions
 * 
 * Generates comprehension questions for a specific story section
 * 
 * @route POST /api/generate-questions
 * @auth Required (TimeBack cookie or Bearer token)
 * @feature Gated by QTI_SPLIT_GENERATION_ENABLED flag (fail-fast)
 * 
 * @body {SectionQuestionGenInput} Section content and generation parameters
 * @returns {SectionQuestionsResult} Generated questions with metadata
 * 
 * @example Request:
 * ```json
 * {
 *   "sectionContent": "Alice found a mysterious door in the enchanted forest...",
 *   "sectionIndex": 0,
 *   "gradeLevel": "4-5",
 *   "constraints": {
 *     "questionCount": 2,
 *     "questionTypes": ["comprehension", "inference"]
 *   },
 *   "storyMetadata": {
 *     "universe": "Fantasy Adventure",
 *     "character": "Alice",
 *     "spark": "Mysterious Door",
 *     "studentId": "student-123"
 *   }
 * }
 * ```
 * 
 * @example Success Response:
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "sectionIndex": 0,
 *     "questions": [
 *       {
 *         "id": "q1",
 *         "type": "multiple_choice",
 *         "question": "What did Alice find in the forest?",
 *         "options": ["A door", "A key", "A rabbit", "A tree"],
 *         "correct": 0,
 *         "explanation": "The text states Alice found a mysterious door.",
 *         "questionType": "comprehension",
 *         "difficultyLevel": 2
 *       }
 *     ],
 *     "metadata": {
 *       "generationTimeMs": 1500,
 *       "modelUsed": "gemini-2.0-flash",
 *       "retryCount": 0,
 *       "validationPassed": true
 *     }
 *   }
 * }
 * ```
 * 
 * @example Error Response:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Split question generation is not enabled",
 *     "code": "FEATURE_DISABLED"
 *   }
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  // Declare these at function scope so they're available in catch block
  const requestId = crypto.randomUUID();
  const requestStartTime = Date.now();
  
  try {
    // Feature flag check (fail fast - before any processing)
    if (!FEATURE_FLAGS.QTI_SPLIT_GENERATION_ENABLED) {
      console.log('⚠️ Split generation disabled by feature flag', {
        requestId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Split question generation is not enabled',
            code: 'FEATURE_DISABLED'
          } 
        },
        { status: 501 } // Not Implemented
      );
    }
    
    console.log('🚀 Split generation enabled, processing request:', {
      flagEnabled: FEATURE_FLAGS.QTI_SPLIT_GENERATION_ENABLED,
      requestId,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...',
      origin: request.headers.get('origin'),
      contentLength: request.headers.get('content-length')
    });

    // Authentication implementation (Task 3.3)
    // Get token from cookie or header (following /api/generate-story pattern)
    const cookieStore = await cookies();
    let token = cookieStore.get('timeback-access-token')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      console.log('❌ Authentication failed: No token provided', {
        requestId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { success: false, error: { message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Validate token with TimeBack API
    let userData;
    try {
      const userResponse = await fetch(`${TIMEBACK_API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!userResponse.ok) {
        console.log('❌ Authentication failed: TimeBack API rejected token', {
          requestId,
          status: userResponse.status,
          statusText: userResponse.statusText,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json(
          { success: false, error: { message: 'Invalid or expired token' } },
          { status: 401 }
        );
      }

      userData = await userResponse.json();
      
      if (!userData.success || !userData.data) {
        console.log('❌ Authentication failed: Invalid user data from TimeBack', {
          requestId,
          hasSuccess: !!userData.success,
          hasData: !!userData.data,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json(
          { success: false, error: { message: 'Invalid or expired token' } },
          { status: 401 }
        );
      }

    } catch (error: any) {
      console.error('❌ Authentication failed: TimeBack API error', {
        requestId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { success: false, error: { message: 'Authentication service unavailable' } },
        { status: 503 }
      );
    }

    // Extract user information for logging and request processing
    const timebackUser = userData.data.user;
    const authenticatedUser = {
      id: timebackUser.id || timebackUser.cognitoId,
      email: timebackUser.email,
      cognitoId: timebackUser.cognitoId,
      role: timebackUser.role === 'student' ? 'student' : 'student', // Always map to student for our app
      name: timebackUser.name || timebackUser.email?.split('@')[0],
    };

    console.log('✅ Authentication successful', {
      requestId,
      userId: authenticatedUser.id,
      userEmail: authenticatedUser.email?.substring(0, 3) + '***', // PII redaction
      timestamp: new Date().toISOString()
    });

    // Request validation and processing (Task 3.4)
    let body: SectionQuestionGenInput;
    try {
      body = await request.json();
    } catch (error) {
      console.log('❌ Request parsing failed: Invalid JSON', {
        requestId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Invalid JSON in request body',
            code: 'INVALID_JSON'
          } 
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.sectionContent || !body.gradeLevel || typeof body.sectionIndex !== 'number') {
      console.log('❌ Request validation failed: Missing required fields', {
        requestId,
        hasSectionContent: !!body.sectionContent,
        hasGradeLevel: !!body.gradeLevel,
        sectionIndexType: typeof body.sectionIndex,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Missing required fields',
            details: 'sectionContent, gradeLevel, and sectionIndex are required',
            code: 'MISSING_REQUIRED_FIELDS'
          } 
        },
        { status: 400 }
      );
    }

    // Input sanitization for security
    // Sanitize section content length
    if (body.sectionContent.length > 10000) {
      console.log('❌ Request validation failed: Section content too long', {
        requestId,
        contentLength: body.sectionContent.length,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Section content too long (max 10000 characters)',
            code: 'CONTENT_TOO_LONG'
          } 
        },
        { status: 400 }
      );
    }

    if (body.sectionContent.length < 10) {
      console.log('❌ Request validation failed: Section content too short', {
        requestId,
        contentLength: body.sectionContent.length,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Section content too short (min 10 characters)',
            code: 'CONTENT_TOO_SHORT'
          } 
        },
        { status: 400 }
      );
    }

    // Validate sectionIndex bounds
    if (body.sectionIndex < 0 || body.sectionIndex > 100) {
      console.log('❌ Request validation failed: Invalid section index', {
        requestId,
        sectionIndex: body.sectionIndex,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Invalid section index (must be between 0 and 100)',
            code: 'INVALID_SECTION_INDEX'
          } 
        },
        { status: 400 }
      );
    }

    // Validate grade level format using existing patterns
    const validGradeLevels = ['K-1', '2-3', '4-5', '6-8'];
    if (!validGradeLevels.includes(body.gradeLevel)) {
      console.log('❌ Request validation failed: Invalid grade level', {
        requestId,
        gradeLevel: body.gradeLevel,
        validGradeLevels,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: `Invalid grade level. Must be one of: ${validGradeLevels.join(', ')}`,
            code: 'INVALID_GRADE_LEVEL'
          } 
        },
        { status: 400 }
      );
    }

    // Sanitize optional constraints if provided
    if (body.constraints) {
      // Validate questionCount
      if (body.constraints.questionCount !== undefined) {
        if (typeof body.constraints.questionCount !== 'number' || 
            body.constraints.questionCount < 1 || 
            body.constraints.questionCount > 5) {
          console.log('❌ Request validation failed: Invalid question count', {
            requestId,
            questionCount: body.constraints.questionCount,
            timestamp: new Date().toISOString()
          });
          return NextResponse.json(
            { 
              success: false, 
              error: { 
                message: 'Invalid question count (must be between 1 and 5)',
                code: 'INVALID_QUESTION_COUNT'
              } 
            },
            { status: 400 }
          );
        }
      }

      // Validate questionTypes
      if (body.constraints.questionTypes) {
        const validTypes = ['comprehension', 'vocabulary', 'inference'];
        const invalidTypes = body.constraints.questionTypes.filter(type => !validTypes.includes(type));
        if (invalidTypes.length > 0) {
          console.log('❌ Request validation failed: Invalid question types', {
            requestId,
            invalidTypes,
            validTypes,
            timestamp: new Date().toISOString()
          });
          return NextResponse.json(
            { 
              success: false, 
              error: { 
                message: `Invalid question types: ${invalidTypes.join(', ')}. Valid types: ${validTypes.join(', ')}`,
                code: 'INVALID_QUESTION_TYPES'
              } 
            },
            { status: 400 }
          );
        }
      }

      // Validate length constraints
      if (body.constraints.maxQuestionLength !== undefined) {
        if (typeof body.constraints.maxQuestionLength !== 'number' || 
            body.constraints.maxQuestionLength < 10 || 
            body.constraints.maxQuestionLength > 500) {
          return NextResponse.json(
            { 
              success: false, 
              error: { 
                message: 'Invalid maxQuestionLength (must be between 10 and 500)',
                code: 'INVALID_MAX_QUESTION_LENGTH'
              } 
            },
            { status: 400 }
          );
        }
      }

      if (body.constraints.maxOptionLength !== undefined) {
        if (typeof body.constraints.maxOptionLength !== 'number' || 
            body.constraints.maxOptionLength < 5 || 
            body.constraints.maxOptionLength > 200) {
          return NextResponse.json(
            { 
              success: false, 
              error: { 
                message: 'Invalid maxOptionLength (must be between 5 and 200)',
                code: 'INVALID_MAX_OPTION_LENGTH'
              } 
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate optional storyMetadata if provided
    if (body.storyMetadata) {
      const requiredMetadataFields = ['universe', 'character', 'spark', 'studentId'];
      const missingFields = requiredMetadataFields.filter(field => !body.storyMetadata![field]);
      if (missingFields.length > 0) {
        console.log('❌ Request validation failed: Incomplete story metadata', {
          requestId,
          missingFields,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: `Missing required story metadata fields: ${missingFields.join(', ')}`,
              code: 'INCOMPLETE_STORY_METADATA'
            } 
          },
          { status: 400 }
        );
      }
    }

    // Enhanced request/response size logging for monitoring
    const requestSizeBytes = JSON.stringify(body).length;
    const contentWords = body.sectionContent.split(/\s+/).length;
    
    console.log('✅ Request validation successful', {
      requestId,
      sectionIndex: body.sectionIndex,
      gradeLevel: body.gradeLevel,
      contentLength: body.sectionContent.length,
      contentWords: contentWords,
      requestSizeBytes: requestSizeBytes,
      hasConstraints: !!body.constraints,
      hasStoryMetadata: !!body.storyMetadata,
      constraintDetails: body.constraints ? {
        questionCount: body.constraints.questionCount,
        questionTypes: body.constraints.questionTypes?.join(','),
        hasLengthLimits: !!(body.constraints.maxQuestionLength || body.constraints.maxOptionLength)
      } : null,
      // PII-safe story metadata logging
      storyMetadataDetails: body.storyMetadata ? {
        universe: body.storyMetadata.universe,
        character: body.storyMetadata.character,
        spark: body.storyMetadata.spark,
        studentId: body.storyMetadata.studentId.substring(0, 8) + '***' // PII redaction
      } : null,
      timestamp: new Date().toISOString()
    });

    // PHASE 8.1: Track question generation request
    TelemetryService.trackUserEvent({
      category: 'question_generation',
      action: 'questions_request_started',
      sectionIndex: body.sectionIndex,
      gradeLevel: body.gradeLevel,
      stimulusId: body.storyMetadata?.studentId ? `${body.storyMetadata.studentId}_${body.sectionIndex}` : undefined,
      properties: {
        requestId,
        contentWords,
        asyncMode: true, // This is the async generation endpoint
        hasConstraints: !!body.constraints,
        questionCount: body.constraints?.questionCount || 'default'
      }
    });

    // Service integration (Task 3.5)
    // Initialize service instance
    const questionService = new QuestionGenerationService();

    // Call service with validated input and capture timing
    const serviceStartTime = Date.now();
    let result: SectionQuestionsResult;
    
    try {
      console.log('🔄 Calling QuestionGenerationService', {
        requestId,
        sectionIndex: body.sectionIndex,
        gradeLevel: body.gradeLevel,
        timestamp: new Date().toISOString()
      });

      result = await questionService.generateQuestionsForSection(body);

      const serviceEndTime = Date.now();
      const serviceCallDuration = serviceEndTime - serviceStartTime;

      console.log('✅ QuestionGenerationService completed successfully', {
        requestId,
        sectionIndex: result.sectionIndex,
        questionCount: result.questions.length,
        serviceCallDurationMs: serviceCallDuration,
        generationTimeMs: result.metadata.generationTimeMs,
        modelUsed: result.metadata.modelUsed,
        retryCount: result.metadata.retryCount,
        validationPassed: result.metadata.validationPassed,
        userId: authenticatedUser.id,
        timestamp: new Date().toISOString()
      });

      // Validate service response before returning
      if (!result || !result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
        console.error('❌ Invalid service response: No questions generated', {
          requestId,
          result: result ? { sectionIndex: result.sectionIndex, questionsLength: result.questions?.length } : null,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'Question generation failed - no questions produced',
              code: 'NO_QUESTIONS_GENERATED'
            } 
          },
          { status: 422 } // Unprocessable Entity
        );
      }

      // Verify questions have required structure
      const invalidQuestions = result.questions.filter(q => !q.id || !q.question || !q.explanation);
      if (invalidQuestions.length > 0) {
        console.error('❌ Invalid service response: Questions missing required fields', {
          requestId,
          invalidQuestionCount: invalidQuestions.length,
          totalQuestions: result.questions.length,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'Question generation failed - invalid question structure',
              code: 'INVALID_QUESTION_STRUCTURE'
            } 
          },
          { status: 422 }
        );
      }

      // Add performance metadata and response size logging
      const totalRequestTime = Date.now() - requestStartTime;
      const responseData = {
        success: true,
        data: {
          sectionIndex: result.sectionIndex,
          questions: result.questions,
          metadata: {
            ...result.metadata,
            serviceCallDurationMs: serviceCallDuration,
            totalRequestTimeMs: totalRequestTime,
            requestId,
            userId: authenticatedUser.id,
            timestamp: new Date().toISOString()
          }
        }
      };
      
      // Enhanced response logging with size metrics
      const responseSizeBytes = JSON.stringify(responseData).length;
      const questionWords = result.questions.reduce((total, q) => 
        total + q.question.split(/\s+/).length + (q.explanation?.split(/\s+/).length || 0), 0
      );
      
      console.log('🎉 Request completed successfully', {
        requestId,
        userId: authenticatedUser.id,
        sectionIndex: result.sectionIndex,
        questionCount: result.questions.length,
        questionWords: questionWords,
        responseSizeBytes: responseSizeBytes,
        performance: {
          totalRequestTimeMs: totalRequestTime,
          serviceCallDurationMs: serviceCallDuration,
          generationTimeMs: result.metadata.generationTimeMs,
          validationTimeMs: totalRequestTime - serviceCallDuration,
          retryCount: result.metadata.retryCount
        },
        quality: {
          modelUsed: result.metadata.modelUsed,
          validationPassed: result.metadata.validationPassed,
          avgQuestionLength: Math.round(result.questions.reduce((total, q) => total + q.question.length, 0) / result.questions.length)
        },
        rateLimit: {
          // Preparation hooks for future rate limiting
          userRequestCount: 1, // Placeholder - would be tracked per user
          ipRequestCount: 1,   // Placeholder - would be tracked per IP
          windowStart: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

      // PHASE 8.1: Track successful question generation
      TelemetryService.trackPerformanceEvent({
        category: 'question_generation',
        action: 'questions_generated',
        duration: totalRequestTime,
        processingTime: serviceCallDuration,
        sectionIndex: result.sectionIndex,
        gradeLevel: body.gradeLevel,
        stimulusId: body.storyMetadata?.studentId ? `${body.storyMetadata.studentId}_${body.sectionIndex}` : undefined,
        properties: {
          requestId,
          questionCount: result.questions.length,
          questionWords,
          modelUsed: result.metadata.modelUsed,
          retryCount: result.metadata.retryCount,
          validationPassed: result.metadata.validationPassed,
          avgQuestionLength: Math.round(result.questions.reduce((total, q) => total + q.question.length, 0) / result.questions.length),
          asyncMode: true
        }
      });

      TelemetryService.trackLearningEvent({
        category: 'content_creation',
        action: 'questions_created',
        sectionIndex: result.sectionIndex,
        gradeLevel: body.gradeLevel,
        stimulusId: body.storyMetadata?.studentId ? `${body.storyMetadata.studentId}_${body.sectionIndex}` : undefined,
        properties: {
          requestId,
          questionCount: result.questions.length,
          questionTypes: result.questions.map(q => q.questionType || 'comprehension').join(',')
        }
      });
      
      return NextResponse.json(responseData);

    } catch (error: any) {
      const serviceEndTime = Date.now();
      const serviceCallDuration = serviceEndTime - serviceStartTime;

      // Handle service-level errors gracefully with appropriate HTTP codes
      console.error('❌ QuestionGenerationService error', {
        requestId,
        error: error.message,
        errorCode: error.code,
        errorName: error.name,
        isRetryable: error.isRetryable,
        serviceCallDurationMs: serviceCallDuration,
        userId: authenticatedUser.id,
        timestamp: new Date().toISOString()
      });

      // PHASE 8.1: Track question generation errors
      TelemetryService.trackErrorEvent({
        category: 'question_generation',
        action: 'questions_generation_failed',
        duration: serviceCallDuration,
        sectionIndex: body.sectionIndex,
        gradeLevel: body.gradeLevel,
        stimulusId: body.storyMetadata?.studentId ? `${body.storyMetadata.studentId}_${body.sectionIndex}` : undefined,
        properties: {
          requestId,
          error: error.message,
          errorCode: error.code || 'UNKNOWN_ERROR',
          errorName: error.name,
          isRetryable: error.isRetryable || false,
          asyncMode: true
        }
      });

      // Handle AIServiceError from Phase 2 service
      if (error.name === 'AIServiceError' || error.constructor.name === 'AIServiceError') {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'AI service error during question generation', 
              details: error.message,
              code: error.code || 'AI_SERVICE_ERROR',
              retryable: error.isRetryable || false
            },
            metadata: {
              serviceCallDurationMs: serviceCallDuration,
              requestId,
              timestamp: new Date().toISOString()
            }
          },
          { status: error.isRetryable ? 503 : 422 } // Service Unavailable vs Unprocessable Entity
        );
      }

      // Handle validation errors from Phase 1 validator
      if (error.name === 'ValidationError' || error.message?.includes('validation')) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'Question validation failed', 
              details: error.message,
              code: 'VALIDATION_ERROR'
            },
            metadata: {
              serviceCallDurationMs: serviceCallDuration,
              requestId,
              timestamp: new Date().toISOString()
            }
          },
          { status: 400 }
        );
      }

      // Handle timeout errors
      if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'Question generation timed out', 
              details: 'Service took too long to respond',
              code: 'GENERATION_TIMEOUT',
              retryable: true
            },
            metadata: {
              serviceCallDurationMs: serviceCallDuration,
              requestId,
              timestamp: new Date().toISOString()
            }
          },
          { status: 504 } // Gateway Timeout
        );
      }

      // Generic service error
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Question generation service error', 
            details: error.message,
            code: 'SERVICE_ERROR'
          },
          metadata: {
            serviceCallDurationMs: serviceCallDuration,
            requestId,
            timestamp: new Date().toISOString()
          }
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    // Enhanced top-level error handling with comprehensive logging
    const totalRequestTime = Date.now() - (requestStartTime || Date.now());
    
    console.error('❌ Unexpected error in generate-questions endpoint:', {
      requestId: requestId || 'unknown',
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      performance: {
        totalRequestTimeMs: totalRequestTime,
        failurePoint: 'top-level-catch'
      },
      request: {
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...',
        contentType: request.headers.get('content-type')
      },
      rateLimit: {
        // Enhanced error tracking for rate limiting decisions
        errorType: 'UNEXPECTED_ERROR',
        shouldPenalize: false // Top-level errors shouldn't count against rate limits
      },
      timestamp: new Date().toISOString()
    });

    // Enhanced error classification for top-level errors
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'Internal server error';

    // Network/connection errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      statusCode = 503;
      errorCode = 'SERVICE_UNAVAILABLE';
      errorMessage = 'Service temporarily unavailable';
    }

    // Memory/resource errors
    if (error.name === 'RangeError' || error.message?.includes('Maximum call stack')) {
      statusCode = 507;
      errorCode = 'INSUFFICIENT_STORAGE';
      errorMessage = 'Request too complex to process';
    }

    // Request parsing errors (shouldn't happen here, but safety net)
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      statusCode = 400;
      errorCode = 'MALFORMED_REQUEST';
      errorMessage = 'Request could not be processed';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: errorMessage,
          code: errorCode,
          requestId: requestId || undefined
        },
        metadata: {
          totalRequestTimeMs: totalRequestTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
}
