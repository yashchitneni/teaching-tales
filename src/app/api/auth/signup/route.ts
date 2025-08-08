import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'https://core.timebackapi.com';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();
    
    // Validate required fields
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: { message: 'Email, password, and display name are required' } },
        { status: 400 }
      );
    }

    // Call Timeback register endpoint
    let signupResponse;
    try {
      signupResponse = await axios.post(
        `${TIMEBACK_API_URL}/api/auth/register`,
        { 
          email, 
          password,
          username: displayName, // Use displayName as username
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );
    } catch (error: any) {
      console.error('[Signup API] Timeback register error:', error.response?.data || error);
      
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message;
      
      // Handle specific error cases
      if (errorMessage.includes('already exists') || 
          errorMessage.includes('UsernameExistsException') ||
          errorMessage.includes('already registered')) {
        return NextResponse.json(
          { success: false, error: { message: 'An account with this email already exists' } },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: { message: errorMessage } },
        { status: 400 }
      );
    }

    // Check if signup was successful
    if (!signupResponse.data.success && signupResponse.data.success !== undefined) {
      return NextResponse.json(
        { success: false, error: { message: signupResponse.data.error || 'Registration failed' } },
        { status: 400 }
      );
    }

    // Return success response with tokens if provided
    const responseData = signupResponse.data.data || signupResponse.data;
    return NextResponse.json({
      success: true,
      data: {
        message: 'Account created successfully. You can now login.',
        tokens: responseData.tokens || null,
        user: responseData.user || null,
        needsVerification: responseData.needsVerification || false
      }
    });

  } catch (error) {
    console.error('[Signup API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}