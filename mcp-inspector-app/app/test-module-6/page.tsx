'use client';

/**
 * Module 6: MCP Integration Layer - Test Page
 *
 * Tests MCP integration via Next.js API routes (server-side).
 *
 * Tests:
 * 1. Connection to AWS Documentation MCP server (via API)
 * 2. 3-message handshake (initialize → response → initialized)
 * 3. Tool discovery (search_documentation, read_documentation, recommend)
 * 4. Tool execution
 * 5. Event recording in timeline
 */

import { useState } from 'react';
import { useTimelineStore } from '@/store/timeline-store';
import type { MCPTool, MCPToolResult } from '@/types/mcp';

export default function TestModule6Page() {
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [connectionError, setConnectionError] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Tool discovery state
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string>('');

  // Tool execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<MCPToolResult | null>(null);
  const [executionError, setExecutionError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('S3 bucket naming rules');

  // Timeline events
  const events = useTimelineStore((state) => state.events);
  const clearEvents = useTimelineStore((state) => state.clearEvents);

  // Stats
  const connectionEvents = events.filter((e) => e.metadata.phase === 'initialization');
  const discoveryEvents = events.filter((e) => e.metadata.phase === 'discovery');
  const executionEvents = events.filter((e) => e.metadata.phase === 'execution');

  /**
   * Connect to AWS Documentation MCP server via API.
   */
  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionError('');

    try {
      const response = await fetch('/api/mcp/connect', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setConnectionStatus('connected');
      } else {
        setConnectionError(data.error || 'Connection failed');
        setConnectionStatus('error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setConnectionError(errorMessage);
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Disconnect from server via API.
   */
  const handleDisconnect = async () => {
    try {
      await fetch('/api/mcp/connect', {
        method: 'DELETE',
      });

      setConnectionStatus('disconnected');
      setTools([]);
      setExecutionResult(null);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  /**
   * Discover tools from connected server via API.
   */
  const handleDiscoverTools = async () => {
    setIsDiscovering(true);
    setDiscoveryError('');

    try {
      const response = await fetch('/api/mcp/tools');
      const data = await response.json();

      if (data.success) {
        setTools(data.tools);
      } else {
        setDiscoveryError(data.error || 'Tool discovery failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setDiscoveryError(errorMessage);
    } finally {
      setIsDiscovering(false);
    }
  };

  /**
   * Execute search_documentation tool via API.
   */
  const handleSearchDocumentation = async () => {
    setIsExecuting(true);
    setExecutionError('');
    setExecutionResult(null);

    try {
      const response = await fetch('/api/mcp/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName: 'search_documentation',
          arguments: {
            search_phrase: searchQuery,
            limit: 5,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setExecutionResult(data.result);
      } else {
        setExecutionError(data.error || 'Tool execution failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setExecutionError(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Clear all events and reset state.
   */
  const handleClearAll = () => {
    clearEvents();
    setConnectionStatus('disconnected');
    setTools([]);
    setExecutionResult(null);
    setConnectionError('');
    setDiscoveryError('');
    setExecutionError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Module 6: MCP Integration Layer (API Routes)
          </h1>
          <p className="text-gray-600">
            Testing connection to AWS Documentation MCP server via Next.js API routes.
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Architecture: Browser → API Routes (Server) → MCP Client → MCP Server
          </p>
        </div>

        {/* Validation Checklist */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Validation Checklist</h2>
          <div className="space-y-2">
            <ValidationItem
              checked={connectionStatus === 'connected'}
              label="Auto-connect to AWS Documentation MCP server"
            />
            <ValidationItem
              checked={connectionEvents.length >= 3}
              label="Successfully complete 3-message initialization handshake"
            />
            <ValidationItem
              checked={tools.length === 3}
              label="Discover all 3 tools (search_documentation, read_documentation, recommend)"
            />
            <ValidationItem
              checked={discoveryEvents.length > 0}
              label="Record all protocol messages as timeline events"
            />
            <ValidationItem
              checked={connectionStatus === 'connected' || connectionStatus === 'error'}
              label="Display connection status in UI"
            />
            <ValidationItem
              checked={connectionError !== ''}
              label="Handle connection errors gracefully"
            />
          </div>
        </div>

        {/* Connection Control */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection</h2>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleConnect}
              disabled={isConnecting || connectionStatus === 'connected'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isConnecting ? 'Connecting...' : 'Connect to AWS Docs Server'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={connectionStatus !== 'connected'}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              Disconnect
            </button>
            <span
              className={`px-3 py-1 rounded font-medium ${
                connectionStatus === 'connected'
                  ? 'bg-green-100 text-green-800'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-100 text-yellow-800'
                  : connectionStatus === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {connectionStatus}
            </span>
          </div>
          {connectionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
              <strong>Error:</strong> {connectionError}
            </div>
          )}
        </div>

        {/* Tool Discovery */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tool Discovery</h2>
          <button
            onClick={handleDiscoverTools}
            disabled={connectionStatus !== 'connected' || isDiscovering}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 mb-4"
          >
            {isDiscovering ? 'Discovering...' : 'Discover Tools'}
          </button>

          {discoveryError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 mb-4">
              <strong>Error:</strong> {discoveryError}
            </div>
          )}

          {tools.length > 0 && (
            <div className="space-y-3">
              <p className="font-semibold">Discovered {tools.length} tools:</p>
              {tools.map((tool) => (
                <div key={tool.name} className="p-4 bg-gray-50 rounded border border-gray-200">
                  <div className="font-semibold text-gray-900">{tool.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{tool.description}</div>
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer">
                      View Input Schema
                    </summary>
                    <pre className="text-xs mt-2 bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(tool.inputSchema, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tool Execution */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tool Execution</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query:
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter search query..."
            />
          </div>
          <button
            onClick={handleSearchDocumentation}
            disabled={connectionStatus !== 'connected' || isExecuting || !searchQuery}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 mb-4"
          >
            {isExecuting ? 'Searching...' : 'Search Documentation'}
          </button>

          {executionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 mb-4">
              <strong>Error:</strong> {executionError}
            </div>
          )}

          {executionResult && (
            <div className="space-y-3">
              <p className="font-semibold">Result:</p>
              <div className="p-4 bg-gray-50 rounded border border-gray-200 max-h-96 overflow-y-auto">
                {executionResult.content.map((item, idx) => (
                  <div key={idx} className="mb-2">
                    {item.type === 'text' && (
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">
                        {item.text}
                      </div>
                    )}
                  </div>
                ))}
                {executionResult.isError && (
                  <div className="text-red-600 text-sm mt-2">Error in tool execution</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Event Statistics */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Event Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Events" value={events.length} color="blue" />
            <StatCard
              label="Initialization"
              value={connectionEvents.length}
              color="green"
            />
            <StatCard label="Discovery" value={discoveryEvents.length} color="purple" />
            <StatCard label="Execution" value={executionEvents.length} color="orange" />
          </div>
          <button
            onClick={handleClearAll}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear All Events
          </button>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Events (Last 10)</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No events recorded yet. Connect to the server to start recording events.
              </p>
            ) : (
              events
                .slice(-10)
                .reverse()
                .map((event) => (
                  <div
                    key={`${event.sequence}`}
                    className="p-3 bg-gray-50 rounded border border-gray-200 text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">#{event.sequence}</span>
                      <span className="text-xs text-gray-500">{event.eventType}</span>
                    </div>
                    <div className="text-gray-700">
                      {event.eventType === 'console_log' && event.logMessage}
                      {event.eventType === 'internal_operation' && event.description}
                      {event.eventType === 'protocol_message' &&
                        `${event.direction} ${event.metadata.messageType}`}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Actor: {event.actor} | Phase: {event.metadata.phase}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ValidationItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-lg ${checked ? 'text-green-600' : 'text-gray-400'}`}>
        {checked ? '✓' : '○'}
      </span>
      <span className={checked ? 'text-gray-900' : 'text-gray-500'}>{label}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
  };

  return (
    <div className={`p-4 rounded border ${colors[color as keyof typeof colors]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}
