/**
 * ConsoleBlock Component
 *
 * Displays console logs with colored badges indicating the log type.
 * Each badge type has specific background and text colors per the design spec.
 */

import { CONSOLE_BADGE_STYLES } from '@/lib/constants';
import type { ConsoleLogEvent } from '@/types/domain';
import { format } from 'date-fns';

export interface ConsoleBlockProps {
  event: ConsoleLogEvent;
}

export function ConsoleBlock({ event }: ConsoleBlockProps) {
  const badgeStyle = CONSOLE_BADGE_STYLES[event.badgeType];

  // Format timestamp as HH:MM:SS.mmm
  const timestamp = format(event.timestamp, 'HH:mm:ss.SSS');

  return (
    <div className="w-full flex flex-col gap-1 font-mono text-xs">
      {/* Badge */}
      <div className="flex items-center gap-2">
        <span
          className="px-2 py-0.5 rounded text-xs font-semibold uppercase"
          style={{
            backgroundColor: badgeStyle.background,
            color: badgeStyle.textColor,
          }}
        >
          {badgeStyle.label}
        </span>
        <span className="text-gray-400">{timestamp}</span>
      </div>

      {/* Log message */}
      <div className="text-gray-700 pl-1">
        {event.logMessage}
      </div>
    </div>
  );
}
