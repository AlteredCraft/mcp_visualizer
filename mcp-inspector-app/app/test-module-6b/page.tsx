/**
 * Module 6B: SSE + Global Singleton Test Page
 *
 * Tests the new architecture with:
 * - Global singleton MCP client (server-side)
 * - Server-Sent Events for real-time event streaming
 * - Persistent connection across API requests
 *
 * Validation Tests:
 * 1. Singleton persistence (call /api/mcp/status multiple times)
 * 2. Connection establishment (POST /api/mcp/connect-v2)
 * 3. Tool discovery after connection (GET /api/mcp/tools-v2)
 * 4. Real-time event streaming via SSE
 */

'use client';

import { useState } from 'react';
import { useTimelineSSE } from '@/hooks/use-timeline-sse';
import { useTimelineStore } from '@/store/timeline-store';
import type { MCPTool } from '@/types/mcp';

export default function TestModule6BPage() {
  // SSE connection
  const { connectionStatus, reconnect, eventCount } = useTimelineSSE();

  // State for tests
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [tools, setTools] = useState<MCPTool[]>([]);

  // Timeline events from store (populated by SSE)
  const events = useTimelineStore((state) => state.events);

  /**
   * Test 1: Singleton Persistence
   * Call /api/mcp/status multiple times and verify same instance
   */
  const testSingletonPersistence = async () => {
    setIsRunningTest(true);
    try {
      // Call status endpoint 3 times
      const results = [];
      for (let i = 0; i < 3; i++) {
        const response = await fetch('/api/mcp/status');
        const data = await response.json();
        results.push(data);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Check if all have same session ID
      const sessionIds = results.map((r) => r.sessionInfo.sessionId);
      const allSame = sessionIds.every((id) => id === sessionIds[0]);

      setTestResults({
        ...testResults,
        singletonPersistence: {
          passed: allSame,
          sessionIds,
          message: allSame
            ? '✅ Singleton persists across API calls'
            : '❌ Different session IDs detected',
        },
      });
    } catch (error) {
      setTestResults({
        ...testResults,
        singletonPersistence: {
          passed: false,
          error: String(error),
        },
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  /**
   * Test 2: Connection Establishment
   */
  const testConnection = async () => {
    setIsRunningTest(true);
    try {
      const response = await fetch('/api/mcp/connect-v2', {
        method: 'POST',
      });

      const data = await response.json();

      setTestResults({
        ...testResults,
        connection: {
          passed: data.success,
          data,
          message: data.success
            ? '✅ Connection established'
            : `❌ Connection failed: ${data.error}`,
        },
      });
    } catch (error) {
      setTestResults({
        ...testResults,
        connection: {
          passed: false,
          error: String(error),
        },
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  /**
   * Test 3: Tool Discovery
   */
  const testToolDiscovery = async () => {
    setIsRunningTest(true);
    try {
      const response = await fetch('/api/mcp/tools-v2');
      const data = await response.json();

      if (data.success) {
        setTools(data.tools);
      }

      setTestResults({
        ...testResults,
        toolDiscovery: {
          passed: data.success && data.count === 3,
          toolCount: data.count,
          tools: data.tools?.map((t: MCPTool) => t.name) || [],
          message: data.success
            ? `✅ Discovered ${data.count} tools`
            : `❌ Tool discovery failed: ${data.error}`,
        },
      });
    } catch (error) {
      setTestResults({
        ...testResults,
        toolDiscovery: {
          passed: false,
          error: String(error),
        },
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  /**
   * Run all tests sequentially
   */
  const runAllTests = async () => {
    setTestResults({});
    await testSingletonPersistence();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await testConnection();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await testToolDiscovery();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Module 6B: SSE + Global Singleton Architecture
          </h1>
          <p className="text-gray-600">
            Testing stateful MCP connection with Server-Sent Events
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Architecture: Browser ← SSE → API Routes → Global Singleton → MCP Server
          </p>
        </div>

        {/* SSE Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">SSE Connection Status</h2>
          <div className="flex items-center gap-4">
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
            <span className="text-sm text-gray-600">
              Events received: {eventCount}
            </span>
            <span className="text-sm text-gray-600">
              Events in store: {events.length}
            </span>
            <button
              onClick={reconnect}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Reconnect
            </button>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Validation Tests</h2>
          <div className="flex gap-3 mb-4">
            <button
              onClick={runAllTests}
              disabled={isRunningTest}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
            >
              {isRunningTest ? 'Running...' : 'Run All Tests'}
            </button>
            <button
              onClick={testSingletonPersistence}
              disabled={isRunningTest}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Test 1: Singleton
            </button>
            <button
              onClick={testConnection}
              disabled={isRunningTest}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Test 2: Connect
            </button>
            <button
              onClick={testToolDiscovery}
              disabled={isRunningTest}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400"
            >
              Test 3: Tools
            </button>
          </div>

          {/* Test Results */}
          <div className="space-y-3">
            {Object.entries(testResults).map(([testName, result]) => (
              <div
                key={testName}
                className={`p-4 rounded border ${
                  result.passed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="font-semibold text-gray-900 capitalize mb-2">
                  {testName.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-sm">{result.message}</div>
                {result.error && (
                  <div className="text-xs text-red-600 mt-2">Error: {result.error}</div>
                )}
                {result.tools && (
                  <div className="text-xs text-gray-600 mt-2">
                    Tools: {result.tools.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Discovered Tools */}
        {tools.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Discovered Tools</h2>
            <div className="space-y-3">
              {tools.map((tool) => (
                <div key={tool.name} className="p-4 bg-gray-50 rounded border border-gray-200">
                  <div className="font-semibold text-gray-900">{tool.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{tool.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events (from SSE) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Recent Events (Last 10 from SSE)
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No events received yet. Run tests to generate events.
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
