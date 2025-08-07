# Student-Only Migration Implementation Plan

## Overview
Migrate from parent-child multi-role architecture to a simplified student-only application where students login directly and manage their own stories.

## 🎯 Goals
- Remove parent-child account relationships
- Simplify authentication to student-only
- Eliminate CreateChildModal and child creation flows
- Maintain OneRoster compliance with simplified model
- Preserve existing book creation and story functionality

## ⚠️ Risk Assessment - REVISED

### Low Risk Areas (Based on API Spec Analysis)
- **TimeBack API Integration** - ✅ No changes needed, already supports student-only
- **OneRoster Compliance** - ✅ No agent relationships to remove, spec already compliant
- **Session Management** - ✅ Minimal changes, just role defaults

### Medium Risk Areas
- **UI Component Dependencies** - CreateChildModal used in multiple places  
- **Existing User Data** - Current users may have parent role, need graceful migration
- **Test Infrastructure** - Test suites assume parent-child relationships

### Removed Risks
- ~~OneRoster agent relationship removal~~ - **Never existed in TimeBack API**
- ~~API contract violations~~ - **No API changes required**
- ~~Database schema changes~~ - **Using same OneRoster user model**

## 📋 Implementation Phases

### Phase 1: Data Model Preparation (Non-Breaking)
*Goal: Update interfaces and types without changing runtime behavior*

#### 1.1 Update TypeScript Interfaces Based on TimeBack API Spec
**File: `src/lib/api-client.ts`**

**Current TimeBack API Contract:**
- **Auth roles**: `"user" | "student" | "teacher" | "admin" | "superadmin"`  
- **OneRoster roles**: `"administrator" | "aide" | "guardian" | "parent" | "proctor" | "relative" | "student" | "teacher"`

```typescript
// Change our interface to match TimeBack spec exactly:
interface OneRosterUser {
  // Required fields per TimeBack spec
  username: string;
  givenName: string;
  familyName: string;
  role: 'student'; // Restrict from full OneRoster enum to student-only
  orgIds: string[];
  enabledUser: boolean;
  
  // Optional fields
  email?: string;
  grades?: string[];
  metadata?: {
    age?: number;
    readingLevel?: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
    // Remove parentId - no longer needed
  };
  
  // Response-only fields (returned by API)
  sourcedId?: string;
  status?: 'active' | 'tobedeleted';
  dateLastModified?: string;
  orgs?: Array<{ href: string; sourcedId: string; type: string }>;
}
```

#### 1.2 Create Student-Only User Interface
**File: `src/lib/types/student-user.ts` (new)**
```typescript
interface StudentUser {
  sourcedId: string;
  username: string;
  givenName: string;
  familyName: string;
  role: 'student';
  orgIds: string[];
  enabledUser: boolean;
  email?: string;
  grades?: string[];
  // Student-specific metadata only
  metadata?: {
    age?: number;
    readingLevel?: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
  };
}
```

#### 1.3 Validation
- [ ] TypeScript compilation passes
- [ ] No runtime changes yet
- [ ] All existing tests pass

---

### Phase 2: Authentication Simplification
*Goal: Update authentication to default to student role*

#### 2.1 Update Authentication Routes Per TimeBack Spec
**File: `src/app/api/auth/login/route.ts`**
```typescript
// Line 95: Use TimeBack's user role directly
// TimeBack returns: "user" | "student" | "teacher" | "admin" | "superadmin"
// For our app, we'll map non-student roles to student
const userRole = timebackUser.role;
const appRole = (userRole === 'student') ? 'student' : 'student'; // Always student for now

role: appRole,
```

**File: `src/app/api/auth/me/route.ts`**
```typescript
// Line 53: Same mapping logic
const userRole = timebackUser.role;
const appRole = (userRole === 'student') ? 'student' : 'student';

role: appRole,
```

#### 2.2 Update Signup Flow
**File: `src/app/signup/page.tsx`**
- Remove references to creating "parent" accounts
- Update copy to reference student accounts directly
- Ensure signup creates student role by default

#### 2.3 Update Onboarding
**File: `src/app/onboarding/create-child/page.tsx`**
- Rename to `src/app/onboarding/create-profile/page.tsx`
- Remove parent-child relationship logic
- Update to create direct student account
- Remove parentId metadata assignment

#### 2.4 Validation
- [ ] New users created with 'student' role
- [ ] Login/logout flow works unchanged
- [ ] Onboarding creates student accounts directly
- [ ] Test with fresh signup

---

### Phase 3: UI Component Simplification
*Goal: Remove parent-child UI components and flows*

#### 3.1 Remove CreateChildModal
**Files to modify:**
- `src/components/CreateChildModal.tsx` - DELETE
- `src/app/dashboard/page.tsx` - Remove imports and modal logic
- `src/app/test-modal/page.tsx` - Remove or update test

#### 3.2 Simplify Dashboard
**File: `src/app/dashboard/page.tsx`**

**Current Logic:**
```typescript
// Remove this entire pattern:
const loadStudents = async () => {
  const response = await fetchUsers({ role: 'student' })
  setStudents(response.users)
}

// Replace with direct user experience
```

**New Logic:**
```typescript
// Direct student dashboard - show current user's books
const loadUserBooks = async () => {
  // Get current user's stories/books directly
  // No need to query for "children"
}
```

#### 3.3 Update Navigation and Routing
**File: `src/middleware.ts`**
- Update protected routes if needed
- Ensure student-only flows work correctly

#### 3.4 Validation
- [ ] Dashboard shows current student's content
- [ ] No CreateChildModal references remain
- [ ] Navigation flows work for student-only
- [ ] Book creation flow works directly from student account

---

### Phase 4: API Integration Cleanup (Simplified)
*Goal: Remove custom parent-child logic from frontend, keep standard OneRoster*

#### 4.1 Update OneRoster Client (Minimal Changes)
**File: `src/lib/api/oneroster-client.ts`**
```typescript
// Keep standard OneRoster v1.2 implementation
// No changes needed - TimeBack API already supports direct student users

// Optional: Remove role filtering if not needed
export async function fetchUsers(filters?: { role?: string }): Promise<UsersResponse> {
  // Keep role filtering for future flexibility
  // Or remove if we only ever query students
}
```

#### 4.2 API Routes - No Changes Required
**File: `src/app/api/ims/oneroster/rostering/v1p2/users/route.ts`**
- ✅ **No changes needed** - Current implementation is correct
- ✅ **TimeBack handles OneRoster v1.2 spec correctly**
- ✅ **Direct student user creation already works**

#### 4.3 Update Book Creation Flow
**File: `src/app/create-book/loading/page.tsx`**
```typescript
// Line 88: Use current authenticated user instead of querying students
// Change from:
const studentsResponse = await fetchUsers({ role: 'student' })

// To: Use current user directly
const { user } = useAuth();
// Book creation for current user only
```

#### 4.4 Validation
- [ ] Book creation flow works with current user context
- [ ] No unnecessary student querying in dashboards
- [ ] OneRoster API calls simplified where possible

---

### Phase 5: Data Migration and Cleanup (Minimal)
*Goal: Clean up custom parent-child logic, keep standard user data*

#### 5.1 User Role Migration Script
**File: `scripts/migrate-user-roles.js` (new)**
```javascript
// Simple script to:
// 1. Query existing users from TimeBack
// 2. Update frontend role mapping for any 'parent' roles to 'student'
// 3. No database changes needed - TimeBack handles user storage
```

#### 5.2 Remove Custom Parent-Child Code
- Remove `CreateChildModal` component
- Clean up custom agent relationship test files
- Remove parent-child documentation in `/archive/task2-docs/`
- Keep standard OneRoster documentation

#### 5.3 Update Documentation
**Files to update:**
- `README.md` - Update to reflect student-only app
- `TIMEBACK_INTEGRATION.md` - Remove custom parent-child examples
- Keep OneRoster v1.2 compliance documentation

#### 5.4 Validation
- [ ] Users can still access their existing content
- [ ] No custom parent-child code remains
- [ ] Standard OneRoster integration still works
- [ ] Documentation reflects simplified architecture

---

### Phase 6: Testing and Validation
*Goal: Comprehensive testing of student-only flow*

#### 6.1 Update Test Suites
**Files to modify:**
- `automated-test.js` - Remove parent-child test cases
- `test-runner.js` - Simplify to student-only scenarios
- `test-timeback-corrected.js` - Update integration tests

#### 6.2 Create New E2E Tests
**File: `tests/student-only-flow.test.js` (new)**
```javascript
// Test complete student journey:
// 1. Student signup
// 2. Direct login
// 3. Book creation
// 4. Story management
```

#### 6.3 Manual Testing Checklist
- [ ] Fresh student signup works
- [ ] Student login redirects to dashboard
- [ ] Dashboard shows student's own books
- [ ] Book creation flow works end-to-end
- [ ] Story reading works
- [ ] No references to parents/children in UI

---

## 🔧 Implementation Order - REVISED

### Week 1: Quick Wins (Low Risk)
- [ ] Phase 1: Data Model Preparation (2 days)
- [ ] Phase 2: Authentication Simplification (2 days)
- [ ] Phase 3: UI Component Simplification (1 day)

### Week 2: Integration & Testing
- [ ] Phase 4: API Integration Cleanup (1 day)
- [ ] Phase 5: Data Migration and Cleanup (2 days)
- [ ] Phase 6: Testing and Validation (2 days)

### Accelerated Timeline Possible
**Original**: 4 weeks → **Revised**: 2 weeks

**Rationale**: No API changes or complex data migrations needed since TimeBack already supports the target architecture.

## 🚨 Rollback Plan - SIMPLIFIED

### If Issues Arise:
1. **Git Branch Strategy**: Each phase in separate branch
2. **Feature Flags**: Toggle between old/new flows during transition
3. **No Data Backup Needed**: TimeBack handles all user data storage
4. **No TimeBack Coordination**: API already supports target architecture

### Rollback Triggers:
- Authentication failures (unlikely - minimal auth changes)
- Critical user experience issues
- ~~OneRoster compliance violations~~ - No API changes
- ~~Data loss during migration~~ - No data migration needed

## 🎯 Success Criteria

### Functional Requirements
- [ ] Students can signup and login directly
- [ ] Book creation works without parent accounts
- [ ] All existing student data preserved
- [ ] OneRoster integration remains functional

### Technical Requirements
- [ ] No breaking changes to TimeBack API contract
- [ ] All tests pass
- [ ] Performance unchanged or improved
- [ ] Security model maintained

### User Experience Requirements
- [ ] Simpler onboarding flow
- [ ] Faster time-to-book-creation
- [ ] No confusing parent-child concepts
- [ ] Clear, student-focused UI

## 📝 Key Insights from API Spec Analysis

### TimeBack API Contract (Source of Truth)
- **OneRoster v1.2 compliant** - Full specification implementation
- **No Agent Relationships** - TimeBack API spec shows NO agent/parent-child relationships in user model
- **Role Enum**: `["administrator", "aide", "guardian", "parent", "proctor", "relative", "student", "teacher"]`
- **Required Fields**: `username`, `givenName`, `familyName`, `role`, `orgIds`, `enabledUser`
- **Metadata**: Flexible object for custom fields

### Critical Discovery
The TimeBack API spec shows **no parent-child agent relationships** in the OneRoster user model. This means:

1. **Our current parent-child logic may not be backed by TimeBack**
2. **Agent relationships were likely a custom implementation**
3. **Student-only migration is fully supported by the API**

### Simplified Migration Strategy
Since TimeBack doesn't implement agent relationships:
- Remove all custom parent-child relationship code
- Use OneRoster user model as designed (single users, no relationships)
- Direct student account creation is the standard approach

## 📝 Notes

- TimeBack API already supports student-only model natively
- No need to modify TimeBack server - it's already compatible
- Focus on frontend simplification rather than API changes
- Monitor user behavior during transition
