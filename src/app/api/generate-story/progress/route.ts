import { NextRequest } from 'next/server';
import { ProgressStore } from '@/lib/jobs/progress-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  if (!jobId) return new Response('Missing jobId', { status: 400 });

  const stream = new ReadableStream({
    start(controller) {
      function send(update: any) {
        controller.enqueue(`event: progress\n`);
        controller.enqueue(`data: ${JSON.stringify(update)}\n\n`);
        if (update.done) controller.close();
      }

      const current = ProgressStore.get(jobId);
      if (current) send(current);
      const off = ProgressStore.on(jobId, send);

      // heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(`:\n`);
      }, 15000);

      controller.oncancel = () => {
        clearInterval(heartbeat);
        off();
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

