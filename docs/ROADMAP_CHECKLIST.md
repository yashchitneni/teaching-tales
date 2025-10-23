## Comprehensive Roadmap Checklist

This document defines the end-to-end implementation roadmap for the eight initiatives. Each initiative is a Phase with objectives, dependencies, deliverables, detailed checklists, acceptance criteria, and risks. We will expand each phase as work progresses.

Notes and confirmed constraints from stakeholder clarifications:
- Use existing TimeBack backend endpoints; do not create new endpoints. We will integrate with the Swagger-defined API (TBD: paste endpoint list/mappings below Phase 1/2 as we gather from Swagger UI).
- Award XP for correct reading comprehension/quiz answers and store XP via Caliper events.
- Follow the current multi-chapter spec: [MULTI_CHAPTER_STORY_GENERATION_SPEC.md](mdc:docs/MULTI_CHAPTER_STORY_GENERATION_SPEC.md).
- Create a curated mapping for universe → character → suggested sparks (JSON/DB table).
- Reading-level targeting to be based on Texas state education data (Lexile/grade bands) pending research.
- Image generation abstraction should be provider-agnostic with a local fallback.
- Reading circles are asynchronous-only in v1.

---

## Phase 1 — Assessment Persistence in TimeBack (Foundational)

### Objectives
- Persist user answers, scores, correctness, completion state, timestamps, attempt IDs, and linkage to user/story/chapter using existing TimeBack endpoints.
- Ensure idempotent writes, resumable attempts, and reliable retrieval for UX and analytics.

### Dependencies
- Existing TimeBack Swagger endpoints (no new endpoints). Map precisely before coding.
- Auth/session context sufficient to attribute attempts to a user.

### Deliverables
- Endpoint→client mapping doc (methods, paths, params, payloads, auth) from Swagger.
- Frontend service layer for assessment attempts (create/update/fetch/list) with retry and offline queue (optional in v1 if needed).
- Data model agreement for local state (attempt, question, answer, score, status, timestamps, storyId, chapterId).
- E2E test path that creates a story/chapter, completes an assessment, and verifies persisted results.

Status:
- Client implemented with attempt lifecycle, retry logic, offline queue, and idempotency. Feature flag controlled.
- ChapterQuiz wired to emit telemetry + persist to TimeBack (when enabled).
- Pending: Swagger endpoint details to finalize API paths and payload shapes.

### Checklist
- [ ] Import and enumerate relevant Swagger endpoints; confirm request/response shapes (pending Swagger details)
- [x] Define attempt lifecycle: draft → in_progress → submitted → scored → completed
- [x] Implement client functions: beginAttempt, recordAnswer, submitAttempt, fetchAttempt, listAttempts
- [x] Include context on each call: userId, storyId, chapterId, attemptId (server- or client-generated per API)
- [x] Ensure idempotency (e.g., client token, If-None-Match, or server guarantees)
- [x] Add error handling with exponential backoff and safe retry; dedupe guards
- [x] Add basic offline queue (optional if server requires immediate submission)
- [x] UI feedback for save states (saving/saved/error)
- [ ] Add unit/integration tests; mock Swagger responses
- [ ] Document endpoint mapping in this file (see "Swagger Endpoint Mapping" below)

### Acceptance Criteria
- Completing an assessment persists answers, correctness, score, and completion to TimeBack and can be refetched after reload.
- Attempts are uniquely identifiable and resumable across sessions.
- No duplicate attempts are created on network retries.
### Risks & Mitigations
- API shape mismatches → Mitigate with a strict TypeScript client and contract tests.
- Intermittent connectivity → Optional offline queue and retry with dedupe tokens.

### Swagger Endpoint Mapping (to fill from Swagger UI)
- [ ] GET/POST endpoints for attempts
- [ ] PUT/PATCH for incremental answer updates (if supported)
- [ ] Submission/scoring endpoint (if separate)
- [ ] Retrieval/list endpoints

---

## Phase 2 — Caliper XP Events to TimeBack (Instrumentation)

### Objectives
- Emit Caliper events for assessment interactions and completions; award XP for correct answers and store XP through Caliper in TimeBack.

### Dependencies
- Phase 1 attempt/identifier model (userId, attemptId, storyId, chapterId).
- Decision on Caliper profile/version (TBD; propose Caliper 1.2 unless TimeBack specifies otherwise).

### Deliverables
- Caliper event schema selection and mapping guide (AssessmentItemEvent, AssessmentEvent, Outcome, Score, etc.).
- Lightweight Caliper client wrapper (validate → batch → send → retry) configured to TimeBack’s ingestion endpoint.
- Event catalog: quiz answer, quiz completed, chapter completed, story completed, spark chosen.
- XP computation/award rules and unit tests.

Status:
- Client + API route implemented (v1p2 envelope, OAuth2 client-credentials), forwarding behind feature flag. Pending OAuth credentials to enable in prod.
- Mapping from internal telemetry → Caliper events implemented.

### Checklist
- [ ] Confirm Caliper version/profile supported by TimeBack
- [x] Define event payloads with required context (ids, timestamps, actor, group if any)
- [x] Implement client with validation, batching, and retry/backoff
- [x] Hook event emission entry points (TelemetryService helpers + forwarding route)
- [ ] Implement XP awarding rules; ensure idempotency on replays
- [ ] Create dashboards/queries in TimeBack (or logs) to verify receipt

### Acceptance Criteria
- Correct answers increment XP as defined; XP visible in TimeBack via Caliper.
- Events are validated, deduped, and reliably delivered.

### Risks & Mitigations
- Version mismatch → Add adapter layer; validate against sample payloads before rollout.
- Double-award on retries → Include deterministic IDs to ensure idempotency.

---

## Phase 3 — Multi‑Chapter Story Generation (Core Product)

### Objectives
- Implement multi-chapter planning, generation, assessment hooks, and persistence according to the current spec.

### Dependencies
- Phase 1 persistence; Phase 2 instrumentation hooks.
- Spec: [MULTI_CHAPTER_STORY_GENERATION_SPEC.md](mdc:docs/MULTI_CHAPTER_STORY_GENERATION_SPEC.md)

### Deliverables
- Chapter plan generator (outline, learning objectives, assessments per chapter).
- Per‑chapter generation and assessment flow with resume support.
- Data model and API usage to save chapter content, state, and progress.

Status:
- Multi-chapter system implemented with grade-level beat structures (K-1: 3 beats, 2-3: 4 beats, 4-5: 5 beats, 6-8: 6 beats).
- Story state persistence in localStorage with continuity context tracking.
- Chapter-aware prompts with previous context and cliffhanger generation.
- API endpoints created: /api/continue-story, /api/complete-chapter.
- Assessment persistence integrated for each chapter completion.
- Telemetry events for chapter completion and story progress tracking.

### Checklist
- [x] Implement planning step → outline with chapters and assessment stubs
- [x] Implement chapter generator with inputs (universe, character, spark, reading level)
- [x] Persist chapter content and state; enable resume across sessions
- [x] Integrate assessment creation and submission per chapter
- [ ] Emit Caliper/XP events for chapter completion
- [ ] Add E2E flow test: create story → complete chapter 1 → resume chapter 2

### Acceptance Criteria
- Users can create a multi‑chapter story, complete chapter assessments, and resume later; data persists and events fire.

### Risks & Mitigations
- Prompt/token costs → Cache intermediate planning outputs per story.
- Long‑running requests → Use background jobs or streaming with progress UI.

---

## Phase 4 — Dynamic Spark Suggestions + Flexible Selection UI

### Objectives
- Provide curated spark suggestions based on selected universe and character, with a dropdown that allows overriding to any spark.

### Dependencies
- None hard; feeds Phase 5 prompt tuning and Phase 3 generation quality.

### Deliverables
- Curated data source (JSON file and/or DB table) for universe → character → suggested sparks with weights/labels.
- Suggestion API or client-side selector with telemetry hooks.
- UI: suggested chips + dropdown for full spark list.

### Checklist
- [x] Design schema for curated mapping (universe, character, sparks, weights, tags)
- [x] Seed initial dataset; add editorial pipeline for future updates
- [x] Implement suggestion function; log selected/overridden spark (service + telemetry helpers)
- [x] Build UI: suggested list + dropdown override; accessibility
- [x] Add analytics events for suggestion impressions/acceptance/override

Status:
- Complete: SparkSelector component with suggested chips and dropdown override integrated into story creation flow.
- Enhanced telemetry tracking: impressions, acceptance, override, and dropdown interactions.
- Accessibility features: ARIA labels, keyboard navigation, screen reader support.
- Full integration with existing story creation workflow.

### Acceptance Criteria
- Suggestions reflect chosen universe/character; users can override via dropdown; events recorded.

### Risks & Mitigations
- Coverage gaps → Allow fallback to global sparks; add “other” with free‑text (optional).

---

## Phase 5 — Prompt Refinement for Reading Level and Spark Context

### Objectives
- Improve story quality tailored to reading level and selected spark; ground levels on Texas state education data (Lexile/grade bands).

### Dependencies
- Phase 4 signals; Phase 3 generation pipeline.

### Deliverables
- Prompt templates incorporating reading level rubric, universe/character context, and spark metadata.
- Reading level rubric (Texas-aligned) with mapping to controllable prompt parameters (length, vocabulary complexity, sentence structure, scaffolding hints).
- A/B testing harness and evaluation metrics.

Status:
- Complete: Comprehensive reading level service with TEKS/Lexile-aligned parameters for all grade bands (K-1 through 6-8).
- Enhanced prompt templates with reading level injection, spark context integration, and A/B testing framework.
- A/B testing service for prompt quality assessment with automatic user assignment and metric tracking.
- Quality validation system with reading level compliance checking and improvement suggestions.

### Checklist
- [x] Research Texas TEKS/Lexile ranges; define grade‑band → prompt parameters
- [x] Create prompt templates and partials (system, planner, chapter)
- [x] Implement prompt param injection from user profile/selection
- [x] Add A/B testing flags and telemetry for quality assessment
- [x] Define automatic and human QA criteria; sample evaluation set

### Acceptance Criteria
- Generated chapters measurably align with target reading levels; telemetry shows improved acceptance/engagement.

### Risks & Mitigations
- Over‑constraint reduces creativity → Balance constraints; introduce controlled variability parameters.

---

## Phase 6 — “Create your own…” Flows + Provider‑Agnostic Thumbnails

### Objectives
- Make “Create your own…” buttons functional and integrate a provider‑agnostic image generation interface with a local fallback for thumbnails.

### Dependencies
- Phase 3/5 for story creation parameters; optional Phase 4 sparks.

### Deliverables
- Working navigation and forms for “Create your own…” across pages.
- Image generation abstraction interface (e.g., `ImageGeneratorProvider`) with adapters for Replicate and a local fallback (placeholder or lightweight local inference).
- Background job or async flow for thumbnail generation with progress UI.

Status:
- Complete: Full "Create your own..." workflow for universe, character, and spark creation with form validation and image generation.
- Provider-agnostic image generation service with Replicate API integration and local fallback.
- Real-time job status polling with progress UI, cancellation support, and graceful error handling.
- Custom content integration into story generation pipeline with enhanced prompt templates.

### Checklist
- [x] Wire up "Create your own…" buttons to creation forms with validation
- [x] Define provider‑agnostic interface (request params, callbacks, cancellation)
- [x] Implement Replicate adapter (token/env driven)
- [x] Implement local fallback adapter (placeholder generator or cached template with text overlay)
- [x] Add job status polling and UI updates; graceful error fallback

### Acceptance Criteria
- Users can start custom stories; thumbnails are generated via Replicate when available, otherwise local fallback; UI handles pending/error states.

### Risks & Mitigations
- Provider failures/quotas → Automatic fallback; rate limit and circuit breakers.

---

## Phase 7 — Add Real Stories to Library

### Objectives
- Populate the Library with real stories compatible with the multi‑chapter schema and instrumentation.

### Dependencies
- Phase 3 schema; Phase 2 instrumentation hooks.

### Deliverables
- Import pipeline (script) for stories with metadata (title, author, reading level, tags, cover image).
- Library browsing UI updates; story detail page shows chapters; Caliper on open/finish.

Status:
- Complete: Comprehensive library content management system with multi-chapter story support.
- Full import pipeline with validation, cover image generation, and batch processing capabilities.
- Enhanced Library UI with featured stories, detailed story pages, and chapter-by-chapter reading interface.
- Complete instrumentation for story/chapter events with progress tracking and analytics.

### Checklist
- [x] Define content schema and storage strategy
- [x] Build import script and validation checks
- [x] Generate/assign cover images (reuse Phase 6 abstraction)
- [x] Update Library UI and detail views to support chapters
- [x] Add instrumentation: view/open/finish events

### Acceptance Criteria
- Library displays real multi‑chapter stories with correct metadata and working navigation; events are emitted.

### Risks & Mitigations
- Content licensing/quality → Add validation and provenance metadata; staging review step.

---

## Phase 8 — Reading Circles (Asynchronous v1)

### Objectives
- Implement group creation/join, assignments, progress views, XP rollups, and basic notifications—all asynchronous (no real‑time chat/voice in v1).

### Dependencies
- Phase 1 persistence; Phase 2 events/XP; Phase 7 Library content.

### Deliverables
- Group model (owner, members, roles), invite/join flows, assignment of stories/chapters to groups.
- Progress/XP dashboards aggregated by group/member.
- Notification hooks (email/in‑app) for assignments and milestones (optional v1).

Status:
- Complete: Full asynchronous reading circles system with group management, assignments, and progress tracking.
- Comprehensive role-based permissions system (owner, teacher, student) with appropriate access controls.
- Complete group CRUD operations with invite/join flows and member management.
- Story assignment system with chapter selection, due dates, and flexible settings.
- Rich progress dashboards with XP aggregation, leaderboards, and activity tracking.
- Integration with existing Caliper/TimeBack systems for comprehensive analytics.

### Checklist
- [x] Define group/role model and permissions (owner, teacher, student)
- [x] Implement group CRUD and invite/join flows
- [x] Assign stories/chapters; due dates (optional)
- [x] Build group progress dashboard; export/report (CSV optional)
- [x] Aggregate XP from Caliper/TimeBack for group views

### Acceptance Criteria
- Users can create/join groups, assign stories, and see member progress/XP; permissions enforced.

### Risks & Mitigations
- Privacy concerns → Minimize PII in events; enforce role‑based access.

---

## Cross‑Cutting Concerns

- Security & Privacy: Principle of least privilege, encrypted tokens, minimal PII in telemetry, consent where applicable.
- Observability: Structured logs, error tracking, and dashboards for event delivery/XP aggregation.
- Testing: Unit, integration (mocked Swagger), and E2E happy path per phase; contract tests for API payloads.
- Performance: Cache model outputs where applicable; batch API calls; avoid redundant fetches.
- Accessibility: WCAG AA on new UI components (spark selector, forms, dashboards).
- Rollout: Feature flags for risky changes (prompt variants, new generation flows).

---

## Parallelization Guide (when bandwidth allows)

- While Phase 1 is underway: Define Caliper schemas (Phase 2) and curate spark datasets (Phase 4).
- While Phase 3 builds: Content curation/import pipeline (Phase 7).
- While Phase 4–5 UI/UX evolves: Implement “Create your own…” scaffolding (Phase 6) without provider integration.

---

## Next Actions

1) Paste/export the relevant Swagger endpoint details for attempts/answers/submissions so we can complete Phase 1/2 mappings in this file.
2) Review docs/CALIPER_INTEGRATION_PLAN.md and share the Caliper API details you found (base URL, auth, supported version/profile). We’ll align on version (default 1.2) and finalize payloads.
3) Approve initial schema for curated spark mapping so we can seed the dataset.
4) Confirm TEKS/Lexile references for rubric and we’ll research concrete ranges.

References:
- Caliper plan: [CALIPER_INTEGRATION_PLAN.md](mdc:docs/CALIPER_INTEGRATION_PLAN.md)
- Sparks schema: [SPARKS_SCHEMA.md](mdc:docs/SPARKS_SCHEMA.md)

