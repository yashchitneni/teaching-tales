# API Documentation: /api/generate-questions

**Endpoint**: `POST /api/generate-questions`  
**Purpose**: Generate comprehension questions for a specific story section  
**Status**: ✅ Production Ready (Phase 3 Complete)  
**Version**: 1.0.0  

## Overview

The `/api/generate-questions` endpoint provides AI-powered question generation for story sections, enabling asynchronous question creation separate from story generation. This endpoint is part of the **Split Generation Architecture** that decouples story and question generation for improved performance and flexibility.

### Key Features

- 🔐 **Secure**: TimeBack authentication integration
- 🚀 **Fast**: Asynchronous processing with performance metrics
- 🛡️ **Robust**: Comprehensive error handling and validation
- 📊 **Monitored**: Detailed logging and performance tracking
- 🎛️ **Controlled**: Feature flag for instant enable/disable
- 📝 **Flexible**: Grade-level appropriate question generation

---

## Authentication

### Required Authentication
- **Cookie**: `timeback-access-token` (preferred)
- **Header**: `Authorization: Bearer <token>` (fallback)

### Validation Process
1. Extract token from cookie or Authorization header
2. Validate token against TimeBack API (`/api/auth/me`)  
3. Return 401 if authentication fails

```javascript
// Example authentication headers
const headers = {
  'Content-Type': 'application/json',
  'Cookie': 'timeback-access-token=your_token_here'
  // OR
  'Authorization': 'Bearer your_token_here'
};
```

---

## Request Format

### HTTP Request
```http
POST /api/generate-questions
Content-Type: application/json
Cookie: timeback-access-token=<token>

{
  "sectionContent": "string (required)",
  "gradeLevel": "string (required)",
  "sectionIndex": "number (required)",
  "constraints": {
    "questionCount": "number (optional)",
    "questionTypes": "string[] (optional)",
    "maxQuestionLength": "number (optional)",
    "maxOptionLength": "number (optional)"
  },
  "storyMetadata": {
    "universe": "string (optional)",
    "character": "string (optional)", 
    "spark": "string (optional)",
    "studentId": "string (optional)"
  }
}
```

### Request Parameters

#### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `sectionContent` | `string` | Story text for question generation | 50-10,000 characters |
| `gradeLevel` | `string` | Target grade level | `K-1`, `2-3`, `4-5`, `6-8` |
| `sectionIndex` | `number` | Section position in story | ≥ 0 |

#### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `constraints.questionCount` | `number` | Number of questions to generate | 3 |
| `constraints.questionTypes` | `string[]` | Types: comprehension, inference, vocabulary | `['comprehension']` |
| `constraints.maxQuestionLength` | `number` | Max characters per question | 200 |
| `constraints.maxOptionLength` | `number` | Max characters per option | 100 |
| `storyMetadata.*` | `object` | Story context for logging | `{}` |

### Example Request
```json
{
  "sectionContent": "Alice walked through the enchanted forest, her heart pounding with excitement and fear. The ancient trees towered above her, their branches creating intricate patterns against the sky. She could hear strange sounds in the distance - was it the wind, or something else entirely?",
  "gradeLevel": "4-5",
  "sectionIndex": 0,
  "constraints": {
    "questionCount": 3,
    "questionTypes": ["comprehension", "inference", "vocabulary"],
    "maxQuestionLength": 150,
    "maxOptionLength": 50
  },
  "storyMetadata": {
    "universe": "fantasy",
    "character": "alice",
    "spark": "enchanted_forest",
    "studentId": "student_12345"
  }
}
```

---

## Response Format

### Successful Response (200 OK)
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "question": "What did Alice feel as she walked through the forest?",
        "options": [
          "Excitement and fear",
          "Only excitement", 
          "Only fear",
          "Confusion"
        ],
        "correctAnswer": 0,
        "explanation": "The text states Alice felt both excitement and fear as she walked."
      },
      {
        "question": "What created patterns against the sky?",
        "options": [
          "The clouds",
          "Tree branches", 
          "Birds flying",
          "The wind"
        ],
        "correctAnswer": 1,
        "explanation": "The branches of ancient trees created intricate patterns against the sky."
      }
    ],
    "metadata": {
      "generationTimeMs": 2847,
      "modelUsed": "gemini-pro",
      "retryCount": 0,
      "validationPassed": true,
      "serviceCallDurationMs": 2643,
      "totalRequestTimeMs": 3012,
      "requestId": "req_abc123",
      "userId": "user_xyz789",
      "timestamp": "2024-01-15T10:30:45.123Z",
      "gradeLevel": "4-5",
      "sectionIndex": 0,
      "questionCount": 2,
      "contentWords": 67,
      "questionWords": 42
    }
  }
}
```

---

## Error Responses

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE_CONSTANT", 
    "details": "Additional context (optional)"
  }
}
```

### HTTP Status Codes & Error Types

| Status | Error Code | Description | Cause |
|--------|------------|-------------|-------|
| 400 | `MISSING_REQUIRED_FIELDS` | Required field missing | Missing sectionContent, gradeLevel, or sectionIndex |
| 400 | `INVALID_SECTION_CONTENT` | Content validation failed | Content too short (<50 chars) or too long (>10,000 chars) |
| 400 | `INVALID_GRADE_LEVEL` | Invalid grade level | Grade not in: K-1, 2-3, 4-5, 6-8 |
| 400 | `INVALID_SECTION_INDEX` | Invalid section index | sectionIndex < 0 |
| 400 | `MALFORMED_REQUEST` | JSON parsing failed | Invalid JSON in request body |
| 401 | `AUTHENTICATION_REQUIRED` | No auth token provided | Missing cookie and Authorization header |
| 401 | `NOT_AUTHENTICATED` | Auth token invalid | Token expired or invalid |
| 422 | `SERVICE_VALIDATION_ERROR` | Generated content invalid | AI service returned malformed questions |
| 422 | `QUESTION_GENERATION_FAILED` | Question generation failed | AI service couldn't generate valid questions |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error | Unhandled server-side error |
| 501 | `FEATURE_DISABLED` | Feature flag disabled | QTI_SPLIT_GENERATION_ENABLED = false |
| 503 | `SERVICE_UNAVAILABLE` | External service failure | TimeBack API or AI service unavailable |
| 503 | `AUTHENTICATION_SERVICE_UNAVAILABLE` | Auth service down | TimeBack API unreachable |
| 504 | `SERVICE_TIMEOUT` | Service timeout | AI service took too long to respond |
| 507 | `INSUFFICIENT_STORAGE` | Memory/storage limit | Server resource constraints |

### Example Error Responses

#### Authentication Error (401)
```json
{
  "success": false,
  "error": {
    "message": "Authentication required. Please provide a valid access token.",
    "code": "AUTHENTICATION_REQUIRED"
  }
}
```

#### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "message": "Section content must be between 50 and 10,000 characters",
    "code": "INVALID_SECTION_CONTENT",
    "details": "Received 23 characters"
  }
}
```

#### Service Error (503)
```json
{
  "success": false,
  "error": {
    "message": "Question generation service temporarily unavailable",
    "code": "SERVICE_UNAVAILABLE"
  }
}
```

#### Feature Disabled (501)
```json
{
  "success": false,
  "error": {
    "message": "Split question generation is not enabled",
    "code": "FEATURE_DISABLED"
  }
}
```

---

## Usage Examples

### JavaScript/Node.js Example
```javascript
const generateQuestions = async (sectionData, authToken) => {
  try {
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        sectionContent: sectionData.content,
        gradeLevel: sectionData.grade,
        sectionIndex: sectionData.index,
        constraints: {
          questionCount: 3,
          questionTypes: ['comprehension', 'inference']
        },
        storyMetadata: {
          universe: sectionData.universe,
          studentId: sectionData.studentId
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`Generated ${result.data.questions.length} questions`);
      console.log(`Generation time: ${result.data.metadata.generationTimeMs}ms`);
      return result.data.questions;
    } else {
      console.error(`Error: ${result.error.message} (${result.error.code})`);
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
    throw error;
  }
};

// Usage
const questions = await generateQuestions({
  content: "Alice found a mysterious door in the forest...",
  grade: "4-5", 
  index: 0,
  universe: "fantasy",
  studentId: "student123"
}, "your_auth_token");
```

### Python Example
```python
import requests
import json

def generate_questions(section_content, grade_level, section_index, auth_token):
    url = "http://localhost:3000/api/generate-questions"
    
    payload = {
        "sectionContent": section_content,
        "gradeLevel": grade_level, 
        "sectionIndex": section_index,
        "constraints": {
            "questionCount": 3,
            "questionTypes": ["comprehension", "inference", "vocabulary"]
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        result = response.json()
        
        if response.status_code == 200 and result["success"]:
            questions = result["data"]["questions"]
            metadata = result["data"]["metadata"] 
            
            print(f"✅ Generated {len(questions)} questions")
            print(f"📊 Generation time: {metadata['generationTimeMs']}ms")
            print(f"🤖 Model used: {metadata['modelUsed']}")
            
            return questions
        else:
            error_code = result.get("error", {}).get("code", "UNKNOWN")
            error_msg = result.get("error", {}).get("message", "Unknown error")
            print(f"❌ Error {response.status_code}: {error_msg} ({error_code})")
            return None
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out after 30 seconds")
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None

# Usage example
questions = generate_questions(
    section_content="Alice walked through the enchanted forest...",
    grade_level="4-5",
    section_index=0,
    auth_token="your_auth_token_here"
)

if questions:
    for i, q in enumerate(questions, 1):
        print(f"\n{i}. {q['question']}")
        for j, option in enumerate(q['options']):
            marker = "✓" if j == q['correctAnswer'] else " " 
            print(f"   {chr(65+j)}. {option} {marker}")
        print(f"   Explanation: {q['explanation']}")
```

### cURL Example
```bash
#!/bin/bash

# Set your auth token
AUTH_TOKEN="your_auth_token_here"

# Make the API call
curl -X POST http://localhost:3000/api/generate-questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "sectionContent": "Alice walked through the enchanted forest, her heart pounding with excitement and fear. The ancient trees towered above her, creating intricate patterns against the sky.",
    "gradeLevel": "4-5",
    "sectionIndex": 0,
    "constraints": {
      "questionCount": 2,
      "questionTypes": ["comprehension", "inference"],
      "maxQuestionLength": 100,
      "maxOptionLength": 50
    },
    "storyMetadata": {
      "universe": "fantasy",
      "character": "alice",
      "spark": "enchanted_forest"
    }
  }' \
  | jq '.'
```

---

## Integration Points for Phase 4

### Frontend Integration Points

#### 1. **Reading Interface Integration**
**Location**: `src/app/book/[bookId]/chapter/[chapterId]/page.tsx`

```typescript
// Integration pattern for question loading
const loadQuestionsForSection = async (sectionIndex: number) => {
  const response = await fetch('/api/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sectionContent: currentSection.content,
      gradeLevel: student.gradeLevel,
      sectionIndex,
      storyMetadata: {
        universe: story.universe,
        character: story.character,
        studentId: student.id
      }
    })
  });
  
  return response.json();
};
```

#### 2. **Question Display Component**  
**New Component**: `src/components/SectionQuestions.tsx`

```typescript
interface SectionQuestionsProps {
  sectionIndex: number;
  sectionContent: string;
  gradeLevel: string;
  onQuestionsLoaded?: (questions: Question[]) => void;
  onError?: (error: string) => void;
}

export function SectionQuestions({ 
  sectionIndex, 
  sectionContent, 
  gradeLevel,
  onQuestionsLoaded,
  onError 
}: SectionQuestionsProps) {
  // Component implementation
}
```

### Backend Integration Points

#### 1. **Story Generation Service**
**Location**: `src/lib/ai/story-generation-service.ts`

```typescript
// Modified to NOT generate questions automatically
export interface StoryGenerationResult {
  content: string;
  // questions: Question[]; // REMOVED in Phase 4
  metadata: {
    generationTime: number;
    // questionGenerationTime: number; // REMOVED
  };
}
```

#### 2. **Reading Progress Tracking**
**Location**: `src/lib/services/progress-service.ts`

```typescript
// New method to handle async question loading
export interface ReadingProgressUpdate {
  sectionIndex: number;
  questionsRequested: boolean;
  questionsLoaded: boolean;
  questionsAnswered?: boolean;
  questionResponses?: QuestionResponse[];
}
```

#### 3. **QTI Assessment Integration**  
**Location**: `src/lib/qti/`

The existing QTI system will need to integrate with the new async question loading:

```typescript
// Modified QTI transformer to handle async questions
export class AsyncQTITransformer {
  async generateAssessmentFromStory(
    storyContent: string,
    gradeLevel: string
  ): Promise<QTIAssessment> {
    // Use /api/generate-questions for each section
    const sections = this.splitIntoSections(storyContent);
    const assessmentPromises = sections.map((section, index) => 
      this.generateQuestionsForSection(section, gradeLevel, index)
    );
    
    const allQuestions = await Promise.all(assessmentPromises);
    return this.buildQTIAssessment(allQuestions.flat());
  }
  
  private async generateQuestionsForSection(
    content: string, 
    gradeLevel: string, 
    sectionIndex: number
  ): Promise<Question[]> {
    // Call /api/generate-questions internally
  }
}
```

---

## Performance & Monitoring

### Performance Metrics

All successful responses include performance metadata:

```typescript
interface PerformanceMetadata {
  generationTimeMs: number;      // AI service call duration
  serviceCallDurationMs: number; // Total service interaction time  
  totalRequestTimeMs: number;    // Complete request processing time
  retryCount: number;           // Number of retries attempted
  modelUsed: string;            // AI model identifier
  timestamp: string;            // ISO timestamp
  requestId: string;            // Unique request identifier
}
```

### Monitoring & Alerting

#### Key Metrics to Monitor

1. **Response Times**
   - Target: < 5 seconds (95th percentile)
   - Alert: > 10 seconds

2. **Error Rates** 
   - Target: < 5% error rate
   - Alert: > 10% error rate in 5 minutes

3. **Service Availability**
   - Target: 99.9% uptime  
   - Alert: Any 503/504 errors

4. **Authentication Success Rate**
   - Target: > 95% auth success
   - Alert: > 5% auth failures

#### Log Analysis Queries

**Performance Issues:**
```
fields @timestamp, @message
| filter @message like /generate-questions/
| filter totalRequestTimeMs > 10000
| sort @timestamp desc
```

**Error Patterns:**  
```
fields @timestamp, error.code, error.message
| filter success = false
| stats count() by error.code
| sort count desc
```

**Authentication Failures:**
```
fields @timestamp, @message  
| filter @message like /Authentication/
| filter @message like /failed/
| sort @timestamp desc
```

### Operational Dashboards

#### Request Volume & Performance
- Requests per minute
- Average response time
- 95th percentile response time  
- Error rate percentage

#### AI Service Health
- Generation success rate
- Model performance comparison
- Retry frequency
- Timeout incidents

#### Authentication Metrics
- Auth success rate
- Token validation failures
- TimeBack API health

---

## Feature Flag Management

### Current Feature Flag

**Flag**: `QTI_SPLIT_GENERATION_ENABLED`  
**Location**: `src/lib/config.ts`  
**Default**: `true` (enabled)  

```typescript
export const FEATURE_FLAGS = {
  QTI_SPLIT_GENERATION_ENABLED: process.env.QTI_SPLIT_GENERATION_ENABLED !== 'false'
};
```

### Feature Flag Behavior

**When Enabled (`true`):**
- API processes requests normally
- Questions generated via AI service
- Full functionality available

**When Disabled (`false`):**  
- API returns 501 (Not Implemented)
- No processing occurs (fail-fast)
- Minimal resource usage

### Emergency Disable

To instantly disable the feature:
```bash
# Environment variable
export QTI_SPLIT_GENERATION_ENABLED=false

# Or update config directly
// src/lib/config.ts
QTI_SPLIT_GENERATION_ENABLED: false
```

---

## Testing & Quality Assurance

### Test Coverage

- **Unit Tests**: 31 tests covering all functionality
- **Integration Tests**: 9 tests covering end-to-end flows  
- **Test Coverage**: >90% code coverage

### Running Tests

```bash
# Unit tests
npm run test:generate-questions

# Integration tests  
npm run test:integration

# All tests with coverage
npm run test:generate-questions:coverage
```

### Test Scenarios Covered

✅ **Authentication**: Valid tokens, invalid tokens, missing tokens  
✅ **Input Validation**: All required fields, edge cases, malformed data  
✅ **Service Integration**: Success flows, service errors, timeouts  
✅ **Error Handling**: All error types, proper status codes  
✅ **Performance**: Response times, concurrent requests  
✅ **Feature Flags**: Enabled/disabled states  

---

## Security Considerations

### Input Validation & Sanitization
- Content length limits (50-10,000 characters)
- Grade level enumeration validation
- Request size limits enforced
- No script injection possible

### Authentication Security  
- Token validation against authoritative TimeBack API
- No token storage or persistence
- Proper HTTP status codes for auth failures
- PII redaction in logs

### Rate limiting Preparation
All requests include metrics for future rate limiting:
- Request size tracking
- User identification  
- Timestamp logging
- Performance impact measurement

---

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. **422 Validation Errors**
**Symptom**: API returns 422 with service validation error  
**Cause**: AI service returns malformed question structure  
**Solution**: Check AI service response format, verify question generation prompts

#### 2. **503 Service Unavailable** 
**Symptom**: Intermittent 503 responses  
**Cause**: AI service overloaded or TimeBack API down  
**Solution**: Check external service health, implement retry logic

#### 3. **Slow Response Times**
**Symptom**: Requests taking >10 seconds  
**Cause**: Complex content or AI service performance  
**Solution**: Optimize content length, check AI service status

#### 4. **Authentication Failures**
**Symptom**: Unexpected 401 responses  
**Cause**: Token expiration or TimeBack API issues  
**Solution**: Verify token validity, check TimeBack API health

### Debug Mode

Enable detailed logging:
```bash
DEBUG=true npm run dev
```

### Health Check Endpoint

**Endpoint**: `GET /api/health`  
**Purpose**: Verify API and dependencies are healthy  

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "services": {
    "questionGeneration": "healthy",
    "timebackAuth": "healthy"
  }
}
```

---

## Changelog & Versioning

### Version 1.0.0 (Phase 3 Complete)
- ✅ Initial API implementation
- ✅ Authentication integration
- ✅ Input validation & sanitization
- ✅ Error handling & logging
- ✅ Performance monitoring
- ✅ Feature flag support
- ✅ Comprehensive testing
- ✅ **Fixed critical production bug** (requestStartTime scope)

### Future Versions (Phase 4+)
- Rate limiting implementation
- Caching layer for performance
- A/B testing for question quality
- Multi-model AI service support

---

*This documentation was generated for Phase 3 completion. For the most up-to-date information, see the Phase 4 documentation when available.*
