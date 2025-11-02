'use client';

/**
 * TimelineView Component - Actor-Based Grid Visualization
 *
 * Main container for actor-based timeline visualization.
 * Implements the full-screen layout from HTML mockup (docs/mcp-inspector-actor-based.html):
 * - Dark header with recording badge
 * - Five-column timeline grid
 * - Bottom chat input row
 * - Status bar
 *
 * This is the CORE PEDAGOGICAL VISUALIZATION showing:
 * - Host App orchestrates all communication (never LLM ↔ MCP direct)
 * - Vertical alignment shows causality (same row = related events)
 * - Phase headers group workflow stages
 */

import { useTimelineStore } from '@/store/timeline-store';
import { buildTimelineRows } from '@/lib/layout-engine';
import { useSSEConnection } from '@/hooks/useSSEConnection';
import { AppHeader } from './AppHeader';
import { TimelineContainer } from './TimelineContainer';
import { ChatInterface } from '@/components/shared/ChatInterface';
import { StatsDisplay } from '@/components/shared/StatsDisplay';

export function TimelineView() {
  const events = useTimelineStore((state) => state.events);

  // Connect to SSE stream (uses shared hook)
  useSSEConnection();

  // Build timeline rows with spacer insertion and phase headers
  const rows = buildTimelineRows(events, { includePhaseHeaders: true });

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Dark header with recording badge */}
      <AppHeader showRecordingBadge={true} />

      {/* Main timeline with five-column grid */}
      <TimelineContainer rows={rows} />

      {/* Bottom chat input spanning all columns */}
      <ChatInterface variant="minimal" />

      {/* Status bar with connection/event stats */}
      <StatsDisplay variant="statusbar" />
    </div>
  );
}
