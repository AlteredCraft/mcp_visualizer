'use client';

import { useState, useEffect } from 'react';
import { useTimelineStore } from '@/store/timeline-store';
import { formatSessionId } from '@/lib/session';

/**
 * StatusBar Component
 *
 * Bottom status bar showing connection status and event count.
 * Now connected to timeline store for real-time updates.
 */
export function StatusBar() {
  // Use primitive selectors to avoid object creation
  const eventCount = useTimelineStore((state) => state.events.length);
  const sessionId = useTimelineStore((state) => state.sessionId);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer
      className="bg-gray-50 border-t border-gray-300 px-6 py-2 flex items-center justify-between text-xs text-gray-600"
      data-component="status-bar"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Connected to AWS Documentation MCP Server</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span>
          Events: <strong>{mounted ? eventCount : 0}</strong>
        </span>
        <span>
          Session:{' '}
          <strong className="font-mono text-[10px]">
            {mounted ? formatSessionId(sessionId) : '-'}
          </strong>
        </span>
      </div>
    </footer>
  );
}
