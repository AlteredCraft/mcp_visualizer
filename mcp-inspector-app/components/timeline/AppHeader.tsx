/**
 * AppHeader Component
 *
 * Dark header with app title and recording badge.
 * Matches HTML mockup styling (docs/mcp-inspector-actor-based.html lines 24-49)
 */

interface AppHeaderProps {
  isRecording: boolean;
}

export function AppHeader({ isRecording }: AppHeaderProps) {
  return (
    <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0">
      {/* App Title */}
      <div className="text-sm font-semibold flex items-center gap-2.5">
        🔍 MCP Inspector - Actor-Based Timeline
      </div>

      {/* Recording Badge */}
      {isRecording && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 border border-red-500 rounded-full text-xs">
          <div
            className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"
            style={{ animation: 'pulse 2s infinite' }}
          />
          <span>Recording Timeline</span>
        </div>
      )}
    </div>
  );
}
