/**
 * Analytics Events API Endpoint
 * Phase 8.1.1 - Receives telemetry events from TelemetryService
 * 
 * Handles batch event ingestion with validation, rate limiting, and storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeachingTalesEvent } from '@/lib/services/telemetry-service';

interface EventBatch {
  events: TeachingTalesEvent[];
}

// Simple in-memory storage for development (in production, use a proper database)
const eventStore: TeachingTalesEvent[] = [];
const MAX_EVENTS = 10000; // Keep only recent events in memory

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitCheck = await checkRateLimit(request);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitCheck.retryAfter },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json() as EventBatch;
    
    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Invalid request: events array required' },
        { status: 400 }
      );
    }

    // Validate each event
    const validatedEvents = [];
    const invalidEvents = [];

    for (const event of body.events) {
      const validation = validateEvent(event);
      if (validation.valid) {
        validatedEvents.push(event);
      } else {
        invalidEvents.push({
          event: event.eventId || 'unknown',
          errors: validation.errors
        });
      }
    }

    // Store valid events
    if (validatedEvents.length > 0) {
      await storeEvents(validatedEvents);
    }

    // Log processing results
    console.log(`📊 Telemetry batch processed: ${validatedEvents.length} valid, ${invalidEvents.length} invalid events`);

    // Return processing results
    const response = {
      success: true,
      processed: validatedEvents.length,
      invalid: invalidEvents.length,
      timestamp: new Date().toISOString()
    };

    // Include invalid events in response for debugging (if any)
    if (invalidEvents.length > 0) {
      (response as any).invalidEvents = invalidEvents.slice(0, 5); // Limit for response size
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to process telemetry events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const eventType = searchParams.get('eventType');
    const category = searchParams.get('category');
    const since = searchParams.get('since');

    // Filter events based on query parameters
    let filteredEvents = [...eventStore];

    if (eventType) {
      filteredEvents = filteredEvents.filter(e => e.eventType === eventType);
    }

    if (category) {
      filteredEvents = filteredEvents.filter(e => e.category === category);
    }

    if (since) {
      const sinceDate = new Date(since);
      filteredEvents = filteredEvents.filter(e => new Date(e.timestamp) >= sinceDate);
    }

    // Sort by timestamp (newest first) and limit
    const results = filteredEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({
      events: results,
      totalMatching: filteredEvents.length,
      totalStored: eventStore.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to retrieve telemetry events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validate a telemetry event structure
 */
function validateEvent(event: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!event.eventId) errors.push('eventId is required');
  if (!event.timestamp) errors.push('timestamp is required');
  if (!event.sessionId) errors.push('sessionId is required');
  if (!event.eventType) errors.push('eventType is required');
  if (!event.category) errors.push('category is required');
  if (!event.action) errors.push('action is required');

  // Valid event types
  const validEventTypes = ['user_interaction', 'system_performance', 'educational_outcome', 'error_event'];
  if (event.eventType && !validEventTypes.includes(event.eventType)) {
    errors.push(`Invalid eventType: ${event.eventType}`);
  }

  // Timestamp validation
  if (event.timestamp && isNaN(Date.parse(event.timestamp))) {
    errors.push('Invalid timestamp format');
  }

  // Numeric fields validation
  if (event.duration !== undefined && (typeof event.duration !== 'number' || event.duration < 0)) {
    errors.push('duration must be a non-negative number');
  }

  if (event.processingTime !== undefined && (typeof event.processingTime !== 'number' || event.processingTime < 0)) {
    errors.push('processingTime must be a non-negative number');
  }

  if (event.attemptNumber !== undefined && (typeof event.attemptNumber !== 'number' || event.attemptNumber < 1)) {
    errors.push('attemptNumber must be a positive number');
  }

  // Educational data validation
  if (event.questionType && !['comprehension', 'vocabulary', 'inference'].includes(event.questionType)) {
    errors.push(`Invalid questionType: ${event.questionType}`);
  }

  if (event.isCorrect !== undefined && typeof event.isCorrect !== 'boolean') {
    errors.push('isCorrect must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Store events in the event store
 */
async function storeEvents(events: TeachingTalesEvent[]): Promise<void> {
  // Add events to store
  eventStore.push(...events);

  // Maintain size limit (remove oldest events)
  if (eventStore.length > MAX_EVENTS) {
    const excessCount = eventStore.length - MAX_EVENTS;
    eventStore.splice(0, excessCount);
  }

  // In a production environment, you would:
  // 1. Store in a proper database (PostgreSQL, MongoDB, etc.)
  // 2. Use batch inserts for efficiency
  // 3. Implement proper indexing for queries
  // 4. Set up data retention policies
  // 5. Consider using a time-series database for analytics
}

/**
 * Simple rate limiting based on IP address
 */
async function checkRateLimit(request: NextRequest): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Get client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';

  // Simple in-memory rate limiting (in production, use Redis or similar)
  const rateLimitStore = global.rateLimitStore || new Map();
  global.rateLimitStore = rateLimitStore;

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 100; // Max requests per window

  const clientRequests = rateLimitStore.get(ip) || [];
  
  // Remove old requests outside the window
  const recentRequests = clientRequests.filter((timestamp: number) => now - timestamp < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    const oldestRequest = Math.min(...recentRequests);
    const retryAfter = Math.ceil((windowMs - (now - oldestRequest)) / 1000);
    
    return { allowed: false, retryAfter };
  }

  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(ip, recentRequests);

  return { allowed: true };
}

// Global type declaration for rate limiting
declare global {
  var rateLimitStore: Map<string, number[]> | undefined;
}
