/**
 * StatusBar Component
 *
 * Bottom status bar with connection status, event count, and timing.
 * Matches HTML mockup (docs/mcp-inspector-actor-based.html lines 1203-1221)
 */

interface StatusBarProps {
  eventCount: number;
  duration: number | null;
}

export function StatusBar({ eventCount, duration }: StatusBarProps) {
  const formatDuration = (ms: number | null) => {
    if (ms === null) return '0.0s';
    return `${(ms / 1000).toFixed(1)}s`;
  };

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
      <div className="ml-auto">
        📝 All events recorded for playback
      </div>
    </div>
  );
}
