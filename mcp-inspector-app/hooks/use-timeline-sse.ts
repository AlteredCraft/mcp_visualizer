/**
 * Timeline SSE Consumer Hook
 *
 * React hook that establishes an SSE connection to /api/events/stream
 * and adds incoming events to the Zustand timeline store.
 *
 * Features:
 * - Automatic connection on mount
 * - Automatic reconnection on disconnect (with exponential backoff)
 * - Connection status tracking
 * - Cleanup on unmount
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { connectionStatus, reconnect } = useTimelineSSE();
 *   return <div>Status: {connectionStatus}</div>;
 * }
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTimelineStore } from '@/store/timeline-store';
import type { TimelineEvent } from '@/types/domain';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseTimelineSSEReturn {
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
  eventCount: number;
}

/**
 * Hook to consume SSE timeline events and add them to Zustand store.
 */
export function useTimelineSSE(): UseTimelineSSEReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [eventCount, setEventCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const addEvent = useTimelineStore((state) => state.addEvent);

  /**
   * Calculate backoff delay for reconnection attempts.
   * Exponential backoff: 1s, 2s, 4s, 8s, max 30s
   */
  const getReconnectDelay = useCallback(() => {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts.current), maxDelay);
    return delay;
  }, []);

  /**
   * Connect to SSE stream.
   */
  const connect = useCallback(() => {
    // Don't create multiple connections
    if (eventSourceRef.current) {
      console.log('[useTimelineSSE] Connection already exists');
      return;
    }

    console.log('[useTimelineSSE] Connecting to /api/events/stream');
    setConnectionStatus('connecting');

    try {
      const eventSource = new EventSource('/api/events/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[useTimelineSSE] Connected');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0; // Reset on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Ignore control messages
          if (data.type === 'connected') {
            console.log('[useTimelineSSE] Received connection confirmation');
            return;
          }

          // Add event to Zustand store
          addEvent(data as TimelineEvent);
          setEventCount((prev) => prev + 1);
        } catch (error) {
          console.error('[useTimelineSSE] Error parsing event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[useTimelineSSE] Connection error:', error);
        setConnectionStatus('error');

        // Close current connection
        eventSource.close();
        eventSourceRef.current = null;

        // Attempt reconnection with backoff
        reconnectAttempts.current += 1;
        const delay = getReconnectDelay();
        console.log(
          `[useTimelineSSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[useTimelineSSE] Attempting reconnection...');
          connect();
        }, delay);
      };
    } catch (error) {
      console.error('[useTimelineSSE] Failed to create EventSource:', error);
      setConnectionStatus('error');
    }
  }, [addEvent, getReconnectDelay]);

  /**
   * Disconnect from SSE stream.
   */
  const disconnect = useCallback(() => {
    console.log('[useTimelineSSE] Disconnecting');

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    // Close connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, []);

  /**
   * Manual reconnect (exposed to component).
   */
  const reconnect = useCallback(() => {
    console.log('[useTimelineSSE] Manual reconnect triggered');
    disconnect();
    reconnectAttempts.current = 0; // Reset attempts on manual reconnect
    setTimeout(() => connect(), 100);
  }, [connect, disconnect]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionStatus,
    reconnect,
    eventCount,
  };
}
