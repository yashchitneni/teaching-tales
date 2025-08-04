import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    // First try to get token from cookies (new flow)
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access-token')?.value;

    // If no cookie, try to get from Authorization header (Supabase default)
    let token = accessToken;
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

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: { message: userError?.message || 'Invalid token' } },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Profile fetch error:', profileError);
    }

    // TODO: Fetch OneRoster user data if available
    const oneRosterData = {
      sourcedId: user.id,
      role: 'parent',
      status: 'active'
    };

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email || '',
          cognitoId: user.id, // Using Supabase ID as cognitoId equivalent
          role: 'parent', // Default role
          profile: profile || null,
          oneRosterData: oneRosterData,
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