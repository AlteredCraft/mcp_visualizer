import { memo } from 'react';
import { TimelineRow as TimelineRowType } from '@/types/domain';
import { COLUMN_DEFINITIONS } from '@/components/column-definitions';
import { RowCell } from './RowCell';

interface TimelineRowProps {
  row: TimelineRowType;
}

/**
 * TimelineRow Component
 *
 * Renders a single row in the timeline with 5 columns.
 * Maintains strict vertical alignment across all columns.
 *
 * Layout: [20%] [15%] [15%] [15%] [35%]
 *
 * Performance: Memoized to prevent unnecessary re-renders when row data hasn't changed
 */
export const TimelineRow = memo(function TimelineRow({ row }: TimelineRowProps) {
  return (
    <div
      className="grid grid-cols-[20%_15%_15%_15%_35%] w-full min-h-[60px] border-b border-gray-300 items-stretch"
      data-row={row.rowId}
      data-sequence={row.sequence}
    >
      {row.cells.map((cell, index) => {
        const columnDef = COLUMN_DEFINITIONS.find(col => col.id === cell.columnId);
        return (
          <RowCell
            key={cell.columnId}
            cell={cell}
            columnWidth={columnDef?.width || 'w-full'}
            columnType={columnDef?.type || 'actor'}
          />
        );
      })}
    </div>
  );
});
