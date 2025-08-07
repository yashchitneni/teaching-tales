# 📚 Story Storage & Retrieval API Flow Documentation

## Current Implementation Status

### Story Generation & Storage Flow

#### 1. **Story Generation Request**
```
POST /api/generate-story
```
**Location**: `src/app/api/generate-story/route.ts`

**Request Body**:
```json
{
  "universe": "Pokemon",
  "character": "Luigi", 
  "spark": "A mysterious egg appears",
  "gradeLevel": "4-5",
  "studentId": "user-123"
}
```

**Authentication**: 
- Uses TimeBack token validation
- Checks `timeback-access-token` cookie or `Authorization` header
- Validates token with `GET ${TIMEBACK_API_URL}/api/auth/me`

**Process**:
1. Validates authentication with TimeBack API
2. Calls `StoryGenerationService.generateStory()` (Gemini AI)
3. Returns generated story JSON

---

#### 2. **Story Storage After Generation**
**Location**: `src/app/create-book/loading/page.tsx` → `StoryStorageService.saveStory()`

**Current Storage Endpoints Used**:

##### 2a. **QTI Stimuli Storage** ✅ IMPLEMENTED
```
POST /api/qti/[...endpoint] → proxies to TimeBack QTI API
```
**Actual TimeBack Endpoint**: `POST ${TIMEBACK_API_URL}/qti/v3/stimuli`

**Payload**:
```json
{
  "identifier": "story-{storyId}",
  "title": "Generated Story Title",
  "contentType": "application/json",
  "contentText": "{\"sections\":[...],\"wordCount\":500}",
  "metadata": {
    "universe": "Pokemon",
    "character": "Luigi",
    "spark": "A mysterious egg appears",
    "gradeLevel": "4-5",
    "studentId": "user-123",
    "appName": "Teaching Tales",
    "contentType": "ai-generated-story",
    "version": "1.0"
  }
}
```

##### 2b. **Assessment Tests Storage** ✅ IMPLEMENTED
**Location**: `AssessmentService.createStoryAssessments()`

```
POST /api/qti/[...endpoint] → proxies to TimeBack QTI API
```
**Actual TimeBack Endpoint**: `POST ${TIMEBACK_API_URL}/qti/v3/assessments`

**Creates multiple assessments** (one per story section with questions)

##### 2c. **OneRoster Integration** ❌ NOT IMPLEMENTED
**Missing Endpoints**:
```
POST /api/ims/oneroster/rostering/v1p2/classes     ← MISSING
POST /api/ims/oneroster/rostering/v1p2/lineItems   ← MISSING  
POST /api/ims/oneroster/rostering/v1p2/enrollments ← MISSING
```

**Should Create**:
- OneRoster Class for the story
- LineItem for each chapter/assessment
- Student enrollment in the class

---

### Story Retrieval Flow

#### 3. **My Stories Page Loading**
**Location**: `src/app/my-stories/page.tsx`

**API Call**: `StoryStorageService.getUserStories()`

**Current Endpoint Used**:
```
GET /api/qti/[...endpoint] → proxies to TimeBack QTI API
```
**Actual TimeBack Endpoint**: `GET ${TIMEBACK_API_URL}/qti/v3/stimuli?page=1&pageSize=20`

**Process**:
1. Fetches all stimuli from QTI API
2. Filters for `metadata.appName === 'Teaching Tales'`
3. Converts stimuli to `StoredStory` format
4. **Fallback**: Uses `localStorage` if API fails

**Response Format**:
```json
{
  "stimuli": [
    {
      "id": "stimulus-123",
      "identifier": "story-abc",
      "title": "Pokemon Adventure",
      "contentType": "application/json",
      "contentText": "{\"sections\":[...]}",
      "metadata": {
        "universe": "Pokemon",
        "character": "Luigi",
        "appName": "Teaching Tales",
        "contentType": "ai-generated-story"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### 4. **Individual Story Loading**
**Location**: `src/app/book/[bookId]/page.tsx`

**API Call**: `StoryStorageService.getStory(stimulusId)`

**Current Endpoint Used**:
```
GET /api/qti/[...endpoint] → proxies to TimeBack QTI API
```
**Actual TimeBack Endpoint**: `GET ${TIMEBACK_API_URL}/qti/v3/stimuli/{stimulusId}`

**Process**:
1. Fetches specific stimulus by ID
2. Loads associated assessments if `metadata.assessmentIds` exists
3. Merges questions back into story sections
4. **Fallback**: Uses `localStorage` if API fails

---

## Current API Proxy Configuration

**All QTI calls go through**: `src/app/api/qti/[...endpoint]/route.ts`
**All OneRoster calls go through**: `src/app/api/ims/oneroster/rostering/v1p2/[...endpoint]/route.ts`

**Base URLs**:
- QTI API: `${TIMEBACK_API_URL}/qti/v3/`
- OneRoster API: `${TIMEBACK_API_URL}/api/ims/oneroster/rostering/v1p2/`

**Authentication**: All proxied requests include TimeBack bearer token from cookies

---

## ⚠️ Current Limitations

1. **Development Mode**: `USE_LOCAL_STORAGE = true` bypasses all API calls
2. **Missing OneRoster Integration**: No class/enrollment creation
3. **No Response Storage**: Quiz answers not persisted to backend
4. **No XP/Gradebook Sync**: No integration with OneRoster results
5. **Fallback Dependencies**: Heavy reliance on localStorage fallbacks

---

## 🎯 Required API Endpoints for Full Implementation

### Missing Write Operations:
```
POST /api/ims/oneroster/rostering/v1p2/classes
POST /api/ims/oneroster/rostering/v1p2/lineItems  
POST /api/ims/oneroster/rostering/v1p2/enrollments
POST /api/ims/oneroster/rostering/v1p2/results
POST /api/qti/v3/responses
```

### Current Read-Only Operations:
```
GET /api/qti/v3/stimuli                    ✅ WORKING
GET /api/qti/v3/stimuli/{id}               ✅ WORKING
GET /api/qti/v3/assessments/{id}           ✅ WORKING
GET /api/ims/oneroster/rostering/v1p2/*    ✅ WORKING (read-only)
```
