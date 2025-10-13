import { RowCell as RowCellType } from '@/types/domain';
import { SpacerBlock } from './SpacerBlock';
import { ActorCell } from '../actors/ActorCell';

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
 */
export function RowCell({ cell, columnWidth, columnType }: RowCellProps) {
  const baseClasses = "border-r border-gray-200 px-3 py-2 h-full";

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
            // Lane cells will be implemented in Module 4
            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
              {cell.content.type}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
