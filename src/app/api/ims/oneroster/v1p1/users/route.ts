import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { validateTimebackToken } from '@/lib/timeback-auth';

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

// Helper function to manage bidirectional agent relationships
async function createBidirectionalAgentRelationship(
  parentId: string,
  childId: string,
  supabase: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current parent profile to update their agents array
    const { data: parentProfile, error: parentError } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', parentId)
      .single();

    if (parentError) {
      console.error('Error fetching parent profile:', parentError);
      return { success: false, error: 'Failed to fetch parent profile' };
    }

    // Update parent's agents array to include the child
    const currentParentMetadata = parentProfile?.metadata || {};
    const currentOneRoster = currentParentMetadata.oneRoster || {};
    const currentParentAgents = currentOneRoster.agents || [];

    // Check if relationship already exists
    const existingRelationship = currentParentAgents.find(
      (agent: any) => agent.sourcedId === childId
    );

    if (!existingRelationship) {
      // Add child to parent's agents array
      const updatedParentAgents = [
        ...currentParentAgents,
        {
          sourcedId: childId,
          agentSourcedId: childId,
          type: 'student'
        }
      ];

      const updatedParentMetadata = {
        ...currentParentMetadata,
        oneRoster: {
          ...currentOneRoster,
          agents: updatedParentAgents
        }
      };

      // Update parent's profile with new agent relationship
      const { error: updateParentError } = await supabase
        .from('profiles')
        .update({ metadata: updatedParentMetadata })
        .eq('id', parentId);

      if (updateParentError) {
        console.error('Error updating parent agents:', updateParentError);
        return { success: false, error: 'Failed to update parent agents' };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in createBidirectionalAgentRelationship:', error);
    return { success: false, error: 'Unexpected error creating relationship' };
  }
}

// Helper function to get user's agent relationships
async function getUserAgentRelationships(
  userId: string,
  supabase: SupabaseClient
): Promise<Array<{ sourcedId: string; agentSourcedId: string; type?: string }>> {
  try {
    // For parents: get their children as agents
    const { data: children } = await supabase
      .from('children')
      .select('id')
      .eq('parent_id', userId);

    if (children && children.length > 0) {
      // Parent's agents are their children (students they are agent for)
      return children.map(child => ({
        sourcedId: child.id,
        agentSourcedId: child.id,
        type: 'student'
      }));
    }

    // For children: get their parent as agent
    const { data: childRecord } = await supabase
      .from('children')
      .select('parent_id')
      .eq('id', userId)
      .single();

    if (childRecord) {
      // Child's agents are their parents (parents who are agents for them)
      return [{
        sourcedId: childRecord.parent_id,
        agentSourcedId: childRecord.parent_id,
        type: 'parent'
      }];
    }

    return [];
  } catch (error) {
    console.error('Error getting user agent relationships:', error);
    return [];
  }
}

// Helper function to validate agent relationships (for testing/debugging)
async function validateAgentRelationships(
  parentId: string,
  childId: string,
  supabase: SupabaseClient
): Promise<{ valid: boolean; issues: string[] }> {
  const issues: string[] = [];

  try {
    // Check if child exists in children table
    const { data: child } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (!child) {
      issues.push(`Child ${childId} not found in children table`);
    } else if (child.parent_id !== parentId) {
      issues.push(`Child ${childId} has incorrect parent_id: ${child.parent_id} vs ${parentId}`);
    }

    // Check if parent has child in their agents
    const { data: parentProfile } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', parentId)
      .single();

    if (!parentProfile) {
      issues.push(`Parent ${parentId} profile not found`);
    } else {
      const parentAgents = parentProfile.metadata?.oneRoster?.agents || [];
      const hasChildAgent = parentAgents.some((agent: any) => agent.sourcedId === childId);
      
      if (!hasChildAgent) {
        issues.push(`Parent ${parentId} missing child ${childId} in agents array`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  } catch (error) {
    console.error('Error validating agent relationships:', error);
    return {
      valid: false,
      issues: [`Validation error: ${error}`]
    };
  }
}

// Helper to verify authentication
async function verifyAuth(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('timeback-access-token')?.value;

  if (!accessToken) {
    return null;
  }

  // Validate token with Timeback API (like /api/auth/me does)
  const userResponse = await validateTimebackToken(accessToken);

  if (!userResponse.success || !userResponse.data) {
    return null;
  }

  const timebackUser = userResponse.data.user;

  // Return user in the format expected by the rest of the code
  return {
    id: timebackUser.id || timebackUser.cognitoId,
    email: timebackUser.email,
    cognitoId: timebackUser.cognitoId,
    role: timebackUser.role || 'parent',
    name: timebackUser.name || timebackUser.email?.split('@')[0],
  };
}

// Helper function to parse OneRoster filter queries
function parseOneRosterFilter(filterString: string): {
  agentSourcedId?: string;
  role?: string;
  status?: string;
} {
  const filters: any = {};
  
  if (!filterString) return filters;
  
  // Parse agents.agentSourcedId='value'
  const agentMatch = filterString.match(/agents\.agentSourcedId='([^']+)'/);
  if (agentMatch) {
    filters.agentSourcedId = agentMatch[1];
  }
  
  // Parse role='value'
  const roleMatch = filterString.match(/role='([^']+)'/);
  if (roleMatch) {
    filters.role = roleMatch[1];
  }
  
  // Parse status='value'
  const statusMatch = filterString.match(/status='([^']+)'/);
  if (statusMatch) {
    filters.status = statusMatch[1];
  }
  
  return filters;
}

// Helper function to apply sorting to Supabase query
function applySorting(query: any, sort: string | null, order: string): any {
  if (!sort) return query;
  
  const ascending = order.toLowerCase() === 'asc';
  
  switch (sort) {
    case 'name':
      return query.order('name', { ascending });
    case 'dateLastModified':
    case 'created_at':
      return query.order('created_at', { ascending });
    case 'grade':
    case 'grade_level':
      return query.order('grade_level', { ascending });
    case 'age':
      return query.order('age', { ascending });
    default:
      return query.order('created_at', { ascending: false }); // Default sort
  }
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
    const sort = searchParams.get('sort'); // e.g., 'name', 'dateLastModified', 'grade'
    const order = searchParams.get('order') || 'asc'; // 'asc' or 'desc'

    // Parse filters using helper function
    const filters = parseOneRosterFilter(filter || '');
    
    // Handle agent relationship filtering (children of authenticated parent)
    if (filters.agentSourcedId && filters.agentSourcedId === user.id) {
      // Build query for children
      let childQuery = supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);
        
      // Apply sorting
      childQuery = applySorting(childQuery, sort, order);
      
      // Apply pagination
      childQuery = childQuery.range(offset, offset + limit - 1);
      
      const { data: children, error: childError } = await childQuery;
      
      if (childError) {
        console.error('Error fetching children:', childError);
        return NextResponse.json(
          { success: false, error: { message: 'Failed to fetch children' } },
          { status: 500 }
        );
      }

      if (children) {
        // Filter by role if specified (should be 'student' for children)
        let filteredChildren = children;
        if (filters.role && filters.role !== 'student') {
          filteredChildren = []; // Children are always students
        }
        
        // Get total count for pagination metadata
        const { count: totalCount } = await supabase
          .from('children')
          .select('*', { count: 'exact', head: true })
          .eq('parent_id', user.id);

        const childUsers = await Promise.all(filteredChildren.map(async (child) => {
          // Get updated agent relationships for each child
          const childAgents = await getUserAgentRelationships(child.id, supabase);
          
          return {
            sourcedId: child.id,
            status: 'active' as const,
            dateLastModified: child.updated_at || child.created_at || new Date().toISOString(),
            username: child.name.toLowerCase().replace(/\s+/g, '.'),
            enabledUser: true,
            givenName: child.name.split(' ')[0] || '',
            familyName: child.name.split(' ').slice(1).join(' ') || '',
            role: 'student' as const,
            email: `${child.name.toLowerCase().replace(/\s+/g, '.')}@child.local`,
            grades: child.grade_level ? [child.grade_level] : [],
            agents: childAgents,
            metadata: {
              age: child.age,
              readingLevel: child.reading_level,
              interests: child.interests || [],
              preferences: child.preferences || {},
              parentId: user.id,
              childId: child.id,
              createdAt: child.created_at,
              updatedAt: child.updated_at
            }
          };
        }));

        return NextResponse.json({
          users: childUsers,
          count: childUsers.length,
          totalCount: totalCount || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (totalCount || 0),
          filters: filters,
          sort: sort || 'created_at',
          order
        });
      }
    }

    // Default: return the current user as a OneRoster user
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

    // Get agent relationships using helper function
    oneRosterUser.agents = await getUserAgentRelationships(user.id, supabase);

    return NextResponse.json({
      users: [oneRosterUser],
      count: 1,
      totalCount: 1,
      limit,
      offset,
      hasMore: false,
      filters: filters,
      sort: sort || 'dateLastModified',
      order
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

    // Enhanced validation for child users (students)
    if (body.role === 'student') {
      // Validate parent agent relationship exists
      if (!body.agents || body.agents.length === 0) {
        return NextResponse.json(
          { success: false, error: { message: 'Student users must have at least one parent agent relationship' } },
          { status: 400 }
        );
      }

      // Validate parent agent has correct structure
      const parentAgent = body.agents.find(agent => agent.agentSourcedId === user.id);
      if (!parentAgent) {
        return NextResponse.json(
          { success: false, error: { message: 'Student must have agent relationship with authenticated parent' } },
          { status: 400 }
        );
      }

      // Validate grade level is provided
      if (!body.grades || body.grades.length === 0) {
        return NextResponse.json(
          { success: false, error: { message: 'Grade level is required for student users' } },
          { status: 400 }
        );
      }

      // Validate metadata fields for children
      if (!body.metadata?.age || typeof body.metadata.age !== 'number') {
        return NextResponse.json(
          { success: false, error: { message: 'Age is required for student users and must be a number' } },
          { status: 400 }
        );
      }
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
    if (body.role === 'student') {
      // At this point, validation has ensured agents exist and are valid
      const parentAgent = body.agents.find(agent => agent.agentSourcedId === user.id)!;
      
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

      // Create bidirectional agent relationship
      const relationshipResult = await createBidirectionalAgentRelationship(
        user.id,
        sourcedId,
        supabase
      );

      if (!relationshipResult.success) {
        console.error('Error creating agent relationship:', relationshipResult.error);
        
        // Clean up the child record since relationship creation failed
        await supabase
          .from('children')
          .delete()
          .eq('id', sourcedId);
          
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'Failed to establish parent-child relationship. Please try again.',
              details: relationshipResult.error 
            } 
          },
          { status: 500 }
        );
      }

      // Get updated agent relationships after bidirectional creation
      const updatedAgents = await getUserAgentRelationships(sourcedId, supabase);
      
      return NextResponse.json({
        user: {
          ...oneRosterUser,
          agents: updatedAgents, // Include the bidirectional agent relationships
          metadata: {
            ...oneRosterUser.metadata,
            childId: child.id,
            parentId: user.id,
            relationshipEstablished: true
          }
        }
      }, { status: 201 });
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