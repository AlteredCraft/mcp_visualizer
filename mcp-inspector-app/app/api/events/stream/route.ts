/**
 * SSE Stream Endpoint
 *
 * GET /api/events/stream
 *
 * Establishes a Server-Sent Events (SSE) connection to stream timeline events
 * to the browser in real-time. Uses the global MCP client's event broadcasting
 * system.
 *
 * Features:
 * - Streams all timeline events as they occur
 * - Sends buffered events to catch up late-joining clients
 * - Heartbeat to keep connection alive
 * - Automatic cleanup on disconnect
 *
 * SSE Format:
 * data: {"sessionId":"...","sequence":1,...}\n\n
 */

import { getMCPClient } from '@/lib/mcp/global-client';
import type { TimelineEvent } from '@/types/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('[SSE] New client connection');

  const encoder = new TextEncoder();
  const mcpClient = getMCPClient();

  // Create readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Send connection confirmation
      const connectMessage = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(connectMessage));

      // Send buffered events (for late-joining clients)
      const bufferedEvents = mcpClient.getEventBuffer();
      console.log(`[SSE] Sending ${bufferedEvents.length} buffered events`);

      for (const event of bufferedEvents) {
        const message = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(message));
      }

      // Subscribe to new events
      const subscriptionId = mcpClient.subscribe((event: TimelineEvent) => {
        try {
          const message = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('[SSE] Error sending event:', error);
        }
      });

      console.log(`[SSE] Subscribed with ID: ${subscriptionId}`);

      // Heartbeat to keep connection alive (every 30 seconds)
      const heartbeat = setInterval(() => {
        try {
          // SSE comment (ignored by EventSource, keeps connection alive)
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (error) {
          console.error('[SSE] Heartbeat failed:', error);
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        console.log(`[SSE] Client disconnected, cleaning up subscription ${subscriptionId}`);
        clearInterval(heartbeat);
        mcpClient.unsubscribe(subscriptionId);
        controller.close();
      });
    },
  });

  // Return response with SSE headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
