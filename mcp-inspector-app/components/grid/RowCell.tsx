import { RowCell as RowCellType } from '@/types/domain';
import { SpacerBlock } from './SpacerBlock';

interface RowCellProps {
  cell: RowCellType;
  columnWidth: string;
}

/**
 * RowCell Component
 *
 * Wrapper for individual cells in a timeline row.
 * Renders either content or a spacer block based on cell type.
 */
export function RowCell({ cell, columnWidth }: RowCellProps) {
  const baseClasses = "border-r border-gray-200 px-3 py-2 flex items-center justify-center";

  if (cell.cellType === 'spacer') {
    return (
      <div
        className={baseClasses}
        data-column={cell.columnId}
        data-cell-type="spacer"
        data-width-percent={columnWidth}
      >
        <SpacerBlock />
      </div>
    );
  }

  // Content cells - placeholder for now (will be implemented in Module 3 & 4)
  return (
    <div
      className={baseClasses}
      data-column={cell.columnId}
      data-cell-type="content"
      data-width-percent={columnWidth}
    >
      {cell.content && (
        <div className="text-sm text-gray-600">
          {/* Content will be rendered by specific components in later modules */}
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {cell.content.type}
          </span>
        </div>
      )}
    </div>
  );
}
