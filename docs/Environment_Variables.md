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
NEXT_PUBLIC_QTI_SPLIT_GENERATION=false
```

## Production Environment

Environment variables are configured in `sst.config.ts` for deployed environments. Secrets (API keys) are managed through SST Secrets.
