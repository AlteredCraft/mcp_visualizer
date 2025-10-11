/**
 * React hook wrapping timeline store
 * Provides convenient access to timeline state and actions
 */

import { useTimelineStore } from '../store/timeline-store';
import type { Phase, Actor } from '../types/domain';

/**
 * Hook for accessing timeline store
 * Can be used with selectors for optimized re-renders
 */
export function useTimeline() {
  const store = useTimelineStore();
  return store;
}

/**
 * Hook for accessing only events (optimized selector)
 */
export function useTimelineEvents() {
  return useTimelineStore((state) => state.events);
}

/**
 * Hook for accessing event count (optimized selector)
 */
export function useEventCount() {
  return useTimelineStore((state) => state.events.length);
}

/**
 * Hook for accessing recording status
 */
export function useRecordingStatus() {
  return useTimelineStore((state) => state.isRecording);
}

/**
 * Hook for accessing session metadata
 * Computed directly in selector to avoid creating new objects
 */
export function useSessionMetadata() {
  return useTimelineStore((state) => {
    const events = state.events;

    if (events.length === 0) {
      return {
        sessionId: state.sessionId,
        eventCount: 0,
        startTime: null,
        endTime: null,
        duration: null,
      };
    }

    const startTime = events[0].timestamp;
    const endTime = events[events.length - 1].timestamp;

    return {
      sessionId: state.sessionId,
      eventCount: events.length,
      startTime,
      endTime,
      duration: endTime - startTime,
    };
  });
}

/**
 * Hook for accessing events by phase
 */
export function useEventsByPhase(phase: Phase) {
  return useTimelineStore((state) => state.getEventsByPhase(phase));
}

/**
 * Hook for accessing events by actor
 */
export function useEventsByActor(actor: Actor) {
  return useTimelineStore((state) => state.getEventsByActor(actor));
}

/**
 * Hook for timeline actions (does not cause re-renders on state changes)
 */
export function useTimelineActions() {
  return useTimelineStore((state) => ({
    addEvent: state.addEvent,
    addEvents: state.addEvents,
    clearEvents: state.clearEvents,
    startNewSession: state.startNewSession,
    setRecording: state.setRecording,
    exportSession: state.exportSession,
  }));
}
