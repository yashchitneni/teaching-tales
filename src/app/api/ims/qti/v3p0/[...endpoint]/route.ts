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

async function handleAssessmentItemCreation(request: NextRequest) {
  try {
    const token = await resolveAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('🔧 Processing assessment item creation with enhanced scoring...');
    
    // Extract the raw XML content
    const xmlContent = body.xmlContent;
    if (!xmlContent) {
      return NextResponse.json(
        { success: false, error: { message: 'xmlContent is required' } },
        { status: 400 }
      );
    }

    // Ensure the XML has the proper template URL for scoring
    let enhancedXML = xmlContent;
    
    // Check if response processing template uses the full URL
    if (enhancedXML.includes('template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct"')) {
      console.log('✅ XML already has full template URL');
    } else if (enhancedXML.includes('<qti-response-processing template=')) {
      console.log('✅ XML has template attribute');
    } else {
      // Add the proper response processing if missing
      enhancedXML = enhancedXML.replace(
        /<qti-response-processing\s*\/>/g,
        '<qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct" />'
      );
      console.log('🔧 Added response processing template to XML');
    }
    
    const enhancedPayload = {
      ...body,
      xmlContent: enhancedXML
    };

    console.log('✅ Enhanced item payload with proper template URL');
    
    // Forward to TimeBack API
    const url = `${TIMEBACK_API_URL}/ims/qti/v3p0/assessment-items`;
    const upstreamResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enhancedPayload),
    });

    const contentType = upstreamResponse.headers.get('content-type') || '';
    
    if (!upstreamResponse.ok) {
      console.error('❌ TimeBack API error:', upstreamResponse.status);
      if (contentType.includes('application/json')) {
        const errorJson = await upstreamResponse.json().catch(() => ({}));
        return NextResponse.json(
          { success: false, error: errorJson },
          { status: upstreamResponse.status }
        );
      }
      
      const errorText = await upstreamResponse.text().catch(() => '');
      return new NextResponse(errorText, {
        status: upstreamResponse.status,
        headers: { 'content-type': contentType || 'text/plain' }
      });
    }

    if (contentType.includes('application/json')) {
      const data = await upstreamResponse.json();
      console.log('🎉 Item created successfully with enhanced processing');
      return NextResponse.json(data);
    }

    const text = await upstreamResponse.text();
    return new NextResponse(text, {
      status: upstreamResponse.status,
      headers: { 'content-type': contentType || 'text/plain' }
    });

  } catch (error) {
    console.error('❌ Error in handleAssessmentItemCreation:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to process assessment item', details: error instanceof Error ? error.message : String(error) } },
      { status: 500 }
    );
  }
}

async function proxyQTIRequest(request: NextRequest, endpoint: string) {
  try {
    const token = await resolveAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${TIMEBACK_API_URL}/ims/qti/v3p0/${endpoint}${queryString ? `?${queryString}` : ''}`;

    const upstreamResponse = await fetch(url, {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: request.method === 'GET' ? undefined : await request.text(),
    });

    const contentType = upstreamResponse.headers.get('content-type') || '';

    if (!upstreamResponse.ok) {
      if (contentType.includes('application/json')) {
        const errorJson = await upstreamResponse.json().catch(() => ({}));
        return NextResponse.json(
          { success: false, error: errorJson },
          { status: upstreamResponse.status }
        );
      }

      const errorText = await upstreamResponse.text().catch(() => '');
      return new NextResponse(errorText, {
        status: upstreamResponse.status,
        headers: { 'content-type': contentType || 'text/plain' }
      });
    }

    if (contentType.includes('application/json')) {
      const data = await upstreamResponse.json();
      return NextResponse.json(data);
    }

    const text = await upstreamResponse.text();
    return new NextResponse(text, {
      status: upstreamResponse.status,
      headers: { 'content-type': contentType || 'text/plain' }
    });

  } catch (error) {
    console.error(`QTI proxy error for ${endpoint}:`, error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const endpoint = request.nextUrl.pathname.split('/ims/qti/v3p0/')[1];
  return proxyQTIRequest(request, endpoint);
}

export async function POST(request: NextRequest) {
  const endpoint = request.nextUrl.pathname.split('/ims/qti/v3p0/')[1];
  
  // Special handling for assessment-items creation to ensure proper scoring metadata
  if (endpoint === 'assessment-items') {
    return handleAssessmentItemCreation(request);
  }
  
  return proxyQTIRequest(request, endpoint);
}

export async function PUT(request: NextRequest) {
  const endpoint = request.nextUrl.pathname.split('/ims/qti/v3p0/')[1];
  return proxyQTIRequest(request, endpoint);
}

export async function DELETE(request: NextRequest) {
  const endpoint = request.nextUrl.pathname.split('/ims/qti/v3p0/')[1];
  return proxyQTIRequest(request, endpoint);
}