# Environment Variables Documentation

**Document Version**: 2.0 - Phase 9 Production Ready  
**Last Updated**: Phase 9.2.4 - Environment Configuration Documentation  
**Status**: ✅ Complete with Phase 6-8 Production Configuration  

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

---

## Phase 6: UI Polish & Progressive Enhancement Configuration

Phase 6 introduces enhanced UI components with async-aware functionality and progressive loading.

### Client-Side Feature Flags
```bash
# UI progressive enhancement features
NEXT_PUBLIC_QTI_SPLIT_GENERATION=true      # Progressive question loading UI
NEXT_PUBLIC_ASYNC_UI_ENABLED=true          # Async-aware UI components (default: false)
NEXT_PUBLIC_PROGRESSIVE_LOADING=true       # Progressive content loading (default: false)

# UI optimization features
NEXT_PUBLIC_CACHE_UI_STATE=true            # Client-side state caching (default: false)
NEXT_PUBLIC_OPTIMISTIC_UPDATES=true       # Optimistic UI updates (default: false)
```

---

## Phase 7: Bulletproof Scoring & Performance Configuration

Phase 7 introduces high-performance scoring with comprehensive caching and error handling.

### Performance & Caching Configuration
```bash
# Core performance features (recommended for production)
QTI_PERFORMANCE_CACHING_ENABLED=true       # Smart response caching (default: true)
QTI_ADVANCED_ANALYTICS_ENABLED=true        # Real-time metrics collection (default: false)
QTI_ADMIN_METRICS_ENABLED=true             # Admin dashboard access (default: false)

# Cache configuration
REDIS_URL=redis://localhost:6379           # Redis cache URL (required if caching enabled)
CACHE_TTL_SECONDS=300                       # Cache TTL in seconds (default: 300)
CACHE_MAX_SIZE_MB=1024                      # Maximum cache size in MB (default: 1024)

# Performance tuning
RESPONSE_TIMEOUT_MS=30000                   # Response timeout (default: 30000)
MAX_CONCURRENT_REQUESTS=100                 # Max concurrent requests (default: 100)
PERFORMANCE_MONITORING_ENABLED=true        # Performance tracking (default: false)
```

### Error Handling Configuration
```bash
# Error handling and recovery
SCORING_ERROR_RECOVERY_ENABLED=true        # Automatic error recovery (default: true)
MAX_RETRY_ATTEMPTS=3                        # Maximum retry attempts (default: 3)
RETRY_BACKOFF_MS=1000                      # Retry backoff time (default: 1000)
FALLBACK_SCORING_ENABLED=true             # Fallback scoring on errors (default: true)

# Logging and debugging
SCORING_DEBUG_ENABLED=false                # Debug logging for scoring (default: false)
ERROR_REPORTING_ENABLED=true              # Error reporting to external services (default: false)
```

---

## Phase 8: Advanced Telemetry & ML Analytics Configuration

Phase 8 introduces comprehensive telemetry, learning analytics, and ML-driven optimization.

### Core Telemetry Configuration
```bash
# Essential telemetry features
TELEMETRY_ENABLED=true                      # Enable telemetry collection (default: false)
ML_OPTIMIZATION_ENABLED=true               # ML-driven recommendations (default: false)
INTELLIGENT_ALERTING_ENABLED=true          # Predictive alerting (default: false)

# Analytics configuration
ANALYTICS_RETENTION_DAYS=90                # Data retention period (default: 90)
ANALYTICS_BATCH_SIZE=100                   # Event batch size (default: 100)
ANALYTICS_FLUSH_INTERVAL_MS=5000           # Flush interval (default: 5000)
```

### ML & AI Configuration  
```bash
# Machine Learning features
ML_MODEL_UPDATE_INTERVAL=86400             # Model update interval in seconds (default: 24h)
ML_PREDICTION_CONFIDENCE_THRESHOLD=0.7     # Minimum confidence for predictions (default: 0.7)
ML_TRAINING_ENABLED=false                  # Enable model training (default: false)

# Advanced analytics
LEARNING_ANALYTICS_ENABLED=true            # Educational insights generation (default: false)
PREDICTIVE_MODELING_ENABLED=true           # Learning outcome predictions (default: false)
CONTENT_OPTIMIZATION_ENABLED=true          # Content effectiveness optimization (default: false)
```

### Data & Privacy Configuration
```bash
# Privacy and compliance
PII_REDACTION_ENABLED=true                 # Automatic PII redaction (default: true)
DATA_ENCRYPTION_ENABLED=true               # Encrypt sensitive data (default: true)
GDPR_COMPLIANCE_MODE=true                  # GDPR compliance features (default: false)
USER_CONSENT_REQUIRED=true                 # Require user consent (default: false)

# Data warehouse configuration (optional)
DATA_WAREHOUSE_URL=                         # External data warehouse URL
DATA_EXPORT_ENABLED=false                  # Enable data export (default: false)
EXTERNAL_ANALYTICS_ENABLED=false           # External analytics integration (default: false)
```

### Executive Reporting Configuration
```bash
# Business intelligence features
EXECUTIVE_REPORTING_ENABLED=true           # Executive dashboard (default: false)
BUSINESS_METRICS_ENABLED=true             # Business intelligence (default: false)
ROI_CALCULATION_ENABLED=true              # ROI analysis (default: false)
COST_TRACKING_ENABLED=true                # Cost analysis (default: false)

# Report generation
REPORT_GENERATION_ENABLED=true            # Automated report generation (default: false)
PDF_EXPORT_ENABLED=true                   # PDF report export (default: false)
SCHEDULED_REPORTS_ENABLED=false           # Scheduled report delivery (default: false)
```

---

## Production Environment Configurations

### Complete Production Configuration (All Phases)
```bash
# Core async functionality (Phases 3-5) - REQUIRED
QTI_SPLIT_GENERATION_ENABLED=true          # Phase 3: Split question generation
QTI_ASYNC_ASSESSMENTS_ENABLED=true         # Phase 4: Async assessment creation
QTI_ASYNC_STORY_SAVE_ENABLED=true          # Phase 5: Async story save orchestration

# Client-side features (Phase 6)
NEXT_PUBLIC_QTI_SPLIT_GENERATION=true      # Progressive UI loading
NEXT_PUBLIC_ASYNC_UI_ENABLED=true          # Async-aware components
NEXT_PUBLIC_PROGRESSIVE_LOADING=true       # Progressive content loading

# Performance optimization (Phase 7)
QTI_PERFORMANCE_CACHING_ENABLED=true       # Smart caching system
QTI_ADVANCED_ANALYTICS_ENABLED=true        # Real-time metrics
QTI_ADMIN_METRICS_ENABLED=true             # Admin dashboard

# Advanced features (Phase 8)
TELEMETRY_ENABLED=true                      # Comprehensive telemetry
ML_OPTIMIZATION_ENABLED=true               # ML-driven recommendations
INTELLIGENT_ALERTING_ENABLED=true          # Predictive monitoring
LEARNING_ANALYTICS_ENABLED=true            # Educational insights
```

---

## Environment-Specific Configurations

### Development Environment
```bash
NODE_ENV=development

# Core features enabled for testing
QTI_SPLIT_GENERATION_ENABLED=true
QTI_ASYNC_ASSESSMENTS_ENABLED=true
QTI_ASYNC_STORY_SAVE_ENABLED=true
QTI_PERFORMANCE_CACHING_ENABLED=true
TELEMETRY_ENABLED=true

# Debug and development features
SCORING_DEBUG_ENABLED=true
TELEMETRY_DEBUG_MODE=true
PERFORMANCE_MONITORING_ENABLED=true
ML_TRAINING_ENABLED=false                  # Disable in dev

# Local services
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_TIMEBACK_API_URL=http://localhost:8080

# Relaxed security for development
GDPR_COMPLIANCE_MODE=false
DATA_ENCRYPTION_ENABLED=false
```

### Staging Environment
```bash
NODE_ENV=staging

# All production features enabled for testing
QTI_SPLIT_GENERATION_ENABLED=true
QTI_ASYNC_ASSESSMENTS_ENABLED=true
QTI_ASYNC_STORY_SAVE_ENABLED=true
QTI_PERFORMANCE_CACHING_ENABLED=true
QTI_ADVANCED_ANALYTICS_ENABLED=true
TELEMETRY_ENABLED=true
ML_OPTIMIZATION_ENABLED=true
INTELLIGENT_ALERTING_ENABLED=true
LEARNING_ANALYTICS_ENABLED=true

# Production-like security
GDPR_COMPLIANCE_MODE=true
PII_REDACTION_ENABLED=true
DATA_ENCRYPTION_ENABLED=true
```

### Production Environment  
```bash
NODE_ENV=production

# All features enabled for maximum functionality
QTI_SPLIT_GENERATION_ENABLED=true
QTI_ASYNC_ASSESSMENTS_ENABLED=true
QTI_ASYNC_STORY_SAVE_ENABLED=true
QTI_PERFORMANCE_CACHING_ENABLED=true
QTI_ADVANCED_ANALYTICS_ENABLED=true
QTI_ADMIN_METRICS_ENABLED=true
TELEMETRY_ENABLED=true
ML_OPTIMIZATION_ENABLED=true
INTELLIGENT_ALERTING_ENABLED=true
LEARNING_ANALYTICS_ENABLED=true
EXECUTIVE_REPORTING_ENABLED=true

# Production performance settings
ANALYTICS_RETENTION_DAYS=90
ML_PREDICTION_CONFIDENCE_THRESHOLD=0.8
CACHE_TTL_SECONDS=300
MAX_CONCURRENT_REQUESTS=200

# Production security (maximum security)
GDPR_COMPLIANCE_MODE=true
PII_REDACTION_ENABLED=true
DATA_ENCRYPTION_ENABLED=true
USER_CONSENT_REQUIRED=true
ERROR_REPORTING_ENABLED=true
```

---

## Production Environment

Environment variables are configured in `sst.config.ts` for deployed environments. Secrets (API keys) are managed through SST Secrets.

### Production Readiness Checklist
- [ ] All required API keys configured and valid
- [ ] Phase dependencies correctly configured (3→4→5 sequence)
- [ ] Redis cache configured for Phase 7 performance features
- [ ] Privacy settings configured for GDPR compliance (Phase 8)
- [ ] Feature flags validated for target environment
- [ ] Performance monitoring and analytics enabled
