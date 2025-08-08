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

// Proxy for any QTI endpoint (compat: maps to IMS v3p0)
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
    // Map legacy /api/qti/* to upstream /ims/qti/v3p0/* for consistency
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
  const endpoint = request.nextUrl.pathname.split('/qti/')[1];
  return proxyQTIRequest(request, endpoint);
}

export async function POST(request: NextRequest) {
  const endpoint = request.nextUrl.pathname.split('/qti/')[1];
  return proxyQTIRequest(request, endpoint);
}

export async function PUT(request: NextRequest) {
  const endpoint = request.nextUrl.pathname.split('/qti/')[1];
  return proxyQTIRequest(request, endpoint);
}

export async function DELETE(request: NextRequest) {
  const endpoint = request.nextUrl.pathname.split('/qti/')[1];
  return proxyQTIRequest(request, endpoint);
}
