/**
 * Layout Engine
 *
 * Main orchestrator for converting timeline events into renderable grid rows.
 * This is the central algorithm that maintains vertical alignment across all columns.
 *
 * Responsibilities:
 * 1. Build rows from events (with automatic spacer insertion)
 * 2. Detect phase transitions
 * 3. Insert phase header rows at boundaries
 * 4. Return complete grid structure ready for rendering
 *
 * Usage:
 * ```typescript
 * const events = useTimelineStore(state => state.events);
 * const rows = buildTimelineRows(events);
 * ```
 */

import type { TimelineEvent, TimelineRow } from '@/types/domain';
import { buildRows } from './row-builder';
import {
  detectPhaseTransitions,
  createPhaseHeaderRow,
  calculatePhaseTiming,
} from './phase-detector';

/**
 * Build complete timeline rows from events
 *
 * This is the main entry point for the layout engine.
 * Call this function to convert raw timeline events into a fully structured
 * grid with automatic spacer insertion and phase headers.
 *
 * @param events - Array of timeline events from the Zustand store
 * @param options - Configuration options
 * @returns Array of timeline rows ready for rendering
 */
export function buildTimelineRows(
  events: TimelineEvent[],
  options: LayoutOptions = {}
): TimelineRow[] {
  const { includePhaseHeaders = true } = options;

  // Step 1: Build rows from events (automatic spacer insertion)
  const contentRows = buildRows(events);

  // Step 2: Insert phase headers (if enabled)
  if (includePhaseHeaders) {
    return insertPhaseHeaders(contentRows, events);
  }

  return contentRows;
}

/**
 * Insert phase header rows at phase boundaries
 *
 * Algorithm:
 * 1. Detect all phase transitions in the events
 * 2. For each transition, create a phase header row
 * 3. Insert header row before the first row of each phase
 * 4. Calculate phase timing from events
 */
function insertPhaseHeaders(
  rows: TimelineRow[],
  events: TimelineEvent[]
): TimelineRow[] {
  if (rows.length === 0) return [];

  // Detect phase transitions
  const transitions = detectPhaseTransitions(events);

  if (transitions.length === 0) return rows;

  const result: TimelineRow[] = [];
  let transitionIndex = 0;

  for (const row of rows) {
    // Check if we're at a phase boundary
    if (
      transitionIndex < transitions.length &&
      row.sequence === transitions[transitionIndex].startSequence
    ) {
      const { phase } = transitions[transitionIndex];

      // Calculate phase timing
      const timing = calculatePhaseTiming(events, phase);

      // Insert phase header row
      const headerRow = createPhaseHeaderRow(phase, row.sequence, timing);
      result.push(headerRow);

      transitionIndex++;
    }

    // Add the content row
    result.push(row);
  }

  return result;
}

/**
 * Layout engine configuration options
 */
export interface LayoutOptions {
  /**
   * Whether to insert phase header rows at phase boundaries
   * @default true
   */
  includePhaseHeaders?: boolean;
}

/**
 * Build rows for a specific phase only
 * Useful for filtered views or phase-specific debugging
 */
export function buildRowsForPhase(
  events: TimelineEvent[],
  phase: string
): TimelineRow[] {
  const phaseEvents = events.filter((e) => e.metadata.phase === phase);
  return buildRows(phaseEvents);
}

/**
 * Get statistics about the timeline layout
 * Useful for debugging and validation
 */
export function getLayoutStatistics(rows: TimelineRow[]): LayoutStatistics {
  let totalCells = 0;
  let contentCells = 0;
  let spacerCells = 0;
  let phaseHeaderRows = 0;
  let contentRows = 0;

  for (const row of rows) {
    // Check if this is a phase header row
    const isPhaseHeader = row.cells.every(
      (cell) =>
        cell.cellType === 'content' && cell.content?.type === 'phase_header'
    );

    if (isPhaseHeader) {
      phaseHeaderRows++;
    } else {
      contentRows++;
    }

    // Count cells
    for (const cell of row.cells) {
      totalCells++;
      if (cell.cellType === 'content') {
        contentCells++;
      } else {
        spacerCells++;
      }
    }
  }

  return {
    totalRows: rows.length,
    phaseHeaderRows,
    contentRows,
    totalCells,
    contentCells,
    spacerCells,
    spacerPercentage: (spacerCells / totalCells) * 100,
  };
}

/**
 * Layout statistics interface
 */
export interface LayoutStatistics {
  totalRows: number;
  phaseHeaderRows: number;
  contentRows: number;
  totalCells: number;
  contentCells: number;
  spacerCells: number;
  spacerPercentage: number;
}

/**
 * Validate that all rows have the correct number of cells (5)
 * Useful for debugging layout issues
 */
export function validateRowStructure(rows: TimelineRow[]): ValidationResult {
  const errors: string[] = [];

  for (const row of rows) {
    // Each row must have exactly 5 cells (one per column)
    if (row.cells.length !== 5) {
      errors.push(
        `Row ${row.rowId} has ${row.cells.length} cells (expected 5)`
      );
    }

    // Check that column IDs match the expected order
    const expectedColumnIds = [
      'host_app',
      'lane_host_llm',
      'llm',
      'lane_host_mcp',
      'mcp_server',
    ];

    row.cells.forEach((cell, index) => {
      if (cell.columnId !== expectedColumnIds[index]) {
        errors.push(
          `Row ${row.rowId}, cell ${index}: expected columnId "${expectedColumnIds[index]}", got "${cell.columnId}"`
        );
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
