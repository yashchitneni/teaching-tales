# Integration Test Configuration

This document explains how to configure and run integration tests for the `/api/generate-questions` endpoint.

## Test Types

### Unit Tests vs Integration Tests

- **Unit Tests** (`route.test.ts`, `route.error-handling.test.ts`): Test individual components with mocked dependencies
- **Integration Tests** (`integration.test.ts`): Test end-to-end functionality with real or realistic service calls

## Running Integration Tests

### Basic Integration Tests (with mocked external services)
```bash
npm run test:integration
```

### Real Service Integration Tests (requires external services)
```bash
npm run test:integration:real
```

### All Tests (unit + integration)
```bash
npm run test:all
```

## Environment Configuration

### Required Environment Variables

For **mocked integration tests** (default):
```bash
NEXT_PUBLIC_TIMEBACK_API_URL=http://localhost:8080
# No additional variables required - external services are mocked
```

For **real service integration tests**:
```bash
NEXT_PUBLIC_TIMEBACK_API_URL=http://localhost:8080
INTEGRATION_TEST_REAL_SERVICES=true

# AI Service Configuration (one of these)
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

### Test Configuration Options

```javascript
const INTEGRATION_TEST_ENV = {
  TIMEBACK_API_URL: process.env.NEXT_PUBLIC_TIMEBACK_API_URL,
  USE_REAL_SERVICES: process.env.INTEGRATION_TEST_REAL_SERVICES === 'true',
  TIMEOUT_MS: 30000 // 30 second timeout for integration tests
};
```

## Test Scenarios

### 1. End-to-End Success Flow
- **Purpose**: Validates complete question generation workflow
- **Tests**: Full request/response cycle with realistic data
- **Validates**: Question structure, constraints, metadata, performance

### 2. Authentication Integration  
- **Purpose**: Tests real TimeBack authentication flow
- **Tests**: Valid tokens, invalid tokens, missing tokens
- **Validates**: User identification, authorization, error handling

### 3. Service Integration Resilience
- **Purpose**: Tests behavior under stress and edge cases
- **Tests**: Timeouts, malformed responses, edge case content
- **Validates**: Error recovery, graceful degradation

### 4. Performance Integration
- **Purpose**: Validates performance under realistic load
- **Tests**: Concurrent requests, large content, multiple question types
- **Validates**: Response times, throughput, resource usage

### 5. Error Recovery Integration
- **Purpose**: Tests real-world failure scenarios
- **Tests**: Network failures, service outages, invalid data
- **Validates**: Error logging, user-friendly messages, recovery

### 6. Data Validation Integration
- **Purpose**: End-to-end input validation and sanitization
- **Tests**: Boundary conditions, special characters, edge cases
- **Validates**: Security, data integrity, constraint compliance

## Test Data

### Realistic Test Content
The integration tests use realistic story content to ensure questions are generated appropriately:

```typescript
const VALID_TEST_DATA = {
  sectionContent: `Alice walked through the enchanted forest...`, // ~200 words
  gradeLevel: '4-5',
  sectionIndex: 0,
  constraints: {
    questionCount: 3,
    questionTypes: ['comprehension', 'inference', 'vocabulary'],
    maxQuestionLength: 100,
    maxOptionLength: 50
  }
};
```

## Expected Results

### Successful Integration Test Output
```
✅ Integration test completed in 2500ms
📊 Generated 3 questions
🤖 Used model: gemini-pro
🔄 Retry count: 0
🚀 Performance test: 3 concurrent requests in 7200ms
```

### Test Coverage Goals
- **Response Time**: < 30 seconds per request
- **Concurrent Load**: 3+ simultaneous requests
- **Question Quality**: All constraints met
- **Error Recovery**: Graceful handling of all failure modes
- **Authentication**: Complete auth flow validation

## Troubleshooting

### Common Issues

**TimeoutError**: Increase `TIMEOUT_MS` or check AI service availability
```javascript
jest.setTimeout(60000); // Increase to 60 seconds
```

**Authentication Failures**: Verify TimeBack API URL and token format
```javascript
NEXT_PUBLIC_TIMEBACK_API_URL=http://localhost:8080
```

**Service Unavailable**: Check AI service API keys and quotas
```javascript
ANTHROPIC_API_KEY=sk-... # Verify key is valid
```

### Debug Mode
Enable detailed logging for troubleshooting:
```bash
DEBUG=true npm run test:integration
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Integration Tests
  run: |
    npm run test:integration
  env:
    NEXT_PUBLIC_TIMEBACK_API_URL: ${{ secrets.TIMEBACK_API_URL }}
```

### Real Service Testing (Production-like)
```yaml
- name: Production Integration Tests  
  run: |
    npm run test:integration:real
  env:
    NEXT_PUBLIC_TIMEBACK_API_URL: ${{ secrets.TIMEBACK_API_URL }}
    INTEGRATION_TEST_REAL_SERVICES: true
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

This configuration ensures comprehensive testing of the question generation API under realistic conditions.
