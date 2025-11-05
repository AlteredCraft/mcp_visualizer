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
  const totalInputTokens = useTimelineStore((state) => state.totalInputTokens);
  const totalOutputTokens = useTimelineStore((state) => state.totalOutputTokens);

  const eventCount = events.length;
  const duration = events.length > 0 ? events[events.length - 1].timestamp - events[0].timestamp : null;
  const totalTokens = totalInputTokens + totalOutputTokens;

  const formatDuration = (ms: number | null) => {
    if (ms === null) return '0.0s';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTokenCount = (count: number) => {
    if (count === 0) return '0';
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  if (variant === 'statusbar') {
    // StatusBar variant: Bottom bar for timeline view
    return (
      <div className="h-[40px] bg-neutral-800 text-gray-400 flex items-center px-4 text-sm gap-5 flex-shrink-0">
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

        {/* Token Usage - Always visible */}
        <div className="flex items-center gap-2">
          <span>Tokens:</span>
          <span className="text-blue-400 font-mono">{formatTokenCount(totalTokens)}</span>
          <span className="text-gray-500">
            ({formatTokenCount(totalInputTokens)} in / {formatTokenCount(totalOutputTokens)} out)
          </span>
        </div>
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
        <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
          <span className="text-gray-600">Total Tokens:</span>
          <span className="font-mono font-semibold text-blue-600">{formatTokenCount(totalTokens)}</span>
        </div>
        <div className="flex justify-between pl-2">
          <span className="text-gray-500 text-xs">Input:</span>
          <span className="font-mono text-xs text-gray-600">{formatTokenCount(totalInputTokens)}</span>
        </div>
        <div className="flex justify-between pl-2">
          <span className="text-gray-500 text-xs">Output:</span>
          <span className="font-mono text-xs text-gray-600">{formatTokenCount(totalOutputTokens)}</span>
        </div>
      </div>
    </div>
  );
}
