import { COLUMN_DEFINITIONS } from '@/components/column-definitions';

/**
 * TimelineHeader Component
 *
 * Renders column headers for the five-column timeline layout.
 * Headers are sticky and stay visible during scroll.
 */
export function TimelineHeader() {
  return (
    <div
      className="grid grid-cols-[20%_15%_15%_15%_35%] w-full bg-gray-50 border-b-2 border-gray-400 sticky top-0 z-10"
      data-component="timeline-header"
    >
      {COLUMN_DEFINITIONS.map((column) => (
        <div
          key={column.id}
          className="px-4 py-3 border-r border-gray-300 last:border-r-0"
          data-column={column.id}
          data-width-percent={column.width}
        >
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            {column.title}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {column.type === 'actor' ? `${column.actor} actor` : 'Communication lane'}
          </p>
        </div>
      ))}
    </div>
  );
}
