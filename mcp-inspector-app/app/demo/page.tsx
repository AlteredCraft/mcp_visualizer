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
 *
 * Uses shared components and Zustand store for state management.
 */

'use client';

import React from 'react';
import { useTimelineStore } from '@/store/timeline-store';
import { useSSEConnection } from '@/hooks/useSSEConnection';
import { SuggestedQueries } from '@/components/controls/SuggestedQueries';
import { SessionControls } from '@/components/controls/SessionControls';
import { TimelineView } from '@/components/timeline/TimelineView';
import { LoadingState } from '@/components/ui/LoadingState';
import { AppHeader } from '@/components/timeline/AppHeader';
import { ChatInterface } from '@/components/shared/ChatInterface';
import { StatsDisplay } from '@/components/shared/StatsDisplay';
import type { WorkflowResult } from '@/types/mcp';

export default function DemoPage() {
  // Get state from Zustand store
  const events = useTimelineStore((state) => state.events);
  const workflowPhase = useTimelineStore((state) => state.workflowPhase);
  const isExecuting = useTimelineStore((state) => state.isExecuting);
  const sessionId = useTimelineStore((state) => state.sessionId);
  const setExecuting = useTimelineStore((state) => state.setExecuting);
  const setWorkflowPhase = useTimelineStore((state) => state.setWorkflowPhase);
  const addChatMessage = useTimelineStore((state) => state.addChatMessage);
  const clearEvents = useTimelineStore((state) => state.clearEvents);

  // Connect to SSE stream (uses shared hook)
  useSSEConnection();

  const executeWorkflow = async (query: string) => {
    if (!query.trim() || isExecuting) {
      return;
    }

    try {
      setExecuting(true);
      setWorkflowPhase('initializing');

      // Add user message to chat
      addChatMessage({ role: 'user', content: query });

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
        addChatMessage({ role: 'assistant', content: result.finalResponse });
        setWorkflowPhase('complete');
      } else {
        setWorkflowPhase('error');
        addChatMessage({ role: 'assistant', content: `Error: ${result.error}` });
      }
    } catch (error: any) {
      console.error('[DemoPage] Workflow execution error:', error);
      setWorkflowPhase('error');
      addChatMessage({ role: 'assistant', content: `Error: ${error.message}` });
    } finally {
      setExecuting(false);
      // Reset phase after a short delay
      setTimeout(() => setWorkflowPhase('idle'), 2000);
    }
  };

  const handleSuggestedQuery = (query: string) => {
    executeWorkflow(query);
  };

  const handleClear = () => {
    clearEvents();
    setWorkflowPhase('idle');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - using shared AppHeader with light variant */}
      <AppHeader
        title="MCP Inspector Teaching App"
        description="Interactive visualization of Model Context Protocol workflows"
        variant="light"
        showControls={true}
        showRecordingBadge={false}
      />

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

            {/* Stats - using shared StatsDisplay with panel variant */}
            <StatsDisplay variant="panel" />
          </div>

          {/* Right Column: Chat & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loading State */}
            {workflowPhase !== 'idle' && (
              <LoadingState phase={workflowPhase} />
            )}

            {/* Chat Interface - using shared ChatInterface with full variant */}
            <ChatInterface
              variant="full"
              onSubmit={executeWorkflow}
              placeholder="Ask about AWS services..."
            />

            {/* Timeline */}
            <TimelineView />
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
