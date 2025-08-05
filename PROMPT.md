# 🔄 Agent Instructions: Switch
Teaching Tales from Supabase to
TimeBack Auth

## Mission Overview

Update the Teaching Tales project to
completely replace Supabase
authentication with TimeBack
authentication, using the local
TimeBack instance as the single source
of truth for user management.

--------------------------------------

## Current State Analysis

### What Teaching Tales Currently Has

   * ✅ TimeBack Integration: Already
has timeback-auth.ts and API
integration
   * ✅ Local Config: .env.local
pointing to localhost:8080
   * ✅ Working Credentials:
demo123@example.com / TestPassword123!
   * ❌ Mixed Auth: Both Supabase and
TimeBack auth coexisting
   * ❌ Incomplete: Not using TimeBack
SSO SDK patterns

### Reference Implementation

Use the TimeBack Reference App
(/home/duff/00-alpha-school/timeback-re
ference-app) as the gold standard for
auth patterns.

--------------------------------------

## Phase 1: Audit & Remove Supabase
Dependencies

### 1.1 Remove Supabase Dependencies

    # Remove Supabase packages
    bun remove @supabase/supabase-js
@supabase/auth-helpers-nextjs

    # Check what's left
    grep -r "supabase" src/
package.json || echo "Supabase 
references found"

### 1.2 Files to Remove/Clean

   * Remove entirely:
src/lib/supabase.ts
   * Clean up: Any Supabase imports in
other files
   * Remove: Supabase environment
variables from documentation
   * Clean: Any references to Google
OAuth through Supabase

### 1.3 Directory Audit

Search and remove ALL Supabase
references:

    grep -r
"supabase\|createClient\|@supabase"
src/

--------------------------------------

## Phase 2: Install & Configure
TimeBack SSO SDK

### 2.1 Install TimeBack SSO SDK

    bun add @timeback/sso-sdk

### 2.2 Create TimeBack SSO Client

Create new file:
src/lib/auth/timeback-sso.ts

Copy patterns from:
/home/duff/00-alpha-school/timeback-ref
erence-app/src/lib/auth/sso.ts

    import { TimeBackSSO } from
'@timeback/sso-sdk';

    export const sso = new
TimeBackSSO({
      apiBaseUrl: process.env.NEXT_PUBL
IC_TIMEBACK_API_URL ||
'http://localhost:8080',
      autoCheck: true,
    });

    export function getAuthToken():
string | null {
      return sso.getToken();
    }

    export async function
isAuthenticated(): Promise<boolean> {
      // Implementation from reference 
app
    }

    // Add login, logout, user 
management functions

--------------------------------------

## Phase 3: Update Authentication
Context

### 3.1 Enhance AuthContext

File: src/contexts/AuthContext.tsx

Current: Already uses TimeBack API
Update: Switch to TimeBack SSO SDK
patterns

Reference:
/home/duff/00-alpha-school/timeback-ref
erence-app/src/lib/auth/context.tsx

Key Changes:

   * Replace direct API calls with SSO
SDK
   * Use SSO SDK token management
   * Remove any Supabase user
interfaces
   * Implement proper token refresh
cycles

### 3.2 Update User Interface

    interface TimeBackUser {
      id: string
      email: string
      cognitoId: string
      role: 'parent' | 'teacher' |
'student' | 'admin'
      name?: string
    }

--------------------------------------

## Phase 4: Update API Routes

### 4.1 Simplify Login Route

File: src/app/api/auth/login/route.ts

Current: Already uses TimeBack
Update: Simplify using SSO SDK patterns

Reference: TimeBack Reference App API
patterns

### 4.2 Add Missing Auth Routes

Create if missing:

   * src/app/api/auth/logout/route.ts
   * src/app/api/auth/me/route.ts
   * src/app/api/auth/refresh/route.ts

Copy patterns from reference app.

--------------------------------------

## Phase 5: Update Middleware & Route
Protection

### 5.1 Update Middleware

File: src/middleware.ts

Reference: /home/duff/00-alpha-school/t
imeback-reference-app/src/middleware.ts

Requirements:

   * Check for timeback-access-token
cookie
   * Redirect unauthenticated users to
/login
   * Support public routes
   * Handle token validation

### 5.2 Define Protected Routes

    const publicRoutes = ['/login',
'/', '/about'];
    const protectedRoutes =
['/dashboard', '/profile',
'/settings'];

--------------------------------------

## Phase 6: Update Components & UI

### 6.1 Update Login Component

File: src/app/login/page.tsx

Current: Likely has both Supabase and
TimeBack elements
Update: Pure TimeBack auth using SSO
SDK

Reference:
/home/duff/00-alpha-school/timeback-ref
erence-app/src/app/login/page.tsx

### 6.2 Remove Google OAuth UI

   * Remove "Continue with Google"
buttons
   * Remove OAuth provider components
   * Clean up OAUTH_SETUP.md
documentation

### 6.3 Update Logout Components

Ensure logout properly clears TimeBack
tokens and sessions.

--------------------------------------

## Phase 7: Environment & Configuration

### 7.1 Clean Environment Variables

Remove:

    # Remove these from .env files and 
documentation
    NEXT_PUBLIC_SUPABASE_URL=*
    NEXT_PUBLIC_SUPABASE_ANON_KEY=*
    GOOGLE_CLIENT_ID=*
    GOOGLE_CLIENT_SECRET=*

Keep:

    # Keep these
    NEXT_PUBLIC_TIMEBACK_API_URL=http:/
/localhost:8080
    NODE_ENV=development

### 7.2 Update Documentation

   * Update README.md to remove
Supabase setup instructions
   * Update OAUTH_SETUP.md to reflect
TimeBack-only auth
   * Reference the
TIMEBACK_LOCAL_SETUP.md for auth setup

--------------------------------------

## Phase 8: Enhanced Integration

### 8.1 Add Educational Data
Integration

Copy from reference app:

   * src/lib/api/oneroster-client.ts -
Student/teacher/class management
   * src/lib/api/qti-client.ts -
Assessment integration

### 8.2 Add Educational Components

Consider adding:

   * Student dashboard
   * Parent-child relationship
management
   * Class enrollment views
   * Assessment taking interface

--------------------------------------

## Phase 9: Testing & Validation

### 9.1 Test Authentication Flow

   1. Register New User:
          cd /home/duff/00-alpha-school
/timeback-superbuilders
          export COGNITO_USER_POOL_ID="
us-east-1_Bzhz5PGqq"
          export COGNITO_CLIENT_ID="4i6
vie24a9jp2hthaiuf1emh9k"
          export AWS_REGION="us-east-1"
          bun auth-helper.ts register
testteacher@example.com
TestPassword123! 'Test Teacher'
   2. Test Login in Teaching Tales:
      3. Start app: bun run dev
      4. Login with new credentials
      5. Verify token storage and
session management
   6. Test Route Protection:
      7. Try accessing protected routes
 without auth
      8. Verify redirects work properly
      9. Test logout clears session

### 9.2 API Integration Testing

    # Test that Teaching Tales can make
 authenticated calls to local TimeBack
    curl -H "Authorization: Bearer 
$(cat /home/duff/00-alpha-school/timeba
ck-superbuilders/.auth-token)" \
      http://localhost:8080/api/auth/me

--------------------------------------

## Phase 10: Cleanup & Documentation

### 10.1 Remove Dead Code

   * Remove unused imports
   * Remove Supabase-related components
   * Clean up unused environment
variables
   * Remove Google OAuth setup code

### 10.2 Update Documentation

   * Update setup instructions
   * Document new auth flow
   * Add troubleshooting for TimeBack
auth
   * Update API documentation

--------------------------------------

## Success Criteria

### Authentication

   * ✅ Users can register/login
through TimeBack only
   * ✅ JWT tokens properly managed via
 SSO SDK
   * ✅ Route protection works
correctly
   * ✅ Logout clears all TimeBack
sessions

### Integration

   * ✅ No Supabase dependencies remain
   * ✅ Teaching Tales works entirely
with local TimeBack
   * ✅ Educational data can be
accessed via OneRoster/QTI APIs

### Code Quality

   * ✅ Clean, consistent auth patterns
   * ✅ No mixed auth implementations
   * ✅ Proper error handling
   * ✅ Updated documentation

--------------------------------------

## Key Patterns to Follow

### From Reference App

   * SSO SDK usage patterns
   * Token management strategies
   * Route protection middleware
   * Error handling approaches

### Working Local Setup

   * Use localhost:8080 for all
TimeBack calls
   * Use production Cognito credentials
 for auth
   * Test with demo123@example.com /
TestPassword123!

### Educational Focus

   * Keep Teaching Tales' educational
theme
   * Add parent-teacher-student
relationships
   * Integrate assessment capabilities
   * Build on OneRoster data standards

--------------------------------------

## Files to Reference

### TimeBack Reference App Examples

   * /home/duff/00-alpha-school/timebac
k-reference-app/src/lib/auth/sso.ts
   *
/home/duff/00-alpha-school/timeback-ref
erence-app/src/lib/auth/context.tsx
   * /home/duff/00-alpha-school/timebac
k-reference-app/src/middleware.ts
   * /home/duff/00-alpha-school/timebac
k-reference-app/src/app/login/page.tsx


∴ Thinking
  The user wants me to create 
instructions for an agent to update the
 Teaching Tales project to switch from 
Supabase auth to TimeBack auth. 

  Let me think about this carefully:

  1. Current state: Teaching Tales has 
Supabase auth + some TimeBack 
integration
  2. Goal state: Teaching Tales should 
use TimeBack auth completely, removing 
Supabase auth

  From my analysis earlier, I saw that 
Teaching Tales already has some 
TimeBack auth integration:
  - `src/lib/timeback-auth.ts` - 
TimeBack API integration  
  - `src/contexts/AuthContext.tsx` - 
Already using TimeBack API for auth
  - `src/app/api/auth/login/route.ts` -
 Login endpoint using TimeBack

  But it also has:
  - Supabase client and configuration
  - References to Google OAuth (planned
 through Cognito)
  - Mixed auth patterns

  The agent will need to:
  1. Remove all Supabase dependencies 
and code
  2. Fully implement TimeBack auth 
patterns (similar to the reference app)
  3. Update all components to use 
TimeBack auth consistently
  4. Remove any Google OAuth setup that
 was going through Supabase
  5. Update middleware and route 
protection
  6. Clean up any mixed auth patterns

  I should provide very detailed 
instructions that include:
  - What to remove (Supabase stuff)
  - What to keep (existing TimeBack 
integration)
  - What to enhance (make it more like 
the reference app)
  - Specific files to modify
  - Code patterns to follow
  - Testing instructions

  I should also reference the working 
local setup we just established and the
 patterns from the reference app.

# 🔄 Agent Instructions: Switch
Teaching Tales from Supabase to
TimeBack Auth

## Mission Overview

Update the Teaching Tales project to
completely replace Supabase
authentication with TimeBack
authentication, using the local
TimeBack instance as the single source
of truth for user management.

--------------------------------------

## Current State Analysis

### What Teaching Tales Currently Has

   * ✅ TimeBack Integration: Already
has timeback-auth.ts and API
integration
   * ✅ Local Config: .env.local
pointing to localhost:8080
   * ✅ Working Credentials:
demo123@example.com / TestPassword123!
   * ❌ Mixed Auth: Both Supabase and
TimeBack auth coexisting
   * ❌ Incomplete: Not using TimeBack
SSO SDK patterns

### Reference Implementation

Use the TimeBack Reference App
(/home/duff/00-alpha-school/timeback-re
ference-app) as the gold standard for
auth patterns.

--------------------------------------

## Phase 1: Audit & Remove Supabase
Dependencies

### 1.1 Remove Supabase Dependencies

    # Remove Supabase packages
    bun remove @supabase/supabase-js
@supabase/auth-helpers-nextjs

    # Check what's left
    grep -r "supabase" src/
package.json || echo "Supabase 
references found"

### 1.2 Files to Remove/Clean

   * Remove entirely:
src/lib/supabase.ts
   * Clean up: Any Supabase imports in
other files
   * Remove: Supabase environment
variables from documentation
   * Clean: Any references to Google
OAuth through Supabase

### 1.3 Directory Audit

Search and remove ALL Supabase
references:

    grep -r
"supabase\|createClient\|@supabase"
src/

--------------------------------------

## Phase 2: Install & Configure
TimeBack SSO SDK

### 2.1 Install TimeBack SSO SDK

    bun add @timeback/sso-sdk

### 2.2 Create TimeBack SSO Client

Create new file:
src/lib/auth/timeback-sso.ts

Copy patterns from:
/home/duff/00-alpha-school/timeback-ref
erence-app/src/lib/auth/sso.ts

    import { TimeBackSSO } from
'@timeback/sso-sdk';

    export const sso = new
TimeBackSSO({
      apiBaseUrl: process.env.NEXT_PUBL
IC_TIMEBACK_API_URL ||
'http://localhost:8080',
      autoCheck: true,
    });

    export function getAuthToken():
string | null {
      return sso.getToken();
    }

    export async function
isAuthenticated(): Promise<boolean> {
      // Implementation from reference 
app
    }

    // Add login, logout, user 
management functions

--------------------------------------

## Phase 3: Update Authentication
Context

### 3.1 Enhance AuthContext

File: src/contexts/AuthContext.tsx

Current: Already uses TimeBack API
Update: Switch to TimeBack SSO SDK
patterns

Reference:
/home/duff/00-alpha-school/timeback-ref
erence-app/src/lib/auth/context.tsx

Key Changes:

   * Replace direct API calls with SSO
SDK
   * Use SSO SDK token management
   * Remove any Supabase user
interfaces
   * Implement proper token refresh
cycles

### 3.2 Update User Interface

    interface TimeBackUser {
      id: string
      email: string
      cognitoId: string
      role: 'parent' | 'teacher' |
'student' | 'admin'
      name?: string
    }

--------------------------------------

## Phase 4: Update API Routes

### 4.1 Simplify Login Route

File: src/app/api/auth/login/route.ts

Current: Already uses TimeBack
Update: Simplify using SSO SDK patterns

Reference: TimeBack Reference App API
patterns

### 4.2 Add Missing Auth Routes

Create if missing:

   * src/app/api/auth/logout/route.ts
   * src/app/api/auth/me/route.ts
   * src/app/api/auth/refresh/route.ts

Copy patterns from reference app.

--------------------------------------

## Phase 5: Update Middleware & Route
Protection

### 5.1 Update Middleware

File: src/middleware.ts

Reference: /home/duff/00-alpha-school/t
imeback-reference-app/src/middleware.ts

Requirements:

   * Check for timeback-access-token
cookie
   * Redirect unauthenticated users to
/login
   * Support public routes
   * Handle token validation

### 5.2 Define Protected Routes

    const publicRoutes = ['/login',
'/', '/about'];
    const protectedRoutes =
['/dashboard', '/profile',
'/settings'];

--------------------------------------

## Phase 6: Update Components & UI

### 6.1 Update Login Component

File: src/app/login/page.tsx

Current: Likely has both Supabase and
TimeBack elements
Update: Pure TimeBack auth using SSO
SDK

Reference:
/home/duff/00-alpha-school/timeback-ref
erence-app/src/app/login/page.tsx

### 6.2 Remove Google OAuth UI

   * Remove "Continue with Google"
buttons
   * Remove OAuth provider components
   * Clean up OAUTH_SETUP.md
documentation

### 6.3 Update Logout Components

Ensure logout properly clears TimeBack
tokens and sessions.

--------------------------------------

## Phase 7: Environment & Configuration

### 7.1 Clean Environment Variables

Remove:

    # Remove these from .env files and 
documentation
    NEXT_PUBLIC_SUPABASE_URL=*
    NEXT_PUBLIC_SUPABASE_ANON_KEY=*
    GOOGLE_CLIENT_ID=*
    GOOGLE_CLIENT_SECRET=*

Keep:

    # Keep these
    NEXT_PUBLIC_TIMEBACK_API_URL=http:/
/localhost:8080
    NODE_ENV=development

### 7.2 Update Documentation

   * Update README.md to remove
Supabase setup instructions
   * Update OAUTH_SETUP.md to reflect
TimeBack-only auth
   * Reference the
TIMEBACK_LOCAL_SETUP.md for auth setup

--------------------------------------

## Phase 8: Enhanced Integration

### 8.1 Add Educational Data
Integration

Copy from reference app:

   * src/lib/api/oneroster-client.ts -
Student/teacher/class management
   * src/lib/api/qti-client.ts -
Assessment integration

### 8.2 Add Educational Components

Consider adding:

   * Student dashboard
   * Parent-child relationship
management
   * Class enrollment views
   * Assessment taking interface

--------------------------------------

## Phase 9: Testing & Validation

### 9.1 Test Authentication Flow

   1. Register New User:
          cd /home/duff/00-alpha-school
/timeback-superbuilders
          export COGNITO_USER_POOL_ID="
us-east-1_Bzhz5PGqq"
          export COGNITO_CLIENT_ID="4i6
vie24a9jp2hthaiuf1emh9k"
          export AWS_REGION="us-east-1"
          bun auth-helper.ts register
testteacher@example.com
TestPassword123! 'Test Teacher'
   2. Test Login in Teaching Tales:
      3. Start app: bun run dev
      4. Login with new credentials
      5. Verify token storage and
session management
   6. Test Route Protection:
      7. Try accessing protected routes
 without auth
      8. Verify redirects work properly
      9. Test logout clears session

### 9.2 API Integration Testing

    # Test that Teaching Tales can make
 authenticated calls to local TimeBack
    curl -H "Authorization: Bearer 
$(cat /home/duff/00-alpha-school/timeba
ck-superbuilders/.auth-token)" \
      http://localhost:8080/api/auth/me

--------------------------------------

## Phase 10: Cleanup & Documentation

### 10.1 Remove Dead Code

   * Remove unused imports
   * Remove Supabase-related components
   * Clean up unused environment
variables
   * Remove Google OAuth setup code

### 10.2 Update Documentation

   * Update setup instructions
   * Document new auth flow
   * Add troubleshooting for TimeBack
auth
   * Update API documentation

--------------------------------------

## Success Criteria

### Authentication

   * ✅ Users can register/login
through TimeBack only
   * ✅ JWT tokens properly managed via
 SSO SDK
   * ✅ Route protection works
correctly
   * ✅ Logout clears all TimeBack
sessions

### Integration

   * ✅ No Supabase dependencies remain
   * ✅ Teaching Tales works entirely
with local TimeBack
   * ✅ Educational data can be
accessed via OneRoster/QTI APIs

### Code Quality

   * ✅ Clean, consistent auth patterns
   * ✅ No mixed auth implementations
   * ✅ Proper error handling
   * ✅ Updated documentation

--------------------------------------

## Key Patterns to Follow

### From Reference App

   * SSO SDK usage patterns
   * Token management strategies
   * Route protection middleware
   * Error handling approaches

### Working Local Setup

   * Use localhost:8080 for all
TimeBack calls
   * Use production Cognito credentials
 for auth
   * Test with demo123@example.com /
TestPassword123!

### Educational Focus

   * Keep Teaching Tales' educational
theme
   * Add parent-teacher-student
relationships
   * Integrate assessment capabilities
   * Build on OneRoster data standards

--------------------------------------

## Files to Reference

### TimeBack Reference App Examples

   * /home/duff/00-alpha-school/timebac
k-reference-app/src/lib/auth/sso.ts
   *
/home/duff/00-alpha-school/timeback-ref
erence-app/src/lib/auth/context.tsx
   * /home/duff/00-alpha-school/timebac
k-reference-app/src/middleware.ts
   * /home/duff/00-alpha-school/timebac
k-reference-app/src/app/login/page.tsx

### Current Teaching Tales Files

   * /home/duff/00-alpha-school/teachin
g-tales/src/lib/timeback-auth.ts
(enhance)
   * /home/duff/00-alpha-school/teachin
g-tales/src/contexts/AuthContext.tsx
(update)
   * /home/duff/00-alpha-school/teachin
g-tales/TIMEBACK_LOCAL_SETUP.md
(reference)

--------------------------------------

## Final Validation Commands

    # 1. Verify no Supabase references
    grep -r "supabase\|@supabase" src/
|| echo "✅ Supabase removed"

    # 2. Verify TimeBack integration
    grep -r "timeback\|@timeback" src/
&& echo "✅ TimeBack integrated"

    # 3. Test authentication
    bun run dev
    # Navigate to login, test with 
demo123@example.com

    # 4. Verify local API integration
    curl
http://localhost:8080/api/auth/info

This migration will transform Teaching
Tales into a pure
TimeBack-authenticated educational
platform, ready for integration with
the full TimeBack ecosystem! 🚀
