# Generate Questions API Tests

This directory contains comprehensive unit tests for the `/api/generate-questions` endpoint.

## Test Files

### `route.test.ts`
Main test suite covering:
- **Feature Flag Gating**: Tests for enabled/disabled feature flag scenarios
- **Authentication Flow**: Cookie/header authentication, token validation, auth failures
- **Input Validation**: All validation rules including content length, grade levels, constraints
- **Service Integration**: QuestionGenerationService integration and parameter passing
- **Performance Metrics**: Response structure validation and metadata verification

### `route.error-handling.test.ts` 
Additional test suite focusing on:
- **Service Error Handling**: AIServiceError, ValidationError, TimeoutError scenarios
- **Top-Level Error Handling**: Network errors, memory errors, JSON parsing errors
- **PII Redaction & Security**: Email redaction, student ID protection, user agent truncation
- **Performance & Monitoring**: Comprehensive logging verification and rate limiting prep

## Running Tests

```bash
# Run all generate-questions endpoint tests
npm run test:generate-questions

# Run specific test file
npx jest src/app/api/generate-questions/__tests__/route.test.ts

# Run with coverage
npx jest src/app/api/generate-questions/__tests__/ --coverage

# Watch mode for development
npx jest src/app/api/generate-questions/__tests__/ --watch
```

## Test Coverage

The tests provide comprehensive coverage of:

### ✅ **Feature Flag Testing**
- Feature disabled (501 response)
- Feature enabled (proceeds to authentication)
- Fail-fast principle verification

### ✅ **Authentication Testing** 
- Cookie-based authentication success
- Header-based authentication success
- Missing token (401 response)
- Invalid token (401 response) 
- TimeBack API unavailable (503 response)

### ✅ **Input Validation Testing**
- Missing required fields (sectionContent, gradeLevel, sectionIndex)
- Content length validation (too short/too long)
- Grade level validation (valid: K-1, 2-3, 4-5, 6-8)
- Section index bounds (0-100)
- Constraints validation (question count, types, lengths)

### ✅ **Service Integration Testing**
- Correct parameter passing to QuestionGenerationService
- Response structure validation
- Performance metadata inclusion
- Success logging verification

### ✅ **Error Handling Testing**
- AIServiceError classification (retryable vs non-retryable)
- ValidationError handling (422 response)
- TimeoutError handling (504 response)
- Generic service errors (500 response)
- Empty questions response validation
- Network errors (503 response)
- Memory/resource errors (507 response)
- JSON parsing errors (400 response)

### ✅ **Security & PII Testing**
- Email address redaction in logs (`sens***@example.com`)
- Student ID redaction (`student1***`)
- User agent truncation (50 chars + `...`)
- Safe metadata logging

### ✅ **Performance & Monitoring**
- Request/response size metrics
- Performance timing breakdown
- Quality metrics (avg question length, model used)
- Rate limiting preparation hooks
- Comprehensive structured logging

## Mocked Dependencies

The tests mock all external dependencies:
- `next/headers` (cookies)
- `@/lib/ai` (QuestionGenerationService, AIServiceError) 
- `@/lib/config` (FEATURE_FLAGS)
- `global.fetch` (TimeBack API calls)
- `crypto.randomUUID` (consistent request IDs)

## Test Data

Tests use realistic test data including:
- Various content lengths and complexities
- All supported grade levels
- Different constraint combinations
- Multiple error scenarios
- PII data for redaction testing

## Performance Expectations

Tests verify the endpoint meets performance targets:
- Response time logging included
- Service call duration tracking
- Total request time measurement
- Error response time limits

## Security Verification

Tests ensure security measures are working:
- PII redaction in all log statements
- Safe error message exposure
- Request sanitization
- Rate limiting preparation

This test suite ensures the `/api/generate-questions` endpoint is production-ready with comprehensive error handling, security measures, and performance monitoring.
