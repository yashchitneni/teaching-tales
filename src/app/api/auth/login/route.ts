import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loginWithTimeback, validateTimebackToken, getTimebackSSOCookieOptions } from '@/lib/timeback-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Authenticate through Timeback API (which uses Cognito)
    const timebackResponse = await loginWithTimeback(email, password);

    if (!timebackResponse.success || !timebackResponse.data) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: timebackResponse.error?.message || 'Invalid credentials' 
          } 
        },
        { status: 401 }
      );
    }

    const { accessToken, idToken, refreshToken, expiresIn } = timebackResponse.data;

    // Validate the token to get user info from Timeback
    const userResponse = await validateTimebackToken(accessToken);

    if (!userResponse.success || !userResponse.data) {
      return NextResponse.json(
        { success: false, error: { message: 'Failed to get user information' } },
        { status: 500 }
      );
    }

    const timebackUser = userResponse.data.user;

    // Set secure HttpOnly cookies for SSO
    const cookieStore = await cookies();
    const cookieOptions = getTimebackSSOCookieOptions();
    
    // Store tokens in cookies for SSO between apps
    cookieStore.set('timeback-access-token', accessToken, {
      ...cookieOptions,
      maxAge: expiresIn,
    });

    cookieStore.set('timeback-id-token', idToken, {
      ...cookieOptions,
      maxAge: expiresIn,
    });

    cookieStore.set('timeback-refresh-token', refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Return success response with Timeback user data
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: timebackUser.id || timebackUser.cognitoId,
          email: timebackUser.email,
          cognitoId: timebackUser.cognitoId,
          role: timebackUser.role || 'parent',
          name: timebackUser.name || email.split('@')[0],
        },
        tokens: {
          accessToken,
          idToken,
          expiresIn,
        },
        message: 'Login successful'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}