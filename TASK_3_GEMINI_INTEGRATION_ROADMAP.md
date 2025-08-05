# Task #3: Google Gemini Pro Integration - Detailed Roadmap Checklist

## **Overview**
This roadmap provides a step-by-step implementation plan for integrating Google Gemini Pro API into the Teaching Tales story generation system, replacing the current mock implementation with real AI-powered story generation.

## **🎯 Progress Status**
- ✅ **Phase 1: Foundation Setup & Configuration** - COMPLETE
  - API connection verified with Gemini 1.5 Flash
  - Complete AI module architecture implemented
  - Environment configured with all necessary variables
  - Comprehensive error handling and testing infrastructure
- 🔄 **Phase 2: Prompt Engineering & Templates** - READY TO START
- ⏳ **Phase 3: Core Story Generation Service** - PENDING
- ⏳ **Phase 4: Retry Logic & Resilience** - PENDING
- ⏳ **Phase 5: Response Validation & Quality Control** - PENDING
- ⏳ **Phase 6: Error Handling & Testing** - PENDING

## **Branch Strategy**
```bash
git checkout -b feature/gemini-pro-integration
```

---

## **Phase 1: Foundation Setup & Configuration**
*Priority: Critical | Duration: 2-3 hours*

### **1.1 Environment & Dependencies Setup**
- [x] **Install Google GenAI SDK**
  ```bash
  npm install @google/generative-ai
  ```
- [x] **Update package.json** with new dependency
- [x] **Create environment variable structure**
  - [x] Add `GOOGLE_AI_API_KEY` to environment configuration
  - [x] Add `GEMINI_MODEL_NAME=gemini-1.5-flash` (optimized for development with higher rate limits)
  - [x] Add `GEMINI_MAX_TOKENS=4096` for cost control
- [x] **Update src/lib/config.ts** with Gemini configuration
  ```typescript
  export const GEMINI_CONFIG = {
    API_KEY: process.env.GOOGLE_AI_API_KEY,
    MODEL_NAME: process.env.GEMINI_MODEL_NAME || 'gemini-1.5-pro',
    MAX_TOKENS: parseInt(process.env.GEMINI_MAX_TOKENS || '4096'),
    TEMPERATURE: 0.7,
    TOP_P: 0.9
  };
  ```

### **1.2 API Client Architecture**
- [x] **Create src/lib/ai/ directory structure**
  ```
  src/lib/ai/
  ├── gemini-client.ts
  ├── prompt-templates.ts
  ├── types.ts
  ├── connection-test.ts
  └── index.ts
  ```
- [x] **Implement base Gemini client** (`gemini-client.ts`)
  - [x] Initialize GoogleGenerativeAI instance
  - [x] Configure model parameters
  - [x] Add connection validation method
  - [x] Add comprehensive error handling with AIServiceError classification
- [x] **Define TypeScript interfaces** (`types.ts`)
  ```typescript
  interface StoryGenerationRequest {
    universe: string;
    character: string;
    spark: string;
    gradeLevel: string;
    studentId: string;
    previousChapter?: string;
    selectedPath?: string;
  }
  
  interface StoryGenerationResponse {
    title: string;
    content: string;
    sections: StorySection[];
    questions: ComprehensionQuestion[];
    wordCount: number;
    readingTime: string;
  }
  ```

### **1.3 Configuration Testing**
- [x] **Create basic connection test**
- [x] **Verify API key authentication**
- [x] **Test model availability** (Gemini 1.5 Flash confirmed working)
- [x] **Validate environment setup**
- [x] **Created comprehensive test scripts**
  - `test-gemini-setup.js` - Setup verification
  - `test-api-connection.js` - API connection test (Pro model)
  - `test-api-connection-flash.js` - API connection test (Flash model - working)

**🔍 Key Learnings from Phase 1:**
- Gemini 1.5 Pro has very restrictive free tier limits (2 RPM, 50 RPD)
- Gemini 1.5 Flash offers much better development experience (15 RPM, 1,500 RPD)
- API key authentication working correctly
- Error handling successfully classifies rate limits vs other errors
- Environment configuration preserved existing variables while adding Gemini config

---

## **Phase 2: Prompt Engineering & Templates**
*Priority: High | Duration: 3-4 hours*

### **2.1 Analyze Current Story Requirements**
- [ ] **Review existing PRD requirements** (`.taskmaster/docs/prd-qti-integration.txt`)
- [ ] **Study current mock story structure** in loading page
- [ ] **Map QTI integration requirements** to story format
- [ ] **Identify educational content requirements**
  - Reading comprehension questions
  - Grade-appropriate vocabulary
  - Story structure (sections with unlocking mechanism)

### **2.2 Design Prompt Templates**
- [ ] **Create base story generation template** (`prompt-templates.ts`)
  ```typescript
  export const STORY_GENERATION_TEMPLATE = `
  Generate an educational children's story with the following requirements:
  
  STORY PARAMETERS:
  - Universe: {universe}
  - Main Character: {character}
  - Story Premise: {spark}
  - Target Grade Level: {gradeLevel}
  - Word Count Target: 800-1200 words
  
  STRUCTURE REQUIREMENTS:
  1. Create exactly 5 story sections
  2. Each section should be 160-240 words
  3. End each section with a natural pause/cliffhanger
  4. Include age-appropriate vocabulary and themes
  
  EDUCATIONAL INTEGRATION:
  For each section, create 2 comprehension questions:
  - 1 literal comprehension question (what happened?)
  - 1 inferential question (why/how/what if?)
  
  OUTPUT FORMAT: Return as JSON with this exact structure:
  {
    "title": "Story title",
    "sections": [
      {
        "id": 1,
        "content": "Section text here...",
        "questions": [
          {
            "id": "q1_1",
            "type": "multiple_choice",
            "question": "Question text?",
            "options": ["A", "B", "C", "D"],
            "correct": 0,
            "explanation": "Why this is correct"
          }
        ]
      }
    ],
    "wordCount": 1000,
    "readingTime": "4 minutes"
  }
  `;
  ```
- [ ] **Create continuation story template** for multi-chapter stories
- [ ] **Create prompt validation helper functions**
- [ ] **Add template variable substitution logic**

### **2.3 Prompt Optimization**
- [ ] **Test prompts with different universes/characters**
- [ ] **Validate JSON output consistency**
- [ ] **Optimize for token efficiency**
- [ ] **Add prompt variation for different grade levels**

---

## **Phase 3: Core Story Generation Service**
*Priority: Critical | Duration: 4-5 hours*

### **3.1 Implement Story Generation Service**
- [ ] **Create StoryGenerationService class** (`src/lib/ai/story-generation-service.ts`)
  ```typescript
  export class StoryGenerationService {
    private geminiClient: GoogleGenerativeAI;
    private model: GenerativeModel;
    
    async generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse>
    async generateContinuation(request: ContinuationRequest): Promise<StoryGenerationResponse>
    private buildPrompt(request: StoryGenerationRequest): string
    private validateResponse(response: any): StoryGenerationResponse
  }
  ```
- [ ] **Implement generateStory method**
  - [ ] Build prompt from template
  - [ ] Call Gemini API
  - [ ] Parse and validate JSON response
  - [ ] Handle malformed responses
- [ ] **Add response post-processing**
  - [ ] Validate story structure
  - [ ] Ensure question format compliance
  - [ ] Calculate reading metrics
  - [ ] Sanitize content for age-appropriateness

### **3.2 Integration with Existing Flow**
- [ ] **Update loading page** (`src/app/create-book/loading/page.tsx`)
  - [ ] Replace setTimeout mock with real API call
  - [ ] Import StoryGenerationService
  - [ ] Update generateStory function
  - [ ] Maintain existing error handling structure
  - [ ] Preserve OneRoster student integration
- [ ] **Update story metadata handling**
  - [ ] Store generated story data properly
  - [ ] Update localStorage structure if needed
  - [ ] Ensure compatibility with reading interface

### **3.3 Service Testing**
- [ ] **Create unit tests for service methods**
- [ ] **Test with various input combinations**
- [ ] **Validate output format consistency**
- [ ] **Test error scenarios**

---

## **Phase 4: Retry Logic & Resilience**
*Priority: High | Duration: 2-3 hours*

### **4.1 Implement Retry Mechanism**
- [ ] **Create RetryManager class** (`src/lib/ai/retry-manager.ts`)
  ```typescript
  export class RetryManager {
    async executeWithRetry<T>(
      operation: () => Promise<T>,
      options: RetryOptions
    ): Promise<T>
    private calculateBackoff(attempt: number): number
    private shouldRetry(error: any, attempt: number): boolean
  }
  ```
- [ ] **Add exponential backoff logic**
  - Base delay: 1000ms
  - Max delay: 30000ms
  - Max attempts: 3
  - Jitter for rate limit distribution
- [ ] **Implement retry conditions**
  - Network errors (ECONNRESET, ETIMEDOUT)
  - Rate limit errors (429)
  - Temporary server errors (5xx)
  - Exclude permanent errors (401, 403, 400)

### **4.2 Rate Limit Handling**
- [ ] **Add rate limit detection**
- [ ] **Implement backoff for rate limits**
- [ ] **Add quota tracking (optional)**
- [ ] **Log rate limit events for monitoring**

### **4.3 Integration with Story Service**
- [ ] **Wrap API calls with retry logic**
- [ ] **Add timeout handling**
- [ ] **Implement circuit breaker pattern (optional)**
- [ ] **Add retry metrics/logging**

---

## **Phase 5: Response Validation & Quality Control**
*Priority: High | Duration: 2-3 hours*

### **5.1 Response Validation System**
- [ ] **Create ResponseValidator class** (`src/lib/ai/response-validator.ts`)
  ```typescript
  export class ResponseValidator {
    validateStoryResponse(response: any): ValidationResult
    validateStructure(response: any): boolean
    validateContent(response: any): boolean
    validateQuestions(questions: any[]): boolean
    sanitizeContent(content: string): string
  }
  ```
- [ ] **Implement structure validation**
  - Required fields present
  - Correct data types
  - Expected array lengths
  - Valid question format
- [ ] **Add content quality checks**
  - Age-appropriate language
  - Reasonable word counts
  - Story coherence checks
  - Educational value validation

### **5.2 Fallback Mechanisms**
- [ ] **Implement response repair logic**
  - Fix common JSON formatting issues
  - Regenerate malformed questions
  - Adjust word counts if needed
- [ ] **Add fallback content**
  - Default story templates for complete failures
  - Generic comprehension questions
  - Error state handling
- [ ] **Create validation reporting**
  - Log validation failures
  - Track success rates
  - Monitor content quality metrics

### **5.3 Content Safety**
- [ ] **Implement content filtering**
- [ ] **Add inappropriate content detection**
- [ ] **Ensure educational standards compliance**
- [ ] **Add parental guidance considerations**

---

## **Phase 6: Error Handling & Testing**
*Priority: Critical | Duration: 3-4 hours*

### **6.1 Comprehensive Error Handling**
- [ ] **Create AIError hierarchy** (`src/lib/ai/errors.ts`)
  ```typescript
  export class AIServiceError extends Error
  export class APIConnectionError extends AIServiceError
  export class RateLimitError extends AIServiceError
  export class ValidationError extends AIServiceError
  export class ContentError extends AIServiceError
  ```
- [ ] **Implement error classification**
  - Network errors
  - API errors
  - Validation errors
  - Content safety errors
- [ ] **Add user-friendly error messages**
  - Clear explanations for each error type
  - Actionable recovery suggestions
  - Graceful degradation paths
- [ ] **Update UI error handling**
  - Display appropriate error messages
  - Provide retry options
  - Fallback to mock generation if needed

### **6.2 Logging & Monitoring**
- [ ] **Add structured logging**
  ```typescript
  const logger = {
    info: (message: string, meta?: object) => console.log(JSON.stringify({level: 'info', message, ...meta})),
    error: (message: string, error?: Error, meta?: object) => console.error(JSON.stringify({level: 'error', message, error: error?.message, ...meta})),
    warn: (message: string, meta?: object) => console.warn(JSON.stringify({level: 'warn', message, ...meta}))
  };
  ```
- [ ] **Track key metrics**
  - API response times
  - Success/failure rates
  - Token usage
  - Error frequencies
- [ ] **Add performance monitoring**
  - Story generation duration
  - Token consumption tracking
  - Cache hit rates (if implemented)

### **6.3 Testing Suite**
- [ ] **Unit Tests**
  - [ ] Test StoryGenerationService methods
  - [ ] Test prompt template generation
  - [ ] Test response validation logic
  - [ ] Test retry mechanisms
  - [ ] Test error handling paths
- [ ] **Integration Tests**
  - [ ] Test end-to-end story generation flow
  - [ ] Test with various input combinations
  - [ ] Test error scenarios and recovery
  - [ ] Test with OneRoster integration
- [ ] **Mock API Testing**
  - [ ] Create Gemini API mocks for testing
  - [ ] Test rate limit scenarios
  - [ ] Test network failure scenarios
  - [ ] Test malformed response handling
- [ ] **Performance Tests**
  - [ ] Test response times under load
  - [ ] Test memory usage
  - [ ] Test concurrent request handling

### **6.4 Quality Assurance**
- [ ] **Manual Testing Scenarios**
  - [ ] Test different universe/character combinations
  - [ ] Verify story quality and coherence
  - [ ] Check educational content appropriateness
  - [ ] Validate question quality and relevance
- [ ] **Edge Case Testing**
  - [ ] Very long character/universe names
  - [ ] Special characters in inputs
  - [ ] Network interruptions during generation
  - [ ] API quota exhaustion scenarios
- [ ] **User Experience Testing**
  - [ ] Test loading states and feedback
  - [ ] Verify error message clarity
  - [ ] Check story navigation flow
  - [ ] Validate mobile responsiveness

---

## **Phase 7: Documentation & Deployment Preparation**
*Priority: Medium | Duration: 1-2 hours*

### **7.1 Code Documentation**
- [ ] **Add comprehensive JSDoc comments**
- [ ] **Document API interfaces and types**
- [ ] **Create usage examples**
- [ ] **Document configuration options**

### **7.2 Environment Setup Documentation**
- [ ] **Create setup guide for API keys**
- [ ] **Document environment variables**
- [ ] **Add troubleshooting guide**
- [ ] **Create deployment checklist**

### **7.3 Team Handoff Preparation**
- [ ] **Create integration summary**
- [ ] **Document breaking changes (if any)**
- [ ] **Prepare demo scenarios**
- [ ] **Create rollback plan**

---

## **Quality Gates & Validation**

### **Before Phase Completion:**
- [x] **Phase 1**: API connection successful, environment configured ✅
  - Google GenAI SDK installed and configured
  - API key authentication verified with Gemini 1.5 Flash
  - Complete AI module architecture implemented
  - Comprehensive error handling and validation systems
  - Rate limit handling and model optimization
- [ ] **Phase 2**: Prompt generates valid story structure consistently
- [ ] **Phase 3**: End-to-end story generation working in UI
- [ ] **Phase 4**: Retry logic handles failures gracefully
- [ ] **Phase 5**: Response validation catches and fixes issues
- [ ] **Phase 6**: All tests pass, error handling comprehensive

### **Final Acceptance Criteria:**
- [ ] **Functional**: Story generation works end-to-end
- [ ] **Quality**: Generated stories meet educational standards
- [ ] **Performance**: Response time < 30 seconds for story generation
- [ ] **Reliability**: Handles API failures without breaking user experience
- [ ] **Security**: API keys properly secured, no sensitive data logged
- [ ] **Maintainability**: Code is well-documented and testable

---

## **Risk Mitigation**

### **Technical Risks:**
- **API Rate Limits**: Implement retry logic and usage monitoring
- **Response Quality**: Add validation and fallback mechanisms
- **Network Issues**: Add timeout handling and offline graceful degradation
- **Cost Control**: Implement token limits and usage tracking

### **Business Risks:**
- **API Changes**: Use stable model versions, monitor deprecation notices
- **Content Safety**: Implement content filtering and age-appropriate checks
- **Performance**: Add caching and optimization strategies
- **Team Dependencies**: Ensure clear documentation and knowledge transfer

---

## **Success Metrics**
- [ ] **Story generation success rate > 95%**
- [ ] **Average response time < 20 seconds**
- [ ] **User satisfaction with story quality**
- [ ] **Zero breaking changes to existing functionality**
- [ ] **Comprehensive test coverage > 85%**

This roadmap ensures a systematic, low-risk implementation that builds incrementally and maintains compatibility with existing systems while providing a robust foundation for AI-powered story generation.