'use client';

/**
 * TimelineView Component - Actor-Based Grid Visualization
 *
 * Main container for actor-based timeline visualization.
 * Implements the full-screen layout from HTML mockup (docs/mcp-inspector-actor-based.html):
 * - Dark header with recording badge
 * - Five-column timeline grid
 * - Bottom chat input row
 * - Status bar
 *
 * This is the CORE PEDAGOGICAL VISUALIZATION showing:
 * - Host App orchestrates all communication (never LLM ↔ MCP direct)
 * - Vertical alignment shows causality (same row = related events)
 * - Phase headers group workflow stages
 */

import { useEffect, useRef } from 'react';
import { useTimelineStore } from '@/store/timeline-store';
import { buildTimelineRows } from '@/lib/layout-engine';
import { AppHeader } from './AppHeader';
import { TimelineContainer } from './TimelineContainer';
import { ChatInputRow } from './ChatInputRow';
import { StatusBar } from './StatusBar';
import type { TimelineEvent as DomainTimelineEvent } from '@/types/domain';

export function TimelineView() {
  const events = useTimelineStore((state) => state.events);
  const isRecording = useTimelineStore((state) => state.isRecording);
  const addEvent = useTimelineStore((state) => state.addEvent);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to SSE stream and populate Zustand store
  useEffect(() => {
    const connectSSE = () => {
      console.log('[TimelineView] Connecting to SSE stream...');
      const eventSource = new EventSource('/api/events/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[TimelineView] SSE connection opened');
      };

      eventSource.onmessage = (event) => {
        try {
          const timelineEvent = JSON.parse(event.data) as DomainTimelineEvent;
          console.log('[TimelineView] Received event:', timelineEvent);

          // Add event to Zustand store (will auto-enrich with sessionId, sequence, timestamp)
          addEvent(timelineEvent);
        } catch (error) {
          console.error('[TimelineView] Error parsing SSE event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[TimelineView] SSE error:', error);
        eventSource.close();
        // Attempt to reconnect after 3 seconds
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [addEvent]);

  // Build timeline rows with spacer insertion and phase headers
  const rows = buildTimelineRows(events, { includePhaseHeaders: true });

  // Compute duration from events (avoid getSessionMetadata which returns new object)
  const duration = events.length > 0
    ? events[events.length - 1].timestamp - events[0].timestamp
    : null;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Dark header with recording badge */}
      <AppHeader isRecording={isRecording} />

      {/* Main timeline with five-column grid */}
      <TimelineContainer rows={rows} />

      {/* Bottom chat input spanning all columns */}
      <ChatInputRow />

      {/* Status bar with connection/event stats */}
      <StatusBar
        eventCount={events.length}
        duration={duration}
      />
    </div>
  );
}
