'use client';

import { useEffect, useState } from 'react';
import { TimelineContainer } from '@/components/layout/TimelineContainer';
import { TimelineHeader } from '@/components/layout/TimelineHeader';
import { TimelineRow as TimelineRowComponent } from '@/components/grid/TimelineRow';
import { StatusBar } from '@/components/layout/StatusBar';
import { useTimelineStore } from '@/store/timeline-store';
import { generateMockWorkflow, generateMultiToolWorkflow } from '@/lib/mock-events';
import { buildTimelineRows, getLayoutStatistics, validateRowStructure } from '@/lib/layout-engine';
import type { TimelineRow } from '@/types/domain';

/**
 * Module 5 Test Page: Layout Engine with Automatic Spacer Insertion
 *
 * Tests the core layout engine algorithm that converts timeline events into
 * grid rows with automatic spacer block insertion to maintain strict vertical alignment.
 *
 * Validation Criteria:
 * 1. ✅ Render complete 5-phase workflow from mock events
 * 2. ✅ Verify spacer blocks appear in correct positions
 * 3. ✅ Visual test: all rows maintain vertical alignment
 * 4. ✅ Edge case: MCP Server with 3 console logs → other columns show 3 spacers
 * 5. ✅ Verify phase headers appear at correct boundaries
 */

export default function TestModule5Page() {
  const { addEvents, clearEvents, events, getEventCount } = useTimelineStore();
  const [rows, setRows] = useState<TimelineRow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<'single' | 'multi'>('single');
  const [showPhaseHeaders, setShowPhaseHeaders] = useState(true);

  // Load mock workflow on mount
  useEffect(() => {
    loadWorkflow(selectedWorkflow);
  }, [selectedWorkflow]);

  // Rebuild rows whenever events or settings change
  useEffect(() => {
    const builtRows = buildTimelineRows(events, {
      includePhaseHeaders: showPhaseHeaders,
    });
    setRows(builtRows);
  }, [events, showPhaseHeaders]);

  function loadWorkflow(type: 'single' | 'multi') {
    clearEvents();
    const mockEvents = type === 'single' ? generateMockWorkflow() : generateMultiToolWorkflow();
    addEvents(mockEvents);
  }

  // Get layout statistics for debugging
  const stats = getLayoutStatistics(rows);
  const validation = validateRowStructure(rows);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with controls */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Module 5 Test: Layout Engine (Automatic Spacer Insertion)
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Testing row builder algorithm with automatic spacer insertion and phase headers
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Workflow selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Workflow:</label>
              <select
                value={selectedWorkflow}
                onChange={(e) => setSelectedWorkflow(e.target.value as 'single' | 'multi')}
                className="text-sm border border-gray-300 rounded px-3 py-1 bg-white"
              >
                <option value="single">Single Tool (33 events)</option>
                <option value="multi">Multiple Tools (21 events)</option>
              </select>
            </div>

            {/* Phase headers toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showPhaseHeaders}
                onChange={(e) => setShowPhaseHeaders(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-700">Show Phase Headers</span>
            </label>

            {/* Reload button */}
            <button
              onClick={() => loadWorkflow(selectedWorkflow)}
              className="text-sm bg-blue-500 text-white px-4 py-1.5 rounded hover:bg-blue-600"
            >
              Reload
            </button>
          </div>
        </div>

        {/* Layout Statistics */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600 font-mono">
          <div>
            <span className="font-semibold">Events:</span> {getEventCount()}
          </div>
          <div>
            <span className="font-semibold">Rows:</span> {stats.totalRows}
          </div>
          <div>
            <span className="font-semibold">Content Rows:</span> {stats.contentRows}
          </div>
          <div>
            <span className="font-semibold">Phase Headers:</span> {stats.phaseHeaderRows}
          </div>
          <div>
            <span className="font-semibold">Total Cells:</span> {stats.totalCells}
          </div>
          <div>
            <span className="font-semibold">Content Cells:</span> {stats.contentCells}
          </div>
          <div>
            <span className="font-semibold">Spacer Cells:</span> {stats.spacerCells}
          </div>
          <div>
            <span className="font-semibold">Spacer %:</span> {stats.spacerPercentage.toFixed(1)}%
          </div>
          <div>
            <span
              className={`font-semibold ${
                validation.isValid ? 'text-green-600' : 'text-red-600'
              }`}
            >
              Validation: {validation.isValid ? '✓ PASS' : '✗ FAIL'}
            </span>
          </div>
        </div>

        {/* Validation Errors */}
        {!validation.isValid && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            <div className="font-semibold mb-1">Validation Errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto">
        <TimelineContainer>
          <TimelineHeader />
          {rows.map((row) => (
            <TimelineRowComponent key={row.rowId} row={row} />
          ))}
        </TimelineContainer>
      </div>

      {/* Status Bar */}
      <StatusBar
        sessionId="test-module-5"
        eventCount={getEventCount()}
        isRecording={false}
      />

      {/* Legend */}
      <div className="border-t bg-white px-6 py-3">
        <div className="text-xs text-gray-600">
          <span className="font-semibold">Legend:</span>
          <span className="ml-3">Gray dotted cells = spacer blocks (maintain vertical alignment)</span>
          <span className="ml-3">Colored banners = phase headers</span>
          <span className="ml-3">White cells = content (console logs, message cards)</span>
        </div>
      </div>
    </div>
  );
}
