# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Feature flag `QTI_SPLIT_GENERATION_ENABLED` for split story/quiz generation (default: disabled)
- Feature flag `NEXT_PUBLIC_QTI_SPLIT_GENERATION` for client-side split generation UI features (default: disabled)
- Environment variables documentation in `docs/Environment_Variables.md`
- Comprehensive roadmap for split generation implementation in `docs/Assessment_Quiz_Generation_Roadmap.md`
- Detailed Phase 2 implementation roadmap in `docs/Phase_2_Detailed_Roadmap.md`
- **Phase 2 Complete**: AI-powered question generation service for individual story sections
  - `QuestionGenerationService` class with comprehensive retry logic and validation integration
  - Enhanced `PromptTemplates.generateQuestionsForSection()` method with grade-level support
  - Phase 1 validator integration ensuring question quality before return
  - 170+ comprehensive test cases (>90% coverage) across prompt and service logic
  - Production-ready structured logging and monitoring hooks
  - Complete TypeScript integration with backward-compatible enhanced question types

### Changed
- Updated `src/lib/config.ts` with `FEATURE_FLAGS` and `CLIENT_FEATURE_FLAGS` exports
- Enhanced `sst.config.ts` with feature flag environment variables
- **OPTIMIZATION**: Split generation approach changed to async processing
  - Stories now appear instantly (3-5 seconds), questions generate in background
  - Simplified UI implementation reduces frontend work from weeks to 2-4 hours
  - Lower rollout risk: stories always work, questions are progressive enhancement

### Technical Notes
- **No behavior changes** when feature flags are disabled (default state)
- Split generation implementation will be gated behind feature flags for safe rollout
- Instant rollback capability via flag toggles without code deployment
- **Phase 2 Implementation Details**:
  - New service: `src/lib/ai/question-generation-service.ts` (449 lines, production-ready)
  - Enhanced: `src/lib/ai/prompt-templates.ts` (+150 lines, 3 new helper methods)
  - Test coverage: `src/lib/ai/__tests__/` (2 comprehensive test suites, 1000+ lines)
  - Documentation: `src/lib/ai/question-generation-service.md` (complete usage guide)
  - Integration examples: `src/lib/ai/question-generation-smoke-test.ts`
  - Clean exports: Enhanced `src/lib/ai/index.ts` with new types and service

---

## Previous Releases

*This changelog was initiated with the split generation feature flag implementation.*
*Previous changes are documented in git history and relevant documentation files.*
