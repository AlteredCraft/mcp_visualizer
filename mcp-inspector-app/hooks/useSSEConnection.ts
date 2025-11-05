/**
 * useSSEConnection Hook
 *
 * Shared SSE connection logic for timeline event streaming.
 * Connects to /api/events/stream and automatically adds events to Zustand store.
 * Handles reconnection, errors, and cleanup.
 */

import { useEffect, useRef } from 'react';
import { useTimelineStore } from '@/store/timeline-store';
import type { TimelineEvent, ProtocolMessageEvent } from '@/types/domain';

export function useSSEConnection() {
  const addEvent = useTimelineStore((state) => state.addEvent);
  const setWorkflowPhase = useTimelineStore((state) => state.setWorkflowPhase);
  const addTokenUsage = useTimelineStore((state) => state.addTokenUsage);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connectSSE = () => {
      console.log('[useSSEConnection] Connecting to SSE stream...');
      const eventSource = new EventSource('/api/events/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[useSSEConnection] SSE connection opened');
      };

      eventSource.onmessage = (event) => {
        try {
          const timelineEvent = JSON.parse(event.data) as TimelineEvent;
          console.log('[useSSEConnection] Received event:', timelineEvent);

          // Add event to Zustand store (will auto-enrich with sessionId, sequence, timestamp)
          addEvent(timelineEvent);

          // Extract and store token usage from LLM responses
          if (timelineEvent.eventType === 'protocol_message') {
            const protocolEvent = timelineEvent as ProtocolMessageEvent;
            if (
              protocolEvent.direction === 'received' &&
              protocolEvent.lane === 'host_llm' &&
              protocolEvent.message &&
              typeof protocolEvent.message === 'object' &&
              'usage' in protocolEvent.message
            ) {
              const usage = (protocolEvent.message as any).usage;
              if (usage && typeof usage === 'object' && 'inputTokens' in usage && 'outputTokens' in usage) {
                console.log('[useSSEConnection] Capturing token usage:', usage);
                addTokenUsage({
                  inputTokens: usage.inputTokens,
                  outputTokens: usage.outputTokens,
                  phase: timelineEvent.metadata?.phase,
                });
              }
            }
          }

          // Update workflow phase based on event metadata
          if (timelineEvent.metadata?.phase) {
            const phase = timelineEvent.metadata.phase;
            if (phase === 'initialization') {
              setWorkflowPhase('initializing');
            } else if (phase === 'discovery') {
              setWorkflowPhase('discovering');
            } else if (phase === 'selection') {
              setWorkflowPhase('planning');
            } else if (phase === 'execution') {
              setWorkflowPhase('executing');
            } else if (phase === 'synthesis') {
              setWorkflowPhase('synthesizing');
            }
          }
        } catch (error) {
          console.error('[useSSEConnection] Error parsing SSE event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[useSSEConnection] SSE error:', error);
        eventSource.close();
        // Attempt to reconnect after 3 seconds
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        console.log('[useSSEConnection] Closing SSE connection');
        eventSourceRef.current.close();
      }
    };
  }, [addEvent, setWorkflowPhase, addTokenUsage]);
}
