// Server-only configuration that accesses SST resources
// This file should only be imported in server-side code (API routes, server components)

import { Resource } from "sst";

// Helper function to safely access SST Resources
function getSSResourceValue(resourceName: string): string | undefined {
  try {
    return Resource[resourceName]?.value;
  } catch (error) {
    // SST not available in this environment
    return undefined;
  }
}

// Server-side Gemini configuration
export const GEMINI_SERVER_CONFIG = {
  API_KEY: getSSResourceValue("GOOGLE_AI_API_KEY") || process.env.GOOGLE_AI_API_KEY,
  MODEL_NAME: process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash',
  MAX_TOKENS: parseInt(process.env.GEMINI_MAX_TOKENS || '4096'),
  TEMPERATURE: 0.7,
  TOP_P: 0.9,
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 30000
};

// Server-side Replicate configuration
export const REPLICATE_SERVER_CONFIG = {
  API_KEY: getSSResourceValue("REPLICATE_API_TOKEN") || process.env.REPLICATE_API_TOKEN,
  MODEL_NAME: process.env.REPLICATE_MODEL || 'black-forest-labs/flux-schnell',
  MAX_RETRIES: 3,
  BASE_DELAY: 2000,
  MAX_DELAY: 60000
};

// Server-side S3 configuration
export const S3_SERVER_CONFIG = {
  BUCKET_NAME: Resource.TeachingTalesBucket?.name || process.env.S3_BUCKET_NAME || 'teaching-tales-production-teachingtalesbucketbucket-ncvkkabz'
};

// Server-side Caliper configuration (OAuth2 Client Credentials)
export const CALIPER_SERVER_CONFIG = {
  BASE_URL: process.env.CALIPER_BASE_URL, // e.g., https://caliper.alpha-1edtech.com
  TOKEN_URL: process.env.CALIPER_TOKEN_URL, // e.g., https://alpha-auth-production-idp.auth.us-west-2.amazoncognito.com/oauth2/token
  CLIENT_ID: process.env.CALIPER_CLIENT_ID,
  CLIENT_SECRET: process.env.CALIPER_CLIENT_SECRET,
  SCOPE: process.env.CALIPER_SCOPE, // optional if required by IDP
  SENSOR_IRI: process.env.CALIPER_SENSOR_IRI || 'https://teachtales.app/sensors/caliper-primary',
  VERSION: process.env.CALIPER_VERSION || '1.2'
};