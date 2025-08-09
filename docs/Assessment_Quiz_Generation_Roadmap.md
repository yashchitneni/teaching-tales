### Assessment Question Generation — Split Plan Roadmap Checklist

- Reference: `docs/Assessment_Quiz_Generation_Nuclear_Plan.md`
- Objective: Split story generation and question generation, per-section, gated by feature flags, with minimal diffs to avoid conflicts.

---

## Phase 0 — Isolation, flags, and scope
- [ ] Create Git branch `feature/split-quiz-generation`
- [ ] Create Taskmaster tag `feature-split-quiz`
- [ ] Add server flag `QTI_SPLIT_GENERATION_ENABLED=false` (default)
- [ ] Add client flag `NEXT_PUBLIC_QTI_SPLIT_GENERATION=false` (optional)
- [ ] Update decision doc with flags and scope

Notes
- Keep flags false until rollout; no default behavior change.

---

## Phase 1 — Questions-only prompt and types
- [ ] Add types in `src/lib/ai/types.ts`:
  - [ ] `SectionQuestionGenInput { sectionContent, sectionIndex, gradeLevel, constraints? }`
  - [ ] `GeneratedQuestion { id, prompt, options[], correctIndex, explanation }`
  - [ ] `SectionQuestionsResult { sectionIndex, questions: GeneratedQuestion[] }`
- [ ] Implement `PromptTemplates.generateQuestionsForSection(input)` in `src/lib/ai/prompt-templates.ts`
  - [ ] Enforce deterministic JSON schema (single correct index, options length, explanation references section text)
- [ ] Implement validator in `src/lib/qti/validators/section-question-validator.ts`
  - [ ] Bounds check for `correctIndex`
  - [ ] Unique, non-empty options
  - [ ] Optional evidence-in-text heuristic

---

## Phase 2 — Questions generation API
- [ ] Create `src/app/api/generate-questions/route.ts`
  - [ ] Auth: cookie/bearer; verify via `${NEXT_PUBLIC_TIMEBACK_API_URL}/api/auth/me`
  - [ ] Input: `{ sectionContent, sectionIndex, gradeLevel, storyMetadata, constraints? }`
  - [ ] Use `GeminiClient` + `PromptTemplates.generateQuestionsForSection`
  - [ ] Run validation; return `{ sectionIndex, questions[] }`
  - [ ] Log latency/size; redact PII
- [ ] Create `src/lib/ai/question-generation-service.ts`
  - [ ] Export `generateQuestionsForSection(input)` with retries/backoff

---

## Phase 3 — Assessment creation variant (non-breaking)
- [ ] Add `createSectionAssessmentsFromQuestions(...)` to `src/lib/services/assessment-service.ts`
  - [ ] Build `CreateAssessmentTestRequest` per section from generated questions
  - [ ] Persist via `POST /api/ims/qti/v3p0/assessment-tests` using `src/lib/api/qti-client.ts`
- [ ] Do not modify existing `createStoryAssessments` (avoid churn)

---

## Phase 4 — Story save orchestration (flag-gated)
- [ ] In `src/lib/services/story-storage-service.ts` update `saveStory`:
  - [ ] If flag off → current behavior
  - [ ] If flag on:
    - [ ] Step 1: Create stimulus (sections only)
    - [ ] Step 2: For each section, call `generateQuestionsForSection` (parallel with concurrency cap)
    - [ ] Step 3: Validate; dedupe; retry once on failure
    - [ ] Step 4: `createSectionAssessmentsFromQuestions` to persist assessments
    - [ ] Step 5: Update stimulus metadata with `assessmentIds`

---

## Phase 5 — UI progressive availability (flag-gated)
- [ ] In `src/app/book/[bookId]/page.tsx` (no breaking changes):
  - [ ] When flag on: show story immediately, then poll/refresh assessments by ids from stimulus metadata
  - [ ] Render per-section "Questions loading…" indicator until ready
  - [ ] Keep existing path intact when flag off

---

## Phase 6 — Scoring and submission (verify only)
- [ ] Ensure client submission remains `POST /api/ims/qti/v3p0/responses`
- [ ] Confirm local `QTIResponseProcessor` correctness aligns with generated `correctIndex`

---

## Phase 7 — Telemetry, logging, analytics
- [ ] Add structured logs for `/api/generate-questions` (latency, output size, validation/retry counts)
- [ ] Log assessment creation outcomes per section
- [ ] Add lightweight metrics to compare correctness disputes pre/post flag enablement

---

## Phase 8 — Tests
- Unit tests
  - [ ] Prompt/validator tests (bounds, duplicates, schema)
- Integration tests
  - [ ] E2E: save story (flag on) → per-section questions → assessment creation → answer submission → correctness
  - [ ] Use mocked upstream via proxy routes
- UI tests
  - [ ] Progressive rendering of sections/questions and loading indicator

---

## Phase 9 — Docs and ops
- [ ] Update `docs/Assessment_Quiz_Generation_Nuclear_Plan.md` with `/api/generate-questions` contract
- [ ] Update `STORY_STORAGE_API_FLOW.md` and `QUIZ_XP_API_FLOW.md` to include split flow
- [ ] Add "how to enable" section for flags (local/staging)

---

## Phase 10 — Rollout
- Staging
  - [ ] Enable flag; generate multiple stories; validate assessments and correctness
  - [ ] Review logs/metrics
- Production (gradual)
  - [ ] Enable for internal testers (cookie/tenant/flag gate)
  - [ ] Expand as metrics show stability
- Fallback
  - [ ] Ensure instant rollback by turning off the flag

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
