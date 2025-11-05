/**
 * Mock event generation for testing and demonstration
 * Generates realistic 5-phase MCP workflow events
 */

import type { TimelineEvent } from '../types/domain';
import {
  createUserInputLog,
  createSystemLog,
  createServerLog,
  createLLMLog,
  createCompleteLog,
  createProtocolMessageEvent,
  createInternalOperationEvent,
  createJSONRPCRequest,
  createJSONRPCResponse,
  createJSONRPCNotification,
} from './event-builder';

/**
 * Generate complete 5-phase workflow mock events
 * Simulates: User query "Search AWS documentation for S3 bucket naming rules"
 */
export function generateMockWorkflow(): Array<
  Omit<TimelineEvent, 'sessionId' | 'sequence' | 'timestamp'>
> {
  const events: Array<Omit<TimelineEvent, 'sessionId' | 'sequence' | 'timestamp'>> =
    [];

  // ==========================================================================
  // PHASE 1: INITIALIZATION & NEGOTIATION
  // ==========================================================================

  // User input
  events.push(
    createUserInputLog('User: Search AWS documentation for S3 bucket naming rules')
  );

  // Host app connects to MCP server
  events.push(
    createSystemLog('Connecting to AWS Documentation MCP server...', 'initialization')
  );

  // 3-message handshake: initialize request
  events.push(
    createProtocolMessageEvent({
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_mcp',
      message: createJSONRPCRequest(1, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'mcp-inspector',
          version: '1.0.0',
        },
      }),
      messageType: 'initialize_request',
      phase: 'initialization',
    })
  );

  // Server processing
  events.push(
    createServerLog('Processing initialization request...', 'initialization')
  );

  // initialize response
  events.push(
    createProtocolMessageEvent({
      actor: 'mcp_server',
      direction: 'received',
      lane: 'host_mcp',
      message: createJSONRPCResponse(1, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'aws-documentation-mcp-server',
          version: '0.1.0',
        },
      }),
      messageType: 'initialize_response',
      phase: 'initialization',
      metadata: { processingTime: 45 },
    })
  );

  // initialized notification
  events.push(
    createProtocolMessageEvent({
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_mcp',
      message: createJSONRPCNotification('notifications/initialized'),
      messageType: 'initialized_notification',
      phase: 'initialization',
    })
  );

  events.push(createSystemLog('Handshake complete', 'initialization'));

  // ==========================================================================
  // PHASE 2: DISCOVERY & CONTEXTUALIZATION
  // ==========================================================================

  events.push(createSystemLog('Discovering available tools...', 'discovery'));

  // tools/list request
  events.push(
    createProtocolMessageEvent({
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_mcp',
      message: createJSONRPCRequest(2, 'tools/list'),
      messageType: 'tools_list_request',
      phase: 'discovery',
    })
  );

  events.push(createServerLog('Listing available tools...', 'discovery'));

  // tools/list response
  events.push(
    createProtocolMessageEvent({
      actor: 'mcp_server',
      direction: 'received',
      lane: 'host_mcp',
      message: createJSONRPCResponse(2, {
        tools: [
          {
            name: 'search_documentation',
            description: 'Search AWS documentation for specific topics',
            inputSchema: {
              type: 'object',
              properties: {
                search_phrase: {
                  type: 'string',
                  description: 'The phrase to search for',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results',
                  default: 10,
                },
              },
              required: ['search_phrase'],
            },
          },
          {
            name: 'read_documentation',
            description: 'Read specific AWS documentation page',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL of documentation page',
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'recommend',
            description: 'Get related documentation recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to get recommendations for',
                },
              },
              required: ['url'],
            },
          },
        ],
      }),
      messageType: 'tools_list_response',
      phase: 'discovery',
      metadata: { processingTime: 12 },
    })
  );

  events.push(createSystemLog('Discovered 3 tool(s)', 'discovery'));

  // Schema conversion
  events.push(
    createInternalOperationEvent({
      actor: 'host_app',
      operationType: 'schema_conversion',
      description: 'Formatting tool schemas for LLM context',
      phase: 'discovery',
    })
  );

  // ==========================================================================
  // PHASE 3: MODEL-DRIVEN SELECTION (First LLM Inference)
  // ==========================================================================

  events.push(createSystemLog('Calling LLM for tool planning...', 'selection'));

  // LLM request (planning)
  events.push(
    createProtocolMessageEvent({
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_llm',
      message: {
        role: 'user',
        content: 'Search AWS documentation for S3 bucket naming rules',
      },
      messageType: 'llm_request',
      phase: 'selection',
    })
  );

  events.push(createLLMLog('Analyzing available tools...', 'selection'));
  events.push(createLLMLog('Selecting appropriate tool(s)...', 'selection'));

  // LLM response with tool_use
  events.push(
    createProtocolMessageEvent({
      actor: 'llm',
      direction: 'received',
      lane: 'host_llm',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_01A',
            name: 'search_documentation',
            input: {
              search_phrase: 'S3 bucket naming rules',
              limit: 10,
            },
          },
        ],
      },
      messageType: 'llm_response_with_tool_use',
      phase: 'selection',
      metadata: { processingTime: 856 },
    })
  );

  events.push(createSystemLog('LLM selected 1 tool(s)', 'selection'));

  // ==========================================================================
  // PHASE 4: EXECUTION ROUND TRIP
  // ==========================================================================

  events.push(
    createSystemLog('Invoking tool: search_documentation', 'execution')
  );

  // tools/call request
  events.push(
    createProtocolMessageEvent({
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_mcp',
      message: createJSONRPCRequest(3, 'tools/call', {
        name: 'search_documentation',
        arguments: {
          search_phrase: 'S3 bucket naming rules',
          limit: 10,
        },
      }),
      messageType: 'tools_call_request',
      phase: 'execution',
    })
  );

  events.push(createServerLog('Searching AWS documentation...', 'execution'));
  events.push(
    createServerLog('Querying AWS documentation index...', 'execution')
  );
  events.push(createServerLog('Found 10 results', 'execution'));

  // tools/call response
  events.push(
    createProtocolMessageEvent({
      actor: 'mcp_server',
      direction: 'received',
      lane: 'host_mcp',
      message: createJSONRPCResponse(3, {
        content: [
          {
            type: 'text',
            text: `Search Results for "S3 bucket naming rules":

1. **Bucket naming rules**
   https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html
   Rules for naming S3 buckets: 3-63 characters, lowercase, no uppercase, no underscores...

2. **Creating, configuring, and working with Amazon S3 buckets**
   https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-buckets-s3.html
   Learn how to create and configure S3 buckets...

3. **Bucket restrictions and limitations**
   https://docs.aws.amazon.com/AmazonS3/latest/userguide/BucketRestrictions.html
   Understand limitations on bucket names and operations...`,
          },
        ],
        isError: false,
      }),
      messageType: 'tools_call_response',
      phase: 'execution',
      metadata: { processingTime: 234 },
    })
  );

  events.push(
    createSystemLog('Received result from search_documentation', 'execution')
  );

  // Append to context
  events.push(
    createInternalOperationEvent({
      actor: 'host_app',
      operationType: 'context_append',
      description: 'Appending tool results to conversation',
      phase: 'execution',
    })
  );

  // ==========================================================================
  // PHASE 5: SYNTHESIS & FINAL RESPONSE (Second LLM Inference)
  // ==========================================================================

  events.push(createSystemLog('Calling LLM for final synthesis...', 'synthesis'));

  // LLM request (synthesis) - includes conversation history
  events.push(
    createProtocolMessageEvent({
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_llm',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_01A',
            content: 'Search Results for "S3 bucket naming rules": ...',
          },
        ],
      },
      messageType: 'llm_request_with_tool_result',
      phase: 'synthesis',
    })
  );

  events.push(createLLMLog('Synthesizing final response...', 'synthesis'));

  // LLM final response (text)
  events.push(
    createProtocolMessageEvent({
      actor: 'llm',
      direction: 'received',
      lane: 'host_llm',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: `Based on the AWS documentation, here are the key S3 bucket naming rules:

**Requirements:**
- Bucket names must be between 3 and 63 characters long
- Names can consist only of lowercase letters, numbers, dots (.), and hyphens (-)
- Names must begin and end with a letter or number
- Names must not be formatted as an IP address (e.g., 192.168.5.4)
- Names must not start with the prefix "xn--"
- Names must not end with the suffix "-s3alias"

**Best Practices:**
- Use lowercase letters and avoid uppercase
- Avoid using dots (.) in bucket names to prevent SSL certificate validation issues
- Choose unique, descriptive names

For more details, see: https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html`,
          },
        ],
      },
      messageType: 'llm_final_response',
      phase: 'synthesis',
      metadata: { processingTime: 1243 },
    })
  );

  events.push(createCompleteLog('Response delivered. Total time: 2,390ms', 'synthesis'));

  return events;
}

/**
 * Generate a large number of mock events for performance testing
 * Creates multiple workflow cycles with slight variations
 */
export function generateLargeMockDataset(
  workflowCount: number = 10
): Array<Omit<TimelineEvent, 'sessionId' | 'sequence' | 'timestamp'>> {
  const allEvents: Array<
    Omit<TimelineEvent, 'sessionId' | 'sequence' | 'timestamp'>
  > = [];

  const queries = [
    'Search AWS documentation for S3 bucket naming rules',
    'Look up Lambda function best practices',
    'Find CloudFormation template examples',
    'Search for DynamoDB partition key guidelines',
    'Find ECS task definition documentation',
  ];

  for (let i = 0; i < workflowCount; i++) {
    const query = queries[i % queries.length];
    const workflow = generateMockWorkflow();

    // Modify first event to use different query
    if (workflow[0] && workflow[0].eventType === 'console_log') {
      workflow[0] = createUserInputLog(`User: ${query} (workflow ${i + 1})`);
    }

    allEvents.push(...workflow);

    // Add separator between workflows
    if (i < workflowCount - 1) {
      allEvents.push(createSystemLog('--- New Query ---', 'initialization'));
    }
  }

  return allEvents;
}

/**
 * Generate mock events showing multiple tool calls
 * Demonstrates complex vertical alignment scenarios
 */
export function generateMultiToolWorkflow(): Array<
  Omit<TimelineEvent, 'sessionId' | 'sequence' | 'timestamp'>
> {
  const events: Array<Omit<TimelineEvent, 'sessionId' | 'sequence' | 'timestamp'>> =
    [];

  // Initialization (abbreviated)
  events.push(
    createUserInputLog(
      'User: Look up S3 bucket naming rules and show me related topics'
    )
  );
  events.push(createSystemLog('Handshake complete', 'initialization'));
  events.push(createSystemLog('Discovered 3 tool(s)', 'discovery'));

  // Selection phase - LLM selects TWO tools
  events.push(createSystemLog('Calling LLM for tool planning...', 'selection'));
  events.push(
    createProtocolMessageEvent({
      actor: 'llm',
      direction: 'received',
      lane: 'host_llm',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_01A',
            name: 'search_documentation',
            input: {
              search_phrase: 'S3 bucket naming rules',
              limit: 5,
            },
          },
          {
            type: 'tool_use',
            id: 'toolu_01B',
            name: 'recommend',
            input: {
              url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html',
            },
          },
        ],
      },
      messageType: 'llm_response_with_tool_use',
      phase: 'selection',
      metadata: { processingTime: 956 },
    })
  );
  events.push(createSystemLog('LLM selected 2 tool(s)', 'selection'));

  // Execution phase - Tool 1
  events.push(
    createSystemLog('Invoking tool: search_documentation', 'execution')
  );
  events.push(
    createProtocolMessageEvent({
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_mcp',
      message: createJSONRPCRequest(3, 'tools/call', {
        name: 'search_documentation',
        arguments: {
          search_phrase: 'S3 bucket naming rules',
          limit: 5,
        },
      }),
      messageType: 'tools_call_request',
      phase: 'execution',
    })
  );
  events.push(createServerLog('Searching AWS documentation...', 'execution'));
  events.push(createServerLog('Found 5 results', 'execution'));
  events.push(
    createProtocolMessageEvent({
      actor: 'mcp_server',
      direction: 'received',
      lane: 'host_mcp',
      message: createJSONRPCResponse(3, {
        content: [{ type: 'text', text: 'Search results...' }],
      }),
      messageType: 'tools_call_response',
      phase: 'execution',
      metadata: { processingTime: 187 },
    })
  );

  // Execution phase - Tool 2
  events.push(createSystemLog('Invoking tool: recommend', 'execution'));
  events.push(
    createProtocolMessageEvent({
      actor: 'host_app',
      direction: 'sent',
      lane: 'host_mcp',
      message: createJSONRPCRequest(4, 'tools/call', {
        name: 'recommend',
        arguments: {
          url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html',
        },
      }),
      messageType: 'tools_call_request',
      phase: 'execution',
    })
  );
  events.push(createServerLog('Finding related topics...', 'execution'));
  events.push(createServerLog('Analyzing documentation graph...', 'execution'));
  events.push(createServerLog('Found 8 related topics', 'execution'));
  events.push(
    createProtocolMessageEvent({
      actor: 'mcp_server',
      direction: 'received',
      lane: 'host_mcp',
      message: createJSONRPCResponse(4, {
        content: [{ type: 'text', text: 'Related topics...' }],
      }),
      messageType: 'tools_call_response',
      phase: 'execution',
      metadata: { processingTime: 312 },
    })
  );

  // Synthesis
  events.push(createSystemLog('Calling LLM for final synthesis...', 'synthesis'));
  events.push(
    createProtocolMessageEvent({
      actor: 'llm',
      direction: 'received',
      lane: 'host_llm',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Here are the S3 bucket naming rules and related topics...',
          },
        ],
      },
      messageType: 'llm_final_response',
      phase: 'synthesis',
      metadata: { processingTime: 1456 },
    })
  );
  events.push(createCompleteLog('Response delivered. Total time: 2,911ms', 'synthesis'));

  return events;
}
