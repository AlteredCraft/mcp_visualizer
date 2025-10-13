/**
 * Module 3 Test Page
 *
 * Tests all actor components:
 * - ChatBubble (user/assistant)
 * - ConsoleBlock (all 7 badge types)
 * - ThinkingIndicator
 */

'use client';

import { useEffect } from 'react';
import { useTimelineStore } from '@/store/timeline-store';
import { TimelineContainer } from '@/components/layout/TimelineContainer';
import { TimelineHeader } from '@/components/layout/TimelineHeader';
import { TimelineRow } from '@/components/grid/TimelineRow';
import { AppHeader } from '@/components/layout/AppHeader';
import { StatusBar } from '@/components/layout/StatusBar';
import { COLUMN_DEFINITIONS } from '@/components/column-definitions';
import type { ConsoleLogEvent, ConsoleBadgeType, TimelineRow as TimelineRowType } from '@/types/domain';

export default function TestModule3Page() {
  const { addEvent, clearEvents, events } = useTimelineStore();

  useEffect(() => {
    // Clear previous events
    clearEvents();

    // Add test events for all actor components
    const now = Date.now();

    // 1. User chat bubble
    addEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logLevel: 'info',
      logMessage: 'User message test',
      badgeType: 'USER_INPUT',
      metadata: { phase: 'initialization' },
    });

    // 2. All badge types
    const badgeTypes: ConsoleBadgeType[] = [
      'USER_INPUT',
      'SYSTEM',
      'INTERNAL',
      'LLM',
      'SERVER',
      'LOG',
      'COMPLETE',
    ];

    badgeTypes.forEach((badgeType, index) => {
      addEvent({
        eventType: 'console_log',
        actor: 'host_app',
        logLevel: 'info',
        logMessage: `Testing ${badgeType} badge style`,
        badgeType,
        metadata: { phase: 'discovery' },
      });
    });

    // 3. Add some events for other actors to test vertical alignment
    addEvent({
      eventType: 'console_log',
      actor: 'llm',
      logLevel: 'info',
      logMessage: 'LLM processing request',
      badgeType: 'LLM',
      metadata: { phase: 'selection' },
    });

    addEvent({
      eventType: 'console_log',
      actor: 'mcp_server',
      logLevel: 'info',
      logMessage: 'MCP Server executing tool',
      badgeType: 'SERVER',
      metadata: { phase: 'execution' },
    });

    addEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logLevel: 'info',
      logMessage: 'Response delivered successfully',
      badgeType: 'COMPLETE',
      metadata: { phase: 'synthesis' },
    });
  }, [addEvent, clearEvents]);

  // Build rows from events for testing
  const rows: TimelineRowType[] = events.map((event) => {
    const row: TimelineRowType = {
      rowId: `row-${event.sequence}`,
      sequence: event.sequence,
      cells: [],
    };

    // Create cells for each column (exactly 5 cells)
    COLUMN_DEFINITIONS.forEach((columnDef) => {
      if (columnDef.type === 'actor' && columnDef.actor === event.actor && event.eventType === 'console_log') {
        // Add content cell for matching actor
        row.cells.push({
          columnId: columnDef.id,
          cellType: 'content',
          content: {
            type: 'console_log',
            event: event as ConsoleLogEvent,
          },
        });
      } else {
        // Add spacer for all other columns
        row.cells.push({
          columnId: columnDef.id,
          cellType: 'spacer',
        });
      }
    });

    return row;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppHeader />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto p-4">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <h1 className="text-2xl font-bold mb-2">Module 3: Actor Components Test</h1>
            <p className="text-gray-600 mb-4">
              This page tests all actor components: ChatBubble, ConsoleBlock, and ThinkingIndicator.
            </p>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Components:</span>
                <span className="bg-green-100 px-2 py-1 rounded">ConsoleBlock</span>
                <span className="bg-purple-100 px-2 py-1 rounded">All Badge Types</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Events:</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{events.length}</span>
              </div>
            </div>
          </div>
          <TimelineContainer>
            <TimelineHeader />
            {rows.map((row) => (
              <TimelineRow key={row.rowId} row={row} />
            ))}
          </TimelineContainer>
        </div>
      </main>
      <StatusBar />
    </div>
  );
}
