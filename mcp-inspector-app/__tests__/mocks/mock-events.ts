/**
 * Mock timeline events for testing
 * Provides realistic event sequences for unit and integration tests
 */

import type {
  TimelineEvent,
  ConsoleLogEvent,
  ProtocolMessageEvent,
  InternalOperationEvent,
} from '../../types/domain';

/**
 * Create a mock console log event
 */
export function createMockConsoleLog(
  overrides: Partial<ConsoleLogEvent> = {}
): ConsoleLogEvent {
  return {
    sessionId: 'test-session',
    sequence: 1,
    timestamp: Date.now(),
    eventType: 'console_log',
    actor: 'host_app',
    logLevel: 'info',
    logMessage: 'Test log message',
    badgeType: 'SYSTEM',
    metadata: {
      messageType: 'console_log',
      phase: 'initialization',
    },
    ...overrides,
  };
}

/**
 * Create a mock protocol message event
 */
export function createMockProtocolMessage(
  overrides: Partial<ProtocolMessageEvent> = {}
): ProtocolMessageEvent {
  return {
    sessionId: 'test-session',
    sequence: 1,
    timestamp: Date.now(),
    eventType: 'protocol_message',
    actor: 'host_app',
    direction: 'sent',
    lane: 'host_mcp',
    message: {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
    },
    metadata: {
      messageType: 'jsonrpc_request',
      phase: 'initialization',
    },
    ...overrides,
  };
}

/**
 * Create a mock internal operation event
 */
export function createMockInternalOperation(
  overrides: Partial<InternalOperationEvent> = {}
): InternalOperationEvent {
  return {
    sessionId: 'test-session',
    sequence: 1,
    timestamp: Date.now(),
    eventType: 'internal_operation',
    actor: 'host_app',
    operationType: 'schema_conversion',
    description: 'Test internal operation',
    metadata: {
      messageType: 'internal_operation',
      phase: 'discovery',
    },
    ...overrides,
  };
}

/**
 * Create a sequence of events for testing vertical alignment
 * Scenario: MCP server has 3 logs at the same sequence while other columns are idle
 */
export function createVerticalAlignmentScenario(): TimelineEvent[] {
  const baseTimestamp = Date.now();

  return [
    // Sequence 1: Single host app log
    createMockConsoleLog({
      sequence: 1,
      timestamp: baseTimestamp,
      actor: 'host_app',
      logMessage: 'Starting workflow',
      badgeType: 'SYSTEM',
    }),

    // Sequence 2-4: MCP server has 3 logs, other columns should show spacers
    createMockConsoleLog({
      sequence: 2,
      timestamp: baseTimestamp + 100,
      actor: 'mcp_server',
      logMessage: 'Searching AWS documentation...',
      badgeType: 'SERVER',
      metadata: {
        messageType: 'console_log',
        phase: 'execution',
      },
    }),
    createMockConsoleLog({
      sequence: 3,
      timestamp: baseTimestamp + 200,
      actor: 'mcp_server',
      logMessage: 'Processing results...',
      badgeType: 'SERVER',
      metadata: {
        messageType: 'console_log',
        phase: 'execution',
      },
    }),
    createMockConsoleLog({
      sequence: 4,
      timestamp: baseTimestamp + 300,
      actor: 'mcp_server',
      logMessage: 'Found 15 results',
      badgeType: 'SERVER',
      metadata: {
        messageType: 'console_log',
        phase: 'execution',
      },
    }),

    // Sequence 5: Host app resumes
    createMockConsoleLog({
      sequence: 5,
      timestamp: baseTimestamp + 400,
      actor: 'host_app',
      logMessage: 'Received results from MCP server',
      badgeType: 'SYSTEM',
      metadata: {
        messageType: 'console_log',
        phase: 'execution',
      },
    }),
  ];
}

/**
 * Create a complete 5-phase workflow scenario
 */
export function createComplete5PhaseWorkflow(): TimelineEvent[] {
  const baseTimestamp = Date.now();
  const events: TimelineEvent[] = [];
  let sequence = 1;

  // =================================================================
  // PHASE 1: INITIALIZATION
  // =================================================================

  events.push(
    createMockConsoleLog({
      sequence: sequence++,
      timestamp: baseTimestamp,
      actor: 'host_app',
      logMessage: 'User Query: Search AWS docs for S3 bucket naming',
      badgeType: 'USER_INPUT',
      metadata: { messageType: 'console_log', phase: 'initialization' },
    })
  );

  events.push(
    createMockProtocolMessage({
      sequence: sequence++,
      timestamp: baseTimestamp + 50,
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_mcp',
      message: { jsonrpc: '2.0', id: 1, method: 'initialize' },
      metadata: { messageType: 'jsonrpc_request', phase: 'initialization' },
    })
  );

  events.push(
    createMockProtocolMessage({
      sequence: sequence++,
      timestamp: baseTimestamp + 100,
      actor: 'mcp_server',
      direction: 'received',
      lane: 'host_mcp',
      message: {
        jsonrpc: '2.0',
        id: 1,
        result: { protocolVersion: '2024-11-05', capabilities: {} },
      },
      metadata: { messageType: 'jsonrpc_response', phase: 'initialization', processingTime: 50 },
    })
  );

  // =================================================================
  // PHASE 2: DISCOVERY
  // =================================================================

  events.push(
    createMockProtocolMessage({
      sequence: sequence++,
      timestamp: baseTimestamp + 200,
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_mcp',
      message: { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      metadata: { messageType: 'jsonrpc_request', phase: 'discovery' },
    })
  );

  events.push(
    createMockProtocolMessage({
      sequence: sequence++,
      timestamp: baseTimestamp + 250,
      actor: 'mcp_server',
      direction: 'received',
      lane: 'host_mcp',
      message: {
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [
            {
              name: 'search_documentation',
              description: 'Search AWS documentation',
              inputSchema: { type: 'object', properties: {} },
            },
          ],
        },
      },
      metadata: { messageType: 'jsonrpc_response', phase: 'discovery', processingTime: 50 },
    })
  );

  events.push(
    createMockConsoleLog({
      sequence: sequence++,
      timestamp: baseTimestamp + 300,
      actor: 'host_app',
      logMessage: 'Discovered 1 tool(s)',
      badgeType: 'SYSTEM',
      metadata: { messageType: 'console_log', phase: 'discovery' },
    })
  );

  // =================================================================
  // PHASE 3: SELECTION (First LLM Inference)
  // =================================================================

  events.push(
    createMockConsoleLog({
      sequence: sequence++,
      timestamp: baseTimestamp + 400,
      actor: 'host_app',
      logMessage: 'Calling LLM for tool planning',
      badgeType: 'SYSTEM',
      metadata: { messageType: 'console_log', phase: 'selection' },
    })
  );

  events.push(
    createMockConsoleLog({
      sequence: sequence++,
      timestamp: baseTimestamp + 500,
      actor: 'llm',
      logMessage: 'Analyzing available tools...',
      badgeType: 'LLM',
      metadata: { messageType: 'console_log', phase: 'selection' },
    })
  );

  events.push(
    createMockConsoleLog({
      sequence: sequence++,
      timestamp: baseTimestamp + 1500,
      actor: 'host_app',
      logMessage: 'LLM selected 1 tool(s): search_documentation',
      badgeType: 'SYSTEM',
      metadata: { messageType: 'console_log', phase: 'selection' },
    })
  );

  // =================================================================
  // PHASE 4: EXECUTION
  // =================================================================

  events.push(
    createMockConsoleLog({
      sequence: sequence++,
      timestamp: baseTimestamp + 1600,
      actor: 'host_app',
      logMessage: 'Invoking tool: search_documentation',
      badgeType: 'SYSTEM',
      metadata: { messageType: 'console_log', phase: 'execution' },
    })
  );

  events.push(
    createMockProtocolMessage({
      sequence: sequence++,
      timestamp: baseTimestamp + 1650,
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_mcp',
      message: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'search_documentation',
          arguments: { search_phrase: 'S3 bucket naming', limit: 10 },
        },
      },
      metadata: { messageType: 'jsonrpc_request', phase: 'execution' },
    })
  );

  events.push(
    createMockConsoleLog({
      sequence: sequence++,
      timestamp: baseTimestamp + 1700,
      actor: 'mcp_server',
      logMessage: 'Searching AWS documentation...',
      badgeType: 'SERVER',
      metadata: { messageType: 'console_log', phase: 'execution' },
    })
  );

  events.push(
    createMockProtocolMessage({
      sequence: sequence++,
      timestamp: baseTimestamp + 2500,
      actor: 'mcp_server',
      direction: 'received',
      lane: 'host_mcp',
      message: {
        jsonrpc: '2.0',
        id: 3,
        result: {
          content: [{ type: 'text', text: 'S3 bucket naming rules: ...' }],
        },
      },
      metadata: { messageType: 'jsonrpc_response', phase: 'execution', processingTime: 850 },
    })
  );

  // =================================================================
  // PHASE 5: SYNTHESIS (Second LLM Inference)
  // =================================================================

  events.push(
    createMockConsoleLog({
      sequence: sequence++,
      timestamp: baseTimestamp + 2600,
      actor: 'host_app',
      logMessage: 'Calling LLM for final synthesis',
      badgeType: 'SYSTEM',
      metadata: { messageType: 'console_log', phase: 'synthesis' },
    })
  );

  events.push(
    createMockConsoleLog({
      sequence: sequence++,
      timestamp: baseTimestamp + 2700,
      actor: 'llm',
      logMessage: 'Generating final response...',
      badgeType: 'LLM',
      metadata: { messageType: 'console_log', phase: 'synthesis' },
    })
  );

  events.push(
    createMockConsoleLog({
      sequence: sequence++,
      timestamp: baseTimestamp + 4000,
      actor: 'host_app',
      logMessage: 'Response delivered. Total time: 4000ms',
      badgeType: 'COMPLETE',
      metadata: { messageType: 'console_log', phase: 'synthesis' },
    })
  );

  return events;
}

/**
 * Create events with multiple actors at the same sequence
 * Tests that each actor's event appears in the correct column
 */
export function createMultiActorSequence(): TimelineEvent[] {
  const baseTimestamp = Date.now();

  return [
    // Sequence 1: All actors have events
    createMockConsoleLog({
      sequence: 1,
      timestamp: baseTimestamp,
      actor: 'host_app',
      logMessage: 'Host app event',
      badgeType: 'SYSTEM',
    }),
    createMockConsoleLog({
      sequence: 1,
      timestamp: baseTimestamp,
      actor: 'llm',
      logMessage: 'LLM event',
      badgeType: 'LLM',
    }),
    createMockConsoleLog({
      sequence: 1,
      timestamp: baseTimestamp,
      actor: 'mcp_server',
      logMessage: 'MCP server event',
      badgeType: 'SERVER',
    }),
    createMockProtocolMessage({
      sequence: 1,
      timestamp: baseTimestamp,
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_llm',
      message: { jsonrpc: '2.0', id: 1, method: 'test' },
    }),
    createMockProtocolMessage({
      sequence: 1,
      timestamp: baseTimestamp,
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_mcp',
      message: { jsonrpc: '2.0', id: 2, method: 'test' },
    }),
  ];
}
