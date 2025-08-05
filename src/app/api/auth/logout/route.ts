import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Get access token from cookies
    const accessToken = cookieStore.get('timeback-access-token')?.value;

    // Call TimeBack logout endpoint if we have a token
    if (accessToken) {
      try {
        await fetch(`${TIMEBACK_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        // Continue with local logout even if TimeBack logout fails
        console.error('TimeBack logout error:', error);
      }
    }

    // Clear all TimeBack auth cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0, // Expire immediately
      path: '/',
    };

    cookieStore.set('timeback-access-token', '', cookieOptions);
    cookieStore.set('timeback-id-token', '', cookieOptions);
    cookieStore.set('timeback-refresh-token', '', cookieOptions);

    // Clear SSO cookie if domain is set
    if (process.env.SSO_COOKIE_DOMAIN) {
      cookieStore.set('timeback-sso-token', '', {
        ...cookieOptions,
        domain: process.env.SSO_COOKIE_DOMAIN,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Successfully logged out'
      }
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
