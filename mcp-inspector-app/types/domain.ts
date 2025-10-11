// ============================================================================
// Event System (Timeline Recording)
// ============================================================================

export type EventType = 'protocol_message' | 'internal_operation' | 'console_log';
export type Actor = 'host_app' | 'llm' | 'mcp_server' | 'external_api';
export type CommunicationLane = 'host_llm' | 'host_mcp';
export type Phase = 'initialization' | 'discovery' | 'selection' | 'execution' | 'synthesis';
export type ConsoleBadgeType = 'USER_INPUT' | 'SYSTEM' | 'INTERNAL' | 'LLM' | 'SERVER' | 'LOG' | 'COMPLETE';

export interface EventMetadata {
  processingTime?: number;
  correlatedMessageId?: string;
  messageType?: string;
  phase?: Phase;
  [key: string]: unknown;
}

export interface TimelineEvent {
  sessionId: string;
  sequence: number;           // Global sequence across all events
  timestamp: number;          // Unix timestamp in milliseconds
  eventType: EventType;
  actor: Actor;
  metadata: EventMetadata;
}

export interface ProtocolMessageEvent extends TimelineEvent {
  eventType: 'protocol_message';
  direction: 'sent' | 'received';
  lane: CommunicationLane;
  message: JSONRPCMessage | LLMAPIMessage;
}

export interface ConsoleLogEvent extends TimelineEvent {
  eventType: 'console_log';
  logLevel: 'info' | 'debug' | 'error';
  logMessage: string;
  badgeType: ConsoleBadgeType;
}

export interface InternalOperationEvent extends TimelineEvent {
  eventType: 'internal_operation';
  operationType: string;
  description: string;
}

// ============================================================================
// Message Cards (Communication Lanes)
// ============================================================================

export type MessageCardType = 'request' | 'response' | 'notification';

export interface MessageCard {
  id: string;
  type: MessageCardType;
  method: string;              // e.g., "initialize", "tools/call"
  sequence?: number;           // For requests/responses (correlates req #1 with resp #1)
  direction: 'sent' | 'received';
  timing?: number;             // For responses (processing time in ms)
  payload: object;             // Full JSON-RPC or LLM API payload
  isExpanded: boolean;         // UI state for expand/collapse
}

// JSON-RPC Message Structure (from MCP spec)
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: number | string;         // Present in requests (expects response)
  method: string;
  params?: object;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: number | string;         // Matches request ID
  result?: object;
  error?: JSONRPCError;
}

export interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;              // No id field (fire-and-forget)
  params?: object;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: unknown;
}

export type JSONRPCMessage = JSONRPCRequest | JSONRPCResponse | JSONRPCNotification;

// LLM API Message (placeholder - will be expanded in Module 7)
export type LLMAPIMessage = object;

// ============================================================================
// Grid Layout System
// ============================================================================

export interface ColumnDefinition {
  id: string;
  type: 'actor' | 'lane';
  actor?: Actor;
  lane?: CommunicationLane;
  width: string;               // Tailwind width class (e.g., "w-1/5")
  title: string;
}

export interface TimelineRow {
  rowId: string;
  sequence: number;
  cells: RowCell[];
}

export interface RowCell {
  columnId: string;
  cellType: 'content' | 'spacer';
  content?: CellContent;
}

export type CellContent =
  | { type: 'chat_bubble'; role: 'user' | 'assistant'; text: string }
  | { type: 'console_log'; event: ConsoleLogEvent }
  | { type: 'message_card'; card: MessageCard }
  | { type: 'thinking_indicator'; message: string }
  | { type: 'phase_header'; phase: Phase; timing: number };

// ============================================================================
// MCP Integration Types
// ============================================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;         // JSON Schema format
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;             // Base64 for images
    mimeType?: string;
  }>;
  isError: boolean;
  meta?: object;
}

// ============================================================================
// Claude API Types
// ============================================================================

export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: object;        // Renamed from MCP's inputSchema
}

export interface ClaudeToolUse {
  type: 'tool_use';
  id: string;                  // Tool use ID for correlation
  name: string;
  input: object;
}

export interface ClaudeToolResult {
  type: 'tool_result';
  tool_use_id: string;         // Matches ClaudeToolUse.id
  content: string;
}
