/**
 * Unit tests for layout-engine.ts
 * Tests the core row building and spacer insertion algorithm
 */

import {
  buildTimelineRows,
  buildRowsForPhase,
  getLayoutStatistics,
  validateRowStructure,
} from '../../lib/layout-engine';
import {
  createMockConsoleLog,
  createMockProtocolMessage,
  createVerticalAlignmentScenario,
  createComplete5PhaseWorkflow,
  createMultiActorSequence,
} from '../mocks/mock-events';

describe('Layout Engine', () => {
  describe('buildTimelineRows', () => {
    it('should return empty array for no events', () => {
      const rows = buildTimelineRows([]);
      expect(rows).toEqual([]);
    });

    it('should create one row per unique sequence number', () => {
      const events = [
        createMockConsoleLog({ sequence: 1 }),
        createMockConsoleLog({ sequence: 2 }),
        createMockConsoleLog({ sequence: 3 }),
      ];

      const rows = buildTimelineRows(events, { includePhaseHeaders: false });
      expect(rows).toHaveLength(3);
    });

    it('should create exactly 5 cells per row', () => {
      const events = [createMockConsoleLog({ sequence: 1 })];

      const rows = buildTimelineRows(events, { includePhaseHeaders: false });
      expect(rows[0].cells).toHaveLength(5);
    });

    it('should insert spacer blocks for empty columns', () => {
      // Single host_app event - other 4 columns should have spacers
      const events = [
        createMockConsoleLog({
          sequence: 1,
          actor: 'host_app',
        }),
      ];

      const rows = buildTimelineRows(events, { includePhaseHeaders: false });
      const cells = rows[0].cells;

      // Column 0 (host_app): content
      expect(cells[0].cellType).toBe('content');
      expect(cells[0].columnId).toBe('host_app');

      // Column 1 (lane_host_llm): spacer
      expect(cells[1].cellType).toBe('spacer');
      expect(cells[1].columnId).toBe('lane_host_llm');

      // Column 2 (llm): spacer
      expect(cells[2].cellType).toBe('spacer');
      expect(cells[2].columnId).toBe('llm');

      // Column 3 (lane_host_mcp): spacer
      expect(cells[3].cellType).toBe('spacer');
      expect(cells[3].columnId).toBe('lane_host_mcp');

      // Column 4 (mcp_server): spacer
      expect(cells[4].cellType).toBe('spacer');
      expect(cells[4].columnId).toBe('mcp_server');
    });

    it('should place protocol messages in correct lane columns', () => {
      const events = [
        createMockProtocolMessage({
          sequence: 1,
          actor: 'host_app',
          direction: 'sent',
          lane: 'host_mcp',
        }),
      ];

      const rows = buildTimelineRows(events, { includePhaseHeaders: false });
      const cells = rows[0].cells;

      // Lane column should have content
      const laneCell = cells.find((c) => c.columnId === 'lane_host_mcp');
      expect(laneCell?.cellType).toBe('content');
      expect(laneCell?.content?.type).toBe('message_card');

      // Note: host_app actor will also have content since the event belongs to host_app actor
      // Only llm and mcp_server should have spacers
      expect(cells[2].cellType).toBe('spacer'); // llm
      expect(cells[4].cellType).toBe('spacer'); // mcp_server
    });

    it('should handle multiple events at same sequence', () => {
      const events = createMultiActorSequence();

      const rows = buildTimelineRows(events, { includePhaseHeaders: false });
      expect(rows).toHaveLength(1); // All events at sequence 1

      const cells = rows[0].cells;

      // All 5 columns should have content (no spacers)
      expect(cells.every((c) => c.cellType === 'content')).toBe(true);
    });

    it('should maintain vertical alignment with sequential events', () => {
      const events = createVerticalAlignmentScenario();

      const rows = buildTimelineRows(events, { includePhaseHeaders: false });
      expect(rows).toHaveLength(5); // Sequences 1-5

      // Row 1: Host app has content, others spacers
      expect(rows[0].cells[0].cellType).toBe('content'); // host_app
      expect(rows[0].cells[4].cellType).toBe('spacer'); // mcp_server

      // Rows 2-4: MCP server has content, others spacers
      for (let i = 1; i <= 3; i++) {
        expect(rows[i].cells[0].cellType).toBe('spacer'); // host_app
        expect(rows[i].cells[4].cellType).toBe('content'); // mcp_server
      }

      // Row 5: Host app has content again
      expect(rows[4].cells[0].cellType).toBe('content'); // host_app
      expect(rows[4].cells[4].cellType).toBe('spacer'); // mcp_server
    });

    it('should insert phase headers when includePhaseHeaders is true', () => {
      const events = createComplete5PhaseWorkflow();

      const rows = buildTimelineRows(events, { includePhaseHeaders: true });

      // Should have more rows than events due to phase headers
      expect(rows.length).toBeGreaterThan(events.length);

      // Find phase header rows
      const phaseHeaders = rows.filter((row) =>
        row.rowId.startsWith('phase-header-')
      );

      // Should have 5 phase headers (one per phase)
      expect(phaseHeaders.length).toBe(5);

      // All phase header cells should be content type with phase_header
      for (const headerRow of phaseHeaders) {
        expect(headerRow.cells).toHaveLength(5);
        expect(headerRow.cells.every((c) => c.cellType === 'content')).toBe(true);
        expect(headerRow.cells.every((c) => c.content?.type === 'phase_header')).toBe(true);
      }
    });

    it('should not insert phase headers when includePhaseHeaders is false', () => {
      const events = createComplete5PhaseWorkflow();

      const rows = buildTimelineRows(events, { includePhaseHeaders: false });

      // Should have exactly as many rows as unique sequences
      const uniqueSequences = new Set(events.map((e) => e.sequence)).size;
      expect(rows).toHaveLength(uniqueSequences);

      // Should have no phase header rows
      const phaseHeaders = rows.filter((row) =>
        row.rowId.startsWith('phase-header-')
      );
      expect(phaseHeaders).toHaveLength(0);
    });
  });

  describe('buildRowsForPhase', () => {
    it('should filter events by phase', () => {
      const events = createComplete5PhaseWorkflow();

      const initRows = buildRowsForPhase(events, 'initialization');
      const discoveryRows = buildRowsForPhase(events, 'discovery');
      const executionRows = buildRowsForPhase(events, 'execution');

      // Should have rows for each phase
      expect(initRows.length).toBeGreaterThan(0);
      expect(discoveryRows.length).toBeGreaterThan(0);
      expect(executionRows.length).toBeGreaterThan(0);

      // Execution phase should have more rows than others
      expect(executionRows.length).toBeGreaterThan(initRows.length);
    });

    it('should return empty array for non-existent phase', () => {
      const events = [
        createMockConsoleLog({
          sequence: 1,
          metadata: { messageType: 'console_log', phase: 'initialization' },
        }),
      ];

      const rows = buildRowsForPhase(events, 'synthesis');
      expect(rows).toEqual([]);
    });
  });

  describe('getLayoutStatistics', () => {
    it('should count total rows correctly', () => {
      const events = createVerticalAlignmentScenario();
      const rows = buildTimelineRows(events, { includePhaseHeaders: false });

      const stats = getLayoutStatistics(rows);
      expect(stats.totalRows).toBe(5);
      expect(stats.contentRows).toBe(5);
      expect(stats.phaseHeaderRows).toBe(0);
    });

    it('should count cells correctly', () => {
      const events = createVerticalAlignmentScenario();
      const rows = buildTimelineRows(events, { includePhaseHeaders: false });

      const stats = getLayoutStatistics(rows);

      // 5 rows × 5 cells per row = 25 total cells
      expect(stats.totalCells).toBe(25);

      // 5 events = 5 content cells, rest are spacers
      expect(stats.contentCells).toBe(5);
      expect(stats.spacerCells).toBe(20);
    });

    it('should calculate spacer percentage', () => {
      const events = [createMockConsoleLog({ sequence: 1 })];
      const rows = buildTimelineRows(events, { includePhaseHeaders: false });

      const stats = getLayoutStatistics(rows);

      // 1 row × 5 cells = 5 total, 1 content, 4 spacers
      expect(stats.spacerPercentage).toBe(80); // 4/5 = 80%
    });

    it('should count phase header rows separately', () => {
      const events = createComplete5PhaseWorkflow();
      const rows = buildTimelineRows(events, { includePhaseHeaders: true });

      const stats = getLayoutStatistics(rows);

      expect(stats.phaseHeaderRows).toBe(5);
      expect(stats.contentRows).toBe(rows.length - 5);
    });
  });

  describe('validateRowStructure', () => {
    it('should validate correct row structure', () => {
      const events = createVerticalAlignmentScenario();
      const rows = buildTimelineRows(events, { includePhaseHeaders: false });

      const result = validateRowStructure(rows);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect rows with wrong number of cells', () => {
      const events = createVerticalAlignmentScenario();
      const rows = buildTimelineRows(events, { includePhaseHeaders: false });

      // Corrupt first row by removing a cell
      rows[0].cells.pop();

      const result = validateRowStructure(rows);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('has 4 cells (expected 5)');
    });

    it('should detect rows with wrong column IDs', () => {
      const events = [createMockConsoleLog({ sequence: 1 })];
      const rows = buildTimelineRows(events, { includePhaseHeaders: false });

      // Corrupt column ID
      rows[0].cells[2].columnId = 'wrong_column';

      const result = validateRowStructure(rows);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('expected columnId');
    });

    it('should validate rows with phase headers', () => {
      const events = createComplete5PhaseWorkflow();
      const rows = buildTimelineRows(events, { includePhaseHeaders: true });

      const result = validateRowStructure(rows);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Edge cases', () => {
    it('should handle events with undefined phase', () => {
      const events = [
        createMockConsoleLog({
          sequence: 1,
          metadata: { messageType: 'console_log', phase: undefined },
        }),
      ];

      const rows = buildTimelineRows(events, { includePhaseHeaders: true });

      // Should still create row, just no phase header
      expect(rows.length).toBe(1);
      expect(rows[0].rowId).not.toContain('phase-header');
    });

    it('should handle events with same sequence but different timestamps', () => {
      const baseTimestamp = Date.now();
      const events = [
        createMockConsoleLog({
          sequence: 1,
          timestamp: baseTimestamp,
          actor: 'host_app',
        }),
        createMockConsoleLog({
          sequence: 1,
          timestamp: baseTimestamp + 100,
          actor: 'mcp_server',
        }),
      ];

      const rows = buildTimelineRows(events, { includePhaseHeaders: false });

      // Should create single row for sequence 1
      expect(rows).toHaveLength(1);
      expect(rows[0].sequence).toBe(1);
    });

    it('should handle non-sequential sequence numbers', () => {
      const events = [
        createMockConsoleLog({ sequence: 1 }),
        createMockConsoleLog({ sequence: 5 }), // Skip 2, 3, 4
        createMockConsoleLog({ sequence: 10 }),
      ];

      const rows = buildTimelineRows(events, { includePhaseHeaders: false });

      // Should create 3 rows with correct sequences
      expect(rows).toHaveLength(3);
      expect(rows[0].sequence).toBe(1);
      expect(rows[1].sequence).toBe(5);
      expect(rows[2].sequence).toBe(10);
    });

    it('should handle large number of events (performance)', () => {
      // Create 500 events
      const events = Array.from({ length: 500 }, (_, i) =>
        createMockConsoleLog({
          sequence: i + 1,
          actor: i % 2 === 0 ? 'host_app' : 'mcp_server',
        })
      );

      const startTime = performance.now();
      const rows = buildTimelineRows(events, { includePhaseHeaders: false });
      const endTime = performance.now();

      expect(rows).toHaveLength(500);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });
  });
});
