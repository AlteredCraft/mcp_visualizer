'use client';

import { useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { TimelineContainer } from '@/components/layout/TimelineContainer';
import { TimelineHeader } from '@/components/layout/TimelineHeader';
import { StatusBar } from '@/components/layout/StatusBar';
import { TimelineRow } from '@/components/grid/TimelineRow';
import { generateMockRows } from '@/lib/mock-data';
import { useTimelineEvents } from '@/hooks/use-timeline';
import { useTimelineStore } from '@/store/timeline-store';
import { generateMockWorkflow, generateLargeMockDataset } from '@/lib/mock-events';

/**
 * MCP Inspector Teaching App - Main Page
 *
 * Module 1: Layout & Grid System (completed)
 * Module 2: Event Recording System (in progress)
 * Displays five-column actor-based timeline with strict vertical alignment
 */
export default function Home() {
  const mockRows = generateMockRows();
  const events = useTimelineEvents();

  // Load mock events on mount (for testing Module 2)
  useEffect(() => {
    // Load large dataset for testing (100+ events)
    const mockEvents = generateLargeMockDataset(5); // ~165 events (5 workflows × ~33 events each)

    // Access store directly to avoid dependency issues
    useTimelineStore.getState().addEvents(mockEvents);
  }, []); // Empty deps - only run once on mount

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />

      <TimelineContainer>
        <TimelineHeader />

        <div data-component="timeline-rows">
          {mockRows.map((row) => (
            <TimelineRow key={row.rowId} row={row} />
          ))}
        </div>

        {/* Debug info for Module 2 validation */}
        <div className="p-4 bg-gray-100 border-t">
          <div className="text-sm font-mono">
            <div className="font-bold mb-2">Module 2: Event Recording System</div>
            <div>Events recorded: {events.length}</div>
            <div className="mt-2 text-xs text-gray-600">
              Check browser console or use DevTools to inspect Zustand store state
            </div>
          </div>
        </div>
      </TimelineContainer>

      <StatusBar />
    </div>
  );
}
