/**
 * Store-specific types for Zustand timeline store
 */

import type { TimelineEvent, Phase, Actor } from '../types/domain';

/**
 * Timeline store state and actions
 */
export interface TimelineStore {
  // ============================================================================
  // State
  // ============================================================================

  /**
   * Unique identifier for current recording session
   */
  sessionId: string;

  /**
   * All recorded timeline events (chronologically ordered)
   */
  events: TimelineEvent[];

  /**
   * Current sequence number (auto-increments with each event)
   */
  currentSequence: number;

  /**
   * Recording status
   */
  isRecording: boolean;

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Add a new event to the timeline
   * Auto-enriches event with sessionId, sequence, and timestamp
   */
  addEvent: (
    event: Omit<TimelineEvent, 'sessionId' | 'sequence' | 'timestamp'>
  ) => void;

  /**
   * Add multiple events at once (batch operation)
   */
  addEvents: (
    events: Array<Omit<TimelineEvent, 'sessionId' | 'sequence' | 'timestamp'>>
  ) => void;

  /**
   * Clear all events and reset session
   */
  clearEvents: () => void;

  /**
   * Start a new recording session (resets events and generates new sessionId)
   */
  startNewSession: () => void;

  /**
   * Toggle recording status
   */
  setRecording: (isRecording: boolean) => void;

  // ============================================================================
  // Selectors (Query Functions)
  // ============================================================================

  /**
   * Get events filtered by phase
   */
  getEventsByPhase: (phase: Phase) => TimelineEvent[];

  /**
   * Get events filtered by actor
   */
  getEventsByActor: (actor: Actor) => TimelineEvent[];

  /**
   * Get event by sequence number
   */
  getEventBySequence: (sequence: number) => TimelineEvent | undefined;

  /**
   * Get total event count
   */
  getEventCount: () => number;

  /**
   * Export session data as JSON string
   */
  exportSession: () => string;

  /**
   * Get session metadata
   */
  getSessionMetadata: () => {
    sessionId: string;
    eventCount: number;
    startTime: number | null;
    endTime: number | null;
    duration: number | null;
  };
}
