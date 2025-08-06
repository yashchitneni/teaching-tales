export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080',
  ONEROSTER_BASE_PATH: '/ims/oneroster/rostering/v1p2',
  QTI_BASE_PATH: '/ims/qti/v3p0'
};

export const GEMINI_CONFIG = {
  API_KEY: process.env.GOOGLE_AI_API_KEY,
  MODEL_NAME: process.env.GEMINI_MODEL_NAME || 'gemini-1.5-pro',
  MAX_TOKENS: parseInt(process.env.GEMINI_MAX_TOKENS || '4096'),
  TEMPERATURE: 0.7,
  TOP_P: 0.9,
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 30000
};
