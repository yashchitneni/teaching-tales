# Phase 4 → Phase 5 Interface Contract

**Document Version**: 1.0  
**Phase 4 Status**: ✅ Complete  
**Phase 5 Status**: Ready for Implementation  

## Overview

This document defines the **stable interface contract** that Phase 4 provides for Phase 5 story save orchestration. Phase 5 will use these methods to implement async story saving with split question generation and assessment creation.

---

## 1. Assessment Creation Service

### Primary Method: `createSectionAssessmentsFromQuestions`

```typescript
AssessmentService.createSectionAssessmentsFromQuestions(
  inputs: SectionAssessmentInput[]
): Promise<SectionAssessmentResult[]>
```

**Purpose**: Create QTI assessment tests from pre-generated questions  
**Phase 5 Usage**: Called after all sections have questions generated via Phase 3 API

#### Input Interface: `SectionAssessmentInput`

```typescript
interface SectionAssessmentInput {
  /** Zero-based index of this section in the story */
  sectionIndex: number;
  /** The story content for this section */
  sectionContent: string;
  /** Enhanced questions from Phase 3 API */
  questions: EnhancedComprehensionQuestion[];
  /** Story and assessment metadata */
  metadata: {
    /** Unique story identifier */
    storyId: string;
    /** Optional stimulus ID - may be created later */
    stimulusId?: string;
    /** Story title for assessment naming */
    storyTitle: string;
    /** Story universe context */
    universe: string;
    /** Story character */
    character: string;
    /** Story premise/spark */
    spark: string;
    /** Target grade level */
    gradeLevel: string;
    /** Student identifier */
    studentId: string;
  };
}
```

#### Output Interface: `SectionAssessmentResult`

```typescript
interface SectionAssessmentResult {
  /** Section index this assessment was created for */
  sectionIndex: number;
  /** Generated assessment ID */
  assessmentId: string;
  /** Complete assessment test response */
  assessmentTest: AssessmentTestResponse;
  /** ISO timestamp when assessment was created */
  createdAt: string;
  /** Assessment creation metadata */
  metadata: {
    /** Number of questions in this assessment */
    questionCount: number;
    /** Time spent generating questions (0 for async - already generated) */
    generationTimeMs: number;
    /** Time spent creating QTI assessment */
    qtiCreationTimeMs: number;
  };
}
```

---

## 2. API Integration Helper

### Method: `prepareSectionAssessmentFromAPI`

```typescript
AssessmentService.prepareSectionAssessmentFromAPI(
  apiResponse: SectionQuestionsResult,
  sectionContent: string, 
  metadata: SectionAssessmentInput['metadata']
): SectionAssessmentInput
```

**Purpose**: Convert Phase 3 `/api/generate-questions` output to Phase 4 input format  
**Phase 5 Usage**: Bridge between Phase 3 question generation and Phase 4 assessment creation

#### Integration Pattern for Phase 5

```typescript
// Phase 5 Orchestration Example
async function saveStoryWithAsyncAssessments(story: StoryData): Promise<SaveStoryResult> {
  // 1. Save story stimulus first
  const stimulus = await StoryStorageService.saveStory(story);
  
  // 2. Generate questions for each section (Phase 3)
  const questionPromises = story.sections.map(section => 
    fetch('/api/generate-questions', {
      method: 'POST',
      body: JSON.stringify({
        sectionContent: section.content,
        sectionIndex: section.index,
        gradeLevel: story.gradeLevel
      })
    }).then(res => res.json())
  );
  
  const questionResults = await Promise.all(questionPromises);
  
  // 3. Convert to Phase 4 input format
  const assessmentInputs = questionResults.map(apiResponse => 
    AssessmentService.prepareSectionAssessmentFromAPI(
      apiResponse,
      story.sections[apiResponse.sectionIndex].content,
      {
        storyId: stimulus.id,
        stimulusId: stimulus.id,
        storyTitle: story.title,
        universe: story.universe,
        character: story.character,
        spark: story.spark,
        gradeLevel: story.gradeLevel,
        studentId: story.studentId
      }
    )
  );
  
  // 4. Create assessments using Phase 4
  const assessmentResults = await AssessmentService.createSectionAssessmentsFromQuestions(assessmentInputs);
  
  return {
    stimulus,
    assessments: assessmentResults,
    totalSections: story.sections.length,
    createdAt: new Date().toISOString()
  };
}
```

---

## 3. Error Handling Strategy

### Current Phase 4 Behavior
- **Transactional Integrity**: All sections succeed or all fail
- **Detailed Error Messages**: Specific validation errors with context
- **Fail-Fast**: Feature flag and validation errors throw immediately

### Phase 5 Considerations

**Option A: Maintain Transactional Integrity (Recommended)**
```typescript
// All assessments created or none
try {
  const assessments = await AssessmentService.createSectionAssessmentsFromQuestions(allInputs);
  // All succeeded - proceed with story save completion
} catch (error) {
  // All failed - rollback story creation or mark as incomplete
  throw new StoryOrchestrationError('Assessment creation failed', { cause: error });
}
```

**Option B: Partial Failure Handling (Advanced)**
```typescript
// Phase 5 could implement section-by-section creation for partial failure handling
const results = [];
const failures = [];

for (const input of assessmentInputs) {
  try {
    const result = await AssessmentService.createSectionAssessmentsFromQuestions([input]);
    results.push(result[0]);
  } catch (error) {
    failures.push({ sectionIndex: input.sectionIndex, error });
  }
}

// Handle partial success/failure as needed
```

### Error Types to Handle

1. **Feature Flag Errors**: `QTI_ASYNC_ASSESSMENTS_ENABLED=false`
2. **Validation Errors**: Invalid input data, missing required fields
3. **QTI Service Errors**: External API failures, network issues
4. **Phase 3 Integration Errors**: Malformed question data from `/api/generate-questions`

---

## 4. Performance Characteristics

### Timing Expectations

**Per-Section Assessment Creation**: ~500-800ms average
- Question processing: ~50-100ms
- QTI API call: ~300-500ms  
- Validation & metadata: ~50-100ms

**Multi-Section Creation**: Scales linearly
- 5 sections: ~2.5-4 seconds total
- 10 sections: ~5-8 seconds total

### Performance Monitoring

**Built-in Metrics**: Automatic performance logging for:
- Individual section creation time
- Overall operation duration
- Question processing statistics
- QTI API response times

**External Integration Hooks**:
```typescript
// Global monitoring service (if available)
global.monitoringService?.trackPerformance('assessment-service', {
  operation: 'createSectionAssessmentsFromQuestions',
  phase: 'phase-4',
  durationMs: 1234,
  totalSections: 5,
  avgTimePerSection: 247
});

// Client-side analytics (if available)
window.analytics?.track('Assessment Service Performance', {
  operation: 'createSectionAssessmentsFromQuestions',
  phase: 'phase-4',
  durationMs: 1234
});
```

---

## 5. Feature Flag Integration

### Phase 5 Requirements

**Feature Flag Check**: Phase 5 MUST verify `QTI_ASYNC_ASSESSMENTS_ENABLED=true` before using Phase 4 methods

```typescript
import { FEATURE_FLAGS } from '@/lib/config';

if (!FEATURE_FLAGS.QTI_ASYNC_ASSESSMENTS_ENABLED) {
  // Fall back to existing sync story save or throw error
  throw new Error('Async assessment creation is not enabled');
}
```

### Deployment Strategy

**Recommended Rollout**:
1. **Phase 5 Implementation**: Complete with feature flag checks
2. **Development Testing**: Enable both Phase 3 and Phase 4 flags
3. **Staging Validation**: Test full pipeline with realistic data
4. **Production Gradual Rollout**: Enable flags progressively
5. **Monitoring & Rollback**: Monitor performance and error rates

---

## 6. Data Compatibility

### Question Format Compatibility

**Supports Both Formats**:
- **Legacy**: `ComprehensionQuestion` (basic format)
- **Enhanced**: `EnhancedComprehensionQuestion` (with metadata)

```typescript
// Enhanced questions include additional fields
interface EnhancedComprehensionQuestion extends ComprehensionQuestion {
  questionType?: 'comprehension' | 'vocabulary' | 'inference';
  difficultyLevel?: number; // 1-5 scale
  validationMetadata?: {
    validationPassed: boolean;
    warnings?: string[];
    hasTextEvidence?: boolean;
  };
}
```

### Assessment Versioning

**Version Metadata**: Phase 4 assessments include `version: '2.0'` to distinguish from sync-created assessments (`version: '1.0'`)

**Identification Fields**:
```typescript
// Phase 4 assessment metadata includes
{
  generationMethod: 'async-split',
  createdWithPhase: 'phase-4',
  assessmentType: 'section-comprehension-async',
  questionGenerationAPI: '/api/generate-questions',
  version: '2.0'
}
```

---

## 7. Testing & Validation

### Integration Testing Requirements

**Phase 5 Should Test**:
1. **End-to-End Flow**: Story save → question generation → assessment creation
2. **Error Handling**: Network failures, invalid data, feature flag disabled
3. **Performance**: Multi-section stories, large question sets
4. **Partial Failures**: Individual section failures (if implementing Option B)
5. **Feature Flag States**: Enabled/disabled scenarios

### Test Utilities Available

**Existing Test Helpers** (from Phase 4):
```typescript
// Mock data generators
import { mockSectionAssessmentInput, mockEnhancedQuestions } from '@/lib/services/__tests__/assessment-service-async.test';

// Integration test patterns  
import { phase3ToPhase4Integration } from '@/lib/services/__tests__/phase3-phase4-integration.test';
```

---

## 8. Monitoring & Observability

### Metrics to Track in Phase 5

**Story Save Orchestration**:
- Total story save time (including assessment creation)
- Success/failure rates per section
- Phase 3 → Phase 4 handoff latency
- Overall pipeline success rates

**Assessment Creation Performance**:
- Time per section (available in `SectionAssessmentResult.metadata`)
- Question processing efficiency
- QTI API response times
- Error rates by error type

### Logging Strategy

**Structured Logging**: Use consistent log format for Phase 5 operations
```typescript
console.log('📚 StoryOrchestration.saveStoryAsync', {
  operation: 'saveStoryAsync',
  storyId: story.id,
  totalSections: story.sections.length,
  phase: 'phase-5',
  durationMs: totalTime,
  assessmentResults: results.length
});
```

---

## 9. Backward Compatibility

### Coexistence Requirements

**Phase 5 MUST**:
- Not interfere with existing sync story save functionality
- Allow both sync and async methods to be used in the same application
- Provide graceful fallback when async features are disabled

### Migration Strategy

**Gradual Migration**:
1. Phase 5 implements async path alongside existing sync path
2. Feature flags control which path is used
3. Both paths remain available during transition period
4. Eventual sunset of sync path after validation

---

## 10. Security Considerations

### Input Validation

**Phase 5 Responsibilities**:
- Validate story data before passing to Phase 4
- Ensure student IDs are properly authenticated
- Sanitize content before question generation

**Phase 4 Guarantees**:
- Comprehensive input validation for all assessment creation
- Protection against malformed question data
- Secure handling of story metadata

### Data Privacy

**Assessment Creation**: No sensitive data is logged in performance monitoring  
**Student Information**: Student IDs are included in metadata but not exposed in logs  
**Content Security**: Story content is processed but not permanently stored by Phase 4

---

## 11. Support & Troubleshooting

### Common Integration Issues

**Feature Flag Not Enabled**:
```
Error: Async assessment creation is not enabled
Solution: Set QTI_ASYNC_ASSESSMENTS_ENABLED=true
```

**Invalid Question Format**:
```  
Error: Invalid question structure at index N
Solution: Verify Phase 3 API returns EnhancedComprehensionQuestion format
```

**QTI Service Unavailable**:
```
Error: Failed to create assessment for section N: QTI service connection failed  
Solution: Check TIMEBACK_API_URL and service availability
```

### Debug Information

**Performance Debugging**: Phase 4 includes detailed timing information in results  
**Error Context**: All errors include section index and story ID for tracing  
**Monitoring Hooks**: External monitoring integration available for production debugging

---

## 12. Version Compatibility

**Phase 4 Version**: 2.0 (stable)  
**Minimum Phase 3 Version**: Must support `/api/generate-questions` endpoint  
**Next.js Compatibility**: 14.x+  
**Node.js Compatibility**: 18.x+  

---

**This interface contract is stable and ready for Phase 5 implementation. All methods, types, and behaviors documented here are tested and production-ready.**
