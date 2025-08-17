# Production Troubleshooting Guide

**Document Version**: 1.0  
**Created**: Phase 9.3.2 - Troubleshooting & Recovery Documentation  
**Status**: Production Ready  
**Dependencies**: Phase 8 Monitoring & Phase 7 Performance Systems  

This guide provides comprehensive troubleshooting procedures and recovery strategies for Teaching Tales production issues, organized by system component and severity level.

## 📋 Table of Contents

- [Quick Reference](#quick-reference)
- [Story Creation Issues](#story-creation-issues)
- [Question Generation Problems](#question-generation-problems)
- [Performance Issues](#performance-issues)
- [Analytics & Telemetry Problems](#analytics--telemetry-problems)
- [Authentication & Authorization Issues](#authentication--authorization-issues)
- [Database & Storage Issues](#database--storage-issues)
- [Cache & Performance Problems](#cache--performance-problems)
- [External API Integration Issues](#external-api-integration-issues)
- [Recovery Procedures](#recovery-procedures)
- [Emergency Response](#emergency-response)

---

## Quick Reference

### 🚨 Emergency Contacts & Escalation
```yaml
P0 - Critical System Down:
  response_time: "< 1 minute"
  escalation: "Page on-call engineer immediately"
  stakeholders: ["CTO", "Engineering Manager", "Product Owner"]

P1 - Major Functionality Down:
  response_time: "< 5 minutes" 
  escalation: "Notify engineering team"
  stakeholders: ["Engineering Manager", "Product Owner"]

P2 - Performance Degradation:
  response_time: "< 15 minutes"
  escalation: "Create ticket and notify team"
  stakeholders: ["Engineering Team"]
```

### 🔧 Quick Diagnostic Commands
```bash
# System health overview
curl https://api.teachingtales.ai/health/detailed

# Phase 8 monitoring dashboard
curl https://api.teachingtales.ai/api/admin/advanced-metrics?type=technical

# Phase 7 scoring performance
curl https://api.teachingtales.ai/api/admin/scoring-metrics

# Recent error events
curl https://api.teachingtales.ai/api/analytics/events?category=error_events&limit=10
```

### ⚡ Emergency Recovery Commands
```bash
# Emergency feature flag rollback
QTI_ASYNC_STORY_SAVE_ENABLED=false          # Disable async story save
QTI_PERFORMANCE_CACHING_ENABLED=false       # Disable caching
TELEMETRY_ENABLED=false                      # Disable telemetry

# Scale down non-essential services
INTELLIGENT_ALERTING_ENABLED=false
EXECUTIVE_REPORTING_ENABLED=false
ML_OPTIMIZATION_ENABLED=false

# Restart core services (varies by deployment)
pm2 restart teaching-tales                   # PM2
docker-compose restart app                   # Docker
kubectl rollout restart deployment/app       # Kubernetes
```

---

## Story Creation Issues

### 🔴 Critical: Stories Not Appearing (P0)

#### Symptoms
- Users report stories not appearing after creation
- High error rate in `/api/generate-story` endpoint
- Story creation hangs indefinitely
- Stories appear but without content

#### Immediate Diagnostics
```bash
# 1. Check story creation endpoint health
curl -X POST https://api.teachingtales.ai/api/generate-story \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"universe":"test","character":"test","spark":"test","gradeLevel":"test","studentId":"diagnostic"}'

# 2. Check async story save status
curl https://api.teachingtales.ai/api/story-question-status/diagnostic-story-id

# 3. Review recent story creation telemetry
curl https://api.teachingtales.ai/api/analytics/insights?category=story_creation&preset=1h

# 4. Check background job queue depth
curl https://api.teachingtales.ai/api/admin/advanced-metrics?type=technical | jq '.resourceUtilization.queueDepth'
```

#### Root Cause Analysis
```bash
# Check AI service connectivity
curl https://generativelanguage.googleapis.com/v1/models \
  -H "Authorization: Bearer $GOOGLE_AI_API_KEY"

# Verify feature flag configuration
echo "QTI_ASYNC_STORY_SAVE_ENABLED: $QTI_ASYNC_STORY_SAVE_ENABLED"
echo "QTI_SPLIT_GENERATION_ENABLED: $QTI_SPLIT_GENERATION_ENABLED"
echo "QTI_ASYNC_ASSESSMENTS_ENABLED: $QTI_ASYNC_ASSESSMENTS_ENABLED"

# Check database connectivity
curl https://api.teachingtales.ai/health/detailed | jq '.services.database'

# Review application logs for errors
tail -f /var/log/teaching-tales/app.log | grep -i error
```

#### Recovery Actions
1. **Immediate (< 2 minutes)**:
   ```bash
   # If async story save is failing, rollback to sync
   QTI_ASYNC_STORY_SAVE_ENABLED=false
   
   # Restart application to apply changes
   pm2 restart teaching-tales
   ```

2. **Short-term (< 15 minutes)**:
   ```bash
   # Clear background job queue if backed up
   curl -X POST https://api.teachingtales.ai/api/admin/jobs/clear-queue
   
   # Scale up background workers
   export BACKGROUND_WORKERS=10  # Increase from default 5
   
   # Enable enhanced error logging
   STORY_GENERATION_DEBUG=true
   ```

3. **Long-term (< 1 hour)**:
   - Investigate and fix root cause (AI API limits, database issues, etc.)
   - Gradually re-enable async features once stable
   - Implement additional monitoring and alerting

#### Validation
```bash
# Test story creation end-to-end
curl -X POST https://api.teachingtales.ai/api/generate-story \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer valid-token" \
  -d '{"universe":"Pokemon","character":"Pikachu","spark":"adventure","gradeLevel":"4-5","studentId":"validation-test"}'

# Verify story appears in user interface
# Confirm questions generate in background (if async enabled)
# Check telemetry events are captured
```

---

### 🟡 Warning: Story Creation Slow (P1)

#### Symptoms
- Story creation taking >5 seconds consistently
- Users reporting slow response times
- High CPU usage during story generation
- Background job queue building up

#### Diagnostics
```bash
# Check current performance metrics
curl https://api.teachingtales.ai/api/admin/scoring-metrics | jq '.performanceDistribution'

# Review story creation timing
curl https://api.teachingtales.ai/api/analytics/insights?category=story_creation&preset=30m \
  | jq '.averageProcessingTime'

# Check system resource utilization
curl https://api.teachingtales.ai/api/admin/advanced-metrics?type=technical \
  | jq '.resourceUtilization'
```

#### Recovery Actions
1. **Optimize AI API calls**:
   ```bash
   # Reduce AI model parameters temporarily
   GEMINI_MAX_TOKENS=2048        # Reduce from 4096
   GEMINI_TEMPERATURE=0.5        # Reduce creativity for speed
   
   # Enable response caching
   STORY_GENERATION_CACHING=true
   ```

2. **Scale background processing**:
   ```bash
   # Increase background worker capacity
   BACKGROUND_WORKERS=15
   WORKER_CONCURRENCY=3
   
   # Optimize job batching
   JOB_BATCH_SIZE=5
   ```

3. **Performance optimization**:
   ```bash
   # Enable Phase 7 caching if not already active
   QTI_PERFORMANCE_CACHING_ENABLED=true
   
   # Warm caches proactively
   curl -X POST https://api.teachingtales.ai/api/admin/cache/warm
   ```

---

## Question Generation Problems

### 🔴 Critical: Questions Not Generating (P0)

#### Symptoms
- Stories appear but questions never load
- Question generation failure rate >10%
- Background jobs stuck in "generating" state
- High error rate in `/api/generate-questions`

#### Immediate Diagnostics
```bash
# 1. Test question generation API directly
curl -X POST https://api.teachingtales.ai/api/generate-questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "sectionContent": "Test content for diagnostics",
    "sectionIndex": 0,
    "gradeLevel": "4-5",
    "constraints": {"questionCount": 1}
  }'

# 2. Check background job status
curl https://api.teachingtales.ai/api/admin/jobs/queue-status

# 3. Review question generation telemetry
curl https://api.teachingtales.ai/api/analytics/events?category=question_generation&limit=20

# 4. Check AI service limits and quota
curl https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent \
  -H "Authorization: Bearer $GOOGLE_AI_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}' 2>&1 | head -20
```

#### Root Cause Analysis
```bash
# Check feature flag dependencies
echo "Required flags for question generation:"
echo "QTI_SPLIT_GENERATION_ENABLED: $QTI_SPLIT_GENERATION_ENABLED"
echo "QTI_ASYNC_ASSESSMENTS_ENABLED: $QTI_ASYNC_ASSESSMENTS_ENABLED"

# Verify prompt templates are loading
grep -r "generateQuestionsForSection" src/lib/ai/prompt-templates.ts

# Check assessment service connectivity
curl https://api.teachingtales.ai/api/qti/assessments/health

# Review worker process health
ps aux | grep -i background | grep -i question
```

#### Recovery Actions
1. **Immediate (< 2 minutes)**:
   ```bash
   # Restart background job processors
   pm2 restart question-workers
   
   # Clear stuck jobs
   curl -X POST https://api.teachingtales.ai/api/admin/jobs/clear-stuck
   
   # Fallback to synchronous generation temporarily
   QTI_SPLIT_GENERATION_ENABLED=false
   ```

2. **Short-term (< 15 minutes)**:
   ```bash
   # Scale up question generation workers
   QUESTION_WORKERS=8
   QUESTION_WORKER_TIMEOUT=60000  # Increase timeout
   
   # Enable enhanced retry logic
   QUESTION_GENERATION_RETRY_ATTEMPTS=5
   QUESTION_GENERATION_RETRY_DELAY=2000
   ```

3. **Long-term (< 1 hour)**:
   - Investigate AI API rate limits and quota
   - Review and optimize prompt templates
   - Implement circuit breaker for AI service failures
   - Add more comprehensive error handling

#### Validation
```bash
# Test complete question generation flow
curl -X POST https://api.teachingtales.ai/api/generate-story \
  -d '{"universe":"test","character":"test","spark":"test","gradeLevel":"4-5","studentId":"question-test"}'

# Wait for story creation, then check question status
sleep 5
curl https://api.teachingtales.ai/api/story-question-status/test-story-id

# Verify questions appear in UI after background processing
```

---

## Performance Issues

### 🟡 Warning: High Response Times (P1)

#### Symptoms
- API response times >500ms sustained
- Phase 7 scoring metrics showing degraded performance
- Cache hit rates below 60%
- User complaints about slow application

#### Phase 7 Performance Diagnostics
```bash
# 1. Check detailed scoring metrics
curl https://api.teachingtales.ai/api/admin/scoring-metrics | jq '{
  averageProcessingTime,
  cacheHitRate,
  performanceDistribution,
  errorRate
}'

# 2. Analyze cache performance
curl https://api.teachingtales.ai/api/admin/cache/stats | jq '{
  hitRate,
  missRate, 
  memoryUsage,
  evictionRate
}'

# 3. Review recent performance trends
curl https://api.teachingtales.ai/api/admin/advanced-metrics?type=technical | jq '{
  responseTime,
  throughput,
  resourceUtilization
}'

# 4. Check for slow queries
curl https://api.teachingtales.ai/api/admin/database/slow-queries | head -10
```

#### Recovery Actions

##### Cache Optimization (Phase 7)
```bash
# 1. Warm critical caches immediately
curl -X POST https://api.teachingtales.ai/api/admin/cache/warm \
  -d '{"strategy": "popular_questions", "priority": "high"}'

# 2. Increase cache memory if available
CACHE_MAX_SIZE_MB=2048         # Increase from 1024
REDIS_MAXMEMORY=2gb            # Increase Redis memory limit

# 3. Optimize cache keys and TTL
CACHE_TTL_SECONDS=600          # Increase from 300
CACHE_KEY_OPTIMIZATION=true    # Enable optimized key generation

# 4. Enable aggressive cache preloading
CACHE_PRELOAD_POPULAR=true
CACHE_PRELOAD_SCHEDULE="*/5 * * * *"  # Every 5 minutes
```

##### Database Optimization
```bash
# 1. Enable query performance monitoring
QUERY_PERFORMANCE_LOGGING=true
SLOW_QUERY_THRESHOLD=100       # Log queries >100ms

# 2. Optimize connection pool
DB_POOL_MAX=30                 # Increase from 20
DB_POOL_MIN=10                 # Increase from 5
DB_POOL_IDLE=30000             # 30s idle timeout

# 3. Check and rebuild indexes if needed
curl -X POST https://api.teachingtales.ai/api/admin/database/analyze-indexes
```

##### Application-Level Optimization
```bash
# 1. Enable response compression
COMPRESSION_ENABLED=true
COMPRESSION_THRESHOLD=1024     # Compress responses >1KB

# 2. Optimize concurrent request handling
MAX_CONCURRENT_REQUESTS=150    # Increase from 100
REQUEST_QUEUE_SIZE=500         # Increase queue size

# 3. Enable performance monitoring
PERFORMANCE_MONITORING_ENABLED=true
PERFORMANCE_SAMPLING_RATE=0.1  # Sample 10% of requests
```

#### Validation
```bash
# Monitor improvement over 10-minute window
for i in {1..10}; do
  echo "Minute $i:"
  curl -s https://api.teachingtales.ai/api/admin/scoring-metrics | \
    jq '.averageProcessingTime, .cacheHitRate'
  sleep 60
done

# Verify cache hit rates improve
curl https://api.teachingtales.ai/api/admin/cache/stats | jq '.hitRate'

# Check overall system response time
curl https://api.teachingtales.ai/health/detailed | jq '.metrics.responseTime'
```

---

### 🔴 Critical: System Overload (P0)

#### Symptoms
- Response times >2 seconds
- HTTP 503 Service Unavailable errors
- CPU usage >90% sustained
- Memory usage approaching limits
- Database connection pool exhausted

#### Emergency Response
```bash
# 1. Immediate load shedding
RATE_LIMITING_ENABLED=true
RATE_LIMIT_RPM=60              # Reduce from default
RATE_LIMIT_BURST=10            # Reduce burst capacity

# 2. Disable non-essential features
TELEMETRY_ENABLED=false        # Reduce processing overhead
EXECUTIVE_REPORTING_ENABLED=false
ML_OPTIMIZATION_ENABLED=false
INTELLIGENT_ALERTING_ENABLED=false

# 3. Scale down expensive operations  
QTI_PERFORMANCE_CACHING_ENABLED=false  # Temporarily disable if causing issues
ANALYTICS_ENABLED=false                # Reduce analytics processing
BACKGROUND_JOB_PROCESSING=false        # Pause background jobs

# 4. Emergency cache flush if memory critical
curl -X POST https://api.teachingtales.ai/api/admin/cache/emergency-flush
```

#### System Recovery
```bash
# 1. Scale up infrastructure (if available)
# AWS Auto Scaling
aws autoscaling set-desired-capacity --auto-scaling-group-name teaching-tales-asg --desired-capacity 5

# Docker Swarm
docker service scale teaching-tales=5

# Kubernetes
kubectl scale deployment teaching-tales --replicas=5

# 2. Optimize resource usage
GC_HEAP_SIZE=1024M             # Optimize garbage collection
NODE_OPTIONS="--max-old-space-size=1024"

# 3. Database connection optimization
DB_POOL_MAX=10                 # Reduce to essential connections only
DB_POOL_ACQUIRE_TIMEOUT=5000   # Reduce connection timeout

# 4. Enable circuit breakers
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_THRESHOLD=5    # Fail fast after 5 errors
CIRCUIT_BREAKER_TIMEOUT=30000  # 30s timeout
```

---

## Analytics & Telemetry Problems

### 🟡 Warning: Missing Analytics Data (P2)

#### Symptoms
- Phase 8 dashboards showing no recent data
- Telemetry events not appearing in logs
- Learning insights failing to generate
- Executive reports showing stale data

#### Phase 8 Telemetry Diagnostics
```bash
# 1. Check telemetry service health
curl https://api.teachingtales.ai/api/analytics/events?limit=5 | jq '.length'

# 2. Verify telemetry configuration
echo "TELEMETRY_ENABLED: $TELEMETRY_ENABLED"
echo "ANALYTICS_RETENTION_DAYS: $ANALYTICS_RETENTION_DAYS"
echo "ANALYTICS_BATCH_SIZE: $ANALYTICS_BATCH_SIZE"

# 3. Check data pipeline health
curl https://api.teachingtales.ai/api/admin/analytics/pipeline-status

# 4. Review recent analytics errors
curl https://api.teachingtales.ai/api/analytics/events?category=error_events&limit=10
```

#### Recovery Actions
```bash
# 1. Restart telemetry services
TELEMETRY_ENABLED=false
sleep 5
TELEMETRY_ENABLED=true

# 2. Clear telemetry buffers and restart collection
curl -X POST https://api.teachingtales.ai/api/admin/telemetry/restart

# 3. Verify data pipeline configuration
ANALYTICS_BATCH_SIZE=50        # Reduce batch size if processing issues
ANALYTICS_FLUSH_INTERVAL_MS=10000  # Increase flush interval

# 4. Enable debug logging temporarily
TELEMETRY_DEBUG_MODE=true
ANALYTICS_VERBOSE_LOGGING=true
```

#### Validation
```bash
# Generate test events and verify processing
curl -X POST https://api.teachingtales.ai/api/analytics/events \
  -d '{"category":"test","action":"troubleshooting","properties":{"test":true}}'

# Wait for processing and verify event appears
sleep 10
curl https://api.teachingtales.ai/api/analytics/events?category=test&limit=1

# Test insights generation
curl https://api.teachingtales.ai/api/analytics/insights?preset=1h
```

---

### 🔴 Critical: Analytics System Down (P1)

#### Symptoms
- All Phase 8 analytics endpoints returning 500 errors
- Learning insights API completely unresponsive  
- Executive reporting failing to generate
- ML optimization service not responding

#### Emergency Response
```bash
# 1. Isolate analytics system failures
LEARNING_ANALYTICS_ENABLED=false
EXECUTIVE_REPORTING_ENABLED=false
ML_OPTIMIZATION_ENABLED=false

# 2. Keep core telemetry for essential monitoring
TELEMETRY_ENABLED=true         # Keep basic telemetry
INTELLIGENT_ALERTING_ENABLED=false  # Disable complex alerting

# 3. Check and restart analytics services
systemctl status teaching-tales-analytics
systemctl restart teaching-tales-analytics

# 4. Verify data warehouse connectivity (if applicable)
curl https://data-warehouse.example.com/health || echo "Data warehouse unreachable"
```

#### Recovery Steps
```bash
# 1. Restart analytics services with minimal configuration
ANALYTICS_RETENTION_DAYS=7     # Reduce retention temporarily
ANALYTICS_BATCH_SIZE=10        # Reduce batch size
ML_PREDICTION_CONFIDENCE_THRESHOLD=0.9  # Higher threshold

# 2. Gradually re-enable features
LEARNING_ANALYTICS_ENABLED=true
sleep 30
# Verify basic analytics work before proceeding

INTELLIGENT_ALERTING_ENABLED=true
sleep 30
# Test alerting system

ML_OPTIMIZATION_ENABLED=true
sleep 30
# Test ML recommendations

EXECUTIVE_REPORTING_ENABLED=true
# Test report generation
```

---

## Authentication & Authorization Issues

### 🔴 Critical: Login System Down (P0)

#### Symptoms
- Users cannot log in
- TimeBack SSO integration failing
- Authentication API returning 401/403 errors
- Session tokens not validating

#### Immediate Diagnostics
```bash
# 1. Test TimeBack API connectivity
curl https://core.timebackapi.com/health || echo "TimeBack API unreachable"

# 2. Verify API configuration
echo "NEXT_PUBLIC_TIMEBACK_API_URL: $NEXT_PUBLIC_TIMEBACK_API_URL"

# 3. Test authentication endpoint
curl https://api.teachingtales.ai/api/auth/me \
  -H "Authorization: Bearer test-token"

# 4. Check authentication service logs
tail -f /var/log/teaching-tales/auth.log | grep -i error
```

#### Recovery Actions
```bash
# 1. Verify TimeBack API configuration
# Check environment variables
env | grep TIMEBACK

# Validate API URL accessibility
curl -I $NEXT_PUBLIC_TIMEBACK_API_URL/health

# 2. Restart authentication services
systemctl restart teaching-tales-auth

# 3. Clear authentication caches if applicable
curl -X POST https://api.teachingtales.ai/api/auth/clear-cache

# 4. Enable authentication debug mode
AUTH_DEBUG_MODE=true
AUTH_VERBOSE_LOGGING=true
```

---

## Database & Storage Issues

### 🔴 Critical: Database Connection Failures (P0)

#### Symptoms
- Stories not saving to database
- Connection pool exhausted errors
- Database timeouts in application logs
- Health checks failing for database

#### Emergency Response
```bash
# 1. Check database connectivity
curl https://api.teachingtales.ai/health/detailed | jq '.services.database'

# 2. Test direct database connection (if accessible)
pg_isready -h database-host -p 5432 -U username

# 3. Check connection pool status
curl https://api.teachingtales.ai/api/admin/database/pool-status

# 4. Review database performance
curl https://api.teachingtales.ai/api/admin/database/stats
```

#### Recovery Actions
```bash
# 1. Optimize connection pool immediately
DB_POOL_MAX=10                 # Reduce max connections
DB_POOL_MIN=2                  # Reduce min connections
DB_POOL_ACQUIRE_TIMEOUT=10000  # 10s timeout
DB_POOL_IDLE=5000              # 5s idle timeout

# 2. Clear connection pool
curl -X POST https://api.teachingtales.ai/api/admin/database/clear-pool

# 3. Enable connection pooling optimization
DB_POOL_EVICT_INTERVAL=1000    # 1s eviction interval
DB_POOL_VALIDATION=true        # Enable connection validation

# 4. Restart database services if necessary
systemctl restart postgresql  # If self-hosted
# OR contact cloud provider if managed database
```

---

## Cache & Performance Problems

### 🟡 Warning: Cache Hit Rate Low (P2)

#### Symptoms
- Phase 7 cache hit rate <40%
- Slow response times despite caching enabled
- High cache eviction rates
- Memory pressure on cache servers

#### Phase 7 Cache Diagnostics
```bash
# 1. Detailed cache performance analysis
curl https://api.teachingtales.ai/api/admin/scoring-metrics | jq '{
  cacheHitRate,
  performanceDistribution,
  asyncQuestionPerformance
}'

# 2. Cache memory and eviction analysis
curl https://api.teachingtales.ai/api/admin/cache/detailed-stats | jq '{
  memoryUsage,
  evictionRate,
  fragmentationRatio,
  keyDistribution
}'

# 3. Popular cache keys analysis
curl https://api.teachingtales.ai/api/admin/cache/popular-keys | head -20

# 4. Cache miss patterns
curl https://api.teachingtales.ai/api/admin/cache/miss-patterns | head -10
```

#### Recovery Actions
```bash
# 1. Immediate cache optimization
CACHE_TTL_SECONDS=900          # Increase from 300 to 15 minutes
CACHE_MAX_SIZE_MB=3072         # Increase cache size
CACHE_KEY_OPTIMIZATION=true    # Enable optimized key generation

# 2. Proactive cache warming
curl -X POST https://api.teachingtales.ai/api/admin/cache/warm \
  -d '{
    "strategy": "popular_questions",
    "priority": "high",
    "preloadCount": 1000
  }'

# 3. Cache eviction optimization
CACHE_EVICTION_POLICY=LRU      # Least Recently Used
CACHE_EVICTION_PERCENTAGE=10   # Evict 10% when full

# 4. Enable cache analytics
CACHE_PERFORMANCE_TRACKING=true
CACHE_HIT_RATE_ALERTING=true
CACHE_HIT_RATE_THRESHOLD=0.6   # Alert if below 60%
```

#### Validation
```bash
# Monitor cache improvements over time
for i in {1..15}; do
  echo "Check $i (minute $(date '+%M')):"
  curl -s https://api.teachingtales.ai/api/admin/scoring-metrics | \
    jq '.cacheHitRate'
  sleep 60
done

# Verify cache warming effectiveness
curl https://api.teachingtales.ai/api/admin/cache/stats | \
  jq '{hitRate, memoryUsage, evictionRate}'
```

---

## External API Integration Issues

### 🟡 Warning: AI Service Rate Limits (P1)

#### Symptoms
- Story generation failing with quota exceeded errors
- Question generation timeouts
- AI API returning 429 Too Many Requests
- Increased latency in AI operations

#### Diagnostics
```bash
# 1. Check AI API key and quota
curl https://generativelanguage.googleapis.com/v1/models \
  -H "Authorization: Bearer $GOOGLE_AI_API_KEY" 2>&1 | grep -i quota

# 2. Review AI service usage patterns
curl https://api.teachingtales.ai/api/admin/ai-usage/stats

# 3. Check rate limiting configuration
echo "AI_RATE_LIMIT_RPM: $AI_RATE_LIMIT_RPM"
echo "AI_RATE_LIMIT_CONCURRENT: $AI_RATE_LIMIT_CONCURRENT"
```

#### Recovery Actions
```bash
# 1. Implement exponential backoff
AI_RETRY_ENABLED=true
AI_RETRY_MAX_ATTEMPTS=5
AI_RETRY_BACKOFF_MS=2000       # 2s initial backoff
AI_RETRY_BACKOFF_MULTIPLIER=2  # Double each retry

# 2. Optimize AI usage
GEMINI_MAX_TOKENS=2048         # Reduce from 4096
GEMINI_TEMPERATURE=0.3         # Reduce for more focused responses

# 3. Enable AI response caching
AI_RESPONSE_CACHING=true
AI_CACHE_TTL_HOURS=24         # Cache responses for 24 hours

# 4. Implement circuit breaker
AI_CIRCUIT_BREAKER_ENABLED=true
AI_CIRCUIT_BREAKER_THRESHOLD=10
AI_CIRCUIT_BREAKER_TIMEOUT=60000  # 1 minute
```

---

## Recovery Procedures

### 🚨 Emergency Rollback Procedures

#### Complete System Rollback
```bash
#!/bin/bash
# emergency-rollback.sh
echo "🚨 EMERGENCY ROLLBACK: Disabling all advanced features"

# Disable Phase 8 features
export TELEMETRY_ENABLED=false
export ML_OPTIMIZATION_ENABLED=false
export INTELLIGENT_ALERTING_ENABLED=false
export LEARNING_ANALYTICS_ENABLED=false
export EXECUTIVE_REPORTING_ENABLED=false

# Disable Phase 7 performance features
export QTI_PERFORMANCE_CACHING_ENABLED=false
export QTI_ADVANCED_ANALYTICS_ENABLED=false
export QTI_ADMIN_METRICS_ENABLED=false

# Disable Phase 6 UI features
export NEXT_PUBLIC_PROGRESSIVE_LOADING=false
export NEXT_PUBLIC_ASYNC_UI_ENABLED=false

# Disable Phase 5 async story save
export QTI_ASYNC_STORY_SAVE_ENABLED=false

# Keep Phase 3-4 for basic functionality
export QTI_SPLIT_GENERATION_ENABLED=true
export QTI_ASYNC_ASSESSMENTS_ENABLED=true

# Restart services
pm2 restart teaching-tales
echo "✅ Emergency rollback complete - core functionality preserved"
```

#### Gradual Recovery Process
```bash
#!/bin/bash
# gradual-recovery.sh
echo "🔄 Starting gradual system recovery"

# Phase 1: Enable basic async features
export QTI_ASYNC_STORY_SAVE_ENABLED=true
pm2 restart teaching-tales
echo "Phase 5 async story save: Enabled"
sleep 60

# Validate core functionality
if curl -s https://api.teachingtales.ai/health | grep -q "healthy"; then
  echo "✅ Core system stable, continuing recovery"
else
  echo "❌ Core system unstable, aborting recovery"
  exit 1
fi

# Phase 2: Enable performance features
export QTI_PERFORMANCE_CACHING_ENABLED=true
export QTI_ADMIN_METRICS_ENABLED=true
sleep 30

# Phase 3: Enable telemetry
export TELEMETRY_ENABLED=true
sleep 30

# Phase 4: Enable analytics
export LEARNING_ANALYTICS_ENABLED=true
sleep 30

# Phase 5: Enable advanced features
export ML_OPTIMIZATION_ENABLED=true
export INTELLIGENT_ALERTING_ENABLED=true

echo "✅ Gradual recovery complete"
```

### 🛠️ Service Restart Procedures

#### Application Services
```bash
# PM2 (Node.js Process Manager)
pm2 restart teaching-tales
pm2 restart teaching-tales-workers

# Docker Compose
docker-compose restart app
docker-compose restart workers

# Kubernetes
kubectl rollout restart deployment/teaching-tales
kubectl rollout restart deployment/teaching-tales-workers

# Systemd
systemctl restart teaching-tales
systemctl restart teaching-tales-workers
```

#### Cache Services
```bash
# Redis restart
systemctl restart redis
# OR
docker-compose restart redis

# Clear caches
curl -X POST https://api.teachingtales.ai/api/admin/cache/clear
curl -X POST https://api.teachingtales.ai/api/admin/cache/warm
```

#### Database Services
```bash
# PostgreSQL restart (if self-hosted)
systemctl restart postgresql

# Connection pool restart
curl -X POST https://api.teachingtales.ai/api/admin/database/restart-pool
```

---

## Emergency Response

### 🚨 Incident Response Checklist

#### P0 - Critical System Down
- [ ] **Immediate (< 1 minute)**: Page on-call engineer
- [ ] **Assessment (< 5 minutes)**: Determine scope and impact
- [ ] **Communication (< 10 minutes)**: Notify stakeholders and users
- [ ] **Mitigation (< 30 minutes)**: Implement emergency rollback
- [ ] **Resolution (< 2 hours)**: Fix root cause and validate
- [ ] **Post-mortem (< 24 hours)**: Document incident and prevention

#### P1 - Major Functionality Down
- [ ] **Detection (< 5 minutes)**: Confirm issue and scope
- [ ] **Investigation (< 15 minutes)**: Identify root cause
- [ ] **Mitigation (< 60 minutes)**: Implement temporary fix
- [ ] **Resolution (< 4 hours)**: Deploy permanent solution
- [ ] **Validation (< 8 hours)**: Confirm fix and monitor stability

### 📞 Communication Templates

#### P0 Incident Notification
```
🚨 P0 INCIDENT: Teaching Tales System Down

Impact: Complete system outage affecting all users
Started: [TIMESTAMP]
ETA: Under investigation
Actions: Emergency rollback initiated
Updates: Will provide update in 15 minutes

Engineering team investigating immediately.
```

#### P1 Issue Update
```
⚠️ P1 UPDATE: [Issue Description]

Status: [In Progress/Resolved]
Impact: [Description of user impact]
Root Cause: [If identified]
Next Steps: [Planned actions]
ETA: [Estimated resolution time]

Will update again in [TIME INTERVAL].
```

### 📋 Post-Incident Checklist

#### Immediate Post-Resolution
- [ ] Confirm system stability for 30+ minutes
- [ ] Re-enable monitoring and alerting
- [ ] Validate all features functioning correctly
- [ ] Update incident status page
- [ ] Notify stakeholders of resolution

#### Within 24 Hours
- [ ] Schedule post-mortem meeting with all involved parties
- [ ] Document timeline of events and decisions made
- [ ] Identify root cause and contributing factors
- [ ] Create action items to prevent recurrence
- [ ] Update runbooks and documentation based on learnings

#### Within 48 Hours
- [ ] Complete post-mortem report
- [ ] Implement immediate prevention measures
- [ ] Update monitoring and alerting thresholds
- [ ] Share learnings with broader engineering team
- [ ] Update emergency response procedures if needed

---

## 🎯 Production Checklist

### Pre-Incident Preparation
- [ ] All diagnostic commands tested and working
- [ ] Emergency rollback procedures tested
- [ ] On-call rotation established and trained
- [ ] Communication channels and templates ready
- [ ] Monitoring and alerting thresholds validated

### During Incident Response
- [ ] Follow established severity classification
- [ ] Use diagnostic commands for rapid assessment
- [ ] Apply appropriate recovery procedures
- [ ] Maintain clear communication with stakeholders
- [ ] Document all actions and decisions

### Post-Incident Recovery
- [ ] Complete thorough system validation
- [ ] Conduct post-mortem within 24 hours
- [ ] Update documentation and procedures
- [ ] Implement prevention measures
- [ ] Monitor system stability for extended period

---

**Production Ready**: ✅ Comprehensive troubleshooting guide with recovery procedures for all major Teaching Tales system components, covering Phase 7 performance optimization and Phase 8 analytics systems.
