# 🧠 Quiz Questions & XP API Flow Documentation

## Current Implementation Status

### Quiz Question Loading & Display

#### 1. **Question Loading Source**
**Location**: `src/app/book/[bookId]/page.tsx` and `src/app/book/[bookId]/chapter/[chapterId]/page.tsx`

**Current Source**: 
- **Primary**: Story sections from QTI Stimuli API
- **Fallback**: localStorage stored questions
- **Development**: Mock data hardcoded in components

**API Endpoint Used**:
```
GET /api/qti/[...endpoint] → TimeBack QTI API
```
**Actual TimeBack Endpoint**: `GET ${TIMEBACK_API_URL}/qti/v3/stimuli/{stimulusId}`

**Question Format in Storage**:
```json
{
  "sections": [
    {
      "id": "section-1",
      "content": "Story text...",
      "questions": [
        {
          "id": "q1",
          "question": "What did Pikachu find?",
          "options": ["Crystal", "Berry", "Pokeball", "Map"],
          "correct": 0,
          "explanation": "Pikachu found a mysterious crystal"
        }
      ]
    }
  ]
}
```

---

#### 2. **Question Display Components**

##### 2a. **GuidingQuestions Component** ✅ IMPLEMENTED
**Location**: `src/components/GuidingQuestions.tsx`

**Current Functionality**:
- Displays one question at a time
- Shows multiple choice options
- Handles answer selection
- Tracks progress through questions
- **Local state management only**

##### 2b. **AssessmentResults Component** ✅ IMPLEMENTED  
**Location**: `src/components/AssessmentResults.tsx`

**Current Functionality**:
- Shows quiz completion summary
- Displays accuracy percentage
- Shows words per minute
- **No backend persistence**

---

### Quiz Response Handling

#### 3. **Answer Processing** ⚠️ CLIENT-SIDE ONLY

**Location**: `src/app/book/[bookId]/chapter/[chapterId]/page.tsx`

**Current Implementation**:
```javascript
const handleQuestionAnswer = (answerIndex: number) => {
  const newAnswers = [...answers]
  newAnswers[currentQuestionIndex] = answerIndex
  setAnswers(newAnswers)
  
  // Local progression logic only
  if (currentQuestionIndex < chapter.questions.length - 1) {
    setCurrentQuestionIndex(currentQuestionIndex + 1)
  } else {
    setShowAssessment(true) // Show results locally
  }
}

const calculateAccuracy = () => {
  const correct = answers.filter((answer, index) => 
    answer === chapter.questions[index].correctAnswer
  ).length
  return Math.round((correct / chapter.questions.length) * 100)
}
```

**⚠️ Missing Backend Integration**:
- No API calls to store responses
- No persistence across sessions
- No gradebook integration

---

#### 4. **Response Storage** ❌ NOT IMPLEMENTED

**Missing API Endpoint**:
```
POST /api/qti/v3/responses
```

**Should Store**:
```json
{
  "assessmentId": "assessment-123",
  "studentId": "user-456", 
  "itemResponses": [
    {
      "itemId": "q1",
      "response": "0",
      "timestamp": "2024-01-15T10:30:00Z",
      "timeSpent": 15000,
      "attempts": 1,
      "score": 1.0
    }
  ],
  "totalScore": 85,
  "completedAt": "2024-01-15T10:35:00Z"
}
```

---

### XP & Progress Tracking

#### 5. **XP Calculation** ⚠️ LOCAL ONLY

**Location**: `src/lib/xpData.ts`

**Current XP Data Structure**:
```typescript
export interface XPLevel {
  level: number
  title: string
  description: string
  currentXP: number
  maxXP: number
  hoursToNext: number
  image: string
}

export interface UserStats {
  accuracy: number
  readingTimeMinutes: number
  // ... other stats
}
```

**Current XP Sources** (all local calculations):
- Reading completion
- Quiz accuracy
- Time spent reading
- **No backend persistence**

---

#### 6. **Progress Persistence** ❌ NOT IMPLEMENTED

**Missing OneRoster Integration**:

##### 6a. **Results Storage**
```
POST /api/ims/oneroster/rostering/v1p2/results
```

**Should Store**:
```json
{
  "sourcedId": "result-123",
  "lineItem": {
    "sourcedId": "lineitem-456"
  },
  "student": {
    "sourcedId": "user-789"
  },
  "scoreGiven": 85,
  "scoreMaximum": 100,
  "comment": "Great comprehension skills!",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

##### 6b. **LineItem Management**
```
GET /api/ims/oneroster/rostering/v1p2/lineItems
POST /api/ims/oneroster/rostering/v1p2/lineItems
```

**Should Create LineItems for**:
- Each story chapter
- Each assessment
- XP milestones
- Reading achievements

---

### Dashboard & Stats Display

#### 7. **My Stats Page** ⚠️ MOCK DATA ONLY
**Location**: `src/app/my-stats/page.tsx`

**Current Data Sources**:
- Hardcoded mock data
- No API integration
- No real user progress

**Missing API Calls**:
```
GET /api/ims/oneroster/rostering/v1p2/results?student={studentId}
GET /api/user/stats  ← Custom endpoint needed
GET /api/user/achievements  ← Custom endpoint needed
```

---

#### 8. **Dashboard Integration** ⚠️ LIMITED
**Location**: `src/app/dashboard/page.tsx`

**Current Features**:
- Shows recent stories (from localStorage/QTI API)
- Basic navigation
- **No XP display**
- **No progress tracking**
- **No achievement system**

---

## Current QTI Integration

### QTI Response Processing ✅ PARTIALLY IMPLEMENTED

**Location**: `src/lib/qti/transformers/ai-to-qti-transformer.ts`

**QTI Templates Support**:
- `match_correct` - Basic correct/incorrect scoring
- `map_response` - Partial credit scoring
- Response processing rules in XML format

**QTI Response Types Supported**:
- `choiceInteraction` - Multiple choice
- `textEntryInteraction` - Fill in blank  
- `extendedTextInteraction` - Essay (manual scoring)

**⚠️ Missing**: Actual response submission and processing pipeline

---

## ⚠️ Current Limitations

### Quiz Questions:
1. **No Response Persistence**: Answers lost on page refresh
2. **No Retry Logic**: Can't retake quizzes
3. **No Partial Credit**: Binary correct/incorrect only
4. **No Question Randomization**: Fixed order always
5. **No Adaptive Questioning**: No difficulty adjustment

### XP System:
1. **No Backend Storage**: XP not saved anywhere
2. **No Achievement System**: No badges or milestones
3. **No Leaderboards**: No social comparison
4. **No Progress History**: No tracking over time
5. **No XP for Different Activities**: Only basic reading/quiz XP

### Integration:
1. **No OneRoster Gradebook**: No teacher visibility
2. **No Real-time Updates**: No live progress tracking
3. **No Parent Reporting**: No progress sharing
4. **No Standards Alignment**: No curriculum mapping

---

## 🎯 Required API Endpoints for Full Implementation

### Quiz Response Storage:
```
POST /api/qti/v3/responses                    ← Store quiz answers
GET /api/qti/v3/responses/{assessmentId}      ← Retrieve past responses
PUT /api/qti/v3/responses/{responseId}        ← Update/retry responses
```

### OneRoster Gradebook Integration:
```
POST /api/ims/oneroster/rostering/v1p2/results     ← Store grades
GET /api/ims/oneroster/rostering/v1p2/results      ← Retrieve grades
POST /api/ims/oneroster/rostering/v1p2/lineItems   ← Create assignments
```

### Custom XP & Achievement System:
```
GET /api/user/xp                             ← Get current XP
POST /api/user/xp                            ← Award XP points
GET /api/user/achievements                   ← Get earned badges
POST /api/user/achievements                  ← Unlock achievements
GET /api/user/stats                          ← Get reading stats
```

### Progress Tracking:
```
GET /api/user/progress                       ← Overall progress
GET /api/story/{id}/progress                 ← Story-specific progress
POST /api/user/activity                      ← Log user activities
```
