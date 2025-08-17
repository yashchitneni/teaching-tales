# Phase 0 — Isolation, Flags, and Scope (Detailed Roadmap)

## Status
- ✅ **DONE**: Create Git branch `decoupling-questions-from-passage`
- 🔄 **IN PROGRESS**: Remaining Phase 0 tasks

---

## Remaining Tasks

### Task 1: Create Taskmaster tag for task tracking
- [ ] Initialize Taskmaster in project if not already done
- [ ] Create tag `feature-split-quiz` for isolating these tasks
- [ ] Switch to the new tag context

**Commands:**
```bash
# If Taskmaster not initialized
task-master init --name "Teaching Tales" --description "Educational story generation platform"

# Create and switch to feature tag
task-master add-tag feature-split-quiz --description "Split story and quiz generation implementation"
task-master use-tag feature-split-quiz
```

### Task 2: Add server-side feature flag ✅
- [x] Add `QTI_SPLIT_GENERATION_ENABLED` environment variable
- [x] Set default to `false` in all environments
- [x] Wire flag into configuration system

**Files to modify:**
- `src/lib/config.ts` - Add flag to config object
- `.env.example` or `assets/env.example` - Document the flag
- `sst.config.ts` - Add to environment variables (if using SST)

**Implementation:**
```typescript
// In src/lib/config.ts
export const FEATURE_FLAGS = {
  QTI_SPLIT_GENERATION_ENABLED: process.env.QTI_SPLIT_GENERATION_ENABLED === 'true',
  // ... other flags
} as const;
```

### Task 3: Add client-side feature flag (optional) ✅
- [x] Add `NEXT_PUBLIC_QTI_SPLIT_GENERATION` environment variable
- [x] Set default to `false`
- [x] Wire into client-side config if needed for UI gating

**Implementation:**
```typescript
// In src/lib/config.ts (client section)
export const CLIENT_FEATURE_FLAGS = {
  QTI_SPLIT_GENERATION: process.env.NEXT_PUBLIC_QTI_SPLIT_GENERATION === 'true',
  // ... other client flags
} as const;
```

### Task 4: Update decision documentation ✅
- [x] Update `docs/Assessment_Quiz_Generation_Nuclear_Plan.md`
- [x] Add flag details and usage instructions
- [x] Document rollout strategy with flags

**Content to add:**
- Flag names and default values
- How to enable for testing
- Rollback strategy (toggle flags)
- Environment-specific settings

### Task 5: Add CHANGELOG entry ✅
- [x] Create or update CHANGELOG.md
- [x] Note the gated feature addition
- [x] Mention no behavior change with flags off

**CHANGELOG entry:**
```markdown
## [Unreleased]
### Added
- Feature flag `QTI_SPLIT_GENERATION_ENABLED` for split story/quiz generation (default: disabled)
- No behavior changes when flag is disabled
```

### Task 6: Validate isolation setup ✅
- [x] Confirm flags are properly defaulted to `false`
- [x] Test that existing story generation still works unchanged
- [x] Verify no breaking changes introduced

**Validation commands:**
```bash
# Test existing story generation flow
npm run dev
# Navigate to create-book flow and generate a story
# Confirm questions are generated and work as before
```

---

## Files to Create/Modify

### New Files:
- `docs/Phase_0_Detailed_Roadmap.md` (this file)

### Modified Files:
- `src/lib/config.ts` - Add feature flags
- `docs/Assessment_Quiz_Generation_Nuclear_Plan.md` - Add flag documentation
- `CHANGELOG.md` - Add entry for gated feature
- `.env.example` or `assets/env.example` - Document new env vars
- `sst.config.ts` - Add environment variables (if applicable)

---

## Acceptance Criteria for Phase 0 ✅ ALL COMPLETE
- [x] All feature flags exist and default to `false` ✅
- [x] Existing story generation works unchanged ✅
- [x] Documentation updated with flag usage ✅
- [x] Taskmaster tag created and active (SKIPPED - not needed)
- [x] CHANGELOG entry added ✅
- [x] No breaking changes or behavioral differences ✅

---

## Next Phase Preview
Once Phase 0 is complete, Phase 1 will focus on:
- Adding new TypeScript interfaces for section-only question generation
- Creating the questions-only prompt template
- Building validation logic for generated questions

---

## Commands Summary

```bash
# Taskmaster setup (if needed)
task-master add-tag feature-split-quiz --description "Split story and quiz generation implementation"
task-master use-tag feature-split-quiz

# Development testing
npm run dev

# Verify no regressions
# Test existing story creation flow end-to-end
```

---

## Notes
- Keep all changes minimal and non-breaking
- Default flags to `false` to maintain current behavior
- Focus on setup and isolation in this phase
- No functional changes to story generation yet
