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

### Changed
- Updated `src/lib/config.ts` with `FEATURE_FLAGS` and `CLIENT_FEATURE_FLAGS` exports
- Enhanced `sst.config.ts` with feature flag environment variables

### Technical Notes
- **No behavior changes** when feature flags are disabled (default state)
- Split generation implementation will be gated behind feature flags for safe rollout
- Instant rollback capability via flag toggles without code deployment

---

## Previous Releases

*This changelog was initiated with the split generation feature flag implementation.*
*Previous changes are documented in git history and relevant documentation files.*
