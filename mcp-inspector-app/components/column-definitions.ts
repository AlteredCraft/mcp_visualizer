import { ColumnDefinition } from '../types/domain';

/**
 * Five-column actor-based layout configuration
 *
 * Column widths:
 * - Host App: 20%
 * - Host ↔ LLM Lane: 15%
 * - LLM: 15%
 * - Host ↔ MCP Lane: 15%
 * - MCP Server: 35%
 *
 * Critical: These percentages must be maintained for proper visual balance
 */
export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  {
    id: 'host_app',
    type: 'actor',
    actor: 'host_app',
    width: 'w-[20%]',
    title: 'Host App'
  },
  {
    id: 'lane_host_llm',
    type: 'lane',
    lane: 'host_llm',
    width: 'w-[15%]',
    title: 'Host ↔ LLM'
  },
  {
    id: 'llm',
    type: 'actor',
    actor: 'llm',
    width: 'w-[15%]',
    title: 'LLM'
  },
  {
    id: 'lane_host_mcp',
    type: 'lane',
    lane: 'host_mcp',
    width: 'w-[15%]',
    title: 'Host ↔ MCP'
  },
  {
    id: 'mcp_server',
    type: 'actor',
    actor: 'mcp_server',
    width: 'w-[35%]',
    title: 'MCP Server'
  }
];
