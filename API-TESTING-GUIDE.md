# 🧪 OneRoster Child User Creation API - Testing Guide (TimeBack Integration)

⚠️ **UPDATED**: This guide now covers testing the TimeBack OneRoster v1.2 API integration.

This guide provides multiple ways to test the OneRoster User Management functionality via **TimeBack server integration**.

## 🚀 **Quick Start (New TimeBack Integration)**

```bash
# 1. Start TimeBack server
cd ../timeback-superbuilders && bun run dev

# 2. Test integration directly
cd ../trevor && node test-timeback-integration.js

# 3. Test interactively  
node test-runner.js
# Use credentials: demo123@example.com / TestPassword123!
```

## 📋 **What We're Testing**

✅ **TimeBack OneRoster v1.2 Integration** with:
- Direct integration with TimeBack server (localhost:8080)
- OneRoster v1.2 compliant endpoints and data formats
- Robust authentication via TimeBack Cognito system
- Production-ready infrastructure with AWS backend

---

## 🚀 **Testing Methods Available**

### **Method 1: Interactive Test Runner (Recommended for Development)**
**Best for**: Development, debugging, step-by-step testing

```bash
# Run interactive test runner
npm run test:interactive

# Or directly:
node test-runner.js

# Or with custom server (defaults to TimeBack server):
node test-runner.js http://localhost:8080
```

**Features**:
- ✅ Guided authentication process
- ✅ Menu-driven test selection  
- ✅ Real-time response validation
- ✅ Step-by-step progress feedback
- ✅ Detailed error analysis

---

### **Method 2: Automated Test Suite (Best for CI/CD)**
**Best for**: Automated testing, CI/CD pipelines, regression testing

```bash
# Run all tests automatically
npm run test:api user@example.com yourpassword

# Or directly:
node automated-test.js user@example.com yourpassword

# With custom server:
node automated-test.js demo123@example.com TestPassword123! http://localhost:8080
```

**Features**:
- ✅ Complete test suite execution
- ✅ Pass/fail reporting
- ✅ Detailed validation results
- ✅ Exit codes for CI/CD integration
- ✅ Performance timing

---

### **Method 3: Manual curl Testing (Best for Quick Validation)**
**Best for**: Quick spot checks, debugging specific endpoints

📖 **Full Guide**: See [`test-with-curl.md`](./test-with-curl.md)

**Quick Start**:
```bash
# 1. Get authentication token (via browser or curl)
# 2. Test child creation:
curl -X POST http://localhost:8080/ims/oneroster/rostering/v1p2/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{ /* child data */ }'
```

---

### **Method 4: View Test Cases (Documentation)**
**Best for**: Understanding test scenarios, creating custom tests

```bash
# Show all test case documentation
npm run test:cases

# Or directly:
node test-agent-relationships.js
```

**Output**: Comprehensive test case documentation with:
- ✅ Main success test cases
- ✅ Validation error test cases  
- ✅ Manual testing instructions
- ✅ curl command examples

---

## 🎯 **Complete Test Scenarios**

### **Success Path Tests:**
1. **Create Child User** - Full success case with all required fields
2. **Get Parent with Children** - Verify bidirectional relationships
3. **Get Children (Filtered)** - Test agent-based filtering

### **Validation Error Tests:**
1. **Missing Grade Level** - Should return 400 error
2. **Missing Age** - Should return 400 error  
3. **Missing Agent Relationship** - Should return 400 error
4. **Invalid Agent Structure** - Should return 400 error

### **Integration Tests:**
1. **Bidirectional Relationships** - Verify parent-child links in both directions
2. **Database Consistency** - Verify child records and agent metadata
3. **Cleanup on Failure** - Verify rollback when relationship creation fails

---

## 🔧 **Prerequisites**

### **Server Setup:**
```bash
# Make sure TimeBack server is running
cd ../timeback-superbuilders
bun run dev
# TimeBack server should be accessible at http://localhost:8080

# Also ensure trevor frontend is running (for UI testing)
cd ../trevor  
npm run dev
# Frontend accessible at http://localhost:3002 or 3003
```

### **Authentication Required:**
- TimeBack Cognito user account
- Test credentials: demo123@example.com / TestPassword123!
- TimeBack server must be running with Cognito integration

### **Dependencies (Already Installed):**
- `axios` - For HTTP requests
- `readline` - For interactive prompts (Node.js built-in)

---

## 📊 **Expected Test Results**

### **Successful Child Creation:**
```json
{
  "user": {
    "sourcedId": "uuid-generated-id",
    "role": "student", 
    "givenName": "Jane",
    "familyName": "Doe",
    "agents": [
      {
        "sourcedId": "parent-id",
        "agentSourcedId": "parent-id", 
        "type": "parent"
      }
    ],
    "metadata": {
      "childId": "child-db-id",
      "parentId": "parent-id",
      "relationshipEstablished": true,
      "age": 8,
      "readingLevel": "intermediate"
    }
  }
}
```

### **Validation Error Examples:**
```json
{
  "success": false,
  "error": {
    "message": "Grade level is required for student users"
  }
}
```

### **Parent with Children:**
```json
{
  "users": [
    {
      "sourcedId": "parent-id",
      "role": "parent",
      "agents": [
        {
          "sourcedId": "child-id",
          "agentSourcedId": "child-id",
          "type": "student"
        }
      ]
    }
  ]
}
```

---

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **Authentication Problems:**
```bash
# ❌ 401 Unauthorized
# ✅ Solution: Check token validity, re-login if needed
# ✅ Verify cookies are being sent correctly
```

#### **Server Connection:**
```bash
# ❌ Connection Refused
# ✅ Solution: Ensure server is running on correct port
# ✅ Check firewall/network settings
```

#### **Validation Errors:**
```bash
# ❌ 400 Bad Request
# ✅ Solution: Check request payload format
# ✅ Verify all required fields are included
# ✅ Check data types (age should be number)
```

### **Debug Commands:**
```bash
# Test server connectivity
curl -I http://localhost:3001/api/ims/oneroster/v1p1/users

# Test authentication status  
curl -H "Cookie: timeback-access-token=YOUR_TOKEN" http://localhost:3001/api/ims/oneroster/v1p1/users

# View server logs (if accessible)
# Check console output for detailed error messages
```

---

## 📈 **Performance Expectations**

### **Response Times:**
- **Child Creation**: < 2 seconds (includes database writes + relationship creation)
- **Get Parent/Children**: < 500ms (simple database queries)
- **Validation Errors**: < 100ms (immediate validation)

### **Success Rates:**
- **Valid Requests**: 100% success rate expected
- **Invalid Requests**: 100% proper error responses expected
- **Authentication**: Consistent authentication handling

---

## 🎉 **Success Criteria**

### **For Development:**
- ✅ All interactive tests pass
- ✅ Validation errors are caught properly
- ✅ Bidirectional relationships work correctly
- ✅ No orphaned database records on failures

### **For Production Readiness:**  
- ✅ Automated test suite passes 100%
- ✅ Performance meets expectations
- ✅ Error handling is comprehensive
- ✅ Security validation works correctly

---

## 🔄 **Integration with Sprint Progress**

This testing validates **Subtask 2.1 completion** and prepares for:

### **✅ Ready for Subtask 2.3** (User Listing API):
- Child creation working ✅
- Agent relationships established ✅  
- Filtering endpoints tested ✅

### **✅ Ready for Subtask 2.4+2.5** (UI Integration):
- API error messages suitable for UI ✅
- Success responses contain needed metadata ✅
- HTTP status codes correct ✅

### **✅ Ready for Subtask 2.6** (Dashboard):
- Children properly linked to parents ✅
- Agent filtering works ✅
- Complete child metadata available ✅

---

## 📚 **Additional Resources**

- **Sprint Checklist**: `/Library-tree/OneRoster-User-Management-Sprint-Checklist.md`
- **Completion Report**: `/Library-tree/Subtask-2.1-Completion-Report.md`
- **curl Testing Guide**: [`test-with-curl.md`](./test-with-curl.md)
- **Agent Relationships**: [`test-agent-relationships.js`](./test-agent-relationships.js)

---

**🏆 Ready to validate your enhanced Child User Creation API! Choose your preferred testing method and verify that Subtask 2.1 is working perfectly.**