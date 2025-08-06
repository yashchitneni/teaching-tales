export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080',
  ONEROSTER_BASE_PATH: '/ims/oneroster/rostering/v1p2',
  QTI_BASE_PATH: '/ims/qti/v3p0'
};

// Helper function to safely access SST Resources
function getSSResourceValue(resourceName: string): string | undefined {
  try {
    const { Resource } = require("sst");
    return Resource[resourceName]?.value;
  } catch (error) {
    // SST not available in this environment
    return undefined;
  }
}

export const GEMINI_CONFIG = {
  API_KEY: getSSResourceValue("GOOGLE_AI_API_KEY") || process.env.GOOGLE_AI_API_KEY,
  MODEL_NAME: process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash', // Stable Gemini 2.0 Flash
  MAX_TOKENS: parseInt(process.env.GEMINI_MAX_TOKENS || '4096'),
  TEMPERATURE: 0.7,
  TOP_P: 0.9,
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 30000
};

export const REPLICATE_CONFIG = {
  API_KEY: getSSResourceValue("REPLICATE_API_TOKEN") || process.env.REPLICATE_API_TOKEN,
  MODEL_NAME: process.env.REPLICATE_MODEL || 'black-forest-labs/flux-schnell',
  MAX_RETRIES: 3,
  BASE_DELAY: 2000,
  MAX_DELAY: 60000
};
