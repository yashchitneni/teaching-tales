import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_FLAGS } from '@/lib/config';
import { CALIPER_SERVER_CONFIG } from '@/lib/config.server';
import { CaliperClient } from '@/lib/services/caliper-client';
import { mapToCaliperEvents } from '@/lib/services/caliper-mapper';
import type { TeachingTalesEvent } from '@/lib/services/telemetry-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = body as { events: TeachingTalesEvent[] };

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Events array is required' }, { status: 400 });
    }

    console.log(`📊 Received ${events.length} analytics events`);

    // Forward to Caliper if enabled and configured
    if (FEATURE_FLAGS.CALIPER_ENABLED && isCalipeConfigured()) {
      try {
        await forwardToCaliper(events);
        console.log(`✅ Successfully forwarded ${events.length} events to Caliper`);
      } catch (error) {
        console.warn('⚠️ Failed to forward events to Caliper:', error);
        // Don't fail the request if Caliper forwarding fails
      }
    }

    // Store events locally (placeholder - implement based on your storage needs)
    // await storeEventsLocally(events);

    return NextResponse.json({ 
      status: 'success',
      message: `Processed ${events.length} events`,
      caliperForwarded: FEATURE_FLAGS.CALIPER_ENABLED && isCalipeConfigured()
    });

  } catch (error) {
    console.error('❌ Analytics events processing failed:', error);
    return NextResponse.json(
      { error: 'Failed to process events' },
      { status: 500 }
    );
  }
}

function isCalipeConfigured(): boolean {
  return !!(
    CALIPER_SERVER_CONFIG.BASE_URL &&
    CALIPER_SERVER_CONFIG.TOKEN_URL &&
    CALIPER_SERVER_CONFIG.CLIENT_ID &&
    CALIPER_SERVER_CONFIG.CLIENT_SECRET &&
    CALIPER_SERVER_CONFIG.SENSOR_IRI
  );
}

async function forwardToCaliper(events: TeachingTalesEvent[]): Promise<void> {
  const client = new CaliperClient({
    baseUrl: CALIPER_SERVER_CONFIG.BASE_URL!,
    tokenUrl: CALIPER_SERVER_CONFIG.TOKEN_URL!,
    clientId: CALIPER_SERVER_CONFIG.CLIENT_ID!,
    clientSecret: CALIPER_SERVER_CONFIG.CLIENT_SECRET!,
    scope: CALIPER_SERVER_CONFIG.SCOPE,
    sensor: CALIPER_SERVER_CONFIG.SENSOR_IRI!,
    version: CALIPER_SERVER_CONFIG.VERSION!
  });

  // Map internal events to Caliper format
  const caliperEvents = mapToCaliperEvents(events);
  
  if (caliperEvents.length === 0) {
    console.log('📊 No events mapped to Caliper format');
    return;
  }

  // In non-production, validate events first
  if (process.env.NODE_ENV !== 'production') {
    try {
      await client.validateEvents(caliperEvents);
      console.log('✅ Caliper events validation passed');
    } catch (error) {
      console.warn('⚠️ Caliper events validation failed:', error);
      // Continue to send anyway in development for debugging
    }
  }

  // Send events to Caliper
  await client.sendEvents(caliperEvents);
}