/**
 * Shared StatsDisplay Component
 *
 * Unified stats display with two variants:
 * - 'statusbar': Bottom bar with connection/event stats (for root timeline view)
 * - 'panel': Card layout with stats (for demo page)
 *
 * Uses Zustand store for event count and chat history.
 */

'use client';

import { useTimelineStore } from '@/store/timeline-store';

interface StatsDisplayProps {
  variant: 'statusbar' | 'panel';
}

export function StatsDisplay({ variant }: StatsDisplayProps) {
  const events = useTimelineStore((state) => state.events);
  const chatHistory = useTimelineStore((state) => state.chatHistory);
  const isExecuting = useTimelineStore((state) => state.isExecuting);

  const eventCount = events.length;
  const duration = events.length > 0 ? events[events.length - 1].timestamp - events[0].timestamp : null;

  const formatDuration = (ms: number | null) => {
    if (ms === null) return '0.0s';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (variant === 'statusbar') {
    // StatusBar variant: Bottom bar for timeline view
    return (
      <div className="h-[30px] bg-neutral-800 text-gray-400 flex items-center px-4 text-xs gap-5 flex-shrink-0">
        {/* Connection Status */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Connected</span>
        </div>

        {/* Transport */}
        <div>Transport: SSE</div>

        {/* Event Count */}
        <div>Timeline: {eventCount} events</div>

        {/* Duration */}
        <div>Total: {formatDuration(duration)}</div>

        {/* Recording Indicator */}
        <div className="ml-auto">📝 All events recorded for playback</div>
      </div>
    );
  }

  // Panel variant: Card layout for demo page
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Session Stats</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Timeline Events:</span>
          <span className="font-mono font-semibold">{eventCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Chat Messages:</span>
          <span className="font-mono font-semibold">{chatHistory.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={`font-semibold ${isExecuting ? 'text-blue-600' : 'text-green-600'}`}>
            {isExecuting ? 'Running' : 'Idle'}
          </span>
        </div>
        {duration !== null && (
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-mono font-semibold">{formatDuration(duration)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
