import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Initialize Supabase client with service role for server-side operations
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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: { message: authError?.message || 'Invalid credentials' } },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    // Create OneRoster user if not exists
    const oneRosterUserId = authData.user.id; // Using Supabase user ID as OneRoster sourcedId
    
    // Check if OneRoster metadata exists in profile
    let oneRosterUserData = profile?.metadata?.oneRoster || null;
    
    // If no OneRoster data exists, create it
    if (!oneRosterUserData) {
      oneRosterUserData = {
        sourcedId: oneRosterUserId,
        status: 'active' as const,
        dateLastModified: new Date().toISOString(),
        username: email,
        enabledUser: true,
        givenName: profile?.display_name?.split(' ')[0] || email.split('@')[0],
        familyName: profile?.display_name?.split(' ').slice(1).join(' ') || '',
        role: 'parent' as const, // Default role for authenticated users
        email: email,
        userIds: [
          {
            type: 'supabase',
            identifier: authData.user.id
          }
        ],
        metadata: {
          createdAt: new Date().toISOString(),
          source: 'teaching-tales-auth'
        }
      };

      // Store OneRoster metadata in profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          metadata: {
            ...profile?.metadata,
            oneRoster: oneRosterUserData
          }
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Error updating OneRoster metadata:', updateError);
      }
    }

    // Set secure HttpOnly cookies for JWT tokens
    const cookieStore = await cookies();
    
    // Access token cookie
    cookieStore.set('access-token', authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    // Refresh token cookie (longer lived)
    cookieStore.set('refresh-token', authData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          profile: profile || null,
          oneRosterData: oneRosterUserData, // Include OneRoster data in response
        },
        expiresIn: 3600,
        tokenType: 'Bearer',
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