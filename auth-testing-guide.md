# Authentication Testing Guide

## Overview
The authentication integration has been successfully implemented, connecting the existing login UI to API authentication endpoints with OneRoster user creation support.

## What Was Implemented

### 1. API Client Setup ✅
- Created centralized API client using axios (`/src/lib/api-client.ts`)
- Configured automatic token handling with Authorization headers
- Added support for both Supabase localStorage tokens and cookie-based auth

### 2. Secure JWT Storage ✅
- Implemented HttpOnly cookies for secure token storage
- Cookies are set in `/api/auth/login` route
- Configured with appropriate security settings (httpOnly, secure, sameSite)

### 3. OneRoster User Creation ✅
- Created OneRoster-compliant user endpoints at `/api/ims/oneroster/v1p1/users`
- Automatic OneRoster user creation during login
- Stores OneRoster metadata in user profiles

### 4. Auth Context Provider ✅
- Updated AuthContext to use new API client
- Added OneRoster data state management
- Integrated with existing Supabase authentication

### 5. Login/Logout Flows ✅
- Login page uses auth context `signIn` method
- Logout clears both cookies and Supabase session
- TopNav displays user email and sign out button

### 6. Token Refresh Mechanism ✅
- Automatic token refresh every 45 minutes
- Handles refresh failures by signing out user
- Cleans up refresh intervals on logout

### 7. Error Handling ✅
- Comprehensive error handling in all API routes
- Proper error messages returned to client
- Automatic retry on 401 errors with token refresh

## How to Test

### Prerequisites
1. Ensure the development server is running: `npm run dev`
2. Open browser to http://localhost:3000

### Test Scenarios

#### 1. **New User Registration & Login**
1. Go to `/signup`
2. Create a new account with email and password
3. After successful signup, try logging in at `/login`
4. **Expected**: 
   - Successful login redirects to `/dashboard`
   - User email appears in top navigation
   - OneRoster user is created (check console logs)

#### 2. **Existing User Login**
1. Go to `/login`
2. Use existing credentials
3. **Expected**:
   - Successful login redirects to `/dashboard`
   - Auth cookies are set (check DevTools > Application > Cookies)
   - API calls include Authorization header

#### 3. **Logout Flow**
1. While logged in, click "Sign Out" in top navigation
2. **Expected**:
   - Redirected to login page
   - Cookies are cleared
   - Cannot access protected routes

#### 4. **Token Refresh (Advanced)**
1. Login successfully
2. Open DevTools > Console
3. Wait 45 minutes or manually expire token
4. **Expected**:
   - Token automatically refreshes
   - No interruption to user session

#### 5. **Protected Route Access**
1. While logged out, try accessing `/dashboard` or `/create-book`
2. **Expected**:
   - Redirected to login page (client-side redirect)
   - After login, redirected back to requested page

### Debugging Tips

#### Check Authentication State
```javascript
// In browser console
localStorage.getItem('sb-gccgwmuyzlsazkliswjp-auth-token')
```

#### Inspect API Requests
1. Open DevTools > Network tab
2. Look for requests to `/api/auth/*`
3. Check request/response headers and cookies

#### Common Issues

1. **500 Error on Login**: 
   - Ensure Supabase environment variables are set in `.env.local`
   - Check that user exists in Supabase

2. **Not Redirecting After Login**:
   - Check browser console for errors
   - Ensure cookies are being set (not blocked by browser)

3. **API Calls Failing**:
   - Check if Authorization header is present
   - Verify token is not expired

## Security Notes

- Tokens are stored in HttpOnly cookies (not accessible via JavaScript)
- Service role key is only used server-side
- All API routes validate authentication
- Automatic token refresh maintains session security

## Next Steps

While the authentication is fully functional, the following could be added:
1. Unit and integration tests for auth flows
2. Rate limiting on auth endpoints
3. Password reset functionality
4. Multi-factor authentication support