# Cognito SSO Migration Plan for TeachingTales

## Overview
This document outlines the migration from Supabase authentication to AWS Cognito SSO, while preserving the teacher/student relationship system.

## Current State
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **User Types**: Parents (current implementation)
- **OneRoster**: Integration already built

## Target State
- **Authentication**: AWS Cognito SSO (like timeback-superbuilders)
- **Database**: Keep Supabase for data, Cognito for auth only
- **User Types**: Teachers and Students (with relationships preserved)
- **OneRoster**: Keep existing integration

## Reference Implementation
The `timeback-superbuilders` app provides:
- AWS Cognito authentication middleware
- JWT token validation
- Role-based access control (including `student` and `teacher` roles)
- Cookie-based SSO support

## Migration Steps

### Phase 1: Infrastructure Setup
1. **AWS Cognito Configuration**
   - Create User Pool with same configuration as timeback-superbuilders
   - Configure app client for web authentication
   - Set up user attributes for roles (teacher/student)

2. **Environment Variables**
   ```env
   # Add to .env.local
   COGNITO_USER_POOL_ID=your-pool-id
   COGNITO_CLIENT_ID=your-client-id
   AWS_REGION=us-east-1
   ```

### Phase 2: Backend Changes

1. **Install Dependencies**
   ```bash
   npm install @aws-sdk/client-cognito-identity-provider jose
   ```

2. **Create Cognito Auth Middleware**
   - Copy/adapt `src/middleware/auth.ts` from timeback-superbuilders
   - Modify to work with Next.js API routes
   - Keep the role system but adapt for teacher/student

3. **Update API Routes**
   - `/api/auth/login` → Cognito authentication
   - `/api/auth/me` → Validate Cognito JWT
   - `/api/auth/logout` → Clear session
   - Remove Supabase-specific code

4. **Database Schema Updates**
   ```sql
   -- Add to profiles table
   ALTER TABLE profiles ADD COLUMN cognito_id VARCHAR(255) UNIQUE;
   ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'student';
   ```

### Phase 3: Frontend Changes

1. **Update API Client**
   ```typescript
   // Remove Supabase session handling
   // Use Cognito access tokens
   // Update request interceptor for JWT
   ```

2. **Update AuthContext**
   - Remove Supabase auth methods
   - Add Cognito login/logout
   - Store Cognito tokens
   - Preserve teacher/student role handling

3. **Update Login Page**
   - Use Cognito authentication flow
   - Support SSO redirect if needed

### Phase 4: User Migration

1. **Export Existing Users**
   - Get all users from Supabase Auth
   - Map to Cognito user format

2. **Import to Cognito**
   - Create users in Cognito
   - Set temporary passwords
   - Send password reset emails

3. **Update Database**
   - Add cognito_id to existing profiles
   - Set appropriate roles (teacher/student)

### Phase 5: Role Management

1. **Teacher/Student Distinction**
   ```typescript
   // During signup/login
   const role = determineUserRole(email, signupData);
   // Store in Cognito custom attributes
   // Store in database profile
   ```

2. **Relationship Management**
   - Keep existing parent-child relationships
   - Rename to teacher-student relationships
   - Update UI terminology

### Phase 6: Cleanup

1. **Remove Supabase Auth Code**
   - Delete auth helper functions
   - Remove Supabase client auth methods
   - Clean up unused imports

2. **Keep Supabase for Database**
   - Continue using for all data storage
   - Only authentication changes

## Code Examples

### New Auth Middleware (Next.js adapted)
```typescript
// src/lib/cognito-auth.ts
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "us-east-1",
});

export async function validateCognitoToken(token: string) {
  try {
    const command = new GetUserCommand({ AccessToken: token });
    const response = await cognitoClient.send(command);
    return response;
  } catch (error) {
    throw new Error("Invalid token");
  }
}
```

### Updated Auth Context
```typescript
// Key changes:
// 1. Replace Supabase signIn with Cognito
// 2. Store Cognito tokens instead of Supabase session
// 3. Validate with Cognito instead of Supabase
```

## Benefits
1. **Unified SSO**: Same auth system as other company apps
2. **Better Role Management**: Cognito custom attributes for roles
3. **Keep Existing Data**: No database migration needed
4. **Scalability**: AWS Cognito handles auth at scale

## Risks & Mitigations
1. **User Disruption**: Send clear communication about password reset
2. **Data Loss**: Backup all user data before migration
3. **Downtime**: Plan maintenance window for cutover

## Timeline
- Phase 1-2: 2 days (Backend setup)
- Phase 3: 1 day (Frontend updates)
- Phase 4: 1 day (User migration)
- Phase 5-6: 1 day (Role management & cleanup)
- Testing: 2 days
- **Total**: ~1 week

## Next Steps
1. Confirm AWS account access and Cognito setup
2. Review and approve migration plan
3. Begin Phase 1 implementation