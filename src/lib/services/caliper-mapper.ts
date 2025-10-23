import type { TeachingTalesEvent } from '@/lib/services/telemetry-service';
import type { CaliperEvent } from '@/lib/services/caliper-client';

function hash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h) + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function actorFromUser(userId?: string) {
  const id = userId ? `urn:teachtales:user:${hash(userId)}` : 'urn:teachtales:user:anonymous';
  return { id, type: 'Person' };
}

/**
 * Minimal mapping from internal telemetry events to Caliper events.
 * This is intentionally conservative and will be expanded as we validate profiles.
 */
export function mapToCaliperEvents(events: TeachingTalesEvent[]): CaliperEvent[] {
  return events.map((e): CaliperEvent => {
    const base = {
      id: `urn:teachtales:event:${e.eventId}`,
      eventTime: e.timestamp,
      actor: actorFromUser(e.userId),
      edApp: { id: 'https://teachtales.app', type: 'SoftwareApplication' },
      group: e.storyId ? { id: `urn:teachtales:story:${e.storyId}`, type: 'Collection' } : undefined,
      session: { id: `urn:teachtales:session:${e.sessionId}`, type: 'Session' }
    } as any;

    if (e.category === 'question_answering' && e.action === 'question_answered') {
      return {
        ...base,
        type: 'AssessmentItemEvent',
        action: 'Responded',
        object: { id: `urn:teachtales:question:${e.questionId}`, type: 'AssessmentItem' },
        generated: {
          id: `urn:teachtales:attempt:${e.attemptNumber ?? 1}`,
          type: 'Attempt'
        },
        extensions: {
          isCorrect: e.isCorrect ?? null,
          sectionIndex: e.sectionIndex ?? null,
          storyId: e.storyId ?? null
        }
      } as CaliperEvent;
    }

    if (e.category === 'question_answering' && e.action === 'assessment_submitted') {
      return {
        ...base,
        type: 'AssessmentEvent',
        action: 'Submitted',
        object: { id: `urn:teachtales:assessment:${e.stimulusId || e.storyId || 'unknown'}`, type: 'Assessment' }
      } as CaliperEvent;
    }

    if (e.category === 'story_reading' && e.action === 'story_completed') {
      return {
        ...base,
        type: 'Event',
        action: 'Completed',
        object: { id: `urn:teachtales:story:${e.storyId}`, type: 'Document' }
      } as CaliperEvent;
    }

    if (e.category === 'question_answering' && e.action === 'chapter_completed') {
      return {
        ...base,
        type: 'Event',
        action: 'Completed',
        object: { id: `urn:teachtales:chapter:${e.sectionIndex}`, type: 'Chapter' }
      } as CaliperEvent;
    }

    if (e.category === 'story_creation' && e.action === 'spark_selected') {
      return {
        ...base,
        type: 'Event',
        action: 'Selected',
        object: { id: `urn:teachtales:spark:${e.properties?.sparkId || 'unknown'}`, type: 'DigitalResource' }
      } as CaliperEvent;
    }

    // Fallback event
    return {
      ...base,
      type: 'Event',
      action: 'Observed',
      object: { id: `urn:teachtales:unknown:${e.category}:${e.action}`, type: 'DigitalResource' }
    } as CaliperEvent;
  });
}


