/**
 * AppHeader Component
 *
 * Shared header component with customization options.
 * Supports two styles:
 * - Dark header with recording badge (for root timeline view)
 * - Light header with title/description (for demo page)
 *
 * Matches HTML mockup styling (docs/mcp-inspector-actor-based.html lines 24-49)
 */

'use client';

import { useState } from 'react';
import { useTimelineStore } from '@/store/timeline-store';

interface AppHeaderProps {
  /**
   * Custom title (overrides default)
   */
  title?: string;

  /**
   * Optional description/subtitle
   */
  description?: string;

  /**
   * Show recording badge (default: false)
   */
  showRecordingBadge?: boolean;

  /**
   * Show export/reset controls (default: true)
   */
  showControls?: boolean;

  /**
   * Header style variant (default: 'dark')
   */
  variant?: 'dark' | 'light';
}

export function AppHeader({
  title = '🔍 MCP Inspector - Actor-Based Timeline',
  description,
  showRecordingBadge = false,
  showControls = true,
  variant = 'dark',
}: AppHeaderProps) {
  const exportSession = useTimelineStore((state) => state.exportSession);
  const exportSessionAsMermaid = useTimelineStore((state) => state.exportSessionAsMermaid);
  const startNewSession = useTimelineStore((state) => state.startNewSession);
  const sessionId = useTimelineStore((state) => state.sessionId);
  const eventCount = useTimelineStore((state) => state.getEventCount());
  const isRecording = useTimelineStore((state) => state.isRecording);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [mermaidExportStatus, setMermaidExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');

  const handleExportTrace = () => {
    try {
      setExportStatus('exporting');

      // Get JSON from store
      const jsonData = exportSession();

      // Create blob and download link
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Generate filename with timestamp and session ID
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const shortSessionId = sessionId.slice(0, 8);
      link.download = `mcp-trace-${timestamp}-${shortSessionId}.json`;
      link.href = url;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to export trace:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  };

  const handleExportMermaid = () => {
    try {
      setMermaidExportStatus('exporting');

      // Get Markdown with Mermaid diagram from store
      const markdownData = exportSessionAsMermaid();

      // Create blob and download link
      const blob = new Blob([markdownData], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Generate filename with timestamp and session ID
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const shortSessionId = sessionId.slice(0, 8);
      link.download = `mcp-diagram-${timestamp}-${shortSessionId}.md`;
      link.href = url;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);

      setMermaidExportStatus('success');
      setTimeout(() => setMermaidExportStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to export Mermaid diagram:', error);
      setMermaidExportStatus('error');
      setTimeout(() => setMermaidExportStatus('idle'), 2000);
    }
  };

  const handleResetTrace = () => {
    if (eventCount === 0) return;

    const confirmed = window.confirm(
      'Are you sure you want to reset the trace? This will clear all recorded events and start a new session.'
    );

    if (confirmed) {
      startNewSession();
    }
  };

  // Determine styling based on variant
  const headerClasses =
    variant === 'dark'
      ? 'bg-slate-800 text-white'
      : 'bg-white border-b border-gray-200 shadow-sm';

  const titleClasses = variant === 'dark' ? 'text-sm font-semibold' : 'text-2xl font-bold text-gray-900';
  const descriptionClasses = 'text-sm text-gray-600 mt-1';

  return (
    <div className={`${headerClasses} px-4 py-${variant === 'dark' ? '2.5' : '4'} flex items-center justify-between flex-shrink-0`}>
      {/* App Title */}
      <div>
        <div className={titleClasses}>{title}</div>
        {description && <p className={descriptionClasses}>{description}</p>}
      </div>

      {/* Controls Group */}
      {showControls && (
        <div className="flex items-center gap-3">
        {/* Reset Trace Button */}
        <button
          onClick={handleResetTrace}
          disabled={eventCount === 0}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${eventCount === 0
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md'
            }
          `}
          title={eventCount === 0 ? 'No events to reset' : 'Clear all events and start a new session'}
        >
          <span>🔄</span>
          <span>Reset Trace</span>
        </button>

        {/* Export Trace Button */}
        <button
          onClick={handleExportTrace}
          disabled={eventCount === 0 || exportStatus === 'exporting'}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${eventCount === 0 || exportStatus === 'exporting'
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
            }
          `}
          title={eventCount === 0 ? 'No events to export' : 'Download trace as JSON file'}
        >
          {exportStatus === 'exporting' && (
            <>
              <span className="animate-spin">⏳</span>
              <span>Exporting...</span>
            </>
          )}
          {exportStatus === 'success' && (
            <>
              <span>✓</span>
              <span>Downloaded</span>
            </>
          )}
          {exportStatus === 'error' && (
            <>
              <span>✗</span>
              <span>Failed</span>
            </>
          )}
          {exportStatus === 'idle' && (
            <>
              <span>💾</span>
              <span>Export Trace</span>
              {eventCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-700/50 rounded text-xs">
                  {eventCount}
                </span>
              )}
            </>
          )}
        </button>

        {/* Export Mermaid Button */}
        <button
          onClick={handleExportMermaid}
          disabled={eventCount === 0 || mermaidExportStatus === 'exporting'}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${eventCount === 0 || mermaidExportStatus === 'exporting'
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md'
            }
          `}
          title={eventCount === 0 ? 'No events to export' : 'Download sequence diagram as Markdown'}
        >
          {mermaidExportStatus === 'exporting' && (
            <>
              <span className="animate-spin">⏳</span>
              <span>Exporting...</span>
            </>
          )}
          {mermaidExportStatus === 'success' && (
            <>
              <span>✓</span>
              <span>Downloaded</span>
            </>
          )}
          {mermaidExportStatus === 'error' && (
            <>
              <span>✗</span>
              <span>Failed</span>
            </>
          )}
          {mermaidExportStatus === 'idle' && (
            <>
              <span>📊</span>
              <span>Export Mermaid</span>
            </>
          )}
        </button>

        {/* Recording Badge */}
        {showRecordingBadge && isRecording && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 border border-red-500 rounded-full text-xs">
            <div
              className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"
              style={{ animation: 'pulse 2s infinite' }}
            />
            <span>Recording Timeline</span>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
