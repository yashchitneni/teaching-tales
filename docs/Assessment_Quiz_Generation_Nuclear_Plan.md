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

#### Rollout Plan (Incremental)
1) Add `/api/generate-questions` and `PromptTemplates.generateQuestionsForSection`.
2) Wire `StoryStorageService.saveStory` to call per-section question generation and persist results.
3) Update UI to handle progressive assessment availability; instrument analytics for correctness.
4) Monitor, then evaluate moving to first-class QTI items (alternative B) once stable.

#### References (Key Files)
- Generation prompt: `src/lib/ai/prompt-templates.ts`
- Story generation API: `src/app/api/generate-story/route.ts`
- Story save & assessment creation: `src/lib/services/story-storage-service.ts`, `src/lib/services/assessment-service.ts`
- QTI client & proxy: `src/lib/api/qti-client.ts`, `src/app/api/ims/qti/v3p0/[...endpoint]/route.ts`
- Answer submission & local processing: `src/lib/services/response-storage-service.ts`, `src/lib/services/enhanced-response-handler.ts`, `src/lib/qti/processors/response-processor.ts`
- Env & config: `src/lib/config.ts`, `sst.config.ts`
