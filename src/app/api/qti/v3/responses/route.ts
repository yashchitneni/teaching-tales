import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

// Resolve token from cookie or Authorization header
async function resolveAuthToken(request: NextRequest): Promise<string | undefined> {
  const cookieStore = await cookies();
  let token = cookieStore.get('timeback-access-token')?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  return token;
}

// Response validation interfaces
interface QTIResponseSubmission {
  assessmentId: string;
  studentId: string;
  itemResponses: ItemResponse[];
  sessionId?: string;
  timestamp?: string;
}

interface ItemResponse {
  itemId: string;
  responseIdentifier: string;
  response: any; // Can be string, number, array depending on interaction type
  timeSpent?: number;
  attempts?: number;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Validate request payload
function validateResponseSubmission(body: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!body.assessmentId || typeof body.assessmentId !== 'string') {
    errors.push({
      field: 'assessmentId',
      message: 'Assessment ID is required and must be a string',
      code: 'MISSING_ASSESSMENT_ID'
    });
  }

  if (!body.studentId || typeof body.studentId !== 'string') {
    errors.push({
      field: 'studentId', 
      message: 'Student ID is required and must be a string',
      code: 'MISSING_STUDENT_ID'
    });
  }

  if (!body.itemResponses || !Array.isArray(body.itemResponses) || body.itemResponses.length === 0) {
    errors.push({
      field: 'itemResponses',
      message: 'Item responses are required and must be a non-empty array',
      code: 'MISSING_ITEM_RESPONSES'
    });
  } else {
    // Validate each item response
    body.itemResponses.forEach((response: any, index: number) => {
      if (!response.itemId || typeof response.itemId !== 'string') {
        errors.push({
          field: `itemResponses[${index}].itemId`,
          message: 'Item ID is required and must be a string',
          code: 'MISSING_ITEM_ID'
        });
      }

      if (!response.responseIdentifier || typeof response.responseIdentifier !== 'string') {
        errors.push({
          field: `itemResponses[${index}].responseIdentifier`,
          message: 'Response identifier is required and must be a string',
          code: 'MISSING_RESPONSE_IDENTIFIER'
        });
      }

      if (response.response === undefined || response.response === null) {
        errors.push({
          field: `itemResponses[${index}].response`,
          message: 'Response value is required',
          code: 'MISSING_RESPONSE_VALUE'
        });
      }

      // Optional field validation
      if (response.timeSpent !== undefined && (typeof response.timeSpent !== 'number' || response.timeSpent < 0)) {
        errors.push({
          field: `itemResponses[${index}].timeSpent`,
          message: 'Time spent must be a positive number in milliseconds',
          code: 'INVALID_TIME_SPENT'
        });
      }

      if (response.attempts !== undefined && (typeof response.attempts !== 'number' || response.attempts < 1)) {
        errors.push({
          field: `itemResponses[${index}].attempts`,
          message: 'Attempts must be a positive integer',
          code: 'INVALID_ATTEMPTS'
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Process and enrich response data before sending to TimeBack
function processResponseData(responseData: QTIResponseSubmission): any {
  const processedData = {
    ...responseData,
    timestamp: responseData.timestamp || new Date().toISOString(),
    sessionId: responseData.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    itemResponses: responseData.itemResponses.map(response => ({
      ...response,
      submittedAt: new Date().toISOString(),
      // Add default values for optional fields
      timeSpent: response.timeSpent || 0,
      attempts: response.attempts || 1,
      // Ensure response is properly formatted
      response: typeof response.response === 'string' ? response.response.trim() : response.response
    }))
  };

  return processedData;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 QTI Response submission received');

    // Authentication check
    const token = await resolveAuthToken(request);
    if (!token) {
      console.error('❌ No authentication token found');
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Authentication required',
            code: 'UNAUTHORIZED' 
          } 
        },
        { status: 401 }
      );
    }

    // Parse request body
    let body: QTIResponseSubmission;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Invalid JSON in request body:', parseError);
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

    console.log('🔍 Validating response submission:', {
      assessmentId: body.assessmentId,
      studentId: body.studentId,
      itemCount: body.itemResponses?.length || 0
    });

    // Validate request payload
    const validation = validateResponseSubmission(body);
    if (!validation.isValid) {
      console.error('❌ Validation failed:', validation.errors);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validation.errors
          }
        },
        { status: 400 }
      );
    }

    // Process and enrich the response data
    const processedData = processResponseData(body);
    
    console.log('📤 Sending processed response to TimeBack QTI API...');

    // Submit to TimeBack QTI API (IMS v3p0)
    const timebackResponse = await fetch(`${TIMEBACK_API_URL}/ims/qti/v3p0/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processedData)
    });

    const responseData = await timebackResponse.json();

    if (!timebackResponse.ok) {
      console.error('❌ TimeBack API error:', {
        status: timebackResponse.status,
        statusText: timebackResponse.statusText,
        error: responseData
      });
      
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to store response in QTI system',
            code: 'QTI_STORAGE_ERROR',
            details: responseData
          }
        },
        { status: timebackResponse.status }
      );
    }

    console.log('✅ Response successfully stored in QTI system');

    // Return success response with confirmation
    return NextResponse.json({
      success: true,
      data: {
        responseId: responseData.id || responseData.responseId,
        submissionId: processedData.sessionId,
        assessmentId: body.assessmentId,
        studentId: body.studentId,
        itemCount: body.itemResponses.length,
        timestamp: processedData.timestamp,
        message: 'Response successfully recorded'
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in QTI response endpoint:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error while processing response',
          code: 'INTERNAL_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve responses (optional, for debugging/admin)
export async function GET(request: NextRequest) {
  try {
    const token = await resolveAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId');
    const studentId = searchParams.get('studentId');

    if (!assessmentId && !studentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Either assessmentId or studentId parameter is required',
            code: 'MISSING_PARAMETERS'
          }
        },
        { status: 400 }
      );
    }

    // Build query parameters for TimeBack API
    const queryParams = new URLSearchParams();
    if (assessmentId) queryParams.set('assessmentId', assessmentId);
    if (studentId) queryParams.set('studentId', studentId);

    const timebackResponse = await fetch(
      `${TIMEBACK_API_URL}/ims/qti/v3p0/responses?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await timebackResponse.json();

    if (!timebackResponse.ok) {
      return NextResponse.json(
        { success: false, error: data },
        { status: timebackResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('❌ Error retrieving QTI responses:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
