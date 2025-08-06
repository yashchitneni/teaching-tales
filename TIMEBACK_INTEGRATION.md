# TimeBack Integration Guide

## 🚀 Quick Start

### Prerequisites
- TimeBack server running on `localhost:8080`
- Node.js and npm/bun installed

### Verify Integration
```bash
# Check server is running
curl http://localhost:8080/api/auth/info

# Update API spec from live server
./update-api-spec.sh

# Run integration tests
node test-timeback-corrected.js
```

## 📡 API Specification

### Current Source
- **Live Server**: `http://localhost:8080/openapi.json`
- **Local File**: `api-spec.json` (auto-updated)
- **Title**: TimeBack API - Open Badges v3.0, OneRoster v1.2, QTI v3.0 & CASE v1.1

### Key Endpoints
- **Auth**: `/api/auth/login`, `/api/auth/me`
- **OneRoster v1.2**: `/ims/oneroster/rostering/v1p2/*`
- **QTI v3.0**: `/ims/qti/v3p0/*`
- **Open Badges**: `/ims/ob/v3p0/*`

## 🔐 Authentication

### AWS Cognito Setup
```javascript
// Login and get JWT token
const response = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// Use token in requests
const token = response.data.accessToken;
fetch('http://localhost:8080/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Test Credentials
- **Username**: `student@timeback.school`
- **Password**: `TempPass123!`

## 🧪 Testing

### Integration Test
```bash
# Run main integration test
node test-timeback-corrected.js

# Manual endpoint tests
curl http://localhost:8080/ims/oneroster/rostering/v1p2/users
# Expected: {"success":false,"error":{"message":"Authentication required"}}
```

### Automated Testing
```bash
# Full test suite
node automated-test.js
```

## 🔧 Maintenance

### Update API Spec
```bash
# Automated update (recommended)
./update-api-spec.sh

# Manual update
curl -s http://localhost:8080/openapi.json > api-spec.json
```

### Monitor Server
```bash
# Check if TimeBack is running
curl -f http://localhost:8080/api/auth/info || echo "Server down"
```

## 📁 Key Files

- `api-spec.json` - Live API specification
- `update-api-spec.sh` - Automated spec updater
- `src/lib/api-client.ts` - API client implementation
- `test-timeback-corrected.js` - Integration test suite

## ⚠️ Troubleshooting

### Server Not Running
```bash
# Start TimeBack server
cd ../timeback-superbuilders
bun run dev
```

### Authentication Issues
- Verify Cognito credentials in test files
- Check token expiration (expires in 3600 seconds)
- Ensure proper Authorization header format

### API Spec Issues
- Run `./update-api-spec.sh` to get latest spec
- Verify server is accessible at localhost:8080
- Check if endpoints match current specification
