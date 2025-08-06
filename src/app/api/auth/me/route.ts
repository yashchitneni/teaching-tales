import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or header
    const cookieStore = await cookies();
    let token = cookieStore.get('timeback-access-token')?.value;

    // If no cookie, check Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Validate token with TimeBack API
    const userResponse = await fetch(`${TIMEBACK_API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userData.success || !userData.data) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }

    const timebackUser = userData.data.user;

    // Return user data from TimeBack
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: timebackUser.id || timebackUser.cognitoId,
          email: timebackUser.email,
          cognitoId: timebackUser.cognitoId,
          role: timebackUser.role || 'parent',
          name: timebackUser.name || timebackUser.email?.split('@')[0],
        },
        message: 'User information retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
