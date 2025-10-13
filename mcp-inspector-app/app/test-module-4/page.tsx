'use client';

import { TimelineContainer } from '@/components/layout/TimelineContainer';
import { TimelineHeader } from '@/components/layout/TimelineHeader';
import { TimelineRow } from '@/components/grid/TimelineRow';
import { StatusBar } from '@/components/layout/StatusBar';
import { MessageCard } from '@/types/domain';

/**
 * Module 4 Test Page: Communication Lane Components
 *
 * Tests MessageCard, JSONPayloadView, and LaneCell components.
 *
 * Validation Criteria:
 * - Render all three message card types (REQUEST, RESPONSE, NOTIFY)
 * - Click to expand/collapse cards
 * - Verify JSON syntax highlighting
 * - Test correlation: request #1 matches response #1
 * - Verify timing display on responses
 */

export default function TestModule4Page() {
  // Mock message cards for testing all three types
  const mockCards: MessageCard[] = [
    // REQUEST: initialize
    {
      id: 'msg-1',
      type: 'request',
      method: 'initialize',
      sequence: 1,
      direction: 'sent',
      isExpanded: false,
      payload: {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'mcp-inspector',
            version: '1.0.0',
          },
        },
      },
    },
    // RESPONSE: initialize
    {
      id: 'msg-2',
      type: 'response',
      method: 'initialize',
      sequence: 1,
      direction: 'received',
      timing: 33,
      isExpanded: false,
      payload: {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'aws-documentation-server',
            version: '0.1.0',
          },
        },
      },
    },
    // NOTIFICATION: initialized
    {
      id: 'msg-3',
      type: 'notification',
      method: 'initialized',
      direction: 'sent',
      isExpanded: false,
      payload: {
        jsonrpc: '2.0',
        method: 'initialized',
      },
    },
    // REQUEST: tools/list
    {
      id: 'msg-4',
      type: 'request',
      method: 'tools/list',
      sequence: 2,
      direction: 'sent',
      isExpanded: false,
      payload: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      },
    },
    // RESPONSE: tools/list
    {
      id: 'msg-5',
      type: 'response',
      method: 'tools/list',
      sequence: 2,
      direction: 'received',
      timing: 12,
      isExpanded: false,
      payload: {
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [
            {
              name: 'search_documentation',
              description: 'Search AWS documentation',
              inputSchema: {
                type: 'object',
                properties: {
                  search_phrase: {
                    type: 'string',
                    description: 'The search phrase',
                  },
                  limit: {
                    type: 'number',
                    description: 'Maximum results',
                  },
                },
                required: ['search_phrase'],
              },
            },
          ],
        },
      },
    },
    // REQUEST: tools/call
    {
      id: 'msg-6',
      type: 'request',
      method: 'tools/call',
      sequence: 3,
      direction: 'sent',
      isExpanded: false,
      payload: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'search_documentation',
          arguments: {
            search_phrase: 'S3 bucket naming rules',
            limit: 10,
          },
        },
      },
    },
    // RESPONSE: tools/call
    {
      id: 'msg-7',
      type: 'response',
      method: 'tools/call',
      sequence: 3,
      direction: 'received',
      timing: 540,
      isExpanded: false,
      payload: {
        jsonrpc: '2.0',
        id: 3,
        result: {
          content: [
            {
              type: 'text',
              text: 'Found 15 results for S3 bucket naming rules...',
            },
          ],
          isError: false,
        },
      },
    },
  ];

  // Build rows for testing - one card per row for clarity
  const rows = mockCards.map((card, index) => ({
    rowId: `row-${index}`,
    sequence: index,
    cells: [
      // Column 1: Host App (spacer)
      { columnId: 'host_app', cellType: 'spacer' as const },
      // Column 2: Host ↔ LLM (spacer)
      { columnId: 'lane_host_llm', cellType: 'spacer' as const },
      // Column 3: LLM (spacer)
      { columnId: 'llm', cellType: 'spacer' as const },
      // Column 4: Host ↔ MCP (message card)
      {
        columnId: 'lane_host_mcp',
        cellType: 'content' as const,
        content: {
          type: 'message_card' as const,
          card,
        },
      },
      // Column 5: MCP Server (spacer)
      { columnId: 'mcp_server', cellType: 'spacer' as const },
    ],
  }));

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Module 4 Test: Communication Lane Components
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Testing MessageCard with all three types (REQUEST, RESPONSE, NOTIFICATION)
        </p>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto">
        <TimelineContainer>
          <TimelineHeader />
          {rows.map((row) => (
            <TimelineRow key={row.rowId} row={row} />
          ))}
        </TimelineContainer>
      </div>

      {/* Status Bar */}
      <StatusBar
        sessionId="test-module-4"
        eventCount={mockCards.length}
        isRecording={false}
      />
    </div>
  );
}
