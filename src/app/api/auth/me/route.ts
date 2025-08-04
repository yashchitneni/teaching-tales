import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateTimebackToken } from '@/lib/timeback-auth';

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

    // Validate token with Timeback API
    const userResponse = await validateTimebackToken(token);

    if (!userResponse.success || !userResponse.data) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }

    const timebackUser = userResponse.data.user;

    // Return user data from Timeback
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: timebackUser.id || timebackUser.cognitoId,
          email: timebackUser.email,
          cognitoId: timebackUser.cognitoId,
          role: timebackUser.role || 'parent',
          name: timebackUser.name || timebackUser.email.split('@')[0],
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