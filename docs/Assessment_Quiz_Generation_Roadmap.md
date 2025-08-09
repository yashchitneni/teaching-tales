### Assessment Question Generation — Split Plan Roadmap Checklist

- Reference: `docs/Assessment_Quiz_Generation_Nuclear_Plan.md`
- Objective: Split story generation and question generation, per-section, gated by feature flags, with minimal diffs to avoid conflicts.

---

## Phase 0 — Isolation, flags, and scope ✅ COMPLETE
- [x] Create Git branch `decoupling-questions-from-passage` ✅
- [x] Create Taskmaster tag `feature-split-quiz` (SKIPPED - not needed)
- [x] Add server flag `QTI_SPLIT_GENERATION_ENABLED=false` (default) ✅
- [x] Add client flag `NEXT_PUBLIC_QTI_SPLIT_GENERATION=false` (optional) ✅
- [x] Update decision doc with flags and scope ✅
- [x] Add CHANGELOG entry ✅
- [x] Validate isolation setup ✅

**📋 Detailed Phase 0 roadmap: `docs/Phase_0_Detailed_Roadmap.md`**

Notes
- Keep flags false until rollout; no default behavior change.

---

## Phase 1 — Core types and validation foundation ✅ COMPLETE
- [x] Add types in `src/lib/ai/types.ts`: ✅
  - [x] `SectionQuestionGenInput { sectionContent, sectionIndex, gradeLevel, constraints? }` ✅
  - [x] ~~`GeneratedQuestion`~~ → `EnhancedComprehensionQuestion extends ComprehensionQuestion` ✅ **(OPTIMIZED for integration)**
  - [x] `SectionQuestionsResult { sectionIndex, questions: EnhancedComprehensionQuestion[] }` ✅
- [x] Implement validator in `src/lib/qti/validators/section-question-validator.ts` ✅
  - [x] Bounds check for `correctIndex` ✅
  - [x] Unique, non-empty options ✅
  - [x] Optional evidence-in-text heuristic ✅
- [x] Add unit tests for validator (early feedback loop) ✅
  - [x] Test bounds, duplicates, schema validation ✅

**📋 Detailed Phase 1 roadmap: `docs/Phase_1_Detailed_Roadmap.md` ✅ COMPLETE**

**🎯 Phase 1 Optimization Notes:**
- **Integration-First Approach**: Extended existing `ComprehensionQuestion` instead of creating duplicate `GeneratedQuestion` type
- **Zero Rework**: All enhanced questions compatible with existing `StorySection.questions`  
- **Backward Compatibility**: All existing code continues to work unchanged
- **Phase 2 Ready**: Clear contracts and integration path established

---

## Phase 2 — Questions-only prompt and generation service
- [ ] Implement `PromptTemplates.generateQuestionsForSection(input)` in `src/lib/ai/prompt-templates.ts`
  - [ ] Enforce deterministic JSON schema (single correct index, options length, explanation references section text)
- [ ] Create `src/lib/ai/question-generation-service.ts`
  - [ ] Export `generateQuestionsForSection(input)` with retries/backoff
  - [ ] Integrate validator from Phase 1
- [ ] Add unit tests for prompt and service
  - [ ] Mock AI responses, test validation integration

---

## Phase 3 — Questions generation API endpoint
- [ ] Create `src/app/api/generate-questions/route.ts`
  - [ ] Auth: cookie/bearer; verify via `${NEXT_PUBLIC_TIMEBACK_API_URL}/api/auth/me`
  - [ ] Input: `{ sectionContent, sectionIndex, gradeLevel, storyMetadata, constraints? }`
  - [ ] Use `GeminiClient` + `question-generation-service` from Phase 2
  - [ ] Run validation; return `{ sectionIndex, questions[] }`
  - [ ] Log latency/size; redact PII
- [ ] Integration test for API endpoint
  - [ ] Test auth, validation, error handling

---

## Phase 4 — Assessment creation variant (non-breaking)
- [ ] Add `createSectionAssessmentsFromQuestions(...)` to `src/lib/services/assessment-service.ts`
  - [ ] Build `CreateAssessmentTestRequest` per section from generated questions
  - [ ] Persist via `POST /api/ims/qti/v3p0/assessment-tests` using `src/lib/api/qti-client.ts`
- [ ] Do not modify existing `createStoryAssessments` (avoid churn)
- [ ] Unit tests for new assessment creation method

---

## Phase 5 — Story save orchestration (flag-gated)
- [ ] In `src/lib/services/story-storage-service.ts` update `saveStory`:
  - [ ] If flag off → current behavior (no changes)
  - [ ] If flag on:
    - [ ] Step 1: Create stimulus (sections only)
    - [ ] Step 2: For each section, call `/api/generate-questions` (parallel with concurrency cap)
    - [ ] Step 3: Validate; dedupe; retry once on failure
    - [ ] Step 4: `createSectionAssessmentsFromQuestions` to persist assessments
    - [ ] Step 5: Update stimulus metadata with `assessmentIds`
- [ ] Integration test: full story save flow with flag on/off

---

## Phase 6 — UI progressive availability (flag-gated)
- [ ] In `src/app/book/[bookId]/page.tsx` (no breaking changes):
  - [ ] When flag off: existing behavior unchanged
  - [ ] When flag on: show story immediately, then poll/refresh assessments by ids from stimulus metadata
  - [ ] Render per-section "Questions loading…" indicator until ready
- [ ] UI tests for progressive rendering and loading states

---

## Phase 7 — Scoring and submission verification
- [ ] Ensure client submission remains `POST /api/ims/qti/v3p0/responses`
- [ ] Confirm local `QTIResponseProcessor` correctness aligns with generated `correctIndex`
- [ ] E2E test: story creation → question generation → answer submission → correctness verification

---

## Phase 8 — Telemetry and monitoring
- [ ] Add structured logs for `/api/generate-questions` (latency, output size, validation/retry counts)
- [ ] Log assessment creation outcomes per section
- [ ] Add lightweight metrics to compare correctness disputes pre/post flag enablement
- [ ] Dashboard/monitoring setup for flag rollout

---

## Phase 9 — Documentation updates
- [ ] Update `docs/Assessment_Quiz_Generation_Nuclear_Plan.md` with `/api/generate-questions` contract
- [ ] Update `STORY_STORAGE_API_FLOW.md` and `QUIZ_XP_API_FLOW.md` to include split flow
- [ ] Add "how to enable" section for flags (local/staging)
- [ ] Create deployment runbook with rollback procedures

---

## Phase 10 — Controlled rollout and validation
- **Stage 1: Development validation**
  - [ ] Enable flags in development environment
  - [ ] Generate test stories and validate question generation
  - [ ] Verify correctness scoring and assessment flow
  - [ ] Review logs and metrics for issues

- **Stage 2: Staging validation**
  - [ ] Enable flags in staging environment
  - [ ] Run comprehensive E2E tests
  - [ ] Load test question generation endpoint
  - [ ] Validate against production-like data

- **Stage 3: Production rollout (gradual)**
  - [ ] Enable for internal testers (cookie/tenant/flag gate)
  - [ ] Monitor error rates and correctness metrics
  - [ ] Expand to limited user cohort (5-10%)
  - [ ] Full rollout after metrics show stability

- **Stage 4: Fallback preparedness**
  - [ ] Document instant rollback procedure (toggle flags to false)
  - [ ] Test rollback in staging environment
  - [ ] Monitor for any rollback-related issues

---

## Anti‑conflict guardrails (always on)
- [ ] Prefer new files over edits where possible
- [ ] Minimal, flag-gated edits in shared files (`saveStory`, prompts)
- [ ] No renames/moves of shared modules
- [ ] No changes to existing proxy endpoints
- [ ] Keep default flags false until rollout

---

## Acceptance criteria
- [ ] Questions per section reliably mark correct/incorrect locally and upstream
- [ ] Significant reduction in mismatched/unrecognized-answer incidents
- [ ] Round-trip stability across environments with flags toggled
