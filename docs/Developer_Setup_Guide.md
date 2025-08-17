# Developer Environment Setup Guide

**Document Version**: 1.0  
**Created**: Phase 9.4.1 - Development Environment Setup Guide  
**Status**: Production Ready  
**Dependencies**: Phase 9.3 Monitoring Documentation Complete  

This guide provides a streamlined setup process for developers working on Teaching Tales, including all Phase 3-8 features with comprehensive debugging and monitoring tools.

## 📋 Table of Contents

- [Quick Start (5 Minutes)](#quick-start-5-minutes)
- [Development Workflow](#development-workflow)
- [Debugging Tools](#debugging-tools)
- [Testing Strategy](#testing-strategy)
- [Performance Monitoring in Development](#performance-monitoring-in-development)
- [Troubleshooting](#troubleshooting)

---

## Quick Start (5 Minutes)

Get up and running with the full Teaching Tales development environment including all Phase 3-8 features.

### 1. Clone and Install
```bash
# Clone the repository
git clone [repository-url]
cd teaching-tales

# Install dependencies
npm install
# or
bun install
```

### 2. Environment Setup

Create your development environment file:

```bash
# Copy the environment template
cp .env.example .env.local

# Or create .env.local manually with the following content:
```

**File**: `.env.local`
```bash
# =============================================================================
# TEACHING TALES - DEVELOPMENT ENVIRONMENT CONFIGURATION
# =============================================================================

# TimeBack API Configuration
NEXT_PUBLIC_TIMEBACK_API_URL=http://localhost:8080

# AI Service API Keys (REQUIRED)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
REPLICATE_API_TOKEN=your_replicate_api_token_here

# AWS Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_cognito_user_pool_id_here
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=your_cognito_client_id_here
NEXT_PUBLIC_COGNITO_REGION=your_aws_region_here

# =============================================================================
# PHASE 3-8 FEATURE FLAGS - ENABLE ALL FOR DEVELOPMENT
# =============================================================================

# Core Async Functionality (Phases 3-5) - REQUIRED for full experience
QTI_SPLIT_GENERATION_ENABLED=true          # Phase 3: Split question generation API
QTI_ASYNC_ASSESSMENTS_ENABLED=true         # Phase 4: Async assessment creation
QTI_ASYNC_STORY_SAVE_ENABLED=true          # Phase 5: Async story save orchestration

# Client-Side Features (Phase 6)
NEXT_PUBLIC_QTI_SPLIT_GENERATION=true      # Progressive UI loading
NEXT_PUBLIC_ASYNC_UI_ENABLED=true          # Async-aware components
NEXT_PUBLIC_PROGRESSIVE_LOADING=true       # Progressive content loading

# Performance Optimization (Phase 7)
QTI_PERFORMANCE_CACHING_ENABLED=true       # Smart caching system
QTI_ADVANCED_ANALYTICS_ENABLED=true        # Real-time metrics collection
QTI_ADMIN_METRICS_ENABLED=true             # Admin dashboard access

# Advanced Features (Phase 8)
TELEMETRY_ENABLED=true                      # Comprehensive event tracking
ML_OPTIMIZATION_ENABLED=true               # ML-driven recommendations
INTELLIGENT_ALERTING_ENABLED=true          # Predictive issue detection
LEARNING_ANALYTICS_ENABLED=true            # Educational effectiveness insights

# =============================================================================
# DEVELOPMENT & DEBUGGING CONFIGURATION
# =============================================================================

NODE_ENV=development

# Enhanced Debugging
SCORING_DEBUG_ENABLED=true                 # Detailed scoring logs
TELEMETRY_DEBUG_MODE=true                  # Verbose telemetry output
PERFORMANCE_MONITORING_ENABLED=true        # Performance tracking
QTI_DEBUG_SCORING=true                     # Enhanced scoring debug logs

# Development Features
EXTENDED_LOGGING=true                       # Detailed application logs
DEVELOPMENT_MODE=true                       # Enable dev-specific features

# Local Services (optional)
REDIS_URL=redis://localhost:6379           # Local Redis for caching
DATABASE_URL=sqlite://./dev.sqlite         # Local SQLite for development

# Security (relaxed for development)
GDPR_COMPLIANCE_MODE=false                 # Disable strict GDPR in dev
DATA_ENCRYPTION_ENABLED=false              # Disable encryption in dev
```

### 3. Enable All Features for Development
```bash
# Quick verification that all features are enabled
echo "🔍 Checking feature flags:"
echo "Phase 3 (Split Generation): $QTI_SPLIT_GENERATION_ENABLED"
echo "Phase 4 (Async Assessments): $QTI_ASYNC_ASSESSMENTS_ENABLED" 
echo "Phase 5 (Async Story Save): $QTI_ASYNC_STORY_SAVE_ENABLED"
echo "Phase 7 (Performance Caching): $QTI_PERFORMANCE_CACHING_ENABLED"
echo "Phase 8 (Telemetry): $TELEMETRY_ENABLED"
```

### 4. Start Development Server
```bash
# Start with full telemetry and monitoring
npm run dev

# Alternative: Start with Turbopack for faster builds
npm run dev --turbo

# Server will start at http://localhost:3000
```

### 5. Verify Setup (2 Minutes)

**Quick Health Check**:
```bash
# Test API endpoints are responding
curl http://localhost:3000/api/test-env

# Check telemetry system
curl http://localhost:3000/api/admin/advanced-metrics?type=technical

# Verify feature flags
curl http://localhost:3000/api/test-simple-generation
```

**Success Indicators**:
- ✅ Server starts without errors
- ✅ API endpoints respond with 200 status
- ✅ Telemetry dashboard shows active monitoring
- ✅ Story creation takes <2 seconds (async enabled)
- ✅ Questions generate in background

---

## Development Workflow

### 1. Feature Development Process

#### Using Feature Flags for Safe Development
```bash
# Example: Testing new Phase 8 feature
export ML_EXPERIMENTAL_FEATURES=true
export FEATURE_NEW_ANALYTICS=true

# Develop with safe fallbacks
if (process.env.FEATURE_NEW_ANALYTICS === 'true') {
  // New feature implementation
} else {
  // Existing proven implementation
}
```

#### Branch-Based Development
```bash
# Create feature branch
git checkout -b feature/enhance-learning-analytics

# Enable specific features for this branch
echo "LEARNING_ANALYTICS_V2_ENABLED=true" >> .env.local

# Develop and test
npm run dev
npm test
```

### 2. Testing Strategy During Development

#### Phase-Specific Testing
```bash
# Unit tests for individual phases
npm test src/lib/ai/__tests__/                    # Phase 2: AI services
npm test src/app/api/generate-questions/__tests__ # Phase 3: Question API  
npm test src/lib/services/__tests__/               # Phase 4-5: Async services
npm test src/lib/qti/__tests__/                   # Phase 7: Performance systems

# Integration testing  
npm run test:integration                           # Cross-phase integration
npm run test:integration:real                      # With real AI services
```

#### Real-Time Testing with Telemetry
```bash
# Start dev server with enhanced logging
EXTENDED_LOGGING=true npm run dev

# In another terminal, run test scenarios
npm run test:interactive

# Monitor results in telemetry dashboard
open http://localhost:3000/api/admin/advanced-metrics
```

### 3. Performance Validation in Development

#### Phase 7 Performance Monitoring
```bash
# Enable performance profiling
export PERFORMANCE_PROFILING=true
export SCORING_ANALYTICS_DETAILED=true

# Monitor scoring performance
curl http://localhost:3000/api/admin/scoring-metrics

# Expected development performance:
# - Story creation: <3s (relaxed for dev)  
# - Question generation: <90s
# - Response processing: <200ms
```

#### Phase 8 Analytics Validation
```bash
# Generate test analytics data
npm run test:generate-analytics-data

# View learning insights
curl "http://localhost:3000/api/analytics/insights?timeframe=day"

# Check ML recommendations
curl http://localhost:3000/api/admin/ml-recommendations
```

### 4. Documentation Updates

**Always Update Documentation When**:
- Adding new environment variables
- Changing API endpoints
- Modifying performance characteristics
- Adding new debugging tools

```bash
# Update relevant documentation files
docs/Environment_Variables.md          # For new env vars
docs/Complete_API_Documentation.md     # For API changes
docs/Phase_X_Detailed_Roadmap.md       # For phase-specific changes
```

---

## Debugging Tools

### Phase 5: Async Operations Debugging

#### Background Job Status Monitoring
```typescript
// Check story question generation status
const checkStatus = async (stimulusId: string) => {
  const response = await fetch(`/api/story-question-status/${stimulusId}`);
  const status = await response.json();
  
  console.log('📊 Async Job Status:', {
    stimulusId,
    status: status.status,
    progress: status.progress,
    completedAt: status.completedAt,
    estimatedTimeRemaining: status.estimatedTimeRemaining
  });
};

// Usage
await checkStatus('story_123');
```

#### Background Job Debugging
```bash
# Enable detailed async job logging
export ASYNC_JOB_DEBUG=true
export ASYNC_JOB_VERBOSE=true

# Monitor job processing in real-time
tail -f logs/async-jobs.log | grep "story_"

# Check job queue status
curl http://localhost:3000/api/admin/job-queue-status
```

### Phase 7: Performance & Scoring Analytics

#### Scoring Performance Dashboard
```typescript
// Access scoring analytics in development
const scoringMetrics = await fetch('/api/admin/scoring-metrics')
  .then(r => r.json());

console.log('🎯 Scoring Performance:', {
  averageProcessingTime: scoringMetrics.averageProcessingTime,
  cacheHitRate: scoringMetrics.cacheHitRate,
  errorRecoveryRate: scoringMetrics.errorRecoveryRate,
  recentErrors: scoringMetrics.recentErrors
});
```

#### Performance Profiling Tools
```bash
# Enable detailed performance profiling
export PERFORMANCE_PROFILING_DETAILED=true

# Start server with performance monitoring
npm run dev

# In browser DevTools, check Network tab for:
# - API response times
# - Cache hit/miss indicators  
# - Background job processing status
```

#### Cache Analysis Tools
```typescript
// Analyze cache performance
const cacheStats = await fetch('/api/admin/cache-stats')
  .then(r => r.json());

console.log('💾 Cache Analysis:', {
  hitRate: cacheStats.hitRate,
  memoryUsage: cacheStats.memoryUsage,
  hotKeys: cacheStats.hotKeys,
  evictionRate: cacheStats.evictionRate
});
```

### Phase 8: Telemetry & Analytics Debugging

#### Real-Time Event Monitoring
```typescript
// Monitor telemetry events in real-time
const eventStream = new EventSource('/api/telemetry/stream');

eventStream.onmessage = (event) => {
  const telemetryData = JSON.parse(event.data);
  
  console.log('📡 Live Telemetry:', {
    category: telemetryData.category,
    action: telemetryData.action,
    timestamp: telemetryData.timestamp,
    metadata: telemetryData.metadata
  });
};

// Filter for specific categories
eventStream.onerror = console.error;
```

#### Analytics Data Validation
```bash
# Generate test analytics scenarios
npm run test:analytics-scenarios

# Validate analytics processing
curl "http://localhost:3000/api/analytics/insights?debug=true"

# Check ML model predictions
curl "http://localhost:3000/api/admin/ml-debug-info"
```

#### Telemetry Debugging Dashboard
```html
<!-- Access via browser at http://localhost:3000/debug/telemetry -->
<!-- Shows real-time events, processing status, and data validation -->
```

### Comprehensive Error Logging

#### Structured Logging Setup
```typescript
// Enhanced error logging for development
import { Logger } from '@/lib/logger';

const logger = Logger.withContext({
  phase: 'development',
  feature: 'story-creation',
  userId: 'dev-user'
});

// Usage throughout application
logger.debug('Story creation started', { storyData });
logger.info('Question generation queued', { jobId });
logger.warn('Cache miss detected', { key, reason });
logger.error('Processing failed', { error, context });
```

#### Error Aggregation
```bash
# View aggregated errors by category
curl http://localhost:3000/api/admin/error-summary

# Get detailed error traces
curl http://localhost:3000/api/admin/error-details?timeframe=1h

# Export error logs for analysis
curl http://localhost:3000/api/admin/export-logs?format=json > errors.json
```

---

## Testing Strategy

### Test Pyramid Structure

#### Unit Tests (Individual Phase Services)
```bash
# AI and content generation (Phase 2)
npm test src/lib/ai/__tests__/ --verbose

# Question generation API (Phase 3)
npm test src/app/api/generate-questions/__tests__ --coverage

# Async services (Phase 4-5)
npm test src/lib/services/__tests__/ --watch

# QTI processing (Phase 7)
npm test src/lib/qti/__tests__/

# Analytics and telemetry (Phase 8)
npm test src/lib/services/telemetry-service.test.ts
npm test src/lib/services/learning-analytics-service.test.ts
```

#### Integration Tests (Cross-Phase Validation)
```bash
# System integration tests
npm test src/lib/__tests__/phase9-system-integration.test.ts

# Performance validation tests
npm test src/lib/__tests__/phase9-performance-validation.test.ts

# End-to-end workflow tests
npm test src/lib/__tests__/e2e-complete-flow.test.ts
```

#### Development Test Scripts
```bash
# Interactive testing with real services
npm run test:interactive

# API integration testing
npm run test:api

# Specific feature testing
npm run test:generate-questions           # Phase 3 API
npm run test:generate-questions:watch     # Watch mode
npm run test:generate-questions:coverage  # Coverage report

# Real service integration (requires API keys)
npm run test:integration:real
```

### Testing with Feature Flags

```typescript
// Test different feature flag combinations
describe('Feature Flag Testing', () => {
  beforeEach(() => {
    // Reset environment for each test
    delete process.env.QTI_ASYNC_STORY_SAVE_ENABLED;
  });

  test('async story save enabled', async () => {
    process.env.QTI_ASYNC_STORY_SAVE_ENABLED = 'true';
    
    const result = await createStory(testStoryData);
    expect(result.isAsync).toBe(true);
    expect(result.processingTime).toBeLessThan(2000);
  });

  test('async story save disabled (fallback)', async () => {
    process.env.QTI_ASYNC_STORY_SAVE_ENABLED = 'false';
    
    const result = await createStory(testStoryData);
    expect(result.isAsync).toBe(false);
    expect(result.questions).toBeDefined();
  });
});
```

### Performance Testing in Development

#### Load Testing Scripts
```bash
# Simulate concurrent story creation
npm run test:load:story-creation

# Test question generation under load  
npm run test:load:question-generation

# Validate Phase 7 caching under stress
npm run test:stress:caching

# Test Phase 8 telemetry at scale
npm run test:scale:telemetry
```

#### Monitoring Test Coverage
```typescript
// Verify Phase 8 telemetry captures test scenarios
beforeEach(async () => {
  await TelemetryService.clearTestData();
  await TelemetryService.startTestCapture();
});

afterEach(async () => {
  const capturedEvents = await TelemetryService.getTestData();
  
  // Validate expected events were captured
  expect(capturedEvents.some(e => e.category === 'story_creation')).toBe(true);
  expect(capturedEvents.some(e => e.category === 'question_generation')).toBe(true);
});
```

---

## Performance Monitoring in Development

### Real-Time Performance Dashboards

#### Access Development Dashboards
```bash
# Educational metrics dashboard  
open http://localhost:3000/api/admin/advanced-metrics?type=educational

# Technical performance dashboard
open http://localhost:3000/api/admin/advanced-metrics?type=technical

# Optimization recommendations
open http://localhost:3000/api/admin/advanced-metrics?type=optimization

# Executive summary (includes dev data)
open http://localhost:3000/api/admin/executive-summary
```

#### Performance Baseline Monitoring
```typescript
// Establish development performance baselines
const performanceBaselines = {
  storyCreation: {
    target: 2000,      // 2 seconds
    warning: 5000,     // 5 seconds  
    critical: 10000    // 10 seconds
  },
  questionGeneration: {
    target: 45000,     // 45 seconds
    warning: 90000,    // 90 seconds
    critical: 180000   // 3 minutes
  },
  responseProcessing: {
    target: 150,       // 150ms
    warning: 300,      // 300ms
    critical: 500      // 500ms
  }
};

// Monitor against baselines
const monitor = new PerformanceMonitor(performanceBaselines);
await monitor.trackStoryCreation();
await monitor.trackQuestionGeneration();
await monitor.trackResponseProcessing();
```

### Development Performance Optimization

#### Phase 7 Caching in Development
```typescript
// Enable aggressive caching for faster development
const devCacheConfig = {
  storyCache: {
    ttl: 3600,           // 1 hour (longer than production)
    maxSize: 1000,       // More stories cached
    preWarm: true        // Pre-warm common stories
  },
  questionCache: {
    ttl: 7200,           // 2 hours
    maxSize: 5000,       // More questions cached
    persistToDisk: true  // Persist cache between restarts
  },
  responseCache: {
    ttl: 1800,           // 30 minutes
    maxSize: 10000,      // Large response cache
    compression: true    // Compress cached responses
  }
};
```

#### Development-Specific Optimizations
```bash
# Enable development optimizations
export DEV_FAST_MODE=true              # Skip non-essential processing
export DEV_CACHE_AGGRESSIVE=true       # Aggressive caching
export DEV_SKIP_ANALYTICS=false        # Keep analytics for testing
export DEV_MOCK_SLOW_SERVICES=false    # Use real services for testing
```

---

## Troubleshooting

### Common Development Issues

#### 1. Feature Flags Not Taking Effect
**Symptoms**: New features not appearing, async behavior not working

**Solution**:
```bash
# Check environment variables are loaded
echo $QTI_ASYNC_STORY_SAVE_ENABLED

# Restart server after changing .env.local
npm run dev

# Clear Next.js cache if needed
rm -rf .next
npm run dev
```

#### 2. API Keys Not Working
**Symptoms**: AI generation failing, 401/403 errors

**Solution**:
```bash
# Verify API keys are set
echo $GOOGLE_AI_API_KEY | head -c 20  # Should show first 20 chars

# Test API connectivity
npm run test:api-connection

# Check API key permissions/quotas in provider dashboards
```

#### 3. Telemetry/Analytics Not Working  
**Symptoms**: Empty dashboards, no events captured

**Solution**:
```typescript
// Enable telemetry debugging
export TELEMETRY_DEBUG_MODE=true
export TELEMETRY_VERBOSE_LOGGING=true

// Check telemetry service health
const health = await TelemetryService.healthCheck();
console.log('Telemetry Health:', health);

// Manual event test
await TelemetryService.trackEvent({
  category: 'test',
  action: 'manual_test',
  metadata: { timestamp: Date.now() }
});
```

#### 4. Performance Issues in Development
**Symptoms**: Slow API responses, timeouts

**Solution**:
```bash
# Enable performance profiling
export PERFORMANCE_PROFILING=true
export NODE_OPTIONS="--inspect"

# Use faster development settings
export DEV_FAST_MODE=true
export DEV_SKIP_HEAVY_PROCESSING=true

# Monitor resource usage
npm run monitor:resources
```

#### 5. Tests Failing
**Symptoms**: Integration tests timing out, mock data issues

**Solution**:
```bash
# Run tests with increased timeout
npm test -- --timeout=60000

# Use test-specific environment
cp .env.test .env.local

# Check test database/services
npm run test:setup-env
```

### Development Environment Health Check

```typescript
// Comprehensive health check script
async function developmentHealthCheck() {
  const checks = {
    environment: checkEnvironmentVariables(),
    apis: await checkAPIConnectivity(), 
    features: await checkFeatureFlags(),
    performance: await checkPerformanceBaselines(),
    telemetry: await checkTelemetryHealth(),
    cache: await checkCacheStatus()
  };
  
  console.log('🏥 Development Environment Health Check:');
  Object.entries(checks).forEach(([check, status]) => {
    const icon = status.healthy ? '✅' : '❌';
    console.log(`${icon} ${check}: ${status.message}`);
  });
  
  return checks;
}

// Run health check
npm run dev:health-check
```

### Quick Reset Commands

```bash
# Full environment reset
npm run dev:reset

# Clear all caches
npm run dev:clear-cache

# Reset database to clean state  
npm run dev:reset-db

# Rebuild with clean install
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

---

## Success Criteria

✅ **Quick Setup**: 5-minute setup process documented with all feature flags  
✅ **Development Workflow**: Complete workflow with feature flags and testing  
✅ **Debugging Tools**: Comprehensive debugging tools for all phases documented  
✅ **Testing Strategy**: Phase-specific and integration testing approaches  
✅ **Performance Monitoring**: Development-specific monitoring and optimization  
✅ **Troubleshooting**: Common issues and solutions provided  

**Phase 9.4.1 COMPLETE**: Comprehensive development environment setup guide created with streamlined workflow and debugging tools! 🚀

---

**Next**: Phase 9.4.2 - Testing Strategy Documentation
