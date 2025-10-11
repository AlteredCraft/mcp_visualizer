/**
 * Event builder helper functions
 * Creates properly-structured timeline events with auto-enrichment
 */

import type {
  TimelineEvent,
  ProtocolMessageEvent,
  ConsoleLogEvent,
  InternalOperationEvent,
  Actor,
  CommunicationLane,
  Phase,
  ConsoleBadgeType,
  JSONRPCMessage,
  LLMAPIMessage,
} from '../types/domain';

/**
 * Base properties that all events share (before store enrichment)
 */
type BaseEventProps = {
  actor: Actor;
  metadata?: Partial<TimelineEvent['metadata']>;
};

// ============================================================================
// Protocol Message Events
// ============================================================================

/**
 * Create a protocol message event (for communication lanes)
 */
export function createProtocolMessageEvent(
  props: BaseEventProps & {
    direction: 'sent' | 'received';
    lane: CommunicationLane;
    message: JSONRPCMessage | LLMAPIMessage;
    messageType?: string;
    phase?: Phase;
  }
): Omit<ProtocolMessageEvent, 'sessionId' | 'sequence' | 'timestamp'> {
  return {
    eventType: 'protocol_message',
    actor: props.actor,
    direction: props.direction,
    lane: props.lane,
    message: props.message,
    metadata: {
      messageType: props.messageType || inferMessageType(props.message),
      phase: props.phase,
      ...props.metadata,
    },
  };
}

/**
 * Infer message type from JSON-RPC or LLM API message
 */
function inferMessageType(message: JSONRPCMessage | LLMAPIMessage): string {
  // JSON-RPC messages
  if ('jsonrpc' in message && message.jsonrpc === '2.0') {
    if ('method' in message && 'id' in message) {
      return 'jsonrpc_request';
    }
    if ('method' in message && !('id' in message)) {
      return 'jsonrpc_notification';
    }
    if ('result' in message || 'error' in message) {
      return 'jsonrpc_response';
    }
  }

  // LLM API messages
  if ('role' in message) {
    return 'llm_message';
  }

  return 'unknown';
}

// ============================================================================
// Console Log Events
// ============================================================================

/**
 * Create a console log event (for actor columns)
 */
export function createConsoleLogEvent(
  props: BaseEventProps & {
    logLevel: 'info' | 'debug' | 'error';
    logMessage: string;
    badgeType: ConsoleBadgeType;
    phase?: Phase;
  }
): Omit<ConsoleLogEvent, 'sessionId' | 'sequence' | 'timestamp'> {
  return {
    eventType: 'console_log',
    actor: props.actor,
    logLevel: props.logLevel,
    logMessage: props.logMessage,
    badgeType: props.badgeType,
    metadata: {
      messageType: 'console_log',
      phase: props.phase,
      ...props.metadata,
    },
  };
}

// ============================================================================
// Internal Operation Events
// ============================================================================

/**
 * Create an internal operation event (for host app operations)
 */
export function createInternalOperationEvent(
  props: BaseEventProps & {
    operationType: string;
    description: string;
    phase?: Phase;
  }
): Omit<InternalOperationEvent, 'sessionId' | 'sequence' | 'timestamp'> {
  return {
    eventType: 'internal_operation',
    actor: props.actor,
    operationType: props.operationType,
    description: props.description,
    metadata: {
      messageType: 'internal_operation',
      phase: props.phase,
      ...props.metadata,
    },
  };
}

// ============================================================================
// Convenience Functions for Common Events
// ============================================================================

/**
 * Create a console log for user input
 */
export function createUserInputLog(
  message: string
): Omit<ConsoleLogEvent, 'sessionId' | 'sequence' | 'timestamp'> {
  return createConsoleLogEvent({
    actor: 'host_app',
    logLevel: 'info',
    logMessage: message,
    badgeType: 'USER_INPUT',
    phase: 'initialization',
  });
}

/**
 * Create a console log for system events
 */
export function createSystemLog(
  message: string,
  phase?: Phase
): Omit<ConsoleLogEvent, 'sessionId' | 'sequence' | 'timestamp'> {
  return createConsoleLogEvent({
    actor: 'host_app',
    logLevel: 'info',
    logMessage: message,
    badgeType: 'SYSTEM',
    phase,
  });
}

/**
 * Create a console log for MCP server operations
 */
export function createServerLog(
  message: string,
  phase?: Phase
): Omit<ConsoleLogEvent, 'sessionId' | 'sequence' | 'timestamp'> {
  return createConsoleLogEvent({
    actor: 'mcp_server',
    logLevel: 'info',
    logMessage: message,
    badgeType: 'SERVER',
    phase,
  });
}

/**
 * Create a console log for LLM operations
 */
export function createLLMLog(
  message: string,
  phase?: Phase
): Omit<ConsoleLogEvent, 'sessionId' | 'sequence' | 'timestamp'> {
  return createConsoleLogEvent({
    actor: 'llm',
    logLevel: 'info',
    logMessage: message,
    badgeType: 'LLM',
    phase,
  });
}

/**
 * Create a completion log
 */
export function createCompleteLog(
  message: string,
  phase?: Phase
): Omit<ConsoleLogEvent, 'sessionId' | 'sequence' | 'timestamp'> {
  return createConsoleLogEvent({
    actor: 'host_app',
    logLevel: 'info',
    logMessage: message,
    badgeType: 'COMPLETE',
    phase,
  });
}

// ============================================================================
// JSON-RPC Message Builders
// ============================================================================

/**
 * Create a JSON-RPC request message
 */
export function createJSONRPCRequest(
  id: number | string,
  method: string,
  params?: object
): JSONRPCMessage {
  return {
    jsonrpc: '2.0',
    id,
    method,
    ...(params && { params }),
  };
}

/**
 * Create a JSON-RPC response message
 */
export function createJSONRPCResponse(
  id: number | string,
  result: object
): JSONRPCMessage {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

/**
 * Create a JSON-RPC notification message
 */
export function createJSONRPCNotification(
  method: string,
  params?: object
): JSONRPCMessage {
  return {
    jsonrpc: '2.0',
    method,
    ...(params && { params }),
  };
}

/**
 * Create a JSON-RPC error response
 */
export function createJSONRPCError(
  id: number | string,
  code: number,
  message: string,
  data?: unknown
): JSONRPCMessage {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      ...(data && { data }),
    },
  };
}
