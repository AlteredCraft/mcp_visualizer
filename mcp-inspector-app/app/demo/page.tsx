/**
 * MCP Inspector Teaching App - Demo Page
 *
 * Module 9: Interactive Features & Polish
 *
 * Demonstrates complete MCP workflow with:
 * - Suggested query buttons
 * - Real-time timeline visualization via SSE
 * - Session controls (clear/export)
 * - Loading states during workflow execution
 * - Chat interface
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SuggestedQueries } from '@/components/controls/SuggestedQueries';
import { SessionControls } from '@/components/controls/SessionControls';
import { TimelineView } from '@/components/timeline/TimelineView';
import { LoadingState, type WorkflowPhase } from '@/components/ui/LoadingState';
import type { TimelineEvent } from '@/types/domain';
import type { WorkflowResult } from '@/types/mcp';
import { v4 as uuidv4 } from 'uuid';

export default function DemoPage() {
  const [sessionId] = useState(() => uuidv4());
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [workflowPhase, setWorkflowPhase] = useState<WorkflowPhase>('idle');
  const [isExecuting, setIsExecuting] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to SSE stream on mount
  useEffect(() => {
    const connectSSE = () => {
      console.log('[DemoPage] Connecting to SSE stream...');
      const eventSource = new EventSource('/api/events/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[DemoPage] SSE connection opened');
      };

      eventSource.onmessage = (event) => {
        try {
          const timelineEvent: TimelineEvent = JSON.parse(event.data);
          console.log('[DemoPage] Received event:', timelineEvent);
          setEvents((prev) => [...prev, timelineEvent]);

          // Update workflow phase based on event metadata
          if (timelineEvent.metadata?.phase) {
            const phase = timelineEvent.metadata.phase;
            if (phase === 'initialization') {
              setWorkflowPhase('initializing');
            } else if (phase === 'discovery') {
              setWorkflowPhase('discovering');
            } else if (phase === 'selection') {
              setWorkflowPhase('planning');
            } else if (phase === 'execution') {
              setWorkflowPhase('executing');
            } else if (phase === 'synthesis') {
              setWorkflowPhase('synthesizing');
            }
          }
        } catch (error) {
          console.error('[DemoPage] Error parsing SSE event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[DemoPage] SSE error:', error);
        eventSource.close();
        // Attempt to reconnect after 3 seconds
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const executeWorkflow = async (query: string) => {
    if (!query.trim() || isExecuting) {
      return;
    }

    try {
      setIsExecuting(true);
      setWorkflowPhase('initializing');

      // Add user message to chat
      setChatHistory((prev) => [...prev, { role: 'user', content: query }]);

      console.log('[DemoPage] Executing workflow with query:', query);

      // Call workflow API
      const response = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: query })
      });

      const result: WorkflowResult = await response.json();

      console.log('[DemoPage] Workflow result:', result);

      if (result.success) {
        // Add assistant response to chat
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', content: result.finalResponse }
        ]);
        setWorkflowPhase('complete');
      } else {
        setWorkflowPhase('error');
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${result.error}` }
        ]);
      }
    } catch (error: any) {
      console.error('[DemoPage] Workflow execution error:', error);
      setWorkflowPhase('error');
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${error.message}` }
      ]);
    } finally {
      setIsExecuting(false);
      // Reset phase after a short delay
      setTimeout(() => setWorkflowPhase('idle'), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userQuery.trim() && !isExecuting) {
      executeWorkflow(userQuery);
      setUserQuery('');
    }
  };

  const handleSuggestedQuery = (query: string) => {
    setUserQuery(query);
    executeWorkflow(query);
  };

  const handleClear = () => {
    setEvents([]);
    setChatHistory([]);
    setWorkflowPhase('idle');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            MCP Inspector Teaching App
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Interactive visualization of Model Context Protocol workflows
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Suggested Queries */}
            <SuggestedQueries
              onSelectQuery={handleSuggestedQuery}
              disabled={isExecuting}
            />

            {/* Session Controls */}
            <SessionControls
              events={events}
              onClear={handleClear}
              sessionId={sessionId}
              disabled={isExecuting}
            />

            {/* Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Session Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Timeline Events:</span>
                  <span className="font-mono font-semibold">{events.length}</span>
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
              </div>
            </div>
          </div>

          {/* Right Column: Chat & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loading State */}
            {workflowPhase !== 'idle' && (
              <LoadingState phase={workflowPhase} />
            )}

            {/* Chat Interface */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  Chat Interface
                </h3>
              </div>

              {/* Chat History */}
              <div className="p-4 space-y-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">
                    Ask a question or select a suggested query to begin
                  </div>
                ) : (
                  chatHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="text-sm">{message.content}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Form */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Ask about AWS services..."
                    disabled={isExecuting}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={isExecuting || !userQuery.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isExecuting ? 'Running...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>

            {/* Timeline */}
            <TimelineView events={events} autoScroll={true} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-600">
          MCP Inspector Teaching App - Module 9: Interactive Features & Polish
        </div>
      </footer>
    </div>
  );
}
