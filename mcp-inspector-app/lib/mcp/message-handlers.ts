/**
 * MCP Protocol Message Handlers
 *
 * Handles recording of MCP protocol messages as timeline events.
 * Every protocol message (initialize, tools/list, tools/call) is recorded
 * for visualization in the timeline.
 */

import { useTimelineStore } from '@/store/timeline-store';
import type { MCPMessage } from '@/types/mcp';
import type { Phase } from '@/types/domain';

/**
 * Record an MCP protocol message (request or response) as a timeline event.
 */
export function recordProtocolMessage(
  message: MCPMessage,
  direction: 'sent' | 'received',
  lane: 'host_mcp',
  phase: Phase
): void {
  const { addEvent } = useTimelineStore.getState();

  // Determine actor based on direction
  const actor = direction === 'sent' ? 'host_app' : 'mcp_server';

  addEvent({
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
 */
export function recordMCPLog(
  message: string,
  actor: 'host_app' | 'mcp_server',
  phase: Phase,
  logLevel: 'info' | 'debug' | 'error' = 'info'
): void {
  const { addEvent } = useTimelineStore.getState();

  addEvent({
    eventType: 'console_log',
    actor,
    logLevel,
    logMessage: message,
    badgeType: actor === 'host_app' ? 'SYSTEM' : 'SERVER',
    metadata: { phase },
  });
}

/**
 * Record an internal operation (e.g., schema conversion).
 */
export function recordInternalOperation(
  operationType: string,
  description: string,
  phase: Phase
): void {
  const { addEvent } = useTimelineStore.getState();

  addEvent({
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
