'use client';

/**
 * Timeline Page - Actor-Based Grid Visualization
 *
 * This route implements the core pedagogical visualization from the HTML mockup:
 * - Five-column actor-based grid (Host App | Host↔LLM | LLM | Host↔MCP | MCP Server)
 * - Vertical alignment showing causality (same row = related events)
 * - Phase headers spanning all columns
 * - Chat bubbles inside Host App column (not separate interface)
 * - Message cards in communication lanes
 * - Spacer blocks maintaining alignment
 *
 * Source of truth: docs/mcp-inspector-actor-based.html
 */

import { TimelineView } from '@/components/timeline/TimelineView';

export default function TimelinePage() {
  return <TimelineView />;
}
