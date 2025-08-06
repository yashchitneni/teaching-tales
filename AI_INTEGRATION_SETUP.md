# Google Gemini AI Integration Setup Guide

## Overview

This guide covers the setup and configuration of Google Gemini AI integration for Teaching Tales story generation. The integration provides AI-powered educational story creation with comprehension questions and grade-level appropriate content.

## Prerequisites

- Node.js 18+ installed
- Google AI Studio account and API key
- Teaching Tales project environment set up

## Environment Configuration

### 1. Google AI API Key Setup

1. **Get your API key:**
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Sign in with your Google account
   - Create a new API key or use an existing one
   - Copy the API key (starts with `AIza...`)

2. **Add to environment variables:**

   **For local development (.env.local):**
   ```env
   # Google AI Configuration
   GOOGLE_AI_API_KEY=your_actual_api_key_here
   GEMINI_MODEL_NAME=gemini-1.5-flash
   GEMINI_MAX_TOKENS=4096
   ```

   **For production deployment:**
   Set the environment variables in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - AWS/Docker: Set environment variables in your deployment configuration

### 2. Model Configuration

The integration supports multiple Gemini models:

- **gemini-1.5-flash** (Recommended for development)
  - Rate limits: 15 RPM, 1,500 RPD
  - Faster responses, lower cost
  - Good for testing and development

- **gemini-1.5-pro** (Production option)
  - Rate limits: 2 RPM, 50 RPD (free tier)
  - Higher quality responses
  - Better for production with paid plan

## Installation

### 1. Install Dependencies

The Google GenAI SDK is already included in package.json:

```bash
npm install
# or
bun install
```

### 2. Verify Installation

Run the connection test to verify your setup:

```bash
# Test basic API connection
node test-api-connection-flash.js

# Test story generation
node test-story-beats.js
```

## Configuration Options

### GEMINI_CONFIG Settings

Located in `src/lib/config.ts`:

```typescript
export const GEMINI_CONFIG = {
  API_KEY: process.env.GOOGLE_AI_API_KEY,
  MODEL_NAME: process.env.GEMINI_MODEL_NAME || 'gemini-1.5-pro',
  MAX_TOKENS: parseInt(process.env.GEMINI_MAX_TOKENS || '4096'),
  TEMPERATURE: 0.7,        // Creativity level (0.0-1.0)
  TOP_P: 0.9,             // Response diversity
  MAX_RETRIES: 3,         // Retry attempts
  BASE_DELAY: 1000,       // Initial retry delay (ms)
  MAX_DELAY: 30000        // Maximum retry delay (ms)
};
```

### Retry Configuration

The integration includes robust retry logic:

- **Rate Limit Handling**: Automatically retries on rate limit errors
- **Network Error Recovery**: Retries transient network failures
- **Exponential Backoff**: Delays increase: 1s → 2s → 4s (with jitter)
- **Smart Error Classification**: Non-retryable errors (invalid API key) fail immediately

## Usage Examples

### Basic Story Generation

```typescript
import { StoryGenerationService } from '@/lib/ai';

const service = new StoryGenerationService();

const story = await service.generateStory({
  universe: 'Pokemon',
  character: 'Pikachu',
  spark: 'discovers a mysterious glowing Pokeball',
  gradeLevel: '4-5',
  studentId: 'student-123'
});

console.log(story.title);           // "Pikachu's Mysterious Discovery"
console.log(story.sections.length); // 5
console.log(story.wordCount);       // ~1000
```

### Story Continuation

```typescript
const continuation = await service.generateContinuation({
  universe: 'Pokemon',
  character: 'Pikachu',
  spark: 'continues exploring the mysterious cave',
  gradeLevel: '4-5',
  studentId: 'student-123',
  previousChapter: 'Previous story content...',
  selectedPath: 'explore_deeper',
  storyContext: {
    title: 'Pikachu\'s Adventure',
    previousSections: [/* previous sections */]
  }
});
```

### Direct API Usage

```typescript
import { GeminiClient } from '@/lib/ai';

const client = new GeminiClient();

// Basic content generation
const response = await client.generateContent('Write a short poem about friendship');

// With custom configuration
const response = await client.generateContent(
  'Create an educational story about science',
  { temperature: 0.8, maxOutputTokens: 2000 }
);
```

## Grade Level Guidelines

The system supports four grade level ranges:

### K-1 (Kindergarten - 1st Grade)
- Simple sentences and vocabulary
- Gentle adventures and mysteries
- Sight words and basic phonics
- 2-3 sentence paragraphs

### 2-3 (2nd - 3rd Grade)
- Descriptive language and dialogue
- Mild challenges and problem-solving
- Context clues for vocabulary
- 4-5 sentence paragraphs

### 4-5 (4th - 5th Grade)
- Complex sentence structures
- Character development and emotions
- Plot twists and suspense
- 5-7 sentence paragraphs

### 6-8 (6th - 8th Grade)
- Sophisticated vocabulary and themes
- Moral dilemmas and deeper meanings
- Literary techniques and symbolism
- 7-10 sentence paragraphs

## Troubleshooting

### Common Issues

#### 1. "GOOGLE_AI_API_KEY environment variable is required"
- **Cause**: API key not set or incorrect
- **Solution**: Verify your `.env.local` file contains the correct API key
- **Check**: Ensure no extra spaces or quotes around the key

#### 2. Rate limit errors (429)
- **Cause**: Exceeded API rate limits
- **Solution**: The system automatically retries with backoff
- **Prevention**: Use `gemini-1.5-flash` for development (higher limits)

#### 3. "Invalid API key" errors
- **Cause**: API key is incorrect or expired
- **Solution**: Generate a new API key in Google AI Studio
- **Verification**: Test with the connection script

#### 4. Content blocked by safety filters
- **Cause**: Prompt content triggered safety filters
- **Solution**: Modify the story parameters to be more appropriate
- **Note**: The system uses minimal safety filtering for educational content

#### 5. Network connection errors
- **Cause**: Internet connectivity or DNS issues
- **Solution**: Check internet connection, system retries automatically
- **Monitoring**: Check console logs for retry attempts

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
```

This provides:
- Detailed API request/response logging
- Retry attempt tracking
- Validation step debugging
- Performance timing information

### Testing Your Setup

1. **Basic Connection Test:**
   ```bash
   node test-api-connection-flash.js
   ```

2. **Story Generation Test:**
   ```bash
   node test-story-beats.js
   ```

3. **Integration Test:**
   - Start the development server: `npm run dev`
   - Navigate to story creation flow
   - Generate a test story
   - Check browser console for logs

## Performance Optimization

### Rate Limit Management
- Use `gemini-1.5-flash` for development (15 RPM vs 2 RPM)
- Implement request queuing for high-volume usage
- Monitor API usage in Google AI Studio

### Response Time Optimization
- Stories typically generate in 10-30 seconds
- Flash model is 2-3x faster than Pro model
- Retry logic adds minimal overhead for successful requests

### Cost Management
- Flash model is significantly cheaper than Pro
- Monitor token usage in Google AI Studio
- Set appropriate `MAX_TOKENS` limits

## Security Best Practices

1. **API Key Protection:**
   - Never commit API keys to version control
   - Use environment variables for all deployments
   - Rotate keys periodically

2. **Content Safety:**
   - System includes built-in content filtering
   - Educational content is pre-validated
   - Grade-appropriate language is enforced

3. **Error Handling:**
   - Sensitive information is never logged
   - API keys are masked in error messages
   - User-friendly error messages for all failure modes

## Production Deployment

### Environment Variables Checklist
- [ ] `GOOGLE_AI_API_KEY` set correctly
- [ ] `GEMINI_MODEL_NAME` configured (recommend `gemini-1.5-flash`)
- [ ] `GEMINI_MAX_TOKENS` set appropriately (4096 recommended)
- [ ] Other Teaching Tales environment variables preserved

### Monitoring
- Monitor API usage in Google AI Studio dashboard
- Track error rates and retry patterns
- Monitor story generation success rates
- Set up alerts for API quota approaching limits

### Scaling Considerations
- Free tier limits: Consider paid plan for production
- Implement request queuing for high concurrent usage
- Consider caching for repeated similar requests
- Monitor and optimize prompt token usage

## Support and Resources

- **Google AI Documentation**: https://ai.google.dev/docs
- **API Studio**: https://aistudio.google.com/
- **Rate Limits**: https://ai.google.dev/pricing
- **Teaching Tales Documentation**: See project README.md

For technical issues with the integration, check:
1. Console logs for detailed error information
2. API Studio dashboard for quota and usage
3. Network connectivity and DNS resolution
4. Environment variable configuration