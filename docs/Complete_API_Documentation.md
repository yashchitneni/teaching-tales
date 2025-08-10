# Teaching Tales - Complete API Documentation

**Document Version**: 1.0  
**Last Updated**: Phase 9.2.1 - Production Readiness Validation  
**Status**: Production Ready  

This document provides comprehensive documentation for all Teaching Tales APIs across Phases 1-8, designed for production deployment and integration.

## 📋 Table of Contents

- [Authentication & Authorization](#authentication--authorization)
- [Story Generation APIs (Phases 3-5)](#story-generation-apis-phases-3-5)
- [Assessment & Question APIs (Phases 3-4)](#assessment--question-apis-phases-3-4)
- [Analytics & Monitoring APIs (Phase 8)](#analytics--monitoring-apis-phase-8)
- [Administrative APIs (Phase 7-8)](#administrative-apis-phase-7-8)
- [QTI Integration APIs (Phase 4)](#qti-integration-apis-phase-4)
- [OneRoster Integration APIs](#oneroster-integration-apis)
- [Error Handling & Status Codes](#error-handling--status-codes)
- [Performance Specifications](#performance-specifications)
- [Rate Limiting & Security](#rate-limiting--security)

---

## Authentication & Authorization

All Teaching Tales APIs require authentication using TimeBack SSO integration.

### Authentication Methods

1. **Cookie-Based Authentication** (Primary)
   - Cookie: `TimeBackAuth`
   - Automatically handled by TimeBack platform

2. **Bearer Token Authentication** (API Integration)
   - Header: `Authorization: Bearer <token>`
   - For external integrations and monitoring

### Required Headers

```http
Content-Type: application/json
Authorization: Bearer <token> OR Cookie: TimeBackAuth=<session>
X-Request-ID: <uuid> (optional, for request tracking)
```

---

## Story Generation APIs (Phases 3-5)

### POST /api/generate-questions
**Phase 3: Split Question Generation API**

Generate comprehension questions for a specific story section with async processing.

#### Request Schema
```typescript
interface SectionQuestionGenInput {
  sectionContent: string;           // Story section text (required)
  sectionIndex: number;             // Section position (required)
  gradeLevel: string;               // Target grade level (required)
  constraints?: {
    questionCount?: number;         // Number of questions (default: 2)
    questionTypes?: string[];       // Question types filter
    maxQuestionLength?: number;     // Character limit per question
    maxOptionLength?: number;       // Character limit per option
  };
  storyMetadata?: {
    universe: string;               // Story universe/theme
    character: string;              // Main character name
    spark: string;                  // Story spark/prompt
    studentId: string;              // Student identifier
  };
}
```

#### Response Schema
```typescript
interface SectionQuestionsResult {
  success: boolean;
  data: {
    sectionIndex: number;
    questions: {
      id: string;
      type: 'multiple_choice' | 'short_answer' | 'true_false';
      question: string;
      options?: string[];           // For multiple choice
      correct: number | string;    // Correct answer index/text
      explanation: string;
      questionType: 'comprehension' | 'vocabulary' | 'inference';
      difficultyLevel: number;     // 1-5 scale
    }[];
    metadata: {
      generationTimeMs: number;
      modelUsed: string;
      retryCount: number;
      validationPassed: boolean;
    };
  };
}
```

#### Example Request
```bash
curl -X POST "https://api.teachingtales.ai/api/generate-questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sectionContent": "Alice found a mysterious door in the enchanted forest...",
    "sectionIndex": 0,
    "gradeLevel": "4-5",
    "constraints": {
      "questionCount": 2,
      "questionTypes": ["comprehension", "inference"]
    },
    "storyMetadata": {
      "universe": "Fantasy Adventure",
      "character": "Alice",
      "spark": "Mysterious Door",
      "studentId": "student-123"
    }
  }'
```

#### Performance Specifications
- **Generation Time**: <45 seconds background processing
- **Feature Gate**: `QTI_SPLIT_GENERATION_ENABLED=true`
- **Retry Logic**: Automatic retry on transient failures
- **Telemetry**: Full Phase 8 event tracking included

### GET/POST /api/story-question-status/[stimulusId]
**Phase 5: Async Question Status Tracking**

Track the progress of background question generation for async-saved stories.

#### GET Request Parameters
- `stimulusId`: Story stimulus identifier (path parameter)

#### Response Schema
```typescript
interface QuestionStatusResponse {
  questionsReady: boolean;          // Are questions available?
  status: 'pending' | 'generating' | 'creating_assessments' | 'completed' | 'failed' | 'unknown';
  progress?: number;                // 0-1 completion percentage
  totalSections?: number;           // Total sections to process
  completedSections?: number;       // Completed sections count
  error?: string;                   // Error message if failed
}
```

#### Example Usage
```bash
# Poll for question status (recommended: 3-second intervals)
curl "https://api.teachingtales.ai/api/story-question-status/stimulus-123" \
  -H "Authorization: Bearer <token>"
```

#### Response States
- **pending**: Question generation queued
- **generating**: AI actively generating questions
- **creating_assessments**: Converting to QTI assessments
- **completed**: All questions ready and assessments created
- **failed**: Generation failed, check error field
- **unknown**: Status unclear (fallback state)

#### Performance Specifications
- **Polling Interval**: 3 seconds recommended
- **Timeout**: 2 minutes maximum generation time
- **Real-time Updates**: Status updates every 500ms during generation

---

## Assessment & Question APIs (Phases 3-4)

### POST /api/qti/[...endpoint]
**Phase 4: QTI Assessment Integration**

Proxy endpoint for QTI assessment operations with Teaching Tales integration.

#### Supported Operations
- `POST /assessments`: Create new assessments
- `GET /assessments/{id}`: Retrieve assessment details
- `POST /responses`: Submit question responses
- `GET /results/{id}`: Get assessment results

#### Assessment Creation Example
```bash
curl -X POST "https://api.teachingtales.ai/api/qti/assessments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "The Mysterious Door - Section 1 Questions",
    "stimulusId": "stimulus-123",
    "questions": [
      {
        "type": "multiple_choice",
        "question": "What did Alice find in the forest?",
        "options": ["A door", "A key", "A rabbit", "A tree"],
        "correct": 0
      }
    ]
  }'
```

#### Response Processing (Phase 7 Integration)
All question responses automatically integrate with Phase 7 scoring analytics:
- **Processing Time**: <150ms average
- **Cache Integration**: Automatic response caching
- **Error Recovery**: Bulletproof error handling with fallbacks
- **Performance Tracking**: Real-time scoring metrics

---

## Analytics & Monitoring APIs (Phase 8)

### GET /api/analytics/insights
**Phase 8: Learning Analytics & ML Insights**

Generate comprehensive learning effectiveness insights with ML-driven recommendations.

#### Query Parameters
```typescript
interface AnalyticsQuery {
  timeframe?: {
    start?: string;                 // ISO timestamp
    end?: string;                   // ISO timestamp  
    preset?: '24h' | '7d' | '30d';  // Preset timeframes
  };
  filters?: {
    gradeLevel?: string;            // Filter by grade level
    questionType?: string;          // Filter by question type
    storyId?: string;               // Filter by specific story
    userId?: string;                // Filter by user
  };
  includeML?: boolean;              // Include ML recommendations
  includePredictions?: boolean;     // Include learning predictions
}
```

#### Response Schema
```typescript
interface LearningInsights {
  questionPerformance: {
    questionId: string;
    correctRate: number;
    avgResponseTime: number;
    difficultyScore: number;
    engagementScore: number;
  }[];
  storyEngagement: {
    storyId: string;
    completionRate: number;
    avgReadingTime: number;
    questionAccuracy: number;
    userRetention: number;
  }[];
  mlRecommendations?: {
    type: 'question_optimization' | 'story_difficulty' | 'personalization';
    confidence: number;
    recommendation: string;
    expectedImpact: number;
  }[];
  performanceImpact: {
    learningEffectiveness: number;
    userSatisfaction: number;
    systemPerformance: number;
  };
}
```

#### Example Request
```bash
curl "https://api.teachingtales.ai/api/analytics/insights?preset=7d&includeML=true" \
  -H "Authorization: Bearer <token>"
```

#### Performance Specifications
- **7-day Analysis**: <5 seconds generation time
- **30-day Analysis**: <10 seconds generation time
- **Cache TTL**: 5 minutes for identical requests
- **ML Processing**: <15 seconds for advanced recommendations

### POST /api/analytics/insights  
**Phase 8: Advanced Analytics Operations**

Perform specific analytics operations including ML predictions and optimization recommendations.

#### Request Types

##### Question Optimization
```json
{
  "type": "question_optimization",
  "questionId": "question-123"
}
```

##### Learning Prediction
```json
{
  "type": "learning_prediction", 
  "userId": "student-123",
  "proposedContent": {
    "storyType": "adventure",
    "difficultyLevel": 3,
    "questionTypes": ["comprehension", "inference"]
  }
}
```

##### Async Mode Effectiveness
```json
{
  "type": "async_effectiveness"
}
```

#### Response Format
All POST operations return structured results with metadata:
```typescript
{
  "success": boolean;
  "data": {
    "type": string;
    "result": any;                  // Type-specific result data
    "metadata": {
      "generatedAt": string;
      "processingTime": number;
      "requestId": string;
    };
  };
}
```

### GET /api/analytics/events
**Phase 8: Event Stream Access**

Access raw telemetry events for advanced analytics and monitoring.

#### Query Parameters
- `category`: Event category filter
- `action`: Event action filter
- `userId`: User-specific events
- `storyId`: Story-specific events
- `startTime`: Events after timestamp
- `endTime`: Events before timestamp
- `limit`: Maximum events to return (default: 100, max: 1000)

#### Example
```bash
curl "https://api.teachingtales.ai/api/analytics/events?category=question_answering&limit=50" \
  -H "Authorization: Bearer <token>"
```

### GET /api/analytics/responses
**Phase 8: Response Analytics**

Detailed analytics for question responses and learning outcomes.

#### Response Data
```typescript
interface ResponseAnalytics {
  totalResponses: number;
  accuracyRate: number;
  timeDistribution: {
    fast: number;       // <5s
    normal: number;     // 5-30s  
    slow: number;       // >30s
  };
  questionTypePerformance: {
    [type: string]: {
      accuracy: number;
      avgTime: number;
      count: number;
    };
  };
  learningProgression: {
    date: string;
    accuracyTrend: number;
    speedTrend: number;
  }[];
}
```

---

## Administrative APIs (Phase 7-8)

### GET /api/admin/scoring-metrics
**Phase 7: Production Scoring Metrics**

Real-time scoring performance and accuracy metrics for production monitoring.

#### Response Schema
```typescript
interface ScoringMetricsResponse {
  totalResponses: number;
  accuracyRate: number;            // Percentage of correct scores
  averageProcessingTime: number;   // Milliseconds
  errorRate: number;               // Percentage of scoring errors
  cacheHitRate: number;            // Cache effectiveness percentage
  
  asyncQuestionPerformance: {
    totalAsyncQuestions: number;
    scoringAccuracy: number;
    avgProcessingTime: number;
  };
  
  recentActivity: {
    last24Hours: number;
    lastHour: number;
    currentStreak: number;         // Consecutive successful scores
  };
  
  performanceDistribution: {
    fast: number;                  // <100ms responses
    normal: number;                // 100-200ms responses
    slow: number;                  // 200-500ms responses
    verySlow: number;              // >500ms responses
  };
  
  errorAnalysis: {
    totalErrors: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recoverySuccessRate: number;
  };
}
```

#### Security Requirements
- **Admin Authentication**: Required admin-level permissions
- **IP Restrictions**: Limited to authorized monitoring IPs
- **Data Retention**: 24-hour rolling window

### GET /api/admin/advanced-metrics
**Phase 8: Advanced System Metrics**

Comprehensive system health and performance metrics across all phases.

#### Query Parameters
- `type`: Metric type (`educational` | `technical` | `optimization`)
- `timeframe`: Analysis period (`1h` | `24h` | `7d` | `30d`)
- `includeML`: Include ML-driven insights

#### Educational Dashboard Data
```typescript
interface EducationalDashboardData {
  learningEffectiveness: {
    overallScore: number;          // 0-100 effectiveness rating
    questionAccuracy: number;      // Average question accuracy
    completionRate: number;        // Story completion percentage
    engagementTime: number;        // Average engagement duration
  };
  
  contentPerformance: {
    topPerformingStories: Array<{
      storyId: string;
      title: string;
      effectivenessScore: number;
    }>;
    questionTypeAnalysis: {
      [type: string]: {
        count: number;
        avgAccuracy: number;
        avgEngagement: number;
      };
    };
  };
  
  userProgressMetrics: {
    activeUsers: number;
    improvementRate: number;       // Learning improvement percentage
    retentionRate: number;
  };
}
```

#### Technical Dashboard Data
```typescript
interface TechnicalDashboardData {
  systemHealth: {
    uptime: number;                // System uptime percentage
    responseTime: number;          // Average API response time
    errorRate: number;             // System error rate
    throughput: number;            // Requests per minute
  };
  
  performanceMetrics: {
    storyCreationLatency: number;  // Phase 5: Avg story creation time
    questionGenerationTime: number; // Phase 3-4: Avg generation time
    scoringProcessingTime: number; // Phase 7: Avg scoring time
    analyticsGenerationTime: number; // Phase 8: Avg analytics time
  };
  
  resourceUtilization: {
    memoryUsage: number;           // MB currently used
    cpuUtilization: number;        // CPU percentage
    cacheEfficiency: number;       // Cache hit rate
    databaseConnections: number;   // Active DB connections
  };
}
```

### GET /api/admin/executive-summary
**Phase 8: Business Intelligence Reporting**

Executive-level reporting with business metrics and strategic insights.

#### Query Parameters
- `format`: Response format (`json` | `pdf`)
- `period`: Reporting period (`weekly` | `monthly` | `quarterly`)
- `sections`: Specific sections to include

#### Response Sections
1. **Educational Impact Assessment**
2. **Technical Performance Summary**
3. **Business Intelligence Metrics**
4. **Strategic Recommendations**
5. **ROI Analysis and Projections**

#### Performance Specifications
- **JSON Format**: <15 seconds generation time
- **PDF Format**: <30 seconds generation time
- **Comprehensive Monthly**: <60 seconds generation time

---

## QTI Integration APIs (Phase 4)

### QTI Specification Compliance

Teaching Tales implements **QTI 3.0** specification with custom extensions for educational analytics.

#### Core QTI Endpoints

##### POST /api/ims/qti/v3p0/assessments
Create QTI-compliant assessments from Teaching Tales questions.

##### GET /api/ims/qti/v3p0/assessments/{id}
Retrieve assessment metadata and structure.

##### POST /api/ims/qti/v3p0/responses
Submit question responses with QTI result processing.

#### Custom Extensions

##### Teaching Tales Assessment Metadata
```xml
<metadata>
  <teachingTales:storyId>story-123</teachingTales:storyId>
  <teachingTales:generationMethod>async-background</teachingTales:generationMethod>
  <teachingTales:phase>phase-4</teachingTales:phase>
  <teachingTales:analyticsEnabled>true</teachingTales:analyticsEnabled>
</metadata>
```

#### Validation & Compliance
- **Schema Validation**: Full QTI 3.0 XSD compliance
- **Result Processing**: Advanced scoring with Phase 7 integration
- **Analytics Integration**: Seamless Phase 8 telemetry collection

---

## OneRoster Integration APIs

### GET /api/ims/oneroster/rostering/v1p2/users
**OneRoster 1.2 Compliance**

Retrieve user roster information with Teaching Tales integration.

#### Query Parameters
- `limit`: Maximum records to return
- `offset`: Pagination offset
- `filter`: OneRoster filtering syntax
- `fields`: Specific fields to include
- `sort`: Sorting specification

#### Teaching Tales Extensions
- **Story Progress**: Individual student story completion status
- **Learning Analytics**: Performance metrics per student
- **Assessment Results**: QTI assessment outcomes

### POST /api/ims/oneroster/rostering/v1p2/lineItems
Create gradebook line items for Teaching Tales assessments.

#### Integration Features
- **Automatic Gradebook**: Story completion and question accuracy
- **Progress Tracking**: Real-time learning progress updates
- **Analytics Export**: Performance data for LMS integration

---

## Error Handling & Status Codes

### Standard HTTP Status Codes

#### Success Codes
- **200 OK**: Request successful, data returned
- **201 Created**: Resource created successfully
- **202 Accepted**: Request accepted for async processing
- **204 No Content**: Request successful, no data returned

#### Client Error Codes
- **400 Bad Request**: Invalid request format or parameters
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Access denied to requested resource
- **404 Not Found**: Requested resource does not exist
- **409 Conflict**: Resource conflict or constraint violation
- **422 Unprocessable Entity**: Valid format but semantic errors
- **429 Too Many Requests**: Rate limit exceeded

#### Server Error Codes
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: Upstream service error
- **503 Service Unavailable**: Temporary service disruption
- **504 Gateway Timeout**: Request timeout

### Error Response Format

All APIs return consistent error responses:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;                  // Machine-readable error code
    message: string;               // Human-readable error message
    details?: any;                 // Additional error context
    requestId?: string;            // Request tracking ID
    timestamp: string;             // ISO timestamp
  };
}
```

### Common Error Codes

#### Feature Flag Errors
- `FEATURE_DISABLED`: Required feature flag not enabled
- `FEATURE_DEPRECATED`: Feature deprecated, use alternative

#### Authentication Errors
- `AUTH_REQUIRED`: Valid authentication required
- `AUTH_EXPIRED`: Session or token expired
- `AUTH_INSUFFICIENT`: Insufficient permissions for operation

#### Validation Errors  
- `INVALID_INPUT`: Request format or content invalid
- `MISSING_REQUIRED`: Required field not provided
- `CONSTRAINT_VIOLATION`: Data constraint not satisfied

#### Processing Errors
- `GENERATION_FAILED`: AI question generation failed
- `SCORING_ERROR`: Question scoring failed
- `ANALYTICS_UNAVAILABLE`: Analytics service temporarily unavailable

#### Integration Errors
- `QTI_ERROR`: QTI service integration error
- `ONEROSTER_ERROR`: OneRoster service integration error
- `EXTERNAL_SERVICE_ERROR`: Upstream service error

---

## Performance Specifications

### Response Time Targets (Phase 9 Validated)

#### Story Operations (Phase 5)
- **Story Creation**: <2 seconds (async, instant user response)
- **Story Retrieval**: <500ms
- **Story Update**: <1 second

#### Question Operations (Phase 3-4)  
- **Question Generation**: <45 seconds (background)
- **Question Retrieval**: <200ms
- **Response Processing**: <150ms average (Phase 7 target)

#### Analytics Operations (Phase 8)
- **Learning Insights**: <5 seconds (7-day analysis)
- **Advanced Analytics**: <10 seconds (30-day analysis)
- **ML Recommendations**: <15 seconds
- **Executive Reports**: <60 seconds (comprehensive)

#### System Operations
- **Health Checks**: <100ms
- **Authentication**: <200ms  
- **Telemetry Processing**: <100ms overhead

### Throughput Specifications

#### Concurrent Operations
- **Story Creation**: 50 stories/minute sustained
- **Question Generation**: 200 questions/minute background
- **Response Processing**: 1000 responses/minute
- **Analytics Queries**: 100 requests/minute dashboard refresh

#### Load Testing Results (Phase 9 Validated)
- **Concurrent Users**: 200 simultaneous users tested
- **Memory Usage**: <2GB per instance stable
- **CPU Utilization**: Average 35% under normal load
- **Database Performance**: <50% connection pool utilization

---

## Rate Limiting & Security

### Rate Limiting

#### Standard Rate Limits
- **Story Creation**: 10 requests/minute per user
- **Question Generation**: 20 requests/minute per user
- **Analytics Queries**: 60 requests/minute per user
- **Administrative APIs**: 300 requests/minute per admin

#### Burst Allowances
- **Short Burst**: 2x rate limit for 30 seconds
- **Educational Peak**: 5x rate limit during classroom hours
- **Emergency Mode**: No limits for critical operations

#### Rate Limit Headers
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45  
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 15
```

### Security Features

#### Data Protection
- **Encryption**: TLS 1.3 for all API communications
- **PII Protection**: Automatic PII redaction in logs
- **Data Retention**: Configurable retention policies
- **GDPR Compliance**: Data export and deletion endpoints

#### Access Control
- **Role-Based Access**: Student, Teacher, Admin permission levels
- **API Key Management**: Scoped API keys with expiration
- **IP Restrictions**: Configurable IP allowlists
- **Audit Logging**: Complete API access logging

#### Privacy Compliance (Phase 8)
- **Anonymous Telemetry**: User identifiers encrypted
- **Opt-out Support**: Privacy preferences respected
- **Data Minimization**: Only necessary data collected
- **Consent Management**: Granular consent tracking

---

## Feature Flags & Configuration

### Production Feature Flags

#### Core Features (Required for Full Functionality)
```bash
# Phase 3: Split Question Generation
QTI_SPLIT_GENERATION_ENABLED=true

# Phase 4: Async Assessment Creation  
QTI_ASYNC_ASSESSMENTS_ENABLED=true

# Phase 5: Async Story Save
QTI_ASYNC_STORY_SAVE_ENABLED=true
```

#### Advanced Features (Optional)
```bash
# Phase 8: Advanced Telemetry & Analytics
TELEMETRY_ENABLED=true
ML_OPTIMIZATION_ENABLED=true
INTELLIGENT_ALERTING_ENABLED=true

# Integration Features  
ONEROSTER_INTEGRATION_ENABLED=true
QTI_COMPLIANCE_STRICT=true
```

#### Development & Testing
```bash
# Development Modes
DEBUG_MODE=false
MOCK_AI_RESPONSES=false
EXTENDED_LOGGING=false

# Testing Features
PERFORMANCE_MONITORING=true
LOAD_TEST_MODE=false
```

---

## API Versioning & Migration

### Versioning Strategy
- **Semantic Versioning**: Major.Minor.Patch (e.g., v2.1.0)
- **Backward Compatibility**: Maintained for 1 major version
- **Deprecation Notice**: 6 months advance notice for breaking changes

### Current API Version
- **Version**: v2.0 (Phase 9 Production Ready)
- **Base URL**: `https://api.teachingtales.ai/v2`
- **Legacy Support**: v1.x supported until December 2024

### Migration Support
- **Migration Guides**: Comprehensive upgrade documentation
- **Compatibility Layer**: Automatic v1 → v2 request translation
- **Testing Tools**: Migration validation endpoints

---

## Monitoring & Observability

### Health Check Endpoints

#### GET /health
Basic service health check
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

#### GET /health/detailed  
Comprehensive health status
```json
{
  "status": "healthy", 
  "services": {
    "database": "healthy",
    "ai_service": "healthy", 
    "qti_service": "healthy",
    "analytics": "healthy"
  },
  "metrics": {
    "uptime": "99.95%",
    "responseTime": "145ms",
    "errorRate": "0.02%"
  }
}
```

### Metrics Collection (Phase 8 Integration)
- **Request Metrics**: Automatic request/response tracking  
- **Performance Metrics**: Real-time latency and throughput
- **Business Metrics**: Educational effectiveness tracking
- **Error Metrics**: Comprehensive error categorization and alerting

### Logging Standards
- **Structured Logging**: JSON format with consistent fields
- **Request Tracing**: Full request lifecycle tracking
- **Privacy Compliance**: Automatic PII redaction
- **Log Retention**: 90 days standard, 1 year for compliance

---

## Integration Examples

### Story Creation with Full Pipeline
```javascript
// 1. Create story (Phase 5 - Async)
const storyResponse = await fetch('/api/story-storage/async', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storyData: storyContent,
    metadata: { studentId, gradeLevel }
  })
});

const { stimulus, questionGenerationJobId } = await storyResponse.json();

// 2. Poll for question completion (Phase 3-4)
let questionsReady = false;
while (!questionsReady) {
  const statusResponse = await fetch(`/api/story-question-status/${stimulus.id}`);
  const status = await statusResponse.json();
  questionsReady = status.questionsReady;
  
  if (!questionsReady) await new Promise(r => setTimeout(r, 3000));
}

// 3. Get analytics insights (Phase 8)
const analyticsResponse = await fetch('/api/analytics/insights?preset=24h');
const insights = await analyticsResponse.json();
```

### Question Response Processing
```javascript
// Submit response with Phase 7 scoring
const response = await fetch('/api/qti/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    questionId: 'question-123',
    selectedAnswer: 2,
    responseTime: 15000,
    studentId: 'student-456'
  })
});

// Automatic Phase 7 scoring and Phase 8 analytics integration
const result = await response.json();
// Result includes: isCorrect, score, processingTime, analytics tracking
```

---

## Support & Documentation

### Additional Resources
- **API Playground**: Interactive API testing at `/docs/playground`
- **OpenAPI Specification**: Full spec at `/docs/openapi.json` 
- **SDKs**: JavaScript, Python, and PHP client libraries
- **Postman Collection**: Complete API collection for testing

### Support Channels  
- **Technical Documentation**: `/docs/technical/`
- **Integration Guides**: `/docs/integration/`
- **Troubleshooting**: `/docs/troubleshooting/`
- **Status Page**: `https://status.teachingtales.ai`

### Contact Information
- **Technical Support**: `api-support@teachingtales.ai`
- **Integration Support**: `integrations@teachingtales.ai`
- **Emergency Escalation**: `emergency@teachingtales.ai`

---

**Document Status**: ✅ Production Ready - Phase 9.2.1 Complete  
**Last Validation**: Phase 9 System Integration Testing  
**Next Review**: Phase 10 Production Deployment

*This documentation represents the complete, production-ready API specification for Teaching Tales, validated through comprehensive Phase 9 testing and prepared for Phase 10 deployment.*
