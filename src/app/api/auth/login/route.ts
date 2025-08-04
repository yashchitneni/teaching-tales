import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loginWithTimeback, getTimebackSSOCookieOptions } from '@/lib/timeback-auth';
import { randomUUID } from 'crypto';
import { supabase } from '@/lib/supabase';

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
    const { validateTimebackToken } = await import('@/lib/timeback-auth');
    const userResponse = await validateTimebackToken(accessToken);

    if (!userResponse.success || !userResponse.data) {
      return NextResponse.json(
        { success: false, error: { message: 'Failed to get user information' } },
        { status: 500 }
      );
    }

    const timebackUser = userResponse.data.user;

    // Get or create user profile in our Supabase database
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('cognito_id', timebackUser.cognitoId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Profile fetch error:', profileError);
    }

    // Create profile if it doesn't exist
    let userProfile = profile;
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: randomUUID(),
          email: timebackUser.email,
          cognito_id: timebackUser.cognitoId,
          display_name: email.split('@')[0],
          role: 'parent', // All TeachingTales users are parents
          subscription_tier: 'free',
        })
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        return NextResponse.json(
          { success: false, error: { message: 'Failed to create user profile' } },
          { status: 500 }
        );
      }
      userProfile = newProfile;
    }

    // Create OneRoster user data for parent
    const oneRosterUserData = {
      sourcedId: userProfile.id,
      status: 'active' as const,
      dateLastModified: new Date().toISOString(),
      username: email,
      enabledUser: true,
      givenName: userProfile.display_name?.split(' ')[0] || 'Parent',
      familyName: userProfile.display_name?.split(' ').slice(1).join(' ') || 'User',
      role: 'parent',
      email: email,
      userIds: [
        {
          type: 'cognito',
          identifier: timebackUser.cognitoId
        }
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'teaching-tales-timeback-auth'
      }
    };

    // Update profile with OneRoster metadata if needed
    if (!userProfile.oneroster_id || !userProfile.metadata?.oneRoster) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          oneroster_id: userProfile.id,
          metadata: {
            ...userProfile.metadata,
            oneRoster: oneRosterUserData
          }
        })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Error updating OneRoster metadata:', updateError);
      }
    }

    // Get children for this parent
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', userProfile.id);

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

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userProfile.id,
          email: timebackUser.email,
          cognitoId: timebackUser.cognitoId,
          role: 'parent',
          name: userProfile.display_name,
          profile: userProfile,
          oneRosterData: oneRosterUserData,
          children: children || [],
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