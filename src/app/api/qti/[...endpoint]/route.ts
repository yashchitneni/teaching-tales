import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

// Helper to get auth token from cookies
async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get('timeback-access-token')?.value;
}

// Proxy for any QTI endpoint
async function proxyQTIRequest(request: NextRequest, endpoint: string) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${TIMEBACK_API_URL}/qti/${endpoint}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: request.method === 'GET' ? undefined : await request.text(),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

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
