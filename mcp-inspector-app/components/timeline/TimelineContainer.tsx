/**
 * TimelineContainer Component
 *
 * Main timeline container with:
 * - Five-column header (Host App | Host↔LLM | LLM | Host↔MCP | MCP Server)
 * - Scrollable content area rendering TimelineRow components
 * - Grid layout: 20% | 15% | 15% | 15% | 35%
 *
 * Matches HTML mockup (docs/mcp-inspector-actor-based.html lines 66-1189)
 */

import { TimelineRow as TimelineRowType } from '@/types/domain';
import { TimelineRow } from '@/components/grid/TimelineRow';
import { COLUMN_DEFINITIONS } from '@/components/column-definitions';

interface TimelineContainerProps {
  rows: TimelineRowType[];
}

export function TimelineContainer({ rows }: TimelineContainerProps) {
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Five-column header */}
      <div className="grid grid-cols-[20%_15%_15%_15%_35%] border-b-2 border-gray-300 bg-gray-50 flex-shrink-0">
        {COLUMN_DEFINITIONS.map((column) => (
          <div
            key={column.id}
            className="px-4 py-3 font-semibold text-sm text-gray-700 border-r-2 border-gray-300 text-center last:border-r-0"
          >
            {column.title}
          </div>
        ))}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No events yet. Execute a workflow to see the timeline in action.
          </div>
        ) : (
          rows.map((row) => (
            <TimelineRow key={row.rowId} row={row} />
          ))
        )}
      </div>
    </div>
  );
}
