import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { QTIGenerator } from '@/lib/qti/generators/qti-generator';

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

// Assessment response interfaces
interface AssessmentMetadata {
  id: string;
  identifier: string;
  title: string;
  itemCount: number;
  sectionCount: number;
  language: string;
  toolName?: string;
  toolVersion?: string;
  duration?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface QTIAssessmentResponse {
  assessment: AssessmentMetadata;
  xml?: string;
  sections?: any[];
  items?: any[];
  metadata?: Record<string, any>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📖 Loading QTI assessment:', params.id);

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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // 'json', 'xml', 'full'
    const includeItems = searchParams.get('includeItems') === 'true';
    const includeSections = searchParams.get('includeSections') === 'true';

    console.log('🔍 Assessment request parameters:', {
      id: params.id,
      format,
      includeItems,
      includeSections
    });

    // Fetch assessment data from TimeBack QTI API (IMS v3p0)
    const timebackResponse = await fetch(`${TIMEBACK_API_URL}/ims/qti/v3p0/assessments/${params.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!timebackResponse.ok) {
      console.error('❌ TimeBack API error:', {
        status: timebackResponse.status,
        statusText: timebackResponse.statusText
      });

      if (timebackResponse.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Assessment not found',
              code: 'ASSESSMENT_NOT_FOUND'
            }
          },
          { status: 404 }
        );
      }

      const errorData = await timebackResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to fetch assessment from QTI system',
            code: 'QTI_FETCH_ERROR',
            details: errorData
          }
        },
        { status: timebackResponse.status }
      );
    }

    const assessmentData = await timebackResponse.json();
    console.log('✅ Assessment data retrieved from TimeBack API');

    // Handle different response formats
    switch (format) {
      case 'xml':
        return await handleXMLFormat(assessmentData, params.id, token);
      
      case 'full':
        return await handleFullFormat(assessmentData, params.id, token, includeItems, includeSections);
      
      case 'json':
      default:
        return await handleJSONFormat(assessmentData, includeItems, includeSections);
    }

  } catch (error) {
    console.error('❌ Unexpected error in QTI assessment endpoint:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error while fetching assessment',
          code: 'INTERNAL_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Handle XML format response - returns QTI XML
 */
async function handleXMLFormat(
  assessmentData: any, 
  assessmentId: string,
  token: string
): Promise<NextResponse> {
  try {
    console.log('🔧 Generating QTI XML for assessment:', assessmentId);

    // Check if we have XML stored directly
    if (assessmentData.xml) {
      console.log('✅ Using stored QTI XML');
      return new NextResponse(assessmentData.xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="assessment-${assessmentId}.xml"`
        }
      });
    }

    // If no stored XML, try to generate it from the assessment data
    if (assessmentData.sections && assessmentData.items) {
      console.log('🔄 Generating QTI XML from assessment structure...');
      
      // Convert TimeBack assessment format to our story format for QTI generation
      const storyFormat = convertAssessmentToStoryFormat(assessmentData);
      
      // Generate QTI XML using our generator
      const qtiGenerator = new QTIGenerator();
      const qtiPackage = await qtiGenerator.generatePackage(storyFormat);
      
      console.log('✅ QTI XML generated successfully');
      
      return new NextResponse(qtiPackage.files.assessmentTest, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="assessment-${assessmentId}.xml"`
        }
      });
    }

    // Fallback: return basic XML structure
    console.log('⚠️ Generating basic QTI XML structure');
    const basicXML = generateBasicQTIXML(assessmentData);
    
    return new NextResponse(basicXML, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="assessment-${assessmentId}.xml"`
      }
    });

  } catch (error) {
    console.error('❌ Error generating QTI XML:', error);
    throw error;
  }
}

/**
 * Handle full format response - returns complete assessment with XML and metadata
 */
async function handleFullFormat(
  assessmentData: any,
  assessmentId: string,
  token: string,
  includeItems: boolean,
  includeSections: boolean
): Promise<NextResponse> {
  try {
    console.log('📋 Preparing full assessment response');

    const response: QTIAssessmentResponse = {
      assessment: {
        id: assessmentData.id || assessmentId,
        identifier: assessmentData.identifier || `assessment-${assessmentId}`,
        title: assessmentData.title || 'Untitled Assessment',
        itemCount: assessmentData.itemCount || 0,
        sectionCount: assessmentData.sectionCount || 0,
        language: assessmentData.language || 'en-US',
        toolName: assessmentData.toolName || 'Teaching Tales',
        toolVersion: assessmentData.toolVersion || '1.0',
        duration: assessmentData.duration,
        status: assessmentData.status || 'active',
        createdAt: assessmentData.createdAt || new Date().toISOString(),
        updatedAt: assessmentData.updatedAt || new Date().toISOString()
      },
      metadata: assessmentData.metadata || {}
    };

    // Include XML if available or generate it
    if (assessmentData.xml) {
      response.xml = assessmentData.xml;
    } else {
      try {
        const storyFormat = convertAssessmentToStoryFormat(assessmentData);
        const qtiGenerator = new QTIGenerator();
        const qtiPackage = await qtiGenerator.generatePackage(storyFormat);
        response.xml = qtiPackage.files.assessmentTest;
      } catch (xmlError) {
        console.warn('⚠️ Could not generate XML, using basic structure');
        response.xml = generateBasicQTIXML(assessmentData);
      }
    }

    // Include sections if requested
    if (includeSections && assessmentData.sections) {
      response.sections = assessmentData.sections;
    }

    // Include items if requested
    if (includeItems && assessmentData.items) {
      response.items = assessmentData.items;
    }

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Error preparing full assessment response:', error);
    throw error;
  }
}

/**
 * Handle JSON format response - returns assessment metadata and structure
 */
async function handleJSONFormat(
  assessmentData: any,
  includeItems: boolean,
  includeSections: boolean
): Promise<NextResponse> {
  try {
    console.log('📄 Preparing JSON assessment response');

    const response: any = {
      id: assessmentData.id,
      identifier: assessmentData.identifier,
      title: assessmentData.title,
      itemCount: assessmentData.itemCount || 0,
      sectionCount: assessmentData.sectionCount || 0,
      language: assessmentData.language || 'en-US',
      status: assessmentData.status || 'active',
      metadata: assessmentData.metadata || {}
    };

    // Add optional fields if they exist
    if (assessmentData.duration) response.duration = assessmentData.duration;
    if (assessmentData.toolName) response.toolName = assessmentData.toolName;
    if (assessmentData.toolVersion) response.toolVersion = assessmentData.toolVersion;
    if (assessmentData.createdAt) response.createdAt = assessmentData.createdAt;
    if (assessmentData.updatedAt) response.updatedAt = assessmentData.updatedAt;

    // Include sections if requested
    if (includeSections && assessmentData.sections) {
      response.sections = assessmentData.sections;
    }

    // Include items if requested  
    if (includeItems && assessmentData.items) {
      response.items = assessmentData.items;
    }

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Error preparing JSON assessment response:', error);
    throw error;
  }
}

/**
 * Convert TimeBack assessment format to our story format for QTI generation
 */
function convertAssessmentToStoryFormat(assessmentData: any): any {
  // This is a simplified conversion - in a real implementation you would
  // need to map the TimeBack assessment structure to the expected story format
  return {
    title: assessmentData.title || 'Assessment',
    sections: (assessmentData.sections || []).map((section: any, index: number) => ({
      id: section.id || `section-${index + 1}`,
      content: section.content || `Section ${index + 1} content`,
      questions: (section.items || []).map((item: any, qIndex: number) => ({
        id: item.id || `q${qIndex + 1}`,
        question: item.title || `Question ${qIndex + 1}`,
        options: item.choices || ['Option A', 'Option B', 'Option C', 'Option D'],
        correct: item.correctAnswer || 0,
        explanation: item.explanation || 'Explanation not provided'
      }))
    })),
    wordCount: assessmentData.wordCount || 500,
    readingTime: assessmentData.readingTime || '5 minutes',
    metadata: assessmentData.metadata || {}
  };
}

/**
 * Generate basic QTI XML structure
 */
function generateBasicQTIXML(assessmentData: any): string {
  const identifier = assessmentData.identifier || `assessment-${Date.now()}`;
  const title = assessmentData.title || 'Assessment';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test
    xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0.xsd"
    identifier="${identifier}"
    title="${title}">
    
    <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
        <qti-default-value>
            <qti-value>0</qti-value>
        </qti-default-value>
    </qti-outcome-declaration>
    
    <qti-test-part identifier="testPart1" navigation-mode="linear" submission-mode="individual">
        <qti-assessment-section identifier="section1" title="Main Section" visible="true">
            <!-- Items would be included here in a complete implementation -->
            <qti-assessment-item-ref identifier="item1" href="item1.xml"/>
        </qti-assessment-section>
    </qti-test-part>
    
</qti-assessment-test>`;
}
