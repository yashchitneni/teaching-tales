import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logoutFromTimeback } from '@/lib/timeback-auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Call Timeback logout endpoint
    try {
      await logoutFromTimeback();
    } catch (error) {
      // Continue with local logout even if Timeback logout fails
      console.error('Timeback logout error:', error);
    }

    // Clear all Timeback auth cookies
    cookieStore.set('timeback-access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    cookieStore.set('timeback-id-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    cookieStore.set('timeback-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    // Clear SSO cookie if domain is set
    if (process.env.SSO_COOKIE_DOMAIN) {
      cookieStore.set('timeback-sso-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.SSO_COOKIE_DOMAIN,
        maxAge: 0,
        path: '/',
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