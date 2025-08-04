# Manual API Testing with curl

This guide shows you how to test the OneRoster Child User Creation API using curl commands.

## 🔐 Step 1: Get Authentication Token

### Option A: Via Web Browser (Easiest)
1. Open http://localhost:3001/login in your browser
2. Log in with your credentials
3. Open browser developer tools (F12)
4. Go to Application/Storage tab → Cookies
5. Copy the `timeback-access-token` value

### Option B: Via curl Login
```bash
# Login and capture cookies
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'

# The cookies.txt file now contains your authentication cookies
```

## 🧪 Step 2: Test API Endpoints

### Replace Variables:
- `YOUR_TOKEN` = your access token from Step 1
- `YOUR_USER_ID` = your user ID (from login response or browser)

---

## ✅ Test Case 1: Create Child User (Success)

```bash
curl -X POST http://localhost:3001/api/ims/oneroster/v1p1/users \
  -H "Content-Type: application/json" \
  -H "Cookie: timeback-access-token=YOUR_TOKEN" \
  -d '{
    "role": "student",
    "givenName": "Jane",
    "familyName": "Doe", 
    "email": "jane.doe@example.com",
    "username": "jane.doe",
    "grades": ["3rd Grade"],
    "agents": [{
      "sourcedId": "YOUR_USER_ID",
      "agentSourcedId": "YOUR_USER_ID"
    }],
    "metadata": {
      "age": 8,
      "readingLevel": "intermediate",
      "interests": ["science", "reading"],
      "preferences": {}
    }
  }'
```

**Expected Response:**
- Status: `201 Created`
- Response contains `user.sourcedId`, `user.metadata.childId`, `user.metadata.parentId`
- `user.metadata.relationshipEstablished` should be `true`

---

## 🔍 Test Case 2: Validation Error - Missing Grade Level

```bash
curl -X POST http://localhost:3001/api/ims/oneroster/v1p1/users \
  -H "Content-Type: application/json" \
  -H "Cookie: timeback-access-token=YOUR_TOKEN" \
  -d '{
    "role": "student",
    "givenName": "John",
    "familyName": "Test",
    "email": "john.test@example.com",
    "agents": [{
      "sourcedId": "YOUR_USER_ID",
      "agentSourcedId": "YOUR_USER_ID"
    }],
    "metadata": {
      "age": 8
    }
  }'
```

**Expected Response:**
- Status: `400 Bad Request`
- Error message: `"Grade level is required for student users"`

---

## 🔍 Test Case 3: Validation Error - Missing Age

```bash
curl -X POST http://localhost:3001/api/ims/oneroster/v1p1/users \
  -H "Content-Type: application/json" \
  -H "Cookie: timeback-access-token=YOUR_TOKEN" \
  -d '{
    "role": "student",
    "givenName": "Jane",
    "familyName": "Test",
    "email": "jane.test@example.com",
    "grades": ["2nd Grade"],
    "agents": [{
      "sourcedId": "YOUR_USER_ID",
      "agentSourcedId": "YOUR_USER_ID"
    }],
    "metadata": {
      "readingLevel": "beginner"
    }
  }'
```

**Expected Response:**
- Status: `400 Bad Request`
- Error message: `"Age is required for student users and must be a number"`

---

## 🔍 Test Case 4: Validation Error - Missing Agent Relationship

```bash
curl -X POST http://localhost:3001/api/ims/oneroster/v1p1/users \
  -H "Content-Type: application/json" \
  -H "Cookie: timeback-access-token=YOUR_TOKEN" \
  -d '{
    "role": "student",
    "givenName": "Bob",
    "familyName": "Test",
    "email": "bob.test@example.com",
    "grades": ["1st Grade"],
    "metadata": {
      "age": 6
    }
  }'
```

**Expected Response:**
- Status: `400 Bad Request`
- Error message: `"Student users must have at least one parent agent relationship"`

---

## 👨‍👩‍👧‍👦 Test Case 5: Get Parent with Children

```bash
curl -X GET http://localhost:3001/api/ims/oneroster/v1p1/users \
  -H "Cookie: timeback-access-token=YOUR_TOKEN"
```

**Expected Response:**
- Status: `200 OK`
- Response contains `users[0].agents` array with child agents
- Each agent should have `type: "student"`

---

## 🧒 Test Case 6: Get Children (Filtered)

```bash
curl -X GET "http://localhost:3001/api/ims/oneroster/v1p1/users?filter=agents.agentSourcedId%3D%27YOUR_USER_ID%27%26role%3D%27student%27" \
  -H "Cookie: timeback-access-token=YOUR_TOKEN"
```

**Expected Response:**
- Status: `200 OK`
- Response contains array of child users
- Each user should have `role: "student"`
- Each user should have parent in `agents` array

---

## 🛠️ Troubleshooting

### Authentication Issues:
- **401 Unauthorized**: Token expired or invalid - re-login
- **403 Forbidden**: Check user permissions

### Common Errors:
- **400 Bad Request**: Check request payload format
- **500 Internal Server Error**: Check server logs

### Debug Commands:
```bash
# Test authentication status
curl -I http://localhost:3001/api/ims/oneroster/v1p1/users \
  -H "Cookie: timeback-access-token=YOUR_TOKEN"

# Should return 200 OK if authenticated, 401 if not
```

---

## 📝 Quick Reference

### Using Cookie File (Alternative Method):
```bash
# After login with cookie file:
curl -b cookies.txt -X GET http://localhost:3001/api/ims/oneroster/v1p1/users

# Create child with cookie file:
curl -b cookies.txt -X POST http://localhost:3001/api/ims/oneroster/v1p1/users \
  -H "Content-Type: application/json" \
  -d '{ /* child data */ }'
```

### JSON Pretty Printing:
```bash
# Add | jq for formatted JSON output (if jq is installed)
curl ... | jq
```

---

**✅ All test cases validate the enhanced Child User Creation API with proper validation, error handling, and bidirectional agent relationships!**