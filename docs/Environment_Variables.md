# Environment Variables Documentation

## Required Variables

### TimeBack API Configuration
- `NEXT_PUBLIC_TIMEBACK_API_URL` - Base URL for TimeBack API (default: `http://localhost:8080`)

### AI Service API Keys
- `GOOGLE_AI_API_KEY` - Google AI/Gemini API key (required for story generation)
- `REPLICATE_API_TOKEN` - Replicate API token (required for image generation)

## Optional Variables

### AI Model Configuration
- `GEMINI_MODEL_NAME` - Gemini model to use (default: `gemini-2.0-flash`)
- `GEMINI_MAX_TOKENS` - Maximum tokens for Gemini (default: `4096`)
- `REPLICATE_MODEL` - Replicate model for images (default: `black-forest-labs/flux-schnell`)

### Feature Flags
- `QTI_SPLIT_GENERATION_ENABLED` - Enable split story/quiz generation on server (default: `false`)
- `QTI_ASYNC_ASSESSMENTS_ENABLED` - Enable Phase 4 async assessment creation (default: `false`)
- `QTI_ASYNC_STORY_SAVE_ENABLED` - **NEW**: Enable Phase 5 async story save orchestration (default: `false`)
- `NEXT_PUBLIC_QTI_SPLIT_GENERATION` - Enable split generation UI features on client (default: `false`)
- `NEXT_PUBLIC_ONEROSTER_ENABLED` - Enable OneRoster integration (default: `false`)

## Local Development Setup

Create a `.env.local` file in the project root with your API keys:

```bash
# Copy this template and fill in your actual API keys
NEXT_PUBLIC_TIMEBACK_API_URL=http://localhost:8080
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
REPLICATE_API_TOKEN=your_replicate_api_token_here

# Feature flags (keep false during development unless testing)
QTI_SPLIT_GENERATION_ENABLED=false
QTI_ASYNC_ASSESSMENTS_ENABLED=false
QTI_ASYNC_STORY_SAVE_ENABLED=false
NEXT_PUBLIC_QTI_SPLIT_GENERATION=false
```

## Phase 4: Async Assessment Creation Configuration

The `QTI_ASYNC_ASSESSMENTS_ENABLED` flag controls Phase 4's async assessment creation feature.

### Feature Flag Behavior
- **Only `'true'` enables the feature** - any other value (including `undefined`, `'false'`, `'1'`, `'TRUE'`) disables it
- **Safe by default** - undefined or missing variable defaults to `false`
- **Requires Phase 3** - `QTI_SPLIT_GENERATION_ENABLED` must be `true` for Phase 4 to work

### Deployment Scenarios

**Development Testing:**
```bash
QTI_SPLIT_GENERATION_ENABLED=true
QTI_ASYNC_ASSESSMENTS_ENABLED=true
```

**Staging Environment:**
```bash
QTI_SPLIT_GENERATION_ENABLED=true
QTI_ASYNC_ASSESSMENTS_ENABLED=false  # Phase 3 only
```

**Production (Safe Start):**
```bash
QTI_SPLIT_GENERATION_ENABLED=false  # All features disabled
QTI_ASYNC_ASSESSMENTS_ENABLED=false
```

**Production (Phase 4 Enabled):**
```bash
QTI_SPLIT_GENERATION_ENABLED=true
QTI_ASYNC_ASSESSMENTS_ENABLED=true  # Full pipeline active
```

## Phase 5: Async Story Save Orchestration Configuration

The `QTI_ASYNC_STORY_SAVE_ENABLED` flag controls Phase 5's async story save feature - stories display instantly while questions generate in background.

### Feature Flag Behavior
- **Only `'true'` enables the feature** - any other value defaults to sync behavior
- **Safe by default** - undefined or missing variable defaults to `false` (sync story save)
- **Requires Phase 3 & 4** - Both `QTI_SPLIT_GENERATION_ENABLED` and `QTI_ASYNC_ASSESSMENTS_ENABLED` must be `true`

### Deployment Scenarios

**Development Testing (Phase 5):**
```bash
QTI_SPLIT_GENERATION_ENABLED=true
QTI_ASYNC_ASSESSMENTS_ENABLED=true
QTI_ASYNC_STORY_SAVE_ENABLED=true  # Full async pipeline
```

**Staging Environment (Phase 5 Validation):**
```bash
QTI_SPLIT_GENERATION_ENABLED=true
QTI_ASYNC_ASSESSMENTS_ENABLED=true
QTI_ASYNC_STORY_SAVE_ENABLED=false  # Test sync behavior first
```

**Production (Safe Start):**
```bash
QTI_SPLIT_GENERATION_ENABLED=false  # All features disabled
QTI_ASYNC_ASSESSMENTS_ENABLED=false
QTI_ASYNC_STORY_SAVE_ENABLED=false
```

**Production (Phase 5 Enabled):**
```bash
QTI_SPLIT_GENERATION_ENABLED=true
QTI_ASYNC_ASSESSMENTS_ENABLED=true
QTI_ASYNC_STORY_SAVE_ENABLED=true   # Full async experience
```

### Benefits of Phase 5
- **5-10x Faster Story Creation**: Stories appear in <2s vs 10-15s
- **Immediate User Experience**: Never blocked by question generation
- **Better Error Isolation**: Question failures don't break story availability
- **Safe Rollback**: Toggle flag to instantly disable async behavior

## Production Environment

Environment variables are configured in `sst.config.ts` for deployed environments. Secrets (API keys) are managed through SST Secrets.
