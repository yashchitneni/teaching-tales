## Caliper Integration Plan

This document describes how we will emit Caliper analytics for assessments and XP. It clarifies profile/version, endpoint options, and our recommended default. We will fill provider-specific details from the API docs you share.

### Do we need a separate server?
- If TimeBack already exposes a Caliper-compatible ingestion endpoint, we can send events directly there (no extra server).
- If not, we have two options:
  1) Use a managed Caliper endpoint (vendor/LRS). Configure base URL, auth, and keys.
  2) Host a lightweight Caliper endpoint (Node/Express) alongside TimeBack to ingest and forward/store events.

Recommendation: Prefer a single ingestion point co-located with TimeBack (embedded or sidecar) to simplify auth, routing, retries, and idempotency.

### What are Caliper “profile” and “version”?
- Version: The Caliper specification version that defines envelope format and profile schemas (e.g., 1.2). We’ll align with whatever the endpoint expects; default to 1.2 unless docs say otherwise.
- Profile: A domain model that defines entities and actions for a use case (e.g., Assessment Profile for quizzes and questions). We’ll primarily use:
  - Assessment Profile: item-level responses and assessment-level completion/grading
  - General events for reading/progress (e.g., View/Completed) where appropriate for chapters/stories

You don’t need to choose multiple “versions”; it’s one spec version (e.g., 1.2) and one or more “profiles” (Assessment, etc.) used within that version.

### Event mapping (initial)
- Question answered: AssessmentItemEvent with an action like Responded
- Quiz submitted: AssessmentEvent with Submitted/Completed; include score when available
- Chapter completed: Completed event with the chapter as object (or AssessmentEvent if tied to assessment)
- Story completed: Completed event with story as object
- Spark chosen: View/Selected event with spark as object (telemetry)
- XP awarded: Include XP in event extensions, and/or emit a dedicated XP event if supported by your endpoint

We will finalize actions/object types per the endpoint’s supported profile vocabulary after we review the API docs.

### Envelope template (example; to be adjusted per docs)
```json
{
  "@context": "http://purl.imsglobal.org/ctx/caliper/v1p2",
  "id": "urn:uuid:EVENT-UUID",
  "type": "AssessmentItemEvent",
  "actor": { "id": "urn:uuid:USER-ID", "type": "Person" },
  "action": "Responded",
  "object": { "id": "urn:uuid:QUESTION-ID", "type": "AssessmentItem" },
  "generated": {
    "id": "urn:uuid:ATTEMPT-ID",
    "type": "Attempt",
    "assignable": { "id": "urn:uuid:ASSESSMENT-ID", "type": "Assessment" },
    "count": 1
  },
  "edApp": { "id": "https://teachtales.app", "type": "SoftwareApplication" },
  "group": { "id": "urn:uuid:READING-CIRCLE-ID", "type": "Group" },
  "session": { "id": "urn:uuid:SESSION-ID", "type": "Session" },
  "eventTime": "2025-01-01T12:00:00Z",
  "extensions": {
    "storyId": "urn:uuid:STORY-ID",
    "chapterId": "urn:uuid:CHAPTER-ID",
    "answerId": "urn:uuid:ANSWER-ID",
    "correct": true,
    "xpAwarded": 5
  }
}
```

### Client wrapper responsibilities
- Validation: Ensure required fields per profile
- Idempotency: Deterministic event IDs to avoid double counting on retries
- Batching/retry: Backoff and circuit-breaker on failures
- Security: Configure auth (API key, OAuth, or HTTP signature per endpoint)

### Implementation Status ✅
- **Client**: Implemented with v1p2 envelope and OAuth2 client credentials
- **API Route**: `/api/analytics/events` handles forwarding to Caliper
- **Feature Flag**: `CALIPER_ENABLED=true` controls forwarding
- **Event Mapping**: Internal telemetry → Caliper AssessmentItemEvent, AssessmentEvent, etc.
- **Validation**: Non-production validates events before sending

### Environment Variables Required
Add these to your server environment (not client-exposed):
```bash
CALIPER_ENABLED=true
CALIPER_BASE_URL=https://caliper.alpha-1edtech.com
CALIPER_TOKEN_URL=https://alpha-auth-production-idp.auth.us-west-2.amazoncognito.com/oauth2/token
CALIPER_CLIENT_ID=your_client_id
CALIPER_CLIENT_SECRET=your_client_secret
CALIPER_SENSOR_IRI=https://teachtales.app/sensors/primary
CALIPER_SCOPE=caliper.write  # if required by your IDP
```

### Usage Examples
```typescript
import { TelemetryService } from '@/lib/services/telemetry-service';

// Track question answer (→ Caliper AssessmentItemEvent)
TelemetryService.trackQuestionAnswered({
  userId: 'user123',
  storyId: 'story456',
  questionId: 'q1',
  sectionIndex: 0,
  isCorrect: true,
  attemptNumber: 1
});

// Track assessment submission (→ Caliper AssessmentEvent)
TelemetryService.trackAssessmentSubmitted({
  userId: 'user123',
  storyId: 'story456',
  sectionIndex: 0
});

// Track chapter completion (→ Caliper Event)
TelemetryService.trackChapterCompleted({
  userId: 'user123',
  storyId: 'story456',
  sectionIndex: 0,
  readingTime: 120000
});
```

### Testing
- Events are validated in non-production before sending
- Check logs for "📊 Analytics events processed" and Caliper forwarding status
- Use `/caliper/event/validate` endpoint to test event structure
- Graceful fallback: if Caliper fails, internal analytics continue


