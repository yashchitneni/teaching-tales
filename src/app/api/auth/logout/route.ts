import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Clear all Cognito auth cookies
    cookieStore.set('cognito-access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    cookieStore.set('cognito-id-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    cookieStore.set('cognito-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    // Clear SSO cookie if domain is set
    if (process.env.SSO_COOKIE_DOMAIN) {
      cookieStore.set('cognito-sso-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.SSO_COOKIE_DOMAIN,
        maxAge: 0,
        path: '/',
      });
    }

    // Note: We don't need to call Cognito to invalidate the session
    // The tokens will simply expire on their own
    // If you want to implement token revocation, you would need to
    // maintain a blacklist or use AWS Cognito's GlobalSignOut

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