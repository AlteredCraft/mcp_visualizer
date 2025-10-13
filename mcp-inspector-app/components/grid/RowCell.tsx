import { memo } from 'react';
import { RowCell as RowCellType } from '@/types/domain';
import { SpacerBlock } from './SpacerBlock';
import { ActorCell } from '../actors/ActorCell';
import { LaneCell } from '../lanes/LaneCell';
import { PhaseHeader } from '../layout/PhaseHeader';

interface RowCellProps {
  cell: RowCellType;
  columnWidth: string;
  columnType: 'actor' | 'lane';
}

/**
 * RowCell Component
 *
 * Wrapper for individual cells in a timeline row.
 * Renders either content or a spacer block based on cell type.
 * Routes content to ActorCell or LaneCell based on column type.
 *
 * Special handling for phase headers: they span all columns and render
 * as a full-width banner.
 *
 * Performance: Memoized to prevent unnecessary re-renders when cell data hasn't changed
 */
export const RowCell = memo(function RowCell({ cell, columnWidth, columnType }: RowCellProps) {
  const baseClasses = "border-r border-gray-200 px-3 py-2 h-full";

  // Phase header cells: only render in the first column
  // (the PhaseHeader component will span all columns visually)
  if (cell.content?.type === 'phase_header') {
    // Only render the phase header in the first column
    if (cell.columnId === 'host_app') {
      return (
        <div className="col-span-5 border-r border-gray-200">
          <PhaseHeader
            phase={cell.content.phase}
            timing={cell.content.timing}
          />
        </div>
      );
    }
    // For other columns in phase header rows, return null (handled by col-span-5)
    return null;
  }

  if (cell.cellType === 'spacer') {
    return (
      <div
        className={`${baseClasses} flex items-center justify-center`}
        data-column={cell.columnId}
        data-cell-type="spacer"
        data-width-percent={columnWidth}
      >
        <SpacerBlock />
      </div>
    );
  }

  // Content cells
  return (
    <div
      className={`${baseClasses} flex items-start`}
      data-column={cell.columnId}
      data-cell-type="content"
      data-width-percent={columnWidth}
    >
      {cell.content && (
        <div className="w-full">
          {columnType === 'actor' ? (
            <ActorCell content={cell.content} />
          ) : (
            // Lane cells (Module 4)
            cell.content.type === 'message_card' && (
              <LaneCell card={cell.content.card} />
            )
          )}
        </div>
      )}
    </div>
  );
});
