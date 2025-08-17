# Question Generation Service - Usage Guide

The `QuestionGenerationService` provides AI-powered generation of comprehension questions for individual story sections. This service is designed for Phase 3 API integration and follows existing codebase patterns.

## Features

- ✅ Grade-level appropriate question generation
- ✅ Comprehensive input validation and sanitization  
- ✅ Phase 1 validator integration for quality assurance
- ✅ Robust retry logic with exponential backoff
- ✅ Detailed logging for production monitoring
- ✅ Backward-compatible with existing UI components
- ✅ Enhanced questions with optional metadata fields

## Quick Start

```typescript
import { QuestionGenerationService } from '@/lib/ai';

const service = new QuestionGenerationService();

const result = await service.generateQuestionsForSection({
  sectionContent: "Ruby the fox discovered a magical crystal in the enchanted forest...",
  sectionIndex: 0,
  gradeLevel: "4-5"
});

console.log(result.questions); // EnhancedComprehensionQuestion[]
console.log(result.metadata.validationPassed); // true
```

## Basic Usage

### Simple Question Generation

```typescript
import { QuestionGenerationService, SectionQuestionGenInput } from '@/lib/ai';

const service = new QuestionGenerationService();

const input: SectionQuestionGenInput = {
  sectionContent: `Once upon a time, in a magical forest, there lived a brave little fox named Ruby. 
                   Ruby was known throughout the forest for her curiosity and kind heart. 
                   One sunny morning, while exploring near the ancient oak tree, Ruby discovered 
                   something extraordinary - a crystal that glowed with a mysterious blue light.`,
  sectionIndex: 0,
  gradeLevel: "2-3"
};

try {
  const result = await service.generateQuestionsForSection(input);
  
  console.log(`Generated ${result.questions.length} questions for section ${result.sectionIndex}`);
  console.log(`Generation took ${result.metadata.generationTimeMs}ms`);
  console.log(`Validation passed: ${result.metadata.validationPassed}`);
  
  result.questions.forEach((question, index) => {
    console.log(`Question ${index + 1}: ${question.question}`);
    console.log(`Type: ${question.questionType}`);
    console.log(`Difficulty: ${question.difficultyLevel}`);
  });
} catch (error) {
  console.error('Question generation failed:', error.message);
}
```

### Advanced Configuration with Constraints

```typescript
const advancedInput: SectionQuestionGenInput = {
  sectionContent: "The dragon soared high above the mountain peaks...",
  sectionIndex: 2,
  gradeLevel: "6-8",
  constraints: {
    questionCount: 3,
    questionTypes: ['comprehension', 'vocabulary', 'inference'],
    maxQuestionLength: 80,
    maxOptionLength: 40
  },
  storyMetadata: {
    universe: "Fantasy Adventure",
    character: "Sir Brave Knight",
    spark: "encounters a friendly dragon",
    studentId: "student-123"
  }
};

const result = await service.generateQuestionsForSection(advancedInput);
```

## Grade Level Support

The service supports all standard grade levels with appropriate question complexity:

```typescript
// Kindergarten - Grade 1
const k1Result = await service.generateQuestionsForSection({
  sectionContent: "The cat sat on the mat. The cat was happy.",
  sectionIndex: 0,
  gradeLevel: "K-1"
});

// Elementary - Grades 2-3  
const elementary = await service.generateQuestionsForSection({
  sectionContent: "Sarah planted seeds in her garden. She watered them every day...",
  sectionIndex: 1,
  gradeLevel: "2-3"
});

// Intermediate - Grades 4-5
const intermediate = await service.generateQuestionsForSection({
  sectionContent: "The ancient civilization had developed sophisticated engineering techniques...",
  sectionIndex: 2,
  gradeLevel: "4-5"
});

// Advanced - Grades 6-8
const advanced = await service.generateQuestionsForSection({
  sectionContent: "The protagonist's internal conflict reflected the broader societal tensions...",
  sectionIndex: 3,
  gradeLevel: "6-8"
});
```

## Error Handling

The service provides detailed error information for different failure scenarios:

```typescript
try {
  const result = await service.generateQuestionsForSection(input);
} catch (error) {
  if (error instanceof AIServiceError) {
    switch (error.code) {
      case 'RATE_LIMIT':
        console.error('Rate limit exceeded. Please try again later.');
        break;
      case 'NETWORK_ERROR':
        console.error('Network connectivity issues. Check your connection.');
        break;
      case 'VALIDATION_ERROR':
        console.error('Generated questions failed quality validation.');
        break;
      case 'PARSE_ERROR':
        console.error('AI response could not be parsed as valid JSON.');
        break;
      case 'AUTH_ERROR':
        console.error('Authentication failed. Check your API credentials.');
        break;
      case 'CONTENT_BLOCKED':
        console.error('Content was blocked by safety filters.');
        break;
      default:
        console.error('Unknown error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Integration with Existing UI Components

Generated questions are fully compatible with existing `ComprehensionQuestion` interfaces:

```typescript
// Generated questions can be directly assigned to StorySection
const result = await service.generateQuestionsForSection(input);

const storySection: StorySection = {
  id: 1,
  content: input.sectionContent,
  questions: result.questions // ✅ Type-safe assignment
};

// Access enhanced fields when needed
const enhancedQuestion = result.questions[0] as EnhancedComprehensionQuestion;
console.log(enhancedQuestion.questionType); // 'comprehension' | 'vocabulary' | 'inference'
console.log(enhancedQuestion.difficultyLevel); // 1-5
```

## Monitoring and Analytics

The service provides comprehensive logging for production monitoring:

```typescript
// Enable detailed logging in development
process.env.NODE_ENV = 'development';

const result = await service.generateQuestionsForSection(input);

// Logs include structured data for monitoring:
// 🤖 Starting question generation for section 0 (4-5) { sectionIndex: 0, gradeLevel: "4-5", ... }
// 📝 Question generation attempt 1/3 for section 0 { attempt: 1, maxRetries: 3, ... }
// 🔍 Validating generated questions for section 0 { sectionIndex: 0, questionCount: 2, ... }
// ✅ Question validation passed for section 0 { sectionIndex: 0, warnings: [], ... }
// ✅ Question generation successful on attempt 1 (1247ms) { duration: 1247, ... }
```

## Performance Considerations

```typescript
// For high-volume usage, consider concurrent processing
const sections = [section1, section2, section3];

const results = await Promise.all(
  sections.map((section, index) => 
    service.generateQuestionsForSection({
      sectionContent: section.content,
      sectionIndex: index,
      gradeLevel: "4-5"
    })
  )
);

console.log(`Generated questions for ${results.length} sections`);

// Monitor performance metrics
results.forEach((result, index) => {
  console.log(`Section ${index}: ${result.metadata.generationTimeMs}ms, ${result.metadata.retryCount} retries`);
});
```

## API Integration Ready

The service is designed for seamless Phase 3 API integration:

```typescript
// Express.js API endpoint example
app.post('/api/questions/generate', async (req, res) => {
  try {
    const { sectionContent, sectionIndex, gradeLevel, constraints } = req.body;
    
    const service = new QuestionGenerationService();
    const result = await service.generateQuestionsForSection({
      sectionContent,
      sectionIndex,
      gradeLevel,
      constraints
    });
    
    res.json({
      success: true,
      data: result,
      generationTime: result.metadata.generationTimeMs,
      retryCount: result.metadata.retryCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});
```

## Configuration

Get service information and capabilities:

```typescript
const info = service.getServiceInfo();
console.log(info);
// {
//   name: 'QuestionGenerationService',
//   version: '1.0.0',
//   modelInfo: { name: 'gemini-pro', maxTokens: 4096, temperature: 0.7 },
//   supportedQuestionTypes: ['comprehension', 'vocabulary', 'inference'],
//   maxQuestionsPerSection: 5
// }
```

## Type Definitions

```typescript
interface SectionQuestionGenInput {
  sectionContent: string;
  sectionIndex: number;
  gradeLevel: string;
  constraints?: {
    questionCount?: number;
    questionTypes?: ('comprehension' | 'vocabulary' | 'inference')[];
    maxQuestionLength?: number;
    maxOptionLength?: number;
  };
  storyMetadata?: {
    universe: string;
    character: string;
    spark: string;
    studentId: string;
  };
}

interface SectionQuestionsResult {
  sectionIndex: number;
  questions: EnhancedComprehensionQuestion[];
  metadata: {
    generationTimeMs: number;
    modelUsed: string;
    retryCount: number;
    validationPassed: boolean;
  };
}
```

## Best Practices

1. **Input Validation**: Always validate input before sending to the service
2. **Error Handling**: Implement comprehensive error handling for production use
3. **Monitoring**: Use the structured logging data for monitoring and analytics
4. **Retry Logic**: The service handles retries automatically - don't implement additional retry logic
5. **Grade Levels**: Use standard grade level formats: 'K-1', '2-3', '4-5', '6-8'
6. **Content Length**: Keep section content under 5000 characters for optimal performance
7. **Concurrent Requests**: The service handles concurrent requests efficiently

## Troubleshooting

### Common Issues

**Question Generation Fails**
- Check API credentials in environment variables
- Verify section content is not empty or too long
- Ensure grade level is in correct format

**Validation Errors**
- Generated questions may lack clear text evidence
- Try adjusting constraints or section content
- Check if section content supports comprehension questions

**Performance Issues**
- Monitor generation times via `result.metadata.generationTimeMs`
- Consider implementing request queuing for high volume
- Use concurrent processing for multiple sections

### Debug Mode

Enable detailed logging for debugging:

```typescript
// Set environment variable for detailed logs
process.env.QUESTION_GENERATION_DEBUG = 'true';

const result = await service.generateQuestionsForSection(input);
```
