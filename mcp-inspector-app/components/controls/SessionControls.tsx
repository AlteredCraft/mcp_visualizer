/**
 * Session Controls Component
 *
 * Provides controls for managing the timeline session:
 * - Clear timeline events
 * - Export session logs to clipboard
 * - Reset workflow state
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { TimelineEvent } from '@/types/mcp';

interface SessionControlsProps {
  events: TimelineEvent[];
  onClear: () => void;
  sessionId: string;
  disabled?: boolean;
}

export function SessionControls({
  events,
  onClear,
  sessionId,
  disabled = false
}: SessionControlsProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [mounted, setMounted] = useState(false);

  // Only show sessionId after client-side hydration to avoid mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExportSession = async () => {
    try {
      const sessionData = {
        sessionId,
        exportedAt: new Date().toISOString(),
        eventCount: events.length,
        events: events
      };

      const json = JSON.stringify(sessionData, null, 2);
      await navigator.clipboard.writeText(json);

      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy session log:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all timeline events? This action cannot be undone.')) {
      onClear();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Session Controls
      </h3>

      <div className="space-y-2">
        {/* Session Info */}
        <div className="text-xs text-gray-600 space-y-1 mb-3">
          <div>
            <span className="font-semibold">Session ID:</span>{' '}
            <span className="font-mono">
              {mounted ? `${sessionId.slice(0, 8)}...` : 'Loading...'}
            </span>
          </div>
          <div>
            <span className="font-semibold">Events:</span> {events.length}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportSession}
          disabled={disabled || events.length === 0}
          className={`
            w-full px-4 py-2 rounded-md text-sm font-medium transition-all
            ${disabled || events.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
            }
          `}
        >
          {copyStatus === 'copied' && '✓ Copied to Clipboard'}
          {copyStatus === 'error' && '✗ Copy Failed'}
          {copyStatus === 'idle' && 'Export Session Log'}
        </button>

        {/* Clear Button */}
        <button
          onClick={handleClear}
          disabled={disabled || events.length === 0}
          className={`
            w-full px-4 py-2 rounded-md text-sm font-medium transition-all
            ${disabled || events.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
            }
          `}
        >
          Clear Timeline
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500 italic">
        Export logs to clipboard for debugging or sharing
      </div>
    </div>
  );
}
