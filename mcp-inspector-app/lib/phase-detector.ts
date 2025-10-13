/**
 * Phase Detector
 *
 * Detects phase boundaries in timeline events to automatically insert
 * phase header rows at the start of each phase.
 *
 * Five MCP workflow phases:
 * 1. initialization - Handshake and connection
 * 2. discovery - Tool discovery and schema formatting
 * 3. selection - First LLM inference (tool selection)
 * 4. execution - Tool execution round trip
 * 5. synthesis - Second LLM inference (final response)
 */

import type { TimelineEvent, Phase, TimelineRow, RowCell } from '../types/domain';
import { COLUMN_DEFINITIONS } from '../components/column-definitions';

/**
 * Detect the phase of a timeline event based on metadata
 */
export function detectEventPhase(event: TimelineEvent): Phase | null {
  return event.metadata.phase || null;
}

/**
 * Detect phase transitions in a sequence of events
 * Returns an array of phase boundaries with their starting sequence numbers
 */
export function detectPhaseTransitions(
  events: TimelineEvent[]
): Array<{ phase: Phase; startSequence: number }> {
  const transitions: Array<{ phase: Phase; startSequence: number }> = [];
  let currentPhase: Phase | null = null;

  for (const event of events) {
    const eventPhase = detectEventPhase(event);

    // Skip events without phase metadata
    if (!eventPhase) continue;

    // If phase changed, record the transition
    if (eventPhase !== currentPhase) {
      transitions.push({
        phase: eventPhase,
        startSequence: event.sequence,
      });
      currentPhase = eventPhase;
    }
  }

  return transitions;
}

/**
 * Create a phase header row that spans all columns
 * Phase headers are displayed as a full-width banner above the first row of each phase
 */
export function createPhaseHeaderRow(
  phase: Phase,
  sequence: number,
  timing?: number
): TimelineRow {
  const cells: RowCell[] = COLUMN_DEFINITIONS.map((column) => ({
    columnId: column.id,
    cellType: 'content',
    content: {
      type: 'phase_header',
      phase,
      timing: timing || 0,
    },
  }));

  return {
    rowId: `phase-header-${phase}-${sequence}`,
    sequence,
    cells,
  };
}

/**
 * Get human-readable phase names
 */
export function getPhaseName(phase: Phase): string {
  const phaseNames: Record<Phase, string> = {
    initialization: 'Phase 1: Initialization & Negotiation',
    discovery: 'Phase 2: Discovery & Contextualization',
    selection: 'Phase 3: Model-Driven Selection',
    execution: 'Phase 4: Execution Round Trip',
    synthesis: 'Phase 5: Synthesis & Final Response',
  };

  return phaseNames[phase];
}

/**
 * Get phase description for UI display
 */
export function getPhaseDescription(phase: Phase): string {
  const descriptions: Record<Phase, string> = {
    initialization: '3-message handshake: initialize → response → initialized notification',
    discovery: 'Host discovers available tools and formats schemas for LLM',
    selection: 'First LLM inference: analyzes query and selects appropriate tools',
    execution: 'Host invokes selected tools and retrieves results from MCP server',
    synthesis: 'Second LLM inference: synthesizes final response using tool results',
  };

  return descriptions[phase];
}

/**
 * Calculate phase timing from events
 * Returns total duration (ms) for all events in a phase
 */
export function calculatePhaseTiming(
  events: TimelineEvent[],
  phase: Phase
): number {
  const phaseEvents = events.filter((e) => detectEventPhase(e) === phase);

  if (phaseEvents.length === 0) return 0;

  const firstEvent = phaseEvents[0];
  const lastEvent = phaseEvents[phaseEvents.length - 1];

  return lastEvent.timestamp - firstEvent.timestamp;
}

/**
 * Group events by phase
 * Returns a map of phase → events
 */
export function groupEventsByPhase(
  events: TimelineEvent[]
): Map<Phase, TimelineEvent[]> {
  const phaseMap = new Map<Phase, TimelineEvent[]>();

  for (const event of events) {
    const phase = detectEventPhase(event);
    if (!phase) continue;

    if (!phaseMap.has(phase)) {
      phaseMap.set(phase, []);
    }

    phaseMap.get(phase)!.push(event);
  }

  return phaseMap;
}
