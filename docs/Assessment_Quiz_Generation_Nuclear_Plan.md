### Assessment Question Generation – Nuclear Plan Decision

#### Context & Problem
- **Issue**: Assessments intermittently fail to recognize correct answers (answer-key mismatches and/or item-context drift).
- **Goal**: Increase correctness and alignment between questions and the exact story text students read.

#### Current State (As Implemented Today)
- **Single-pass generation**: Story text and per-section questions are produced together in one AI prompt.
  - Source: `src/lib/ai/prompt-templates.ts` (sections include `questions` in the output format)
  - Entry: `src/app/api/generate-story/route.ts` (calls `StoryGenerationService.generateStory`)
- **Storage**:
  - Story is stored as a QTI Stimulus (JSON), with questions stripped from sections before save:
    - `src/lib/services/story-storage-service.ts` → builds `CreateStimulusRequest`, sets `contentText` to sections-only, and removes `questions`.
  - Per-section assessments are created from the generated questions and saved to the TimeBack QTI API:
    - `src/lib/services/assessment-service.ts` → `createStoryAssessments()` → client call `POST /api/ims/qti/v3p0/assessment-tests`
- **Answer submission & scoring**:
  - Client posts answers: `POST /api/ims/qti/v3p0/responses` (proxied upstream)
    - `src/lib/services/response-storage-service.ts` and `src/lib/services/enhanced-response-handler.ts`
  - Local immediate feedback uses `QTIResponseProcessor` before/alongside backend persistence.
- **QTI proxy and base URL**:
  - All IMS QTI calls proxy through Next:
    - `src/app/api/ims/qti/v3p0/[...endpoint]/route.ts` → `${NEXT_PUBLIC_TIMEBACK_API_URL}/ims/qti/v3p0/...`
  - Env wiring:
    - `NEXT_PUBLIC_TIMEBACK_API_URL` (dev/local default `http://localhost:8080`)
    - Production is set in `sst.config.ts` to `https://core.timebackapi.com`.

#### Decision: Nuclear Split of Generation
- **What**: Decouple into two distinct steps:
  1) Generate the story sections only.
  2) For each section, generate multiple-choice questions using a prompt that takes the exact section text (plus grade level, constraints), then store them as assessment tests.
- **Why**: Ensures each question set is grounded in the final section text, eliminating common mismatches and improving correctness.

#### Implementation Outline (High-Level)
- **New server endpoint**: `/api/generate-questions`
  - Input: `{ sectionContent, sectionIndex, gradeLevel, questionCount/type constraints, storyMetadata }`
  - Output: Canonical MCQs with deterministic answer keys.
- **Prompting**: Add a questions-only template (e.g., `PromptTemplates.generateQuestionsForSection(...)`) to enforce:
  - Options list, single correct index, explicit explanation sourced from section text.
- **Storage flow update**:
  1) Save stimulus (story-only) via `StoryStorageService.saveStory`.
  2) For each section, call `/api/generate-questions`.
  3) Persist questions per section as assessment tests:
     - `POST /api/ims/qti/v3p0/assessment-tests` (via `qti-client.ts`)
  4) Update stimulus metadata linking created assessment IDs.
- **UI behavior**:
  - Allow reading to start once story is saved; progressively load/render questions as assessments become available.

#### Endpoint Mapping (Authoritative)
- **Create questions (assessments)**: `POST /api/ims/qti/v3p0/assessment-tests`
- **Submit answers**: `POST /api/ims/qti/v3p0/responses`
- **Upstream base**: `${NEXT_PUBLIC_TIMEBACK_API_URL}/ims/qti/v3p0/...` via the proxy in `src/app/api/ims/qti/v3p0/[...endpoint]/route.ts`

#### Pros
- **Alignment**: Questions explicitly reference final section text → better answer-key integrity.
- **Isolation & retries**: Regenerate/fix a weak section’s questions without touching story.
- **Quality controls**: Per-section validation (evidence-in-text checks, difficulty, Bloom’s level, etc.).
- **Scalability**: Different question policies per section (counts, types) are easier to manage.

#### Cons
- **Latency & cost**: Multiple AI calls (one per section) vs single pass.
- **Complexity**: New endpoint, orchestration, and progressive UI states.
- **Partial state**: Story may be visible before all assessments are ready (requires graceful loading).

#### Alternatives Considered
- **A. Keep single-pass; add verification/repair step**
  - Run a second AI pass to validate each question against section text; fix answer indices/mappings.
  - Pros: Fewer calls than full split; smaller surface change. Cons: Still tied to combined prompt; residual drift risk.
- **B. First-class QTI items**
  - Create real QTI `assessment-items` per question and attach to tests (beyond `metadata.questions`).
  - Pros: Stronger scoring semantics; interoperability. Cons: Heavier implementation; upstream item APIs must be ready.
- **C. Local authority on correctness**
  - Always use local `QTIResponseProcessor` as ground truth for correctness; post upstream for persistence/analytics only.
  - Pros: Deterministic UX; resilient to upstream variations. Cons: Requires tight parity with item definitions.

#### Risks & Mitigations
- **Higher API usage/cost**: Batch generation and reuse caching (idempotent inputs), parallelize where safe.
- **Race conditions**: Gate UI rendering of quizzes until their assessments exist; poll or subscribe for readiness.
- **Answer-key drift**: Enforce schema with explicit `correct` index and evidence strings; validate before save.

#### Success Criteria
- Questions per section reliably mark correct/incorrect in both local processor and upstream results.
- Significant drop in mismatched or unrecognized-answer incidents in logs.
- Round-trip (generate → store → answer → score) is consistent across environments.

#### Feature Flag Configuration
- **Server-side flag**: `QTI_SPLIT_GENERATION_ENABLED` (default: `false`)
  - Controls server-side split generation logic
  - Set via environment variable or `sst.config.ts`
  - Access: `FEATURE_FLAGS.QTI_SPLIT_GENERATION_ENABLED` in `src/lib/config.ts`
- **Phase 4 flag**: `QTI_ASYNC_ASSESSMENTS_ENABLED` (default: `false`)
  - Controls async assessment creation methods in Phase 4
  - Requires `QTI_SPLIT_GENERATION_ENABLED=true`
  - Access: `FEATURE_FLAGS.QTI_ASYNC_ASSESSMENTS_ENABLED` in `src/lib/config.ts`
- **Phase 5 flag**: `QTI_ASYNC_STORY_SAVE_ENABLED` (default: `false`)
  - Controls async story save orchestration - stories display instantly while questions generate in background
  - Requires both `QTI_SPLIT_GENERATION_ENABLED=true` and `QTI_ASYNC_ASSESSMENTS_ENABLED=true`
  - Benefits: 5-10x faster story creation, immediate user experience, better error isolation
  - Access: `FEATURE_FLAGS.QTI_ASYNC_STORY_SAVE_ENABLED` in `src/lib/config.ts`
- **Client-side flag**: `NEXT_PUBLIC_QTI_SPLIT_GENERATION` (default: `false`)
  - Controls client-side UI features (progressive loading, indicators)
  - Set via environment variable or `sst.config.ts`
  - Access: `CLIENT_FEATURE_FLAGS.QTI_SPLIT_GENERATION` in `src/lib/config.ts`

#### Flag Usage Instructions
**Local Development:**
```bash
# Phase 3: Enable split generation for testing
QTI_SPLIT_GENERATION_ENABLED=true npm run dev

# Phase 4: Enable async assessments (requires Phase 3)
QTI_SPLIT_GENERATION_ENABLED=true QTI_ASYNC_ASSESSMENTS_ENABLED=true npm run dev

# Phase 5: Enable full async story save (requires Phase 3 & 4)
QTI_SPLIT_GENERATION_ENABLED=true QTI_ASYNC_ASSESSMENTS_ENABLED=true QTI_ASYNC_STORY_SAVE_ENABLED=true npm run dev

# Enable client UI features
NEXT_PUBLIC_QTI_SPLIT_GENERATION=true npm run dev
```

**Production Deployment:**
- Flags are controlled in `sst.config.ts`
- Default to `false` for safety
- Can be toggled without code deployment

#### Rollout Strategy (Feature Flag Gated)
**Phase 1 - Development & Testing:**
- Implement behind `QTI_SPLIT_GENERATION_ENABLED=false` (no behavior change)
- Local testing with flags enabled
- Staging environment validation

**Phase 2 - Controlled Rollout:**
- Enable for internal users/testing accounts
- Monitor metrics and error rates
- Gradual expansion based on stability

**Phase 3 - Full Deployment:**
- Enable flags in production after validation
- Monitor correctness improvements
- Keep rollback option via flag toggle

#### Rollback Strategy
- **Instant rollback**: Toggle flags to `false` without code deployment
- **No data loss**: Both paths use same storage format and endpoints
- **Graceful degradation**: UI falls back to current behavior when flags disabled
- **Monitoring**: Track error rates and correctness metrics for quick detection

#### Rollout Plan (Incremental)
1) Add `/api/generate-questions` and `PromptTemplates.generateQuestionsForSection` (flag-gated).
2) Wire `StoryStorageService.saveStory` to call per-section question generation (flag-gated).
3) Update UI to handle progressive assessment availability (flag-gated).
4) Enable flags for testing; monitor analytics for correctness improvements.
5) Gradual production rollout with instant rollback capability via flags.
6) Evaluate moving to first-class QTI items (alternative B) once stable.

---

## Phase 4: Assessment Creation Variant (✅ Complete)

**Status**: ✅ Implemented & Tested  
**Purpose**: Async assessment creation from split-generated questions  
**Feature Flag**: `QTI_ASYNC_ASSESSMENTS_ENABLED`

### Overview

Phase 4 creates a **parallel assessment creation pathway** that works with async-generated questions from Phase 3's `/api/generate-questions` endpoint, while preserving all existing synchronous functionality.

### New Methods Added

#### AssessmentService.createSectionAssessmentsFromQuestions()
```typescript
// Create assessments from pre-generated questions (Phase 4)
static async createSectionAssessmentsFromQuestions(
  inputs: SectionAssessmentInput[]
): Promise<SectionAssessmentResult[]>
```

**Purpose**: Create QTI assessment tests from async-generated questions  
**Input**: Array of sections with pre-generated questions from Phase 3 API  
**Output**: Array of created assessment results with performance metrics

#### AssessmentService.prepareSectionAssessmentFromAPI()
```typescript
// Bridge Phase 3 API to Phase 4 input format
static prepareSectionAssessmentFromAPI(
  apiResponse: SectionQuestionsResult,
  sectionContent: string,
  metadata: SectionAssessmentInput['metadata']
): SectionAssessmentInput
```

**Purpose**: Convert Phase 3 `/api/generate-questions` output to Phase 4 input format  
**Integration**: Seamless bridge between phases

### Integration Pattern

```typescript
// Phase 3: Generate questions
const questions = await fetch('/api/generate-questions', {
  method: 'POST',
  body: JSON.stringify({
    sectionContent: section.content,
    sectionIndex: section.index,
    gradeLevel: story.gradeLevel
  })
});

// Phase 4: Create assessments from questions
const assessmentInput = AssessmentService.prepareSectionAssessmentFromAPI(
  questions.data, 
  section.content, 
  storyMetadata
);
const assessments = await AssessmentService.createSectionAssessmentsFromQuestions([assessmentInput]);
```

### Feature Flag Configuration

**Environment Variable**: `QTI_ASYNC_ASSESSMENTS_ENABLED`
- **Default**: `false` (safe for production)
- **Development**: Set to `true` for testing
- **Production**: Enable after Phase 5 integration

```bash
# Enable async assessment creation
QTI_ASYNC_ASSESSMENTS_ENABLED=true

# Existing Phase 3 flag (must remain enabled)
QTI_SPLIT_GENERATION_ENABLED=true
```

### Performance & Monitoring

**Built-in Performance Tracking**:
- Per-section assessment creation timing
- Overall operation metrics
- Rich metadata for observability

**Monitoring Hooks Ready**:
- Global monitoring service integration (`global.monitoringService`)
- Client-side analytics (`window.analytics`)
- Console logging for development

### Enhanced Question Support

**Backward Compatible**: Supports both original `ComprehensionQuestion` and enhanced `EnhancedComprehensionQuestion` formats

**Enhanced Fields Supported**:
- `questionType`: 'comprehension' | 'vocabulary' | 'inference'
- `difficultyLevel`: 1-5 scale
- `validationMetadata`: Quality assurance data

### Deployment Safety

**Non-Breaking Design**:
- ✅ Existing `createStoryAssessments` method unchanged
- ✅ Both sync and async methods coexist safely
- ✅ Feature flag prevents activation until ready
- ✅ Comprehensive test coverage (45+ tests across 3 test files)

**Version Metadata**:
- Sync assessments: `version: '1.0'`
- Async assessments: `version: '2.0'` (distinguishable)

### Phase 5 Integration Ready

**Interface Contract**: Phase 4 provides stable methods for Phase 5 story save orchestration
**Error Handling**: Designed for transactional integrity and partial failure handling
**Scalability**: Built-in performance monitoring for production observability

---

#### References (Key Files)
- **Configuration & flags**: `src/lib/config.ts`, `sst.config.ts`, `docs/Environment_Variables.md`
- **Generation prompt**: `src/lib/ai/prompt-templates.ts`
- **Story generation API**: `src/app/api/generate-story/route.ts`
- **Story save & assessment creation**: `src/lib/services/story-storage-service.ts`, `src/lib/services/assessment-service.ts`
- **QTI client & proxy**: `src/lib/api/qti-client.ts`, `src/app/api/ims/qti/v3p0/[...endpoint]/route.ts`
- **Answer submission & local processing**: `src/lib/services/response-storage-service.ts`, `src/lib/services/enhanced-response-handler.ts`, `src/lib/qti/processors/response-processor.ts`
- **Phase 4 tests**: `src/lib/services/__tests__/assessment-service-async.test.ts`, `src/lib/services/__tests__/phase3-phase4-integration.test.ts`, `src/lib/services/__tests__/backward-compatibility.test.ts`
- **Roadmap documentation**: `docs/Assessment_Quiz_Generation_Roadmap.md`, `docs/Phase_0_Detailed_Roadmap.md`, `docs/Phase_4_Detailed_Roadmap.md`
