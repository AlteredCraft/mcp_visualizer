/**
 * Zustand timeline store for event recording and management
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TimelineStore } from './types';
import type { TimelineEvent, Phase, Actor } from '../types/domain';
import { generateSessionId } from '../lib/session';
import { exportTraceAsMermaid } from '../lib/mermaid-exporter';

/**
 * Create timeline store with auto-enrichment for events
 * Uses Immer middleware for immutable state updates
 */
export const useTimelineStore = create<TimelineStore>()(
  immer((set, get) => ({
    // ============================================================================
    // Initial State
    // ============================================================================

    sessionId: generateSessionId(),
    events: [],
    currentSequence: 0,
    isRecording: true,
    chatHistory: [],
    workflowPhase: 'idle' as const,
    isExecuting: false,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    tokenHistory: [],

    // ============================================================================
    // Actions
    // ============================================================================

    addEvent: (event) => {
      set((state) => {
        const enrichedEvent: TimelineEvent = {
          ...event,
          sessionId: state.sessionId,
          sequence: state.currentSequence,
          timestamp: Date.now(),
        } as TimelineEvent;

        state.events.push(enrichedEvent);
        state.currentSequence += 1;
      });
    },

    addEvents: (events) => {
      set((state) => {
        events.forEach((event) => {
          const enrichedEvent: TimelineEvent = {
            ...event,
            sessionId: state.sessionId,
            sequence: state.currentSequence,
            timestamp: Date.now(),
          } as TimelineEvent;

          state.events.push(enrichedEvent);
          state.currentSequence += 1;
        });
      });
    },

    clearEvents: () => {
      set((state) => {
        state.events = [];
        state.currentSequence = 0;
        state.chatHistory = [];
        state.workflowPhase = 'idle';
        state.totalInputTokens = 0;
        state.totalOutputTokens = 0;
        state.tokenHistory = [];
      });
    },

    startNewSession: () => {
      set((state) => {
        state.sessionId = generateSessionId();
        state.events = [];
        state.currentSequence = 0;
        state.isRecording = true;
        state.chatHistory = [];
        state.workflowPhase = 'idle';
        state.isExecuting = false;
        state.totalInputTokens = 0;
        state.totalOutputTokens = 0;
        state.tokenHistory = [];
      });
    },

    setRecording: (isRecording) => {
      set((state) => {
        state.isRecording = isRecording;
      });
    },

    addChatMessage: (message) => {
      set((state) => {
        state.chatHistory.push(message);
      });
    },

    clearChatHistory: () => {
      set((state) => {
        state.chatHistory = [];
      });
    },

    setWorkflowPhase: (phase) => {
      set((state) => {
        state.workflowPhase = phase;
      });
    },

    setExecuting: (isExecuting) => {
      set((state) => {
        state.isExecuting = isExecuting;
      });
    },

    addTokenUsage: (usage) => {
      set((state) => {
        const tokenUsage = {
          ...usage,
          timestamp: Date.now(),
        };
        state.tokenHistory.push(tokenUsage);
        state.totalInputTokens += usage.inputTokens;
        state.totalOutputTokens += usage.outputTokens;
      });
    },

    getTotalTokens: () => {
      const state = get();
      return state.totalInputTokens + state.totalOutputTokens;
    },

    getTokensByPhase: (phase) => {
      const state = get();
      const phaseTokens = state.tokenHistory.filter((usage) => usage.phase === phase);
      return phaseTokens.reduce(
        (acc, usage) => ({
          inputTokens: acc.inputTokens + usage.inputTokens,
          outputTokens: acc.outputTokens + usage.outputTokens,
        }),
        { inputTokens: 0, outputTokens: 0 }
      );
    },

    // ============================================================================
    // Selectors (Query Functions)
    // ============================================================================

    getEventsByPhase: (phase: Phase) => {
      const state = get();
      return state.events.filter(
        (event) => event.metadata.phase === phase
      );
    },

    getEventsByActor: (actor: Actor) => {
      const state = get();
      return state.events.filter((event) => event.actor === actor);
    },

    getEventBySequence: (sequence: number) => {
      const state = get();
      return state.events.find((event) => event.sequence === sequence);
    },

    getEventCount: () => {
      return get().events.length;
    },

    exportSession: () => {
      const state = get();
      const sessionData = {
        sessionId: state.sessionId,
        eventCount: state.events.length,
        events: state.events,
        exportedAt: new Date().toISOString(),
      };
      return JSON.stringify(sessionData, null, 2);
    },

    exportSessionAsMermaid: () => {
      const state = get();
      const sessionData = {
        sessionId: state.sessionId,
        eventCount: state.events.length,
        events: state.events,
        exportedAt: new Date().toISOString(),
      };
      return exportTraceAsMermaid(sessionData);
    },

    getSessionMetadata: () => {
      const state = get();
      const events = state.events;

      if (events.length === 0) {
        return {
          sessionId: state.sessionId,
          eventCount: 0,
          startTime: null,
          endTime: null,
          duration: null,
          totalInputTokens: state.totalInputTokens,
          totalOutputTokens: state.totalOutputTokens,
          totalTokens: state.totalInputTokens + state.totalOutputTokens,
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
        totalInputTokens: state.totalInputTokens,
        totalOutputTokens: state.totalOutputTokens,
        totalTokens: state.totalInputTokens + state.totalOutputTokens,
      };
    },
  }))
);
