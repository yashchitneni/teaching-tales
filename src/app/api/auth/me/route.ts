import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateTimebackToken } from '@/lib/timeback-auth';
import { supabase } from '@/lib/supabase';

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

    // Get user profile from our database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('cognito_id', timebackUser.cognitoId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }

    // Get children for this parent
    let children = [];
    if (profile) {
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', profile.id);
      
      children = childrenData || [];
    }

    // Get OneRoster data from profile or generate it
    const oneRosterData = profile?.metadata?.oneRoster || {
      sourcedId: profile?.id || timebackUser.id,
      role: 'parent',
      status: 'active',
      email: timebackUser.email,
      givenName: profile?.display_name?.split(' ')[0] || 'Parent',
      familyName: profile?.display_name?.split(' ').slice(1).join(' ') || 'User',
    };

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: profile?.id || timebackUser.id,
          email: timebackUser.email,
          cognitoId: timebackUser.cognitoId,
          role: 'parent', // All TeachingTales users are parents
          name: profile?.display_name,
          profile: profile || null,
          oneRosterData: oneRosterData,
          children: children,
          timebackRole: timebackUser.role, // Store their Timeback role separately if needed
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