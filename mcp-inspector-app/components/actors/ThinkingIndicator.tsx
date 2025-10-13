/**
 * ThinkingIndicator Component
 *
 * Animated "thinking" indicator shown during LLM processing.
 * Displays three animated dots with staggered animation and italic message text.
 */

'use client';

import { ANIMATION_TIMINGS } from '@/lib/constants';

export interface ThinkingIndicatorProps {
  message: string;
}

export function ThinkingIndicator({ message }: ThinkingIndicatorProps) {
  return (
    <div className="w-full flex flex-col items-center gap-2 py-2">
      {/* Message text */}
      <div className="text-sm italic text-gray-500">
        {message}
      </div>

      {/* Animated dots */}
      <div className="flex gap-1">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
            style={{
              animationDelay: `${index * ANIMATION_TIMINGS.thinkingDots.stagger}ms`,
              animationDuration: `${ANIMATION_TIMINGS.thinkingDots.duration}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
