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

import { useState, useRef, useEffect } from 'react';
import { useTimelineStore } from '@/store/timeline-store';
import { Search, RefreshCw, Loader2, Check, X, Save, BarChart3, Settings, Server } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  title = 'MCP Inspector - Actor-Based Timeline',
  description,
  showRecordingBadge = false,
  showControls = true,
  variant = 'dark',
}: AppHeaderProps) {
  const router = useRouter();
  const exportSession = useTimelineStore((state) => state.exportSession);
  const exportSessionAsMermaid = useTimelineStore((state) => state.exportSessionAsMermaid);
  const startNewSession = useTimelineStore((state) => state.startNewSession);
  const sessionId = useTimelineStore((state) => state.sessionId);
  const eventCount = useTimelineStore((state) => state.getEventCount());
  const isRecording = useTimelineStore((state) => state.isRecording);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [mermaidExportStatus, setMermaidExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [resetStatus, setResetStatus] = useState<'idle' | 'resetting'>('idle');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen]);

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

  const handleResetTrace = async () => {
    if (eventCount === 0 || resetStatus === 'resetting') return;

    const confirmed = window.confirm(
      'Start a new session?\n\n' +
      'This will:\n' +
      '• Clear all recorded events\n' +
      '• Disconnect from all MCP servers\n' +
      '• Reload the page with a fresh session\n\n' +
      'Your next query will reconnect to all currently enabled servers.'
    );

    if (confirmed) {
      setResetStatus('resetting');

      try {
        // Disconnect from all MCP servers and clear session state
        // This clears the event buffer on the server-side singleton
        const response = await fetch('/api/mcp/connect-v2?clearSession=true', {
          method: 'DELETE',
        });

        if (!response.ok) {
          console.warn('Failed to disconnect MCP servers:', await response.text());
          // Continue anyway - the user wants to start fresh
        }

        // Reload page to reset all state layers:
        // 1. Server-side: Already cleared above
        // 2. SSE connection: Closes and reconnects
        // 3. Client-side: Zustand store resets to initial state
        // Note: We don't call startNewSession() here because page reload handles it
        window.location.reload();
      } catch (error) {
        console.error('Error during session reset:', error);
        // Even if disconnect failed, reload to ensure clean state
        window.location.reload();
      }
    }
  };

  // Determine styling based on variant
  const headerClasses =
    variant === 'dark'
      ? 'bg-slate-800 text-white'
      : 'bg-white border-b border-gray-200 shadow-sm';

  const titleClasses = variant === 'dark' ? 'text-2xl font-semibold' : 'text-2xl font-bold text-gray-900';
  const descriptionClasses = 'text-sm text-gray-600 mt-1';

  return (
    <div className={`${headerClasses} px-4 py-${variant === 'dark' ? '2.5' : '4'} flex items-center justify-between flex-shrink-0`}>
      {/* App Title */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5" />
        <div>
          <div className={titleClasses}>{title}</div>
          {description && <p className={descriptionClasses}>{description}</p>}
        </div>
      </div>

      {/* Controls Group */}
      {showControls && (
        <div className="flex items-center gap-3">
        {/* Settings Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
              hover:opacity-80 hover:shadow-md
            `}
            style={{
              backgroundColor: '#7671d4',
              color: '#fdfdfa'
            }}
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg overflow-hidden z-50"
              style={{
                backgroundColor: variant === 'dark' ? '#1e293b' : '#ffffff',
                border: `1px solid ${variant === 'dark' ? '#334155' : '#e5e7eb'}`
              }}
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/settings/servers');
                  }}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors
                    ${variant === 'dark'
                      ? 'text-gray-200 hover:bg-slate-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Server className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Server Configuration</div>
                    <div className={`text-xs ${variant === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Manage MCP servers
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Start New Session Button */}
        <button
          onClick={handleResetTrace}
          disabled={eventCount === 0 || resetStatus === 'resetting'}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${eventCount === 0 || resetStatus === 'resetting'
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:opacity-80 hover:shadow-md'
            }
          `}
          style={{
            backgroundColor: eventCount === 0 || resetStatus === 'resetting' ? '#a2a1a4' : '#d97171',
            color: '#fdfdfa'
          }}
          title={eventCount === 0 ? 'No events recorded yet' : 'Start a new session (clears all events and reconnects)'}
        >
          {resetStatus === 'resetting' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Starting...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Start New Session</span>
            </>
          )}
        </button>

        {/* Export Trace Button */}
        <button
          onClick={handleExportTrace}
          disabled={eventCount === 0 || exportStatus === 'exporting'}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${eventCount === 0 || exportStatus === 'exporting'
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:opacity-80 hover:shadow-md'
            }
          `}
          style={{
            backgroundColor: eventCount === 0 || exportStatus === 'exporting' ? '#a2a1a4' : '#7671d4',
            color: '#fdfdfa'
          }}
          title={eventCount === 0 ? 'No events to export' : 'Download trace as JSON file'}
        >
          {exportStatus === 'exporting' && (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Exporting...</span>
            </>
          )}
          {exportStatus === 'success' && (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Downloaded</span>
            </>
          )}
          {exportStatus === 'error' && (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Failed</span>
            </>
          )}
          {exportStatus === 'idle' && (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Export Trace</span>
              {eventCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{backgroundColor: 'rgba(118, 113, 212, 0.3)'}}>
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
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:opacity-80 hover:shadow-md'
            }
          `}
          style={{
            backgroundColor: eventCount === 0 || mermaidExportStatus === 'exporting' ? '#a2a1a4' : '#7671d4',
            color: '#fdfdfa'
          }}
          title={eventCount === 0 ? 'No events to export' : 'Download sequence diagram as Markdown'}
        >
          {mermaidExportStatus === 'exporting' && (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Exporting...</span>
            </>
          )}
          {mermaidExportStatus === 'success' && (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Downloaded</span>
            </>
          )}
          {mermaidExportStatus === 'error' && (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Failed</span>
            </>
          )}
          {mermaidExportStatus === 'idle' && (
            <>
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Export Mermaid</span>
            </>
          )}
        </button>
        </div>
      )}
    </div>
  );
}
