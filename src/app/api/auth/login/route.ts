import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8081';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Authenticate through TimeBack API
    const loginResponse = await fetch(`${TIMEBACK_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginResponse.json();

    if (!loginData.success || !loginData.data) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: loginData.error?.message || 'Invalid credentials' 
          } 
        },
        { status: 401 }
      );
    }

    const { accessToken, idToken, refreshToken, expiresIn } = loginData.data.tokens;

    // Get user info from TimeBack
    const userResponse = await fetch(`${TIMEBACK_API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();

    if (!userData.success || !userData.data) {
      return NextResponse.json(
        { success: false, error: { message: 'Failed to get user information' } },
        { status: 500 }
      );
    }

    const timebackUser = userData.data.user;

    // Set secure HttpOnly cookies for SSO
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
    
    // Store tokens in cookies for SSO between apps
    cookieStore.set('timeback-access-token', accessToken, {
      ...cookieOptions,
      maxAge: expiresIn || 3600,
    });

    cookieStore.set('timeback-id-token', idToken, {
      ...cookieOptions,
      maxAge: expiresIn || 3600,
    });

    cookieStore.set('timeback-refresh-token', refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Return success response with TimeBack user data
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
          expiresIn: expiresIn || 3600,
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
