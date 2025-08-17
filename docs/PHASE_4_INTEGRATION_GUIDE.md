# Phase 4 Integration Guide: Split Generation Architecture

**Purpose**: Guide for integrating the new async questions API with the existing story reading interface  
**Status**: Ready for Phase 4 Implementation  
**Dependencies**: Phase 3 `/api/generate-questions` endpoint (✅ Complete)

## Overview

Phase 4 transforms the reading experience from **synchronous question generation** (questions created with story) to **asynchronous question loading** (questions generated on-demand per section).

### Architecture Changes

#### Before (Phase 1-3): Synchronous Generation
```
Story Generation → Questions Generated → Display Story + Questions
     (slow)              (included)         (immediate)
```

#### After (Phase 4): Asynchronous Generation  
```
Story Generation → Display Story → User Reads Section → Generate Questions → Display Questions
     (fast)        (immediate)      (user-paced)        (on-demand)       (contextual)
```

---

## Integration Points

### 1. Reading Interface (`/book/[bookId]/chapter/[chapterId]`)

#### Current State Analysis
**File**: `src/app/book/[bookId]/chapter/[chapterId]/page.tsx`

**Current Flow:**
1. Load complete story with pre-generated questions
2. Display story content
3. Show questions immediately after each section

**Phase 4 Changes Needed:**
1. Load story content without questions
2. Display story content immediately  
3. Detect when user reaches end of section
4. Trigger async question generation
5. Display loading state during generation
6. Show generated questions when ready

#### Implementation Pattern

```typescript
// New hook for async question loading
const useAsyncQuestions = (sectionContent: string, gradeLevel: string, sectionIndex: number) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateQuestions = useCallback(async () => {
    if (questions.length > 0) return; // Already loaded
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionContent,
          gradeLevel,
          sectionIndex,
          storyMetadata: {
            universe: story?.universe,
            character: story?.character,
            studentId: user?.id
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setQuestions(result.data.questions);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Failed to generate questions');
    } finally {
      setLoading(false);
    }
  }, [sectionContent, gradeLevel, sectionIndex]);
  
  return { questions, loading, error, generateQuestions };
};

// Updated reading interface component
export default function ChapterPage({ params }: { params: { bookId: string, chapterId: string } }) {
  const { story, loading: storyLoading } = useStory(params.bookId, params.chapterId);
  const [currentSection, setCurrentSection] = useState(0);
  const [sectionsRead, setSectionsRead] = useState<Set<number>>(new Set());
  
  // Get questions for current section
  const { 
    questions, 
    loading: questionsLoading, 
    error: questionsError,
    generateQuestions 
  } = useAsyncQuestions(
    story?.sections[currentSection]?.content || '',
    user?.gradeLevel || '4-5',
    currentSection
  );
  
  // Trigger question generation when user finishes reading section
  const handleSectionComplete = useCallback(async (sectionIndex: number) => {
    setSectionsRead(prev => new Set(prev).add(sectionIndex));
    
    if (sectionIndex === currentSection) {
      await generateQuestions();
    }
  }, [currentSection, generateQuestions]);
  
  return (
    <div className="reading-interface">
      {storyLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <StorySection 
            content={story.sections[currentSection].content}
            onComplete={() => handleSectionComplete(currentSection)}
          />
          
          {sectionsRead.has(currentSection) && (
            <QuestionsSection
              questions={questions}
              loading={questionsLoading}
              error={questionsError}
              onRetry={generateQuestions}
            />
          )}
        </>
      )}
    </div>
  );
}
```

### 2. Questions Display Component

#### New Component: `src/components/SectionQuestions.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface SectionQuestionsProps {
  questions: Question[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function SectionQuestions({ 
  questions, 
  loading, 
  error, 
  onRetry 
}: SectionQuestionsProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanations, setShowExplanations] = useState(false);
  
  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Generating questions...</p>
            <p className="text-sm text-muted-foreground">This may take a few seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="mt-6 border-destructive">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium text-destructive">Failed to generate questions</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (questions.length === 0) {
    return null;
  }
  
  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };
  
  const handleSubmit = () => {
    setShowExplanations(true);
    // Track answers for progress/analytics
  };
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Comprehension Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {questions.map((question, questionIndex) => (
            <div key={questionIndex} className="border-b pb-4 last:border-b-0">
              <h3 className="font-medium mb-3">
                {questionIndex + 1}. {question.question}
              </h3>
              
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswers[questionIndex] === optionIndex;
                  const isCorrect = optionIndex === question.correctAnswer;
                  const showResult = showExplanations && isSelected;
                  
                  return (
                    <button
                      key={optionIndex}
                      onClick={() => handleAnswerSelect(questionIndex, optionIndex)}
                      disabled={showExplanations}
                      className={`
                        w-full text-left p-3 rounded-lg border transition-colors
                        ${isSelected 
                          ? showResult
                            ? isCorrect 
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : 'bg-red-50 border-red-200 text-red-800'
                            : 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                        }
                        ${showExplanations ? 'cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + optionIndex)}.
                      </span>
                      {option}
                      {showExplanations && isCorrect && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {showExplanations && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
          
          {!showExplanations && Object.keys(selectedAnswers).length === questions.length && (
            <Button onClick={handleSubmit} className="w-full">
              Submit Answers
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. Story Generation Service Updates

#### File: `src/lib/ai/story-generation-service.ts`

**Current Interface:**
```typescript
interface StoryGenerationResult {
  content: string;
  questions: Question[]; // REMOVE in Phase 4
  metadata: GenerationMetadata;
}
```

**Phase 4 Interface:**
```typescript
interface StoryGenerationResult {
  content: string;
  // questions removed - now generated async
  metadata: {
    generationTimeMs: number;
    modelUsed: string;
    // questionGenerationTime removed
  };
}
```

**Service Changes:**
```typescript
// Remove question generation from story service
export class StoryGenerationService {
  async generateStory(prompt: StoryPrompt): Promise<StoryGenerationResult> {
    const startTime = Date.now();
    
    // Generate story content only
    const storyContent = await this.generateStoryContent(prompt);
    
    // No longer generate questions here
    // Questions will be generated per-section via /api/generate-questions
    
    return {
      content: storyContent,
      metadata: {
        generationTimeMs: Date.now() - startTime,
        modelUsed: this.getModelName(),
        sectionsCount: this.countSections(storyContent)
      }
    };
  }
  
  private countSections(content: string): number {
    // Count sections for progress tracking
    return content.split('\n\n').filter(section => section.trim().length > 0).length;
  }
}
```

### 4. Progress Tracking Updates

#### File: `src/lib/services/progress-service.ts`

**New Progress Interface:**
```typescript
interface ReadingProgress {
  storyId: string;
  userId: string;
  currentSection: number;
  sectionsCompleted: number[];
  questionsRequested: number[]; // New: which sections have requested questions
  questionsCompleted: number[]; // New: which sections have answered questions
  startedAt: Date;
  lastActivityAt: Date;
  completedAt?: Date;
}

interface QuestionProgress {
  sectionIndex: number;
  questionIndex: number;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpentMs: number;
  generatedAt: Date;
  answeredAt: Date;
}
```

**Service Updates:**
```typescript
export class ProgressService {
  async updateSectionProgress(
    userId: string, 
    storyId: string, 
    sectionIndex: number,
    action: 'started' | 'completed' | 'questions_requested' | 'questions_answered'
  ) {
    const progress = await this.getProgress(userId, storyId);
    
    switch (action) {
      case 'completed':
        progress.sectionsCompleted = [...new Set([...progress.sectionsCompleted, sectionIndex])];
        break;
        
      case 'questions_requested':
        progress.questionsRequested = [...new Set([...progress.questionsRequested, sectionIndex])];
        break;
        
      case 'questions_answered':  
        progress.questionsCompleted = [...new Set([...progress.questionsCompleted, sectionIndex])];
        break;
    }
    
    return this.saveProgress(progress);
  }
  
  async trackQuestionResponse(
    userId: string,
    storyId: string, 
    sectionIndex: number,
    questionIndex: number,
    selectedAnswer: number,
    correctAnswer: number,
    timeSpentMs: number
  ) {
    const response: QuestionProgress = {
      sectionIndex,
      questionIndex, 
      selectedAnswer,
      isCorrect: selectedAnswer === correctAnswer,
      timeSpentMs,
      generatedAt: new Date(), // from question metadata
      answeredAt: new Date()
    };
    
    return this.saveQuestionResponse(userId, storyId, response);
  }
}
```

---

## Migration Strategy

### Phase 1: Parallel Implementation
1. **Keep existing synchronous flow** working
2. **Add async question loading** as optional feature
3. **Feature flag control** between sync/async modes
4. **A/B test** with small user groups

### Phase 2: Gradual Rollout
1. **Enable async mode** for new stories only
2. **Monitor performance** and user experience
3. **Gather feedback** from early adopters
4. **Fix issues** and optimize performance

### Phase 3: Full Migration
1. **Switch all stories** to async mode
2. **Remove synchronous question generation** code
3. **Update all related components**
4. **Clean up deprecated interfaces**

### Migration Feature Flags

```typescript
// src/lib/config.ts
export const FEATURE_FLAGS = {
  QTI_SPLIT_GENERATION_ENABLED: true,  // Phase 3 API (✅ Ready)
  ASYNC_QUESTION_LOADING: false,       // Phase 4 UI (🚧 Pending)
  REMOVE_SYNC_QUESTIONS: false        // Phase 4 Cleanup (🚧 Pending)
};
```

---

## Testing Strategy for Phase 4

### Unit Tests Required

1. **`useAsyncQuestions` Hook Tests**
   - Question loading flow
   - Error handling
   - Loading states
   - Caching behavior

2. **`SectionQuestions` Component Tests**
   - Question display
   - Answer selection
   - Submission flow
   - Error states

3. **Progress Service Tests**
   - Section completion tracking
   - Question progress tracking
   - Analytics data collection

### Integration Tests Required

1. **Complete Reading Flow**
   - Story load → Section read → Questions generate → Questions answer
   - Error recovery flows
   - Network failure scenarios

2. **Performance Tests**
   - Question generation speed
   - Concurrent user handling
   - Memory usage optimization

### User Experience Tests

1. **Loading States**
   - Clear feedback during question generation
   - Reasonable timeout handling
   - Graceful error recovery

2. **Accessibility**
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast compliance

---

## Performance Considerations

### Caching Strategy

**Browser-Level Caching:**
```typescript
// Cache questions per section to avoid regeneration
const questionCache = new Map<string, Question[]>();

const getCacheKey = (storyId: string, sectionIndex: number) => 
  `${storyId}_section_${sectionIndex}`;

const loadQuestionsWithCache = async (storyId: string, sectionIndex: number, content: string) => {
  const cacheKey = getCacheKey(storyId, sectionIndex);
  
  if (questionCache.has(cacheKey)) {
    return questionCache.get(cacheKey);
  }
  
  const questions = await generateQuestions(content);
  questionCache.set(cacheKey, questions);
  return questions;
};
```

**Server-Level Caching:**
- Redis cache for frequently requested sections
- Content-based cache keys for consistent results
- TTL of 24 hours for question stability

### Preloading Strategy

**Smart Preloading:**
```typescript
// Preload questions for next section while user reads current
const useSmartPreloading = (currentSection: number, sections: Section[]) => {
  useEffect(() => {
    if (currentSection + 1 < sections.length) {
      // Preload next section questions in background
      const nextSection = sections[currentSection + 1];
      preloadQuestions(nextSection.content, currentSection + 1);
    }
  }, [currentSection, sections]);
};
```

### Error Recovery

**Graceful Degradation:**
1. **Primary**: Generate questions on-demand
2. **Fallback 1**: Use cached questions if available  
3. **Fallback 2**: Show generic comprehension prompts
4. **Fallback 3**: Skip questions, continue story

---

## Analytics & Monitoring for Phase 4

### Key Metrics to Track

1. **Question Loading Performance**
   - Time from section completion to questions displayed
   - Success rate of question generation
   - User abandonment during loading

2. **User Engagement**
   - Percentage of users who complete questions
   - Average time spent answering questions
   - Question accuracy rates by grade level

3. **Technical Performance**  
   - API response times for `/api/generate-questions`
   - Cache hit rates for questions
   - Error rates and recovery success

### Custom Events

```typescript
// Analytics event tracking
const trackQuestionEvent = (event: string, data: any) => {
  analytics.track('Question Generation', {
    event,
    storyId: data.storyId,
    sectionIndex: data.sectionIndex,
    userId: data.userId,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Usage
trackQuestionEvent('questions_requested', { sectionIndex: 0 });
trackQuestionEvent('questions_loaded', { loadTimeMs: 2500 });
trackQuestionEvent('questions_answered', { accuracy: 0.8 });
```

---

## Rollback Plan

### Immediate Rollback (< 5 minutes)
```bash
# Disable async question loading
export ASYNC_QUESTION_LOADING=false

# Restart application servers
pm2 restart teaching-tales
```

### Full Rollback (< 30 minutes)
1. **Revert to previous deployment** with synchronous questions
2. **Update feature flags** to disable Phase 4 features
3. **Clear problematic cache entries**
4. **Restore database** to pre-migration state if needed

### Monitoring During Rollback
- User experience metrics
- Question generation success rates  
- Story loading performance
- Authentication success rates

---

*This integration guide provides the complete roadmap for Phase 4 implementation. All dependencies from Phase 3 are ready and tested.*
