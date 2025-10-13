/**
 * Row Builder
 *
 * Converts timeline events into grid rows with automatic spacer block insertion.
 *
 * Key Principle: All columns must have either content or a spacer at every sequence.
 * This maintains strict vertical alignment across all actors - the most important
 * UI requirement for the MCP Inspector Teaching App.
 *
 * Algorithm:
 * 1. Group events by sequence number
 * 2. For each sequence, create a row with 5 cells (one per column)
 * 3. For each column, check if there's an event that belongs there
 * 4. If event exists → create content cell
 * 5. If no event → create spacer cell
 */

import type {
  TimelineEvent,
  TimelineRow,
  RowCell,
  CellContent,
  ProtocolMessageEvent,
  ConsoleLogEvent,
  InternalOperationEvent,
  MessageCard,
  ColumnDefinition,
} from '../types/domain';
import { COLUMN_DEFINITIONS } from '../components/column-definitions';

/**
 * Build rows from timeline events with automatic spacer insertion
 *
 * This is the core layout engine algorithm that ensures vertical alignment.
 * Every row will have exactly 5 cells (one per column), with either content or spacer.
 */
export function buildRows(events: TimelineEvent[]): TimelineRow[] {
  if (events.length === 0) return [];

  // Group events by sequence number
  const eventsBySequence = groupEventsBySequence(events);

  const rows: TimelineRow[] = [];

  // Process each sequence in order
  const sequences = Array.from(eventsBySequence.keys()).sort((a, b) => a - b);

  for (const sequence of sequences) {
    const eventsAtSequence = eventsBySequence.get(sequence)!;
    const row = buildRowForSequence(sequence, eventsAtSequence);
    rows.push(row);
  }

  return rows;
}

/**
 * Group events by their sequence number
 */
function groupEventsBySequence(
  events: TimelineEvent[]
): Map<number, TimelineEvent[]> {
  const grouped = new Map<number, TimelineEvent[]>();

  for (const event of events) {
    if (!grouped.has(event.sequence)) {
      grouped.set(event.sequence, []);
    }
    grouped.get(event.sequence)!.push(event);
  }

  return grouped;
}

/**
 * Build a single row for a specific sequence number
 * Creates exactly 5 cells (one per column) with content or spacer
 */
function buildRowForSequence(
  sequence: number,
  eventsAtSequence: TimelineEvent[]
): TimelineRow {
  const cells: RowCell[] = [];

  // For each column, find the event that belongs there (if any)
  for (const column of COLUMN_DEFINITIONS) {
    const event = findEventForColumn(eventsAtSequence, column);

    if (event) {
      // Content cell
      cells.push({
        columnId: column.id,
        cellType: 'content',
        content: mapEventToContent(event),
      });
    } else {
      // Spacer cell (maintains vertical alignment)
      cells.push({
        columnId: column.id,
        cellType: 'spacer',
      });
    }
  }

  return {
    rowId: `row-${sequence}`,
    sequence,
    cells,
  };
}

/**
 * Find the event that belongs in a specific column
 *
 * Column mapping:
 * - Actor columns (host_app, llm, mcp_server): Match by event.actor
 * - Lane columns (lane_host_llm, lane_host_mcp): Match by event.lane
 */
function findEventForColumn(
  events: TimelineEvent[],
  column: ColumnDefinition
): TimelineEvent | null {
  if (column.type === 'actor') {
    // Actor columns: find event where actor matches
    return events.find((e) => e.actor === column.actor) || null;
  } else if (column.type === 'lane') {
    // Lane columns: find protocol message event where lane matches
    return (
      events.find(
        (e) =>
          e.eventType === 'protocol_message' &&
          (e as ProtocolMessageEvent).lane === column.lane
      ) || null
    );
  }

  return null;
}

/**
 * Map a timeline event to cell content for rendering
 *
 * Event type → Cell content type mapping:
 * - console_log → console_log cell content
 * - protocol_message (in lane) → message_card cell content
 * - protocol_message (in actor column) → console_log or thinking_indicator
 * - internal_operation → console_log cell content
 */
function mapEventToContent(event: TimelineEvent): CellContent {
  switch (event.eventType) {
    case 'console_log':
      return {
        type: 'console_log',
        event: event as ConsoleLogEvent,
      };

    case 'protocol_message': {
      const protocolEvent = event as ProtocolMessageEvent;

      // Protocol messages in lanes render as message cards
      if (protocolEvent.lane) {
        return {
          type: 'message_card',
          card: mapProtocolMessageToCard(protocolEvent),
        };
      }

      // Protocol messages in actor columns render as console logs
      // (This is a fallback - typically protocol messages are in lanes)
      return {
        type: 'console_log',
        event: {
          ...event,
          eventType: 'console_log',
          logLevel: 'info',
          logMessage: `Protocol message: ${protocolEvent.message}`,
          badgeType: 'SYSTEM',
        } as ConsoleLogEvent,
      };
    }

    case 'internal_operation': {
      const internalEvent = event as InternalOperationEvent;
      return {
        type: 'console_log',
        event: {
          ...event,
          eventType: 'console_log',
          logLevel: 'info',
          logMessage: internalEvent.description,
          badgeType: 'INTERNAL',
        } as ConsoleLogEvent,
      };
    }

    default:
      // Fallback: render as console log
      return {
        type: 'console_log',
        event: {
          ...event,
          eventType: 'console_log',
          logLevel: 'info',
          logMessage: JSON.stringify(event),
          badgeType: 'LOG',
        } as ConsoleLogEvent,
      };
  }
}

/**
 * Convert a protocol message event to a message card
 * Extracts the necessary information for MessageCard rendering
 */
function mapProtocolMessageToCard(
  event: ProtocolMessageEvent
): MessageCard {
  const message = event.message as any;

  // Determine card type: request, response, or notification
  let cardType: 'request' | 'response' | 'notification';
  let method: string;
  let sequence: number | undefined;
  let timing: number | undefined;

  // JSON-RPC request (has id and method)
  if (message.method && message.id) {
    cardType = 'request';
    method = message.method;
    sequence = extractSequenceFromMessage(message);
  }
  // JSON-RPC response (has id and result/error)
  else if (message.id && (message.result || message.error)) {
    cardType = 'response';
    method = extractMethodFromMetadata(event);
    sequence = extractSequenceFromMessage(message);
    timing = event.metadata.processingTime;
  }
  // JSON-RPC notification (has method but no id)
  else if (message.method && !message.id) {
    cardType = 'notification';
    method = message.method;
  }
  // LLM API messages (no JSON-RPC structure)
  else if (message.role || message.content) {
    // LLM request
    if (event.direction === 'sent') {
      cardType = 'request';
      method = extractMethodFromMetadata(event) || 'llm_request';
    }
    // LLM response
    else {
      cardType = 'response';
      method = extractMethodFromMetadata(event) || 'llm_response';
      timing = event.metadata.processingTime;
    }
  }
  // Fallback
  else {
    cardType = 'notification';
    method = 'unknown';
  }

  return {
    id: `card-${event.sequence}`,
    type: cardType,
    method,
    sequence,
    direction: event.direction,
    timing,
    payload: message,
    isExpanded: false,
  };
}

/**
 * Extract sequence number from JSON-RPC message ID
 * JSON-RPC IDs are typically integers representing request sequence
 */
function extractSequenceFromMessage(message: any): number | undefined {
  if (typeof message.id === 'number') {
    return message.id;
  }
  return undefined;
}

/**
 * Extract method name from event metadata
 * Used when method isn't directly in the message (e.g., for responses)
 */
function extractMethodFromMetadata(event: ProtocolMessageEvent): string {
  // Try to get method from messageType metadata
  const messageType = event.metadata.messageType;
  if (messageType) {
    // Convert "initialize_response" → "initialize"
    // Convert "tools_list_request" → "tools/list"
    return messageType
      .replace(/_request$/, '')
      .replace(/_response$/, '')
      .replace(/_notification$/, '')
      .replace(/_/g, '/');
  }

  // Fallback to checking the message itself
  const message = event.message as any;
  if (message.method) {
    return message.method;
  }

  return 'unknown';
}
