/**
 * MCP (Model Context Protocol) Type Definitions
 *
 * Based on:
 * - Technical Design Document domain model
 * - @modelcontextprotocol/sdk types
 * - Python POC implementation (client.py)
 */

// ============================================================================
// MCP Tool Types
// ============================================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>; // JSON Schema format
  serverId?: string; // Which server provides this tool (for multi-server support)
  serverName?: string; // Display name of server providing this tool
}

export interface MCPToolCallParams {
  name: string;
  arguments: Record<string, unknown>;
}

// ============================================================================
// MCP Tool Result Types
// ============================================================================

export type MCPContentType = 'text' | 'image' | 'resource';

export interface MCPTextContent {
  type: 'text';
  text: string;
}

export interface MCPImageContent {
  type: 'image';
  data: string; // Base64 encoded
  mimeType: string;
}

export interface MCPResourceContent {
  type: 'resource';
  resource: {
    uri: string;
    text?: string;
    mimeType?: string;
  };
}

export type MCPContent = MCPTextContent | MCPImageContent | MCPResourceContent;

export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
}

// ============================================================================
// MCP Server Configuration
// ============================================================================

export interface MCPServerConfig {
  id?: string; // Server identifier for multi-server support
  name?: string; // Server display name
  command: string;
  args: string[];
  env?: Record<string, string>;
}

// ============================================================================
// MCP Client Connection State
// ============================================================================

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  serverName?: string;
  error?: string;
  capabilities?: Record<string, unknown>;
}

// ============================================================================
// MCP Protocol Messages (for event recording)
// ============================================================================

export interface MCPInitializeRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: 'initialize';
  params: {
    protocolVersion: string;
    capabilities: Record<string, unknown>;
    clientInfo: {
      name: string;
      version: string;
    };
  };
}

export interface MCPInitializeResponse {
  jsonrpc: '2.0';
  id: number | string;
  result: {
    protocolVersion: string;
    capabilities: Record<string, unknown>;
    serverInfo: {
      name: string;
      version: string;
    };
  };
}

export interface MCPInitializedNotification {
  jsonrpc: '2.0';
  method: 'notifications/initialized';
  params?: Record<string, unknown>;
}

export interface MCPToolsListRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: 'tools/list';
  params?: {
    cursor?: string;
  };
}

export interface MCPToolsListResponse {
  jsonrpc: '2.0';
  id: number | string;
  result: {
    tools: MCPTool[];
    nextCursor?: string;
  };
}

export interface MCPToolCallRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: 'tools/call';
  params: {
    name: string;
    arguments?: Record<string, unknown>;
  };
}

export interface MCPToolCallResponse {
  jsonrpc: '2.0';
  id: number | string;
  result: {
    content: MCPContent[];
    isError?: boolean;
  };
}

export type MCPMessage =
  | MCPInitializeRequest
  | MCPInitializeResponse
  | MCPInitializedNotification
  | MCPToolsListRequest
  | MCPToolsListResponse
  | MCPToolCallRequest
  | MCPToolCallResponse;
