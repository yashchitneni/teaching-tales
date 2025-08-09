# Operations Guide: Questions Generation API

**Service**: `/api/generate-questions`  
**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Monitoring**: Required for production deployment

## Service Health Monitoring

### Health Check Endpoint

**URL**: `GET /api/health` (to be implemented in Phase 4)  
**Purpose**: Verify API and dependencies are operational  
**Timeout**: 5 seconds  

**Expected Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "version": "1.0.0",
  "services": {
    "questionGeneration": "healthy",
    "timebackAuth": "healthy",
    "featureFlags": "enabled"
  },
  "uptime": 3600000,
  "memory": {
    "used": "150MB",
    "total": "512MB"
  }
}
```

**Unhealthy Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy", 
  "timestamp": "2024-01-15T10:30:45.123Z",
  "errors": [
    "AI service unreachable",
    "TimeBack authentication failing"
  ]
}
```

### Key Performance Indicators (KPIs)

| Metric | Target | Alert Threshold | Critical Threshold |
|--------|--------|-----------------|-------------------|
| Response Time (95th) | < 5s | > 10s | > 20s |
| Success Rate | > 95% | < 90% | < 80% |
| Availability | > 99.9% | < 99% | < 95% |
| Error Rate | < 5% | > 10% | > 20% |
| Auth Success Rate | > 98% | < 95% | < 90% |

---

## Logging & Log Analysis

### Log Levels & Categories

**INFO**: Normal operation events
- Request started/completed
- Question generation success
- Performance metrics

**WARN**: Non-critical issues  
- Service timeouts with successful retry
- Authentication retries
- Performance degradation

**ERROR**: Service failures
- Authentication failures
- AI service errors
- Request validation failures
- Unexpected exceptions

### Log Format Structure

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO|WARN|ERROR",
  "service": "generate-questions",
  "requestId": "req_abc123",
  "userId": "user_xyz789", 
  "message": "Human readable message",
  "data": {
    "gradeLevel": "4-5",
    "sectionIndex": 0,
    "generationTimeMs": 2500,
    "questionCount": 3
  },
  "performance": {
    "totalRequestTimeMs": 3012,
    "serviceCallDurationMs": 2643,
    "requestSizeBytes": 1024,
    "responseSizeBytes": 2048
  }
}
```

### Critical Log Queries

#### Performance Issues
```sql
-- CloudWatch Logs Insights
fields @timestamp, @message, totalRequestTimeMs
| filter @message like /generate-questions/
| filter totalRequestTimeMs > 10000
| sort @timestamp desc
| limit 50
```

#### Error Analysis
```sql
fields @timestamp, error.code, error.message, userId
| filter success = false
| stats count() by error.code
| sort count desc
```

#### Authentication Failures
```sql
fields @timestamp, @message, userId
| filter @message like /Authentication.*failed/
| stats count() by userId
| sort count desc
```

#### Request Volume Analysis
```sql
fields @timestamp
| filter @message like /generate-questions/
| stats count() by bin(5m)
| sort @timestamp desc
```

---

## Alerting Configuration

### Critical Alerts (PagerDuty/Immediate)

**High Error Rate**
- **Condition**: Error rate > 20% for 2 consecutive minutes
- **Action**: Page on-call engineer
- **Runbook**: [Error Rate Investigation](#error-rate-investigation)

**Service Down**  
- **Condition**: No successful requests in 5 minutes
- **Action**: Page on-call engineer  
- **Runbook**: [Service Down Recovery](#service-down-recovery)

**Authentication System Failure**
- **Condition**: Auth success rate < 50% for 2 minutes
- **Action**: Page on-call engineer
- **Runbook**: [Auth System Recovery](#auth-system-recovery)

### Warning Alerts (Slack/Email)

**Performance Degradation**
- **Condition**: 95th percentile > 10 seconds for 5 minutes
- **Action**: Notify team channel
- **Runbook**: [Performance Investigation](#performance-investigation)

**Elevated Error Rate**
- **Condition**: Error rate > 10% for 5 minutes  
- **Action**: Notify team channel
- **Runbook**: [Error Rate Investigation](#error-rate-investigation)

**AI Service Issues**
- **Condition**: AI service timeout rate > 5%
- **Action**: Notify team channel
- **Runbook**: [AI Service Investigation](#ai-service-investigation)

### Configuration Examples

#### CloudWatch Alarms
```yaml
HighErrorRateAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: GenerateQuestions-HighErrorRate
    AlarmDescription: High error rate for generate-questions API
    MetricName: ErrorRate
    Namespace: TeachingTales/API
    Statistic: Average
    Period: 60
    EvaluationPeriods: 2
    Threshold: 20
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref PagerDutyTopic

PerformanceDegradationAlarm:
  Type: AWS::CloudWatch::Alarm  
  Properties:
    AlarmName: GenerateQuestions-SlowResponse
    MetricName: ResponseTime95th
    Threshold: 10000
    Period: 300
    EvaluationPeriods: 1
    AlarmActions:
      - !Ref SlackNotificationTopic
```

---

## Incident Response Runbooks

### Error Rate Investigation

**Symptoms**: Error rate above normal thresholds

**Step 1: Identify Error Types**
```bash
# Check error distribution
aws logs insights start-query \
  --log-group-name "/aws/lambda/generate-questions" \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields error.code | stats count() by error.code | sort count desc'
```

**Step 2: Check Service Dependencies**
- TimeBack API health: `curl https://timeback-api/health`
- AI Service status: Check service provider dashboard
- Database connectivity: Run health check

**Step 3: Review Recent Deployments**
- Check deployment logs for timing correlation
- Review feature flag changes
- Verify configuration changes

**Step 4: Mitigation Actions**
- Roll back recent deployment if correlation found
- Disable feature flag: `QTI_SPLIT_GENERATION_ENABLED=false`
- Scale up resources if capacity issue
- Contact service providers if external dependency issue

### Service Down Recovery

**Symptoms**: No successful requests, health check failures

**Step 1: Verify Service Status**
```bash
# Check if service is running
curl -f https://your-domain/api/generate-questions/health || echo "Service down"

# Check container/server status
docker ps | grep teaching-tales
pm2 status | grep teaching-tales
```

**Step 2: Check Infrastructure**
- Server/container resources (CPU, memory, disk)
- Network connectivity
- Load balancer status
- Database connectivity

**Step 3: Review Recent Changes**
- Check deployment history
- Review infrastructure changes  
- Check for configuration updates

**Step 4: Recovery Actions**
```bash
# Restart service
pm2 restart teaching-tales

# Or container restart
docker restart teaching-tales-container

# If needed, rollback deployment
git checkout previous-stable-version
npm run deploy

# Disable feature as last resort
export QTI_SPLIT_GENERATION_ENABLED=false
```

### Auth System Recovery

**Symptoms**: High authentication failure rate

**Step 1: Verify TimeBack API**
```bash
# Test TimeBack API directly
curl -H "Authorization: Bearer test-token" https://timeback-api/api/auth/me

# Check TimeBack service status
curl https://timeback-api/health
```

**Step 2: Review Token Format**
- Check for token format changes
- Verify cookie extraction logic
- Test with known good token

**Step 3: Check Network Issues**
- DNS resolution for TimeBack API
- Network connectivity from application servers
- Firewall/security group changes

**Step 4: Mitigation**
- Contact TimeBack team if their service is down
- Implement temporary bypass if safe (feature flag)
- Scale up TimeBack API if load issue

### Performance Investigation

**Symptoms**: Slow response times, timeouts

**Step 1: Identify Bottleneck**
```bash
# Check response time breakdown
aws logs insights start-query \
  --query-string 'fields totalRequestTimeMs, serviceCallDurationMs, generationTimeMs | sort totalRequestTimeMs desc | limit 20'
```

**Step 2: Resource Analysis**
- CPU utilization on application servers
- Memory usage patterns  
- Database query performance
- AI service response times

**Step 3: Traffic Analysis**
- Request volume changes
- Geographic distribution
- User behavior patterns
- Concurrent request levels

**Step 4: Optimization Actions**
- Scale up application servers if CPU/memory bound
- Optimize database queries if DB is bottleneck
- Implement caching if repeated requests
- Contact AI service provider if external bottleneck

### AI Service Investigation

**Symptoms**: AI service timeouts, generation failures

**Step 1: Check AI Service Status**
- Service provider status page
- API quota and rate limits
- Authentication/API key validity

**Step 2: Request Analysis**
```bash
# Check request patterns causing issues
aws logs insights start-query \
  --query-string 'fields sectionContent, gradeLevel, generationTimeMs | filter generationTimeMs > 30000'
```

**Step 3: Content Analysis**
- Check for unusually long or complex content
- Verify content encoding issues
- Review grade level distribution

**Step 4: Mitigation**
- Switch to backup AI service if configured
- Implement request size limits
- Add retry logic with exponential backoff
- Cache frequently requested content

---

## Deployment & Release Management

### Pre-Deployment Checklist

**✅ Code Quality**
- [ ] All tests passing (unit + integration)
- [ ] Code review completed
- [ ] Security review completed  
- [ ] Performance testing completed

**✅ Configuration**
- [ ] Environment variables validated
- [ ] Feature flags configured correctly
- [ ] API keys and secrets updated
- [ ] Database migrations applied

**✅ Monitoring**
- [ ] Health check endpoints working
- [ ] Logging configured correctly
- [ ] Alerts configured and tested
- [ ] Dashboard updated with new metrics

### Deployment Process

**Step 1: Pre-deployment Validation**
```bash
# Run all tests
npm run test:all
npm run test:integration

# Verify configuration
npm run validate-config

# Check dependencies
npm audit
npm outdated
```

**Step 2: Gradual Rollout**
```bash
# Deploy to staging
npm run deploy:staging

# Run smoke tests
npm run test:smoke

# Deploy to production (blue-green)
npm run deploy:production
```

**Step 3: Post-deployment Verification**
```bash
# Health check
curl https://production-domain/api/health

# Test endpoint with sample request
curl -X POST https://production-domain/api/generate-questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "sectionContent": "Test content for deployment verification",
    "gradeLevel": "4-5",
    "sectionIndex": 0
  }'

# Monitor metrics for 15 minutes
watch -n 30 'curl -s https://monitoring-dashboard/api/metrics'
```

### Rollback Procedures

**Immediate Rollback (< 2 minutes)**
```bash
# Disable feature flag
export QTI_SPLIT_GENERATION_ENABLED=false
pm2 restart teaching-tales
```

**Code Rollback (< 10 minutes)**  
```bash
# Rollback to previous version
git checkout previous-stable-tag
npm run deploy:production --force

# Verify rollback success
curl https://production-domain/api/health
```

**Database Rollback (< 30 minutes)**
```bash
# If database changes were made
npm run db:rollback --to=previous-migration
```

---

## Capacity Planning & Scaling

### Current Capacity Specs

**Single Instance:**
- **CPU**: 2 vCPU
- **Memory**: 4GB RAM
- **Concurrent Requests**: ~100
- **Response Time**: < 5s (95th percentile)

**Horizontal Scaling Triggers:**
- CPU > 70% for 5 minutes
- Memory > 80% for 5 minutes  
- Request queue > 50 pending requests

### Auto-scaling Configuration

```yaml
# Kubernetes HPA example
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: generate-questions-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: teaching-tales-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource  
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Load Testing

**Regular Load Test (Weekly)**
```bash
# Using Artillery.js
npm run load-test:normal

# Expected results:
# - 95th percentile < 5s
# - 0% error rate
# - Memory stable < 2GB
```

**Stress Test (Monthly)**
```bash
# Peak load simulation
npm run load-test:peak

# Capacity limits:
# - Max concurrent users: 500
# - Max requests/minute: 1000
# - Graceful degradation > 1000 rpm
```

### Capacity Alerts

**Approaching Limits**
- CPU > 60% for 10 minutes → Scale up warning
- Memory > 70% for 10 minutes → Scale up warning  
- Response time > 8s → Performance warning

**At Limits**
- CPU > 80% for 5 minutes → Scale up immediately
- Memory > 90% for 5 minutes → Scale up immediately
- Error rate > 5% → Investigate capacity issues

---

## Security Operations

### Security Monitoring

**Authentication Anomalies**
- Multiple auth failures from same IP
- Unusual token usage patterns
- Geographic anomalies in access

**Request Anomalies**  
- Unusual request sizes or patterns
- High frequency requests from single user
- Suspicious content in requests

**System Security**
- Unauthorized configuration changes
- Unusual system resource usage
- Network traffic anomalies

### Security Incident Response

**Step 1: Identify Threat Level**
- **Low**: Single suspicious request
- **Medium**: Pattern of suspicious activity  
- **High**: Active attack or breach attempt

**Step 2: Immediate Actions (High Threat)**
```bash
# Block suspicious IP addresses
iptables -A INPUT -s suspicious.ip.address -j DROP

# Disable compromised user tokens
# (coordinate with TimeBack team)

# Enable additional logging
export LOG_LEVEL=debug
```

**Step 3: Investigation**
- Review request logs for attack patterns
- Check system logs for unauthorized access
- Coordinate with security team
- Document findings for post-mortem

### Regular Security Tasks

**Daily**
- [ ] Review authentication failure logs
- [ ] Check for unusual traffic patterns
- [ ] Verify security monitoring alerts

**Weekly**  
- [ ] Review access logs for anomalies
- [ ] Update security signatures
- [ ] Test security incident procedures

**Monthly**
- [ ] Security audit of logs and procedures
- [ ] Penetration testing results review
- [ ] Update security runbooks

---

## Data Protection & Privacy

### PII Handling

**Data Classification:**
- **Public**: Story content, grade levels
- **Internal**: User IDs, request metadata  
- **Restricted**: User emails (redacted in logs)
- **Confidential**: Authentication tokens

**Log Sanitization:**
```javascript
// Automatic PII redaction in logs
const sanitizeForLogging = (data) => ({
  ...data,
  userEmail: data.userEmail?.replace(/.+@/, '***@'),
  studentId: data.studentId?.replace(/.{3}$/, '***'),
  authToken: '***'
});
```

### Data Retention

**Logs**: 90 days retention
**Metrics**: 2 years retention  
**Error Reports**: 1 year retention
**Audit Trails**: 7 years retention

### Compliance Requirements

**COPPA (Children's Online Privacy)**
- No collection of personal information from children under 13
- PII redaction in all logs
- Secure token handling

**GDPR (European Users)**
- Right to data deletion support
- Data processing transparency
- Breach notification procedures

---

## Maintenance & Updates

### Regular Maintenance Schedule

**Daily (Automated)**
- Log rotation and cleanup
- Metrics aggregation
- Health check validation
- Backup verification

**Weekly**
- Performance review
- Security log analysis  
- Dependency updates (patch level)
- Capacity planning review

**Monthly**
- Security audit
- Performance optimization review
- Dependency updates (minor versions)
- Disaster recovery testing

**Quarterly**
- Major dependency updates
- Infrastructure review
- Security penetration testing
- Full disaster recovery drill

### Update Procedures

**Security Updates (Priority 1)**
```bash
# Apply immediately, minimal testing
npm update package-name
npm run test:critical
npm run deploy:production --emergency
```

**Bug Fixes (Priority 2)**
```bash
# Standard deployment process
npm run test:all
npm run deploy:staging
# Manual verification
npm run deploy:production
```

**Feature Updates (Priority 3)**
```bash
# Full testing cycle
npm run test:all
npm run load-test
# Staging deployment + validation
# Gradual production rollout
```

---

*This operations guide provides comprehensive monitoring, alerting, and incident response procedures for the Questions Generation API. Update this document as the service evolves.*
