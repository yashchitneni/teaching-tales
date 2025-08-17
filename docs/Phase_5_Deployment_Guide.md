# Phase 5 Deployment Guide
**Async Story Save with Background Question Generation**

## Overview

Phase 5 introduces **async story save orchestration** that transforms the user experience by displaying stories instantly while questions generate in the background. This guide covers the complete deployment process for a safe, successful rollout.

## Pre-Deployment Checklist

### Prerequisites
- [ ] Phase 0-4 deployed and stable ✅
- [ ] `QTI_SPLIT_GENERATION_ENABLED=true` working in production ✅
- [ ] `QTI_ASYNC_ASSESSMENTS_ENABLED=true` working in production ✅  
- [ ] All Phase 5 integration tests passing ✅
- [ ] Performance benchmarks validated (story save <2s) ✅

### Code Review Checklist
- [ ] `BackgroundQuestionService` reviewed and approved
- [ ] `StoryStorageService` async methods reviewed and approved
- [ ] API endpoints security validated
- [ ] UI components handle all async states gracefully
- [ ] Error handling covers all failure scenarios
- [ ] Performance monitoring hooks integrated

## Environment Variables

Add to all environments (development, staging, production):

```bash
# Phase 5 - Async Story Save
QTI_ASYNC_STORY_SAVE_ENABLED=false  # Start with false, enable gradually
```

### Required Dependencies
Ensure these are already enabled from previous phases:
```bash
# Phase 3 - Required
QTI_SPLIT_GENERATION_ENABLED=true

# Phase 4 - Required  
QTI_ASYNC_ASSESSMENTS_ENABLED=true
```

## Deployment Strategy

### Stage 1: Deploy Code (Flag OFF) ⏳ 1-2 hours
**Objective**: Deploy Phase 5 code with async features disabled

1. **Deploy Application**
   - Ensure `QTI_ASYNC_STORY_SAVE_ENABLED=false` in all environments
   - Deploy all Phase 5 code (services, API endpoints, UI components)
   - Verify application starts successfully

2. **Smoke Testing**
   - Create test stories using existing sync flow
   - Verify no regressions in story creation time
   - Confirm all existing functionality works unchanged
   - Test new API endpoint returns appropriate responses for sync stories

3. **Validation Criteria**
   - [ ] Zero increase in story creation failure rates
   - [ ] No change in average story creation time (still 10-15s)
   - [ ] All existing UI components function normally
   - [ ] Question status API responds correctly for sync stories

### Stage 2: Enable in Development ⏳ 2-4 hours  
**Objective**: Validate async functionality in development environment

1. **Enable Flag**
   ```bash
   QTI_ASYNC_STORY_SAVE_ENABLED=true
   ```

2. **Functional Testing**
   - Create multiple test stories across different universes
   - Verify stories appear in <2 seconds
   - Watch questions generate in background (check browser network tab)
   - Test UI loading states appear correctly
   - Verify questions populate when ready
   - Test error scenarios (manually cause question generation failures)

3. **Integration Validation**
   - Test with OneRoster enabled/disabled
   - Verify different grade levels work
   - Test concurrent story creation
   - Validate job cleanup works properly

4. **Success Criteria**
   - [ ] Story creation consistently <2 seconds
   - [ ] Questions appear within 30-60 seconds
   - [ ] UI shows appropriate loading states
   - [ ] Error handling graceful (stories still work when questions fail)

### Stage 3: Enable in Staging ⏳ 4-6 hours
**Objective**: Production-like validation with comprehensive testing

1. **Enable Flag**
   ```bash
   QTI_ASYNC_STORY_SAVE_ENABLED=true
   ```

2. **Load Testing**
   - Create 50+ stories in 10 minutes
   - Test concurrent user scenarios
   - Validate background processing doesn't overwhelm system
   - Monitor memory usage for background jobs

3. **End-to-End Validation**
   - Complete user journeys from story creation to question answering
   - Test all supported universes and grade levels
   - Validate assessment submission still works correctly
   - Test story retrieval at different stages of question generation

4. **Performance Validation**
   - Average story save time <2s (target: <1.5s)
   - Question generation success rate >95%
   - Background job completion rate >95%
   - No memory leaks from job tracking

5. **Success Criteria**
   - [ ] Passes all existing E2E test suites
   - [ ] Performance meets or exceeds targets
   - [ ] No increase in error rates
   - [ ] Background processing stable under load

### Stage 4: Gradual Production Rollout ⏳ 1-2 weeks
**Objective**: Safe rollout to production users with monitoring

#### Week 1: Internal Testing (25% Traffic)
1. **Enable for Internal Users**
   - Use feature flags or cookies to enable for team members
   - Monitor real usage patterns
   - Gather feedback on UX improvements

2. **Monitor Key Metrics**
   - Story creation latency (should improve dramatically)
   - Question generation success rates
   - User engagement with questions  
   - Error rates in background processing
   - Memory usage trends

3. **Success Criteria**  
   - [ ] Internal team reports positive experience
   - [ ] No critical errors in background processing
   - [ ] Performance improvements confirmed

#### Week 2: Expand to 50% Traffic
1. **Gradual Expansion**
   - Expand to subset of production users
   - Continue monitoring all metrics
   - Watch for any unusual patterns

2. **User Experience Validation**
   - Monitor user engagement patterns
   - Track story completion rates
   - Watch for increased/decreased question answering

#### Week 3-4: Full Rollout (100% Traffic)
1. **Complete Rollout**
   - Enable `QTI_ASYNC_STORY_SAVE_ENABLED=true` for all users
   - Continue monitoring for 1 week
   - Document lessons learned

## Rollback Plan

### Immediate Rollback (if critical issues arise)
```bash
# Emergency rollback - toggle flag to false
QTI_ASYNC_STORY_SAVE_ENABLED=false
```

**Rollback Impact Assessment**:
- ✅ **No data loss**: Existing async stories remain readable
- ✅ **Immediate effect**: New stories use proven sync path
- ✅ **User experience**: Slight slowdown but reliable functionality
- ✅ **Zero downtime**: No application restart required

### Rollback Scenarios
1. **High background job failure rates (>10%)**
   - Immediate flag rollback
   - Investigate job processing issues
   - Fix and redeploy before re-enabling

2. **Memory leaks or performance degradation**
   - Immediate flag rollback
   - Analyze memory usage patterns
   - Implement fixes for job cleanup

3. **User experience issues**
   - Collect specific feedback
   - May require partial rollback or UI fixes
   - Address issues before continuing rollout

## Monitoring During Rollout

### Key Metrics to Track

#### Performance Metrics
- **Story Creation Latency**: Target <2s average (was 10-15s)
- **Question Generation Time**: Target <60s average
- **Background Job Success Rate**: Target >95%
- **API Response Times**: Should remain stable

#### User Experience Metrics  
- **Story Completion Rate**: Should maintain or improve
- **Question Answering Rate**: Should maintain baseline
- **User Session Duration**: May increase due to instant stories

#### System Health Metrics
- **Background Job Queue Depth**: Monitor for buildup
- **Memory Usage**: Watch for leaks in job tracking
- **Error Rates**: Overall application errors should not increase

### Monitoring Tools Setup
1. **Application Logs**
   - Filter for `phase-5` and `async` operations
   - Monitor structured logging output
   - Set up alerts for error patterns

2. **Performance Dashboards**
   - Story creation latency trends
   - Background processing throughput
   - Memory usage over time

3. **User Analytics** (if available)
   - Story creation frequency
   - Question engagement rates
   - User flow completion

## Success Criteria

### Technical Success
- [ ] Story creation time reduced by 5-10x (from 10-15s to <2s)
- [ ] Question generation success rate >95%
- [ ] Zero increase in story save failure rates
- [ ] Background processing completes for >95% of stories
- [ ] Memory usage remains stable (no leaks)

### User Experience Success
- [ ] Users can read stories immediately
- [ ] Questions appear smoothly without disrupting reading
- [ ] Error states are handled gracefully
- [ ] Overall user engagement maintains or improves

### Business Success
- [ ] Reduced user abandonment during story creation
- [ ] Increased story completion rates
- [ ] Maintained or improved question answering rates
- [ ] Positive user feedback on speed improvements

## Troubleshooting Guide

### Common Issues

#### "Stories created but no questions appearing"
**Symptoms**: Stories load instantly but questions never populate
**Diagnosis**: Check background job status API
**Solutions**:
1. Verify all 3 feature flags are enabled
2. Check AI service connectivity
3. Monitor background job error logs
4. Restart background processing if needed

#### "High memory usage after deployment"
**Symptoms**: Gradual memory increase over time  
**Diagnosis**: Background job map not cleaning up
**Solutions**:
1. Verify `cleanupOldJobs()` is being called
2. Check job retention policies
3. Consider implementing Redis for job storage

#### "Slow story creation after enabling flag"  
**Symptoms**: Stories taking >5s to appear
**Diagnosis**: Async path has unexpected bottlenecks
**Solutions**:
1. Check stimulus creation performance
2. Verify database connection pool
3. Monitor API gateway latency

### Emergency Contacts
- **Primary**: Phase 5 implementation team
- **Secondary**: DevOps/SRE for infrastructure issues  
- **Escalation**: Engineering leadership for business impact

## Post-Deployment Activities

### Week 1 After Full Rollout
- [ ] Comprehensive performance review
- [ ] User feedback collection and analysis
- [ ] Documentation of lessons learned
- [ ] Optimization opportunities identification

### Month 1 Follow-up
- [ ] Background job cleanup implementation for production
- [ ] Performance optimizations based on usage patterns
- [ ] Planning for Phase 6+ enhancements

## Next Steps (Phase 6+)

Based on Phase 5 success, consider:
- **UI Polish**: Question notification system, progress indicators
- **Performance Optimization**: Question caching, batch generation  
- **Advanced Features**: Partial question loading, difficulty adaptation

---

**Phase 5 represents a foundational shift in Teaching Tales architecture - from synchronous blocking operations to asynchronous user-centric design. This deployment guide ensures a safe, successful transition that dramatically improves user experience while maintaining system reliability.**
