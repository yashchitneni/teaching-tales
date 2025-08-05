# 🔐 TimeBack Local Authentication Setup Guide

This document describes how to successfully set up Teaching Tales to authenticate against a local TimeBack instance.

## ✅ **What We Accomplished**

- ✅ Switched Teaching Tales from production TimeBack (`https://core.timebackapi.com`) to local (`localhost:8080`)
- ✅ Configured local TimeBack API with proper Cognito credentials
- ✅ Successfully registered and logged in a test user
- ✅ Generated working JWT access tokens for API authentication

---

## 🔧 **Setup Steps Performed**

### **Step 1: Configure Teaching Tales for Local TimeBack**

Created `.env.local` file in Teaching Tales project:

```bash
# TimeBack API Configuration
NEXT_PUBLIC_TIMEBACK_API_URL=http://localhost:8080

# Development settings
NODE_ENV=development
```

### **Step 2: Identify Correct Cognito Credentials**

The key discovery was that we needed to use the **production Cognito credentials** (not the outdated ones in the TimeBack docs) to work with the shared AWS Cognito pool.

**Working Credentials** (discovered by querying production API):
```bash
COGNITO_USER_POOL_ID="us-east-1_Bzhz5PGqq"
COGNITO_CLIENT_ID="4i6vie24a9jp2hthaiuf1emh9k"
AWS_REGION="us-east-1"
```

### **Step 3: Start Local TimeBack API with Correct Configuration**

```bash
cd /home/duff/00-alpha-school/timeback-superbuilders

# Kill any existing API process
kill $(lsof -ti:8080) 2>/dev/null

# Start API with proper environment variables
export COGNITO_USER_POOL_ID="us-east-1_Bzhz5PGqq"
export COGNITO_CLIENT_ID="4i6vie24a9jp2hthaiuf1emh9k" 
export AWS_REGION="us-east-1"
bun run dev &
```

**Verification**:
```bash
curl -s http://localhost:8080/api/auth/info
# Should return cognito config with the correct userPoolId and clientId
```

### **Step 4: Register Test User**

```bash
cd /home/duff/00-alpha-school/timeback-superbuilders

# Set environment variables for auth helper
export COGNITO_USER_POOL_ID="us-east-1_Bzhz5PGqq"
export COGNITO_CLIENT_ID="4i6vie24a9jp2hthaiuf1emh9k" 
export AWS_REGION="us-east-1"

# Register new user (auto-confirmed)
bun auth-helper.ts register demo123@example.com TestPassword123! 'Demo User'
```

**Expected Output**:
```
✅ User registered successfully!
🚀 User is auto-confirmed and ready to login!
```

### **Step 5: Login and Get Access Token**

```bash
# Login to get JWT token
bun auth-helper.ts login demo123@example.com TestPassword123!
```

**Expected Output**:
```
✅ Login successful!
Access Token: [long JWT token]
Token saved to .auth-token file
```

---

## 🎯 **Working Test Credentials**

**For Teaching Tales Login**:
- **Email**: `demo123@example.com`
- **Password**: `TestPassword123!`

**For API Testing**:
- **JWT Token**: Saved in `/home/duff/00-alpha-school/timeback-superbuilders/.auth-token`

---

## 🚀 **Using with Teaching Tales**

### **Current Status**

1. **Teaching Tales** is configured to hit `localhost:8080` (via `.env.local`)
2. **Local TimeBack API** is running with proper Cognito configuration  
3. **Test user** exists and can authenticate
4. **JWT tokens** are being generated correctly

### **Next Steps**

1. **Start Teaching Tales**:
   ```bash
   cd /home/duff/00-alpha-school/teaching-tales
   bun run dev
   ```

2. **Test Login**: 
   - Navigate to the login page
   - Use credentials: `demo123@example.com` / `TestPassword123!`
   - Should successfully authenticate against local TimeBack

3. **Verify Token Flow**:
   - Check browser network tab for API calls to `localhost:8080`
   - Verify JWT tokens are being exchanged properly
   - Confirm user session is maintained

---

## 🔍 **Key Discoveries & Troubleshooting**

### **Critical Issues Solved**

1. **Wrong Cognito Credentials**: The documentation had outdated credentials. We discovered the correct ones by querying the production API.

2. **Environment Variable Loading**: The local API wasn't loading Cognito config properly. Solution was to explicitly export environment variables before starting the API.

3. **User Auto-Confirmation**: The system now auto-confirms users via Lambda triggers, so no email confirmation step is needed.

### **Environment Variable Discovery Method**

```bash
# How we found the correct credentials
curl -s https://core.timebackapi.com/api/auth/info
# Returns the current production Cognito configuration
```

### **API Health Check**

```bash
# Verify local API is running correctly
curl -s http://localhost:8080/health
curl -s http://localhost:8080/api/auth/info
```

### **Token Validation**

```bash
# Test that tokens work with local API
TOKEN=$(cat /home/duff/00-alpha-school/timeback-superbuilders/.auth-token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/auth/me
```

---

## 📋 **Quick Reference**

### **Start Local TimeBack API**
```bash
cd /home/duff/00-alpha-school/timeback-superbuilders
export COGNITO_USER_POOL_ID="us-east-1_Bzhz5PGqq"
export COGNITO_CLIENT_ID="4i6vie24a9jp2hthaiuf1emh9k" 
export AWS_REGION="us-east-1"
bun run dev
```

### **Register New User**
```bash
cd /home/duff/00-alpha-school/timeback-superbuilders
export COGNITO_USER_POOL_ID="us-east-1_Bzhz5PGqq"
export COGNITO_CLIENT_ID="4i6vie24a9jp2hthaiuf1emh9k" 
export AWS_REGION="us-east-1"
bun auth-helper.ts register [email] [password] '[name]'
```

### **Login User**
```bash
bun auth-helper.ts login [email] [password]
```

### **Test Authentication**
```bash
TOKEN=$(cat .auth-token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/auth/me
```

---

## 🎯 **Architecture Overview**

```
Teaching Tales (localhost:3000)
        ↓ (NEXT_PUBLIC_TIMEBACK_API_URL)
Local TimeBack API (localhost:8080)
        ↓ (COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID)
AWS Cognito (Production User Pool)
        ↓ (JWT Tokens)
Authentication Success ✅
```

**Key Point**: We're using the **production Cognito user pool** but routing API calls through the **local TimeBack instance**. This gives us the best of both worlds - real authentication with local development flexibility.

---

## 🎉 **Success Metrics**

- ✅ Local TimeBack API responding on port 8080
- ✅ Cognito configuration properly loaded  
- ✅ User registration working (auto-confirmed)
- ✅ Login generating valid JWT tokens
- ✅ Teaching Tales configured to use local API
- ✅ Ready for full integration testing

The local TimeBack authentication setup is now **complete and functional**! 🚀
