/**
 * MCP Protocol Message Handlers (Server-Side)
 *
 * Server-side version of message handlers that uses the global MCP client
 * for event broadcasting via SSE instead of direct Zustand store updates.
 *
 * These functions are called from the MCP client wrapper and workflow orchestrator
 * running in Next.js API routes.
 */

import type { MCPMessage } from '@/types/mcp';
import type { Phase } from '@/types/domain';
import type { MCPGlobalClient } from './global-client';

/**
 * Record an MCP protocol message (request or response) as a timeline event.
 *
 * @param client - Global MCP client instance
 * @param message - JSON-RPC message
 * @param direction - Message direction (sent or received)
 * @param lane - Communication lane (always 'host_mcp' for MCP)
 * @param phase - Current workflow phase
 */
export function recordProtocolMessage(
  client: MCPGlobalClient,
  message: MCPMessage,
  direction: 'sent' | 'received',
  lane: 'host_mcp',
  phase: Phase
): void {
  // Determine actor based on direction
  const actor = direction === 'sent' ? 'host_app' : 'mcp_server';

  client.recordEvent({
    eventType: 'protocol_message',
    actor,
    direction,
    lane,
    message,
    metadata: {
      phase,
      messageType: getMessageType(message),
    },
  });
}

/**
 * Record a console log from the MCP client/server.
 *
 * @param client - Global MCP client instance
 * @param message - Log message text
 * @param actor - Actor emitting the log
 * @param phase - Current workflow phase
 * @param logLevel - Log severity level
 */
export function recordMCPLog(
  client: MCPGlobalClient,
  message: string,
  actor: 'host_app' | 'mcp_server',
  phase: Phase,
  logLevel: 'info' | 'debug' | 'error' = 'info'
): void {
  client.recordEvent({
    eventType: 'console_log',
    actor,
    logLevel,
    logMessage: message,
    badgeType: actor === 'host_app' ? 'SYSTEM' : 'SERVER',
    metadata: { phase },
  });
}

/**
 * Record an internal operation (e.g., schema conversion, context building).
 *
 * @param client - Global MCP client instance
 * @param operationType - Type of internal operation
 * @param description - Human-readable description
 * @param phase - Current workflow phase
 */
export function recordInternalOperation(
  client: MCPGlobalClient,
  operationType: string,
  description: string,
  phase: Phase
): void {
  client.recordEvent({
    eventType: 'internal_operation',
    actor: 'host_app',
    operationType,
    description,
    metadata: { phase },
  });
}

/**
 * Extract message type from MCP message for metadata.
 */
function getMessageType(message: MCPMessage): string {
  if ('method' in message) {
    // Request or notification
    return message.method;
  } else if ('result' in message) {
    // Response
    return 'response';
  } else if ('error' in message) {
    // Error response
    return 'error';
  }
  return 'unknown';
}

/**
 * Helper to determine phase based on MCP method.
 */
export function getPhaseForMethod(method: string): Phase {
  if (method === 'initialize' || method === 'notifications/initialized') {
    return 'initialization';
  } else if (method === 'tools/list') {
    return 'discovery';
  } else if (method === 'tools/call') {
    return 'execution';
  }
  // Default to execution for unknown methods
  return 'execution';
}
