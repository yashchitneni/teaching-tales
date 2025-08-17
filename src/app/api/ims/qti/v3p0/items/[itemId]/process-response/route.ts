import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const payload = await request.json();
    
    console.log('🔧 [QTI] Processing item response:', { itemId, payload });

    // First, try to proxy to the upstream Timeback API
    const token = await resolveAuthToken(request);
    if (token) {
      try {
        const upstreamUrl = `${TIMEBACK_API_URL}/ims/qti/v3p0/items/${itemId}/process-response`;
        
        const upstreamResponse = await fetch(upstreamUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (upstreamResponse.ok) {
          const data = await upstreamResponse.json();
          console.log('✅ [QTI] Upstream processing successful');
          return NextResponse.json(data);
        } else {
          console.log('⚠️ [QTI] Upstream processing failed, falling back to local processing');
        }
      } catch (error) {
        console.warn('⚠️ [QTI] Upstream request failed, falling back to local processing:', error);
      }
    }

    // Fallback: Local QTI response processing
    console.log('🔄 [QTI] Using local QTI response processing');
    
    // Extract response data
    const responses = payload.responses || {};
    const attemptId = payload.attemptId;
    const responseValue = responses.RESPONSE?.[0];

    if (!responseValue) {
      return NextResponse.json({
        success: false,
        error: { message: 'No response value provided' }
      }, { status: 400 });
    }

    // Try to fetch item information from assessment-tests endpoint to get correct answer
    let correctAnswer = null;
    let maxScore = 1;
    
    try {
      // Try to find the item in existing assessments via proxy
      if (token) {
        // First get list of assessment tests
        const testsResponse = await fetch(`${TIMEBACK_API_URL}/ims/qti/v3p0/assessment-tests`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (testsResponse.ok) {
          const testsData = await testsResponse.json();
          console.log('📋 [QTI] Found assessment tests, searching for item:', itemId);
          console.log('🔍 [QTI] Available tests:', (testsData.tests || testsData.data?.tests || []).map((t: any) => t.id));
          
          // Search through tests for the item, prioritizing newer assessments
          const tests = (testsData.tests || testsData.data?.tests || [])
            .sort((a: any, b: any) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime());
          
          let foundQuestion = null;
          
          // Optimization: Search most recent assessments first (likely to contain the current question)
          const recentTests = tests.slice(0, 5); // Check newest 5 first
          const olderTests = tests.slice(5);
          
          for (const testBatch of [recentTests, olderTests]) {
            if (foundQuestion) break;
            
            for (const test of testBatch) {
              try {
                const testResponse = await fetch(`${TIMEBACK_API_URL}/ims/qti/v3p0/assessment-tests/${test.id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  }
                });
                
                if (testResponse.ok) {
                  const testData = await testResponse.json();
                  const questions = testData?.test?.metadata?.questions || 
                                  testData?.metadata?.questions || 
                                  testData?.questions || [];
                  
                  if (questions.length > 0) {
                    console.log('🔍 [QTI] Assessment', test.id, 'has questions:', questions.map((q: any) => q.id));
                  }
                  
                  foundQuestion = questions.find((q: any) => q.id === itemId);
                  if (foundQuestion) {
                    console.log('🎯 [QTI] Found matching question:', foundQuestion);
                    break;
                  }
                }
              } catch (e) {
                console.warn('⚠️ [QTI] Failed to get test details for', test.id);
              }
            }
          }
          
          if (!foundQuestion) {
            console.warn('⚠️ [QTI] Could not find question with ID:', itemId, 'in any assessment');
          }
          
          if (foundQuestion) {
            // Extract correct answer based on different possible formats
            if (typeof foundQuestion.correct === 'number') {
              // Convert 0-based index to choice identifier
              correctAnswer = `choice_${foundQuestion.correct}`;
            } else if (foundQuestion.correctResponse) {
              correctAnswer = foundQuestion.correctResponse;
            } else if (foundQuestion.interactions?.[0]?.choices) {
              const correctChoice = foundQuestion.interactions[0].choices.find((c: any) => c.correct);
              correctAnswer = correctChoice?.identifier;
            }
            
            maxScore = foundQuestion.scoring?.maxScore || 1;
            console.log('📊 [QTI] Extracted scoring info:', { correctAnswer, maxScore });
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ [QTI] Failed to retrieve item scoring info:', error);
    }

    // Process the response
    let score = 0;
    let isCorrect = false;
    
    if (correctAnswer) {
      isCorrect = responseValue === correctAnswer;
      score = isCorrect ? maxScore : 0;
    } else {
      // Fallback: assume it's correct (for now)
      console.warn('⚠️ [QTI] No correct answer found, defaulting to correct');
      isCorrect = true;
      score = maxScore;
    }

    // Construct QTI-compliant response
    const result = {
      success: true,
      data: {
        responseId: attemptId,
        submissionId: `submission-${Date.now()}`,
        itemId,
        score,
        maxScore,
        isCorrect,
        feedback: isCorrect 
          ? { type: 'correct', message: 'Correct answer!' }
          : { type: 'incorrect', message: 'Try again.' },
        outcomes: {
          SCORE: score,
          MAXSCORE: maxScore
        },
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ [QTI] Local processing result:', result);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [QTI] Item process-response error:', error);
    return NextResponse.json({
      success: false,
      error: { 
        message: 'Response processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
