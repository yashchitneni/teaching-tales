import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

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

// OneRoster User type
interface OneRosterUser {
  sourcedId: string;
  status: 'active' | 'tobedeleted';
  dateLastModified: string;
  metadata?: Record<string, unknown>;
  username: string;
  userIds?: Array<{ type: string; identifier: string }>;
  enabledUser: boolean;
  givenName: string;
  familyName: string;
  middleName?: string;
  role: 'student' | 'teacher' | 'parent' | 'guardian' | 'relative' | 'aide' | 'administrator';
  identifier?: string;
  email: string;
  sms?: string;
  phone?: string;
  agents?: Array<{ sourcedId: string; agentSourcedId: string }>;
  grades?: string[];
  password?: string;
}

// Helper to verify authentication
async function verifyAuth(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access-token')?.value;

  if (!accessToken) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return null;
  }

  return user;
}

// GET /api/ims/oneroster/v1p1/users
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter');

    // For now, we'll return the current user as a OneRoster user
    // In a full implementation, this would query from a OneRoster database
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const oneRosterUser: OneRosterUser = {
      sourcedId: user.id,
      status: 'active',
      dateLastModified: new Date().toISOString(),
      username: user.email || '',
      enabledUser: true,
      givenName: profile?.display_name?.split(' ')[0] || user.email?.split('@')[0] || '',
      familyName: profile?.display_name?.split(' ').slice(1).join(' ') || '',
      role: 'parent',
      email: user.email || '',
      userIds: [
        {
          type: 'supabase',
          identifier: user.id
        }
      ],
      metadata: {
        profileId: profile?.id,
        createdAt: user.created_at
      }
    };

    // Get children as agents
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', user.id);

    if (children && children.length > 0) {
      oneRosterUser.agents = children.map(child => ({
        sourcedId: child.id,
        agentSourcedId: user.id
      }));
    }

    return NextResponse.json({
      users: [oneRosterUser],
      count: 1,
      limit,
      offset
    });

  } catch (error) {
    console.error('Get OneRoster users error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// POST /api/ims/oneroster/v1p1/users
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json() as Partial<OneRosterUser>;

    // Validate required fields
    if (!body.email || !body.givenName || !body.role) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields: email, givenName, role' } },
        { status: 400 }
      );
    }

    // Generate sourcedId if not provided
    const sourcedId = body.sourcedId || randomUUID();

    // Create or update the OneRoster user data
    // In a real implementation, this would store in a separate OneRoster database
    // For now, we'll store this metadata in the user's profile
    const oneRosterUser: OneRosterUser = {
      sourcedId,
      status: body.status || 'active',
      dateLastModified: new Date().toISOString(),
      username: body.username || body.email,
      enabledUser: body.enabledUser !== false,
      givenName: body.givenName,
      familyName: body.familyName || '',
      middleName: body.middleName,
      role: body.role,
      email: body.email,
      sms: body.sms,
      phone: body.phone,
      userIds: body.userIds || [],
      agents: body.agents || [],
      grades: body.grades || [],
      metadata: {
        ...body.metadata,
        createdBy: user.id,
        createdAt: new Date().toISOString()
      }
    };

    // If this is a child user (student role), create in children table
    if (body.role === 'student' && body.agents?.length) {
      const parentAgent = body.agents.find(agent => agent.agentSourcedId === user.id);
      
      if (parentAgent) {
        const { data: child, error: childError } = await supabase
          .from('children')
          .insert({
            id: sourcedId,
            parent_id: user.id,
            name: `${body.givenName} ${body.familyName}`.trim(),
            age: body.metadata?.age || null,
            grade_level: body.grades?.[0] || null,
            interests: body.metadata?.interests || [],
            reading_level: body.metadata?.readingLevel || null,
            preferences: body.metadata?.preferences || {}
          })
          .select()
          .single();

        if (childError) {
          console.error('Error creating child:', childError);
          return NextResponse.json(
            { success: false, error: { message: 'Failed to create child user' } },
            { status: 500 }
          );
        }

        return NextResponse.json({
          user: {
            ...oneRosterUser,
            metadata: {
              ...oneRosterUser.metadata,
              childId: child.id
            }
          }
        }, { status: 201 });
      }
    }

    // For parent users, update profile with OneRoster metadata
    if (body.role === 'parent') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: `${body.givenName} ${body.familyName}`.trim(),
          metadata: {
            oneRoster: oneRosterUser
          }
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      }
    }

    return NextResponse.json({
      user: oneRosterUser
    }, { status: 201 });

  } catch (error) {
    console.error('Create OneRoster user error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}