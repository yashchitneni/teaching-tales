import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { refreshTimebackToken } from '@/lib/timeback-auth';
import { getSSOCookieOptions } from '@/lib/cognito-auth';

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

    // Refresh the token with Timeback API
    let refreshResponse;
    try {
      refreshResponse = await refreshTimebackToken(refreshToken);
      if (!refreshResponse.success) {
        return NextResponse.json(
          { success: false, error: { message: refreshResponse.error || 'Token refresh failed' } },
          { status: 401 }
        );
      }
    } catch (error) {
      // If refresh fails, user needs to login again
      return NextResponse.json(
        { success: false, error: { message: 'Token refresh failed. Please login again.' } },
        { status: 401 }
      );
    }

    // Update cookies with new tokens from Timeback
    const cookieOptions = getSSOCookieOptions();
    const { tokens } = refreshResponse.data;

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