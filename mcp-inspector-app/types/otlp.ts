/**
 * OpenTelemetry OTLP (OpenTelemetry Protocol) Type Definitions
 *
 * These types represent the OTLP JSON format for trace data.
 * Reference: https://opentelemetry.io/docs/specs/otlp/
 */

/**
 * Span represents a single operation within a trace
 */
export interface OTLPSpan {
  traceId: string;                    // 32-character hex string (16 bytes)
  spanId: string;                     // 16-character hex string (8 bytes)
  parentSpanId?: string;              // Optional parent span ID
  name: string;                       // Operation name
  kind: SpanKind;                     // Span kind enum
  startTimeUnixNano: string;          // Start time in nanoseconds (string to avoid precision loss)
  endTimeUnixNano: string;            // End time in nanoseconds
  attributes?: Attribute[];           // Key-value attributes
  events?: SpanEvent[];               // Span events (like console logs)
  status?: SpanStatus;                // Status of the span
}

/**
 * Span kind enumeration
 */
export enum SpanKind {
  SPAN_KIND_UNSPECIFIED = 0,
  SPAN_KIND_INTERNAL = 1,
  SPAN_KIND_SERVER = 2,
  SPAN_KIND_CLIENT = 3,
  SPAN_KIND_PRODUCER = 4,
  SPAN_KIND_CONSUMER = 5,
}

/**
 * Span event (e.g., console logs, internal events)
 */
export interface SpanEvent {
  timeUnixNano: string;               // Event timestamp in nanoseconds
  name: string;                       // Event name
  attributes?: Attribute[];           // Event attributes
}

/**
 * Span status
 */
export interface SpanStatus {
  code: StatusCode;                   // Status code enum
  message?: string;                   // Optional status message
}

/**
 * Status code enumeration
 */
export enum StatusCode {
  STATUS_CODE_UNSET = 0,
  STATUS_CODE_OK = 1,
  STATUS_CODE_ERROR = 2,
}

/**
 * Attribute key-value pair
 */
export interface Attribute {
  key: string;
  value: AnyValue;
}

/**
 * Typed value for attributes
 */
export interface AnyValue {
  stringValue?: string;
  boolValue?: boolean;
  intValue?: number;
  doubleValue?: number;
  arrayValue?: ArrayValue;
  kvlistValue?: KeyValueList;
}

/**
 * Array of values
 */
export interface ArrayValue {
  values: AnyValue[];
}

/**
 * Key-value list
 */
export interface KeyValueList {
  values: Attribute[];
}

/**
 * Resource represents the entity producing telemetry
 */
export interface Resource {
  attributes: Attribute[];
}

/**
 * Instrumentation scope
 */
export interface InstrumentationScope {
  name: string;
  version?: string;
  attributes?: Attribute[];
}

/**
 * Scope spans - groups spans by instrumentation scope
 */
export interface ScopeSpans {
  scope?: InstrumentationScope;
  spans: OTLPSpan[];
}

/**
 * Resource spans - groups spans by resource
 */
export interface ResourceSpans {
  resource?: Resource;
  scopeSpans: ScopeSpans[];
}

/**
 * Top-level OTLP trace structure
 */
export interface OTLPTrace {
  resourceSpans: ResourceSpans[];
}

/**
 * Export options for OTLP conversion
 */
export interface OTLPExportOptions {
  /**
   * Include console log events in the export
   * Default: true
   */
  includeConsoleLogs?: boolean;

  /**
   * Include internal operation events
   * Default: true
   */
  includeInternalOperations?: boolean;

  /**
   * Group spans by workflow phase
   * Default: true
   */
  groupByPhase?: boolean;

  /**
   * Service name for resource attributes
   * Default: 'mcp-inspector'
   */
  serviceName?: string;

  /**
   * Service version for resource attributes
   * Default: '1.0.0'
   */
  serviceVersion?: string;
}
