import { ReactNode } from 'react';

interface TimelineContainerProps {
  children: ReactNode;
}

/**
 * TimelineContainer Component
 *
 * Main scrollable container for the timeline grid.
 * Handles overflow and provides the canvas for rows.
 */
export function TimelineContainer({ children }: TimelineContainerProps) {
  return (
    <div
      className="flex-1 overflow-auto bg-white"
      data-component="timeline-container"
    >
      {children}
    </div>
  );
}
