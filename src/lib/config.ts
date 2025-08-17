export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080',
  ONEROSTER_BASE_PATH: '/ims/oneroster/rostering/v1p2',
  QTI_BASE_PATH: '/ims/qti/v3p0'
};

export const FEATURE_FLAGS = {
  QTI_SPLIT_GENERATION_ENABLED: process.env.QTI_SPLIT_GENERATION_ENABLED === 'true',
  QTI_ASYNC_ASSESSMENTS_ENABLED: process.env.QTI_ASYNC_ASSESSMENTS_ENABLED === 'true',
  // Phase 5: Controls async story save orchestration where stories display instantly while questions generate in background
  QTI_ASYNC_STORY_SAVE_ENABLED: process.env.QTI_ASYNC_STORY_SAVE_ENABLED === 'true',
} as const;

export const CLIENT_FEATURE_FLAGS = {
  QTI_SPLIT_GENERATION: process.env.NEXT_PUBLIC_QTI_SPLIT_GENERATION === 'true',
} as const;

// Client-safe Gemini configuration (no SST imports)
export const GEMINI_CONFIG = {
  API_KEY: process.env.GOOGLE_AI_API_KEY,
  MODEL_NAME: process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash',
  MAX_TOKENS: parseInt(process.env.GEMINI_MAX_TOKENS || '4096'),
  TEMPERATURE: 0.7,
  TOP_P: 0.9,
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 30000
};

// Client-safe Replicate configuration (no SST imports)
export const REPLICATE_CONFIG = {
  API_KEY: process.env.REPLICATE_API_TOKEN,
  MODEL_NAME: process.env.REPLICATE_MODEL || 'black-forest-labs/flux-schnell',
  MAX_RETRIES: 3,
  BASE_DELAY: 2000,
  MAX_DELAY: 60000
};
