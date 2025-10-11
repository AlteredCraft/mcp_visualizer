import { TimelineRow, RowCell } from '@/types/domain';
import { COLUMN_DEFINITIONS } from '@/components/column-definitions';

/**
 * Generate mock timeline rows for Module 1 testing.
 *
 * Creates rows with mixed content and spacer blocks to validate
 * vertical alignment system.
 *
 * Note: Uses stable IDs (not UUID) to prevent hydration mismatch.
 * In Module 2, real UUIDs will be generated once and stored in Zustand.
 */
export function generateMockRows(): TimelineRow[] {
  return [
    // Row 1: User input in Host App column only
    {
      rowId: 'mock-row-0',
      sequence: 0,
      cells: [
        {
          columnId: 'host_app',
          cellType: 'content',
          content: {
            type: 'chat_bubble',
            role: 'user',
            text: 'Search AWS documentation for S3 bucket naming rules'
          }
        },
        {
          columnId: 'lane_host_llm',
          cellType: 'spacer'
        },
        {
          columnId: 'llm',
          cellType: 'spacer'
        },
        {
          columnId: 'lane_host_mcp',
          cellType: 'spacer'
        },
        {
          columnId: 'mcp_server',
          cellType: 'spacer'
        }
      ]
    },

    // Row 2: Initialize request in Host→MCP lane
    {
      rowId: 'mock-row-1',
      sequence: 1,
      cells: [
        {
          columnId: 'host_app',
          cellType: 'spacer'
        },
        {
          columnId: 'lane_host_llm',
          cellType: 'spacer'
        },
        {
          columnId: 'llm',
          cellType: 'spacer'
        },
        {
          columnId: 'lane_host_mcp',
          cellType: 'content',
          content: {
            type: 'message_card',
            card: {
              id: 'msg-1',
              type: 'request',
              method: 'initialize',
              sequence: 1,
              direction: 'sent',
              payload: {},
              isExpanded: false
            }
          }
        },
        {
          columnId: 'mcp_server',
          cellType: 'spacer'
        }
      ]
    },

    // Row 3: MCP Server processing
    {
      rowId: 'mock-row-2',
      sequence: 2,
      cells: [
        {
          columnId: 'host_app',
          cellType: 'spacer'
        },
        {
          columnId: 'lane_host_llm',
          cellType: 'spacer'
        },
        {
          columnId: 'llm',
          cellType: 'spacer'
        },
        {
          columnId: 'lane_host_mcp',
          cellType: 'spacer'
        },
        {
          columnId: 'mcp_server',
          cellType: 'content',
          content: {
            type: 'console_log',
            event: {
              sessionId: 'test',
              sequence: 2,
              timestamp: 1704124800000, // Fixed timestamp
              eventType: 'console_log',
              actor: 'mcp_server',
              logLevel: 'info',
              logMessage: 'Initializing server...',
              badgeType: 'SERVER',
              metadata: { phase: 'initialization' }
            }
          }
        }
      ]
    },

    // Row 4: LLM thinking indicator
    {
      rowId: 'mock-row-3',
      sequence: 3,
      cells: [
        {
          columnId: 'host_app',
          cellType: 'spacer'
        },
        {
          columnId: 'lane_host_llm',
          cellType: 'spacer'
        },
        {
          columnId: 'llm',
          cellType: 'content',
          content: {
            type: 'thinking_indicator',
            message: 'Analyzing tools...'
          }
        },
        {
          columnId: 'lane_host_mcp',
          cellType: 'spacer'
        },
        {
          columnId: 'mcp_server',
          cellType: 'spacer'
        }
      ]
    },

    // Row 5: Multiple console logs in MCP Server (tests alignment)
    {
      rowId: 'mock-row-4',
      sequence: 4,
      cells: [
        {
          columnId: 'host_app',
          cellType: 'content',
          content: {
            type: 'console_log',
            event: {
              sessionId: 'test',
              sequence: 4,
              timestamp: 1704124801000, // Fixed timestamp
              eventType: 'console_log',
              actor: 'host_app',
              logLevel: 'info',
              logMessage: 'Tool execution complete',
              badgeType: 'COMPLETE',
              metadata: { phase: 'execution' }
            }
          }
        },
        {
          columnId: 'lane_host_llm',
          cellType: 'spacer'
        },
        {
          columnId: 'llm',
          cellType: 'spacer'
        },
        {
          columnId: 'lane_host_mcp',
          cellType: 'spacer'
        },
        {
          columnId: 'mcp_server',
          cellType: 'content',
          content: {
            type: 'console_log',
            event: {
              sessionId: 'test',
              sequence: 4,
              timestamp: 1704124801500, // Fixed timestamp
              eventType: 'console_log',
              actor: 'mcp_server',
              logLevel: 'info',
              logMessage: 'Returning results',
              badgeType: 'SERVER',
              metadata: { phase: 'execution' }
            }
          }
        }
      ]
    }
  ];
}
