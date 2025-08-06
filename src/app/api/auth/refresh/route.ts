import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8081';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('timeback-refresh-token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: { message: 'No refresh token found' } },
        { status: 401 }
      );
    }

    // Refresh the token with TimeBack API
    const refreshResponse = await fetch(`${TIMEBACK_API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const refreshData = await refreshResponse.json();

    if (!refreshData.success) {
      return NextResponse.json(
        { success: false, error: { message: refreshData.error?.message || 'Token refresh failed' } },
        { status: 401 }
      );
    }

    // Update cookies with new tokens from TimeBack
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    const { tokens } = refreshData.data;

    // Access token cookie
    cookieStore.set('timeback-access-token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: tokens.expiresIn || 3600, // Default to 1 hour
    });

    // ID token cookie (for SSO)
    cookieStore.set('timeback-id-token', tokens.idToken, {
      ...cookieOptions,
      maxAge: tokens.expiresIn || 3600,
    });

    // Update refresh token if a new one was provided
    if (tokens.refreshToken) {
      cookieStore.set('timeback-refresh-token', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        idToken: tokens.idToken,
        expiresIn: tokens.expiresIn || 3600,
        tokenType: tokens.tokenType || 'Bearer',
        message: 'Token refreshed successfully'
      }
    });

  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
