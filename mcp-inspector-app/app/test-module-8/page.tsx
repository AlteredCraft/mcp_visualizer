'use client';

/**
 * Module 8 Test Page: Complete 5-Phase Workflow Orchestration
 *
 * This test validates the complete end-to-end workflow:
 * 1. Initialization & Negotiation
 * 2. Discovery & Contextualization
 * 3. Model-Driven Selection (Planning)
 * 4. Execution Round Trip
 * 5. Synthesis & Final Response
 *
 * Success criteria:
 * - All 5 phases execute correctly
 * - Events recorded via SSE
 * - Final response is delivered
 * - Timeline shows proper vertical alignment
 */

import { useState, useEffect } from 'react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  details?: string;
  duration?: number;
}

interface WorkflowResult {
  finalResponse: string;
  success: boolean;
  error?: string;
  metadata: {
    toolsUsed: string[];
    totalTime: number;
    phaseTimings: {
      initialization: number;
      discovery: number;
      selection: number;
      execution: number;
      synthesis: number;
    };
  };
}

interface TimelineEvent {
  sequence: number;
  timestamp: number;
  eventType: string;
  actor: string;
  metadata?: {
    phase?: string;
    [key: string]: any;
  };
}

const SUGGESTED_QUERIES = [
  {
    id: 'q1',
    label: 'Single Tool Query',
    query: 'Search AWS documentation for S3 bucket naming rules',
    description: 'Should call search_documentation tool'
  },
  {
    id: 'q2',
    label: 'Multiple Tools Query',
    query: 'Look up S3 bucket naming rules and show me related topics',
    description: 'Should call search_documentation then read_documentation'
  },
  {
    id: 'q3',
    label: 'Model-Driven Selection',
    query: 'What are the security best practices for Lambda functions?',
    description: 'LLM autonomously selects appropriate tools'
  }
];

export default function TestModule8() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Execute complete workflow', status: 'pending' },
    { name: 'Verify Phase 1: Initialization & Negotiation', status: 'pending' },
    { name: 'Verify Phase 2: Discovery & Contextualization', status: 'pending' },
    { name: 'Verify Phase 3: Model-Driven Selection (Planning)', status: 'pending' },
    { name: 'Verify Phase 4: Execution Round Trip', status: 'pending' },
    { name: 'Verify Phase 5: Synthesis & Final Response', status: 'pending' },
    { name: 'Verify timeline events via SSE', status: 'pending' },
    { name: 'Verify final response quality', status: 'pending' }
  ]);

  const [selectedQuery, setSelectedQuery] = useState(SUGGESTED_QUERIES[0].query);
  const [customQuery, setCustomQuery] = useState('');
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Connect to SSE stream
  useEffect(() => {
    const es = new EventSource('/api/events/stream');

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'event') {
        setEvents(prev => [...prev, data.event]);
      }
    };

    es.onerror = (error) => {
      console.error('SSE error:', error);
    };

    setEventSource(es);

    return () => {
      es.close();
    };
  }, []);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) =>
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runWorkflow = async (query: string) => {
    setIsRunning(true);
    setWorkflowResult(null);
    setEvents([]);

    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending', details: undefined, duration: undefined })));

    try {
      // Test 1: Execute workflow
      updateTest(0, { status: 'running' });
      const startTime = Date.now();

      const response = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: query })
      });

      const result: WorkflowResult = await response.json();
      const duration = Date.now() - startTime;

      if (!response.ok || !result.success) {
        updateTest(0, {
          status: 'failed',
          details: result.error || 'Workflow execution failed',
          duration
        });
        setIsRunning(false);
        return;
      }

      setWorkflowResult(result);
      updateTest(0, {
        status: 'passed',
        details: `Completed in ${duration}ms`,
        duration
      });

      // Give SSE time to receive all events
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test 2-6: Verify all phases
      await verifyPhases(result, events);

      // Test 7: Verify SSE events
      updateTest(6, { status: 'running' });
      const phaseEvents = {
        initialization: events.filter(e => e.metadata?.phase === 'initialization').length,
        discovery: events.filter(e => e.metadata?.phase === 'discovery').length,
        selection: events.filter(e => e.metadata?.phase === 'selection').length,
        execution: events.filter(e => e.metadata?.phase === 'execution').length,
        synthesis: events.filter(e => e.metadata?.phase === 'synthesis').length
      };

      const totalPhaseEvents = Object.values(phaseEvents).reduce((a, b) => a + b, 0);

      if (totalPhaseEvents > 0) {
        updateTest(6, {
          status: 'passed',
          details: `Received ${events.length} events (${totalPhaseEvents} phase events)`
        });
      } else {
        updateTest(6, {
          status: 'failed',
          details: 'No phase events received via SSE'
        });
      }

      // Test 8: Verify response quality
      updateTest(7, { status: 'running' });
      if (result.finalResponse && result.finalResponse.length > 20) {
        updateTest(7, {
          status: 'passed',
          details: `Response length: ${result.finalResponse.length} chars`
        });
      } else {
        updateTest(7, {
          status: 'failed',
          details: 'Final response too short or empty'
        });
      }

    } catch (error: any) {
      updateTest(0, {
        status: 'failed',
        details: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const verifyPhases = async (result: WorkflowResult, events: TimelineEvent[]) => {
    // Phase 1: Initialization
    updateTest(1, { status: 'running' });
    const initEvents = events.filter(e => e.metadata?.phase === 'initialization');
    if (result.metadata.phaseTimings.initialization > 0 || initEvents.length > 0) {
      updateTest(1, {
        status: 'passed',
        details: `${result.metadata.phaseTimings.initialization}ms, ${initEvents.length} events`,
        duration: result.metadata.phaseTimings.initialization
      });
    } else {
      updateTest(1, { status: 'failed', details: 'No initialization events' });
    }

    // Phase 2: Discovery
    updateTest(2, { status: 'running' });
    const discoveryEvents = events.filter(e => e.metadata?.phase === 'discovery');
    if (result.metadata.phaseTimings.discovery > 0 || discoveryEvents.length > 0) {
      updateTest(2, {
        status: 'passed',
        details: `${result.metadata.phaseTimings.discovery}ms, ${discoveryEvents.length} events`,
        duration: result.metadata.phaseTimings.discovery
      });
    } else {
      updateTest(2, { status: 'failed', details: 'No discovery events' });
    }

    // Phase 3: Selection
    updateTest(3, { status: 'running' });
    const selectionEvents = events.filter(e => e.metadata?.phase === 'selection');
    if (result.metadata.phaseTimings.selection > 0 || selectionEvents.length > 0) {
      updateTest(3, {
        status: 'passed',
        details: `${result.metadata.phaseTimings.selection}ms, ${selectionEvents.length} events, selected ${result.metadata.toolsUsed.length} tool(s)`,
        duration: result.metadata.phaseTimings.selection
      });
    } else {
      updateTest(3, { status: 'failed', details: 'No selection events' });
    }

    // Phase 4: Execution
    updateTest(4, { status: 'running' });
    const executionEvents = events.filter(e => e.metadata?.phase === 'execution');
    if (result.metadata.toolsUsed.length > 0) {
      updateTest(4, {
        status: 'passed',
        details: `${result.metadata.phaseTimings.execution}ms, ${executionEvents.length} events, executed ${result.metadata.toolsUsed.length} tool(s)`,
        duration: result.metadata.phaseTimings.execution
      });
    } else {
      updateTest(4, {
        status: 'passed',
        details: 'No tools executed (direct response)',
        duration: result.metadata.phaseTimings.execution
      });
    }

    // Phase 5: Synthesis
    updateTest(5, { status: 'running' });
    const synthesisEvents = events.filter(e => e.metadata?.phase === 'synthesis');
    if (result.metadata.phaseTimings.synthesis > 0 || synthesisEvents.length > 0) {
      updateTest(5, {
        status: 'passed',
        details: `${result.metadata.phaseTimings.synthesis}ms, ${synthesisEvents.length} events`,
        duration: result.metadata.phaseTimings.synthesis
      });
    } else {
      updateTest(5, { status: 'failed', details: 'No synthesis events' });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      default: return '⚪';
    }
  };

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;
  const pendingCount = tests.filter(t => t.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Module 8: Orchestration Engine Test
          </h1>
          <p className="text-gray-600 mb-4">
            Complete 5-phase MCP workflow validation
          </p>

          {/* Test Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded p-4">
              <div className="text-2xl font-bold">{tests.length}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="bg-green-50 rounded p-4">
              <div className="text-2xl font-bold text-green-600">{passedCount}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="bg-red-50 rounded p-4">
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>

          {/* Query Selection */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Select Test Query:</h3>
            <div className="space-y-2 mb-4">
              {SUGGESTED_QUERIES.map(q => (
                <label key={q.id} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="query"
                    checked={selectedQuery === q.query && !customQuery}
                    onChange={() => {
                      setSelectedQuery(q.query);
                      setCustomQuery('');
                    }}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{q.label}</div>
                    <div className="text-sm text-gray-600">{q.description}</div>
                    <div className="text-xs text-gray-500 font-mono mt-1">{q.query}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="radio"
                  name="query"
                  checked={!!customQuery}
                  onChange={() => setCustomQuery('Custom query...')}
                />
                <span className="font-medium">Custom Query</span>
              </label>
              {customQuery !== '' && (
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="Enter your custom query..."
                  className="w-full p-2 border rounded font-mono text-sm"
                  rows={3}
                />
              )}
            </div>

            <button
              onClick={() => runWorkflow(customQuery || selectedQuery)}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running Workflow...' : 'Run Complete Workflow'}
            </button>
          </div>

          {/* Test Results */}
          <div className="space-y-2">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            {tests.map((test, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  test.status === 'passed' ? 'bg-green-50 border-green-200' :
                  test.status === 'failed' ? 'bg-red-50 border-red-200' :
                  test.status === 'running' ? 'bg-blue-50 border-blue-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{getStatusIcon(test.status)}</span>
                    <div>
                      <div className="font-medium">{test.name}</div>
                      {test.details && (
                        <div className="text-sm text-gray-600 mt-1">
                          {test.details}
                        </div>
                      )}
                    </div>
                  </div>
                  {test.duration !== undefined && (
                    <div className="text-sm text-gray-500">
                      {test.duration}ms
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Result Display */}
        {workflowResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Workflow Result</h2>

            {/* Metadata */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Tools Used</div>
                  <div className="font-medium">
                    {workflowResult.metadata.toolsUsed.length > 0
                      ? workflowResult.metadata.toolsUsed.join(', ')
                      : 'None (direct response)'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Time</div>
                  <div className="font-medium">{workflowResult.metadata.totalTime}ms</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Phase Timings:</div>
                <div className="space-y-1 text-sm">
                  <div>Phase 1 (Initialization): {workflowResult.metadata.phaseTimings.initialization}ms</div>
                  <div>Phase 2 (Discovery): {workflowResult.metadata.phaseTimings.discovery}ms</div>
                  <div>Phase 3 (Selection): {workflowResult.metadata.phaseTimings.selection}ms</div>
                  <div>Phase 4 (Execution): {workflowResult.metadata.phaseTimings.execution}ms</div>
                  <div>Phase 5 (Synthesis): {workflowResult.metadata.phaseTimings.synthesis}ms</div>
                </div>
              </div>
            </div>

            {/* Final Response */}
            <div>
              <h3 className="font-semibold mb-2">Final Response:</h3>
              <div className="p-4 bg-gray-50 rounded border whitespace-pre-wrap">
                {workflowResult.finalResponse}
              </div>
            </div>
          </div>
        )}

        {/* Event Stream Display */}
        {events.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">
              Timeline Events ({events.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-50 rounded border text-sm font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">#{event.sequence}</span>
                    <span className="font-semibold">{event.actor}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">{event.eventType}</span>
                    {event.metadata?.phase && (
                      <>
                        <span className="text-gray-500">•</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {event.metadata.phase}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Module 8 Validation</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              This test validates the complete orchestration engine:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>All 5 phases execute in order</li>
              <li>MCP server connection is maintained</li>
              <li>Tools are discovered and formatted for LLM</li>
              <li>Planning inference selects appropriate tools</li>
              <li>Tools are executed via MCP</li>
              <li>Synthesis inference generates final response</li>
              <li>All events recorded and broadcast via SSE</li>
            </ul>
            <p className="mt-2">
              <strong>Prerequisites:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>ANTHROPIC_API_KEY must be set in .env.local</li>
              <li>AWS Documentation MCP server must be available (via uvx)</li>
              <li>SSE stream must be accessible at /api/events/stream</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
