/**
 * OTLP Exporter - Converts MCP Inspector timeline events to OpenTelemetry OTLP format
 *
 * This exporter provides integration with industry-standard observability tools
 * while maintaining the custom pedagogical format for runtime use.
 */

import type {
  TimelineEvent,
  ProtocolMessageEvent,
  ConsoleLogEvent,
  InternalOperationEvent,
  Actor,
  Phase,
  CommunicationLane,
} from '@/types/domain';
import type {
  OTLPTrace,
  OTLPSpan,
  SpanKind,
  Attribute,
  AnyValue,
  Resource,
  ResourceSpans,
  ScopeSpans,
  InstrumentationScope,
  OTLPExportOptions,
  SpanEvent,
  StatusCode,
} from '@/types/otlp';

/**
 * Trace data structure matching the Mermaid exporter format
 */
interface TraceData {
  sessionId: string;
  eventCount: number;
  events: TimelineEvent[];
  exportedAt?: string;
}

/**
 * Helper to convert session ID to OTLP trace ID (32-char hex)
 */
function sessionIdToTraceId(sessionId: string): string {
  // Remove all non-hex characters and convert to lowercase
  const cleaned = sessionId.toLowerCase().replace(/[^0-9a-f]/g, '');
  // Pad with zeros to reach 32 characters or truncate if longer
  return cleaned.padEnd(32, '0').slice(0, 32);
}

/**
 * Helper to generate span ID from sequence number (16-char hex)
 */
function generateSpanId(sequence: number): string {
  return sequence.toString(16).padStart(16, '0');
}

/**
 * Helper to convert milliseconds to nanoseconds string
 */
function msToNano(ms: number): string {
  return (ms * 1_000_000).toString();
}

/**
 * Maps actor to resource attributes
 */
function createActorResource(actor: Actor, serviceName: string, serviceVersion: string): Resource {
  return {
    attributes: [
      { key: 'service.name', value: { stringValue: serviceName } },
      { key: 'service.version', value: { stringValue: serviceVersion } },
      { key: 'mcp.actor', value: { stringValue: actor } },
    ],
  };
}

/**
 * Maps phase to instrumentation scope
 */
function createPhaseScope(phase?: Phase): InstrumentationScope {
  const phaseNames: Record<Phase, string> = {
    initialization: 'Initialization & Negotiation',
    discovery: 'Discovery & Contextualization',
    selection: 'Model-Driven Selection',
    execution: 'Execution Round Trip',
    synthesis: 'Synthesis & Final Response',
  };

  return {
    name: phase ? `phase.${phase}` : 'phase.unknown',
    version: '1.0.0',
    attributes: phase
      ? [{ key: 'phase.display_name', value: { stringValue: phaseNames[phase] } }]
      : [],
  };
}

/**
 * Determines span kind from protocol message event
 */
function getSpanKind(event: TimelineEvent): SpanKind {
  if (event.eventType === 'internal_operation') {
    return 1; // SPAN_KIND_INTERNAL
  }

  if (event.eventType === 'protocol_message') {
    const protocolEvent = event as ProtocolMessageEvent;
    // Sent messages are CLIENT, received are SERVER from the actor's perspective
    return protocolEvent.direction === 'sent' ? 3 : 2; // CLIENT : SERVER
  }

  return 1; // SPAN_KIND_INTERNAL for console logs and others
}

/**
 * Generates a descriptive span name from the event
 */
function getSpanName(event: TimelineEvent): string {
  if (event.eventType === 'protocol_message') {
    const protocolEvent = event as ProtocolMessageEvent;
    const message = protocolEvent.message;

    // Handle LLM calls with explicit numbering
    if (event.metadata.messageType === 'llm_request') {
      if (event.metadata.phase === 'selection') {
        return 'LLM Call #1 (Planning)';
      } else if (event.metadata.phase === 'synthesis') {
        return 'LLM Call #2 (Synthesis)';
      }
    }

    if (event.metadata.messageType === 'llm_response') {
      if (event.metadata.phase === 'selection') {
        return 'LLM Response - tool_use';
      } else if (event.metadata.phase === 'synthesis') {
        return 'LLM Response - final answer';
      }
    }

    // Extract method from JSON-RPC message
    if (message && 'method' in message && typeof message.method === 'string') {
      return message.method;
    }

    // Use messageType as fallback
    return event.metadata.messageType || 'unknown_message';
  }

  if (event.eventType === 'console_log') {
    const consoleEvent = event as ConsoleLogEvent;
    return `console.${consoleEvent.logLevel}`;
  }

  if (event.eventType === 'internal_operation') {
    const opEvent = event as InternalOperationEvent;
    return opEvent.operationType;
  }

  return 'unknown_operation';
}

/**
 * Converts a timeline event to OTLP attributes
 */
function eventToAttributes(event: TimelineEvent): Attribute[] {
  const attributes: Attribute[] = [
    { key: 'event.type', value: { stringValue: event.eventType } },
    { key: 'actor', value: { stringValue: event.actor } },
    { key: 'sequence', value: { intValue: event.sequence } },
  ];

  // Add phase if present
  if (event.metadata.phase) {
    attributes.push({ key: 'phase', value: { stringValue: event.metadata.phase } });
  }

  // Add message type
  if (event.metadata.messageType) {
    attributes.push({ key: 'message.type', value: { stringValue: event.metadata.messageType } });
  }

  // Add processing time if present
  if (event.metadata.processingTime) {
    attributes.push({ key: 'processing.time_ms', value: { doubleValue: event.metadata.processingTime } });
  }

  // Protocol message specific attributes
  if (event.eventType === 'protocol_message') {
    const protocolEvent = event as ProtocolMessageEvent;
    attributes.push(
      { key: 'direction', value: { stringValue: protocolEvent.direction } },
      { key: 'lane', value: { stringValue: protocolEvent.lane } },
      { key: 'message', value: { stringValue: JSON.stringify(protocolEvent.message) } }
    );

    // Extract method and id from JSON-RPC if present
    const message = protocolEvent.message;
    if (message && typeof message === 'object') {
      if ('method' in message && typeof message.method === 'string') {
        attributes.push({ key: 'jsonrpc.method', value: { stringValue: message.method } });
      }
      if ('id' in message) {
        const id = message.id;
        if (typeof id === 'number') {
          attributes.push({ key: 'jsonrpc.id', value: { intValue: id } });
        } else if (typeof id === 'string') {
          attributes.push({ key: 'jsonrpc.id', value: { stringValue: id } });
        }
      }
    }
  }

  // Console log specific attributes
  if (event.eventType === 'console_log') {
    const consoleEvent = event as ConsoleLogEvent;
    attributes.push(
      { key: 'log.level', value: { stringValue: consoleEvent.logLevel } },
      { key: 'log.message', value: { stringValue: consoleEvent.logMessage } },
      { key: 'badge.type', value: { stringValue: consoleEvent.badgeType } }
    );
  }

  // Internal operation specific attributes
  if (event.eventType === 'internal_operation') {
    const opEvent = event as InternalOperationEvent;
    attributes.push(
      { key: 'operation.type', value: { stringValue: opEvent.operationType } },
      { key: 'operation.description', value: { stringValue: opEvent.description } }
    );
  }

  return attributes;
}

/**
 * Converts a console log event to a span event
 */
function consoleLogToSpanEvent(event: ConsoleLogEvent): SpanEvent {
  return {
    timeUnixNano: msToNano(event.timestamp),
    name: event.logMessage,
    attributes: [
      { key: 'log.level', value: { stringValue: event.logLevel } },
      { key: 'badge.type', value: { stringValue: event.badgeType } },
    ],
  };
}

/**
 * Converts a timeline event to an OTLP span
 */
function convertEventToSpan(
  event: TimelineEvent,
  traceId: string,
  nextEvent?: TimelineEvent
): OTLPSpan {
  const startTimeNano = msToNano(event.timestamp);
  // Use next event's timestamp or add 1ms as end time
  const endTimeNano = nextEvent ? msToNano(nextEvent.timestamp) : msToNano(event.timestamp + 1);

  const span: OTLPSpan = {
    traceId,
    spanId: generateSpanId(event.sequence),
    name: getSpanName(event),
    kind: getSpanKind(event),
    startTimeUnixNano: startTimeNano,
    endTimeUnixNano: endTimeNano,
    attributes: eventToAttributes(event),
    status: {
      code: 0, // STATUS_CODE_UNSET (success)
    },
  };

  // For console logs, also add them as span events
  if (event.eventType === 'console_log') {
    span.events = [consoleLogToSpanEvent(event as ConsoleLogEvent)];
  }

  return span;
}

/**
 * Groups events by actor
 */
function groupByActor(events: TimelineEvent[]): Array<{ actor: Actor; events: TimelineEvent[] }> {
  const groups = new Map<Actor, TimelineEvent[]>();

  for (const event of events) {
    const existing = groups.get(event.actor) || [];
    existing.push(event);
    groups.set(event.actor, existing);
  }

  return Array.from(groups.entries()).map(([actor, events]) => ({
    actor,
    events,
  }));
}

/**
 * Groups events by phase
 */
function groupByPhase(events: TimelineEvent[]): Array<{ phase?: Phase; events: TimelineEvent[] }> {
  const groups: Array<{ phase?: Phase; events: TimelineEvent[] }> = [];
  let currentPhase: Phase | undefined = undefined;
  let currentEvents: TimelineEvent[] = [];

  for (const event of events) {
    const phase = event.metadata.phase;

    if (phase !== currentPhase) {
      if (currentEvents.length > 0) {
        groups.push({ phase: currentPhase, events: currentEvents });
      }
      currentPhase = phase;
      currentEvents = [event];
    } else {
      currentEvents.push(event);
    }
  }

  // Add the last group
  if (currentEvents.length > 0) {
    groups.push({ phase: currentPhase, events: currentEvents });
  }

  return groups;
}

/**
 * Filters events based on export options
 */
function filterEvents(events: TimelineEvent[], options: OTLPExportOptions): TimelineEvent[] {
  return events.filter((event) => {
    if (event.eventType === 'console_log' && !options.includeConsoleLogs) {
      return false;
    }
    if (event.eventType === 'internal_operation' && !options.includeInternalOperations) {
      return false;
    }
    return true;
  });
}

/**
 * Exports trace data to OTLP format
 */
export function exportTraceAsOTLP(
  traceData: TraceData,
  options: OTLPExportOptions = {}
): OTLPTrace {
  // Apply default options
  const opts: Required<OTLPExportOptions> = {
    includeConsoleLogs: options.includeConsoleLogs ?? true,
    includeInternalOperations: options.includeInternalOperations ?? true,
    groupByPhase: options.groupByPhase ?? true,
    serviceName: options.serviceName ?? 'mcp-inspector',
    serviceVersion: options.serviceVersion ?? '1.0.0',
  };

  const traceId = sessionIdToTraceId(traceData.sessionId);
  const filteredEvents = filterEvents(traceData.events, opts);

  // Group by actor first
  const actorGroups = groupByActor(filteredEvents);

  const resourceSpans: ResourceSpans[] = actorGroups.map((actorGroup) => {
    const resource = createActorResource(actorGroup.actor, opts.serviceName, opts.serviceVersion);

    let scopeSpans: ScopeSpans[];

    if (opts.groupByPhase) {
      // Group by phase within each actor
      const phaseGroups = groupByPhase(actorGroup.events);
      scopeSpans = phaseGroups.map((phaseGroup) => ({
        scope: createPhaseScope(phaseGroup.phase),
        spans: phaseGroup.events.map((event, index) => {
          const nextEvent = phaseGroup.events[index + 1];
          return convertEventToSpan(event, traceId, nextEvent);
        }),
      }));
    } else {
      // Single scope with all events
      scopeSpans = [
        {
          scope: createPhaseScope(undefined),
          spans: actorGroup.events.map((event, index) => {
            const nextEvent = actorGroup.events[index + 1];
            return convertEventToSpan(event, traceId, nextEvent);
          }),
        },
      ];
    }

    return {
      resource,
      scopeSpans,
    };
  });

  return {
    resourceSpans,
  };
}

/**
 * Exports trace data as OTLP JSON string with metadata
 */
export function exportTraceAsOTLPJSON(
  traceData: TraceData,
  options: OTLPExportOptions = {}
): string {
  const otlpTrace = exportTraceAsOTLP(traceData, options);
  const timestamp = new Date().toISOString();

  // Create a wrapper with metadata
  const exportData = {
    metadata: {
      exportedAt: timestamp,
      sessionId: traceData.sessionId,
      eventCount: traceData.eventCount,
      format: 'otlp',
      formatVersion: '1.0.0',
      exporter: 'mcp-inspector',
    },
    trace: otlpTrace,
  };

  return JSON.stringify(exportData, null, 2);
}
