/**
 * MCP Client Wrapper
 *
 * TypeScript port of Python POC client.py
 * Provides connection, tool discovery, and tool execution for MCP servers.
 *
 * Key features:
 * - 3-message handshake (initialize → response → initialized)
 * - Tool discovery via tools/list
 * - Tool execution via tools/call
 * - Complete event recording for timeline visualization
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  MCPServerConfig,
  MCPTool,
  MCPToolResult,
  ConnectionState,
} from '@/types/mcp';
import {
  recordProtocolMessage,
  recordMCPLog,
  getPhaseForMethod,
} from './message-handlers';

/**
 * MCP Client wrapper class.
 *
 * Mirrors the Python POC client.py implementation.
 */
export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connectionState: ConnectionState = { status: 'disconnected' };

  /**
   * Get current connection status.
   */
  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Check if client is connected.
   */
  public isConnected(): boolean {
    return this.connectionState.status === 'connected' && this.client !== null;
  }

  /**
   * Connect to an MCP server and complete initialization handshake.
   *
   * This performs the 3-message handshake:
   * 1. Host → Server: initialize request
   * 2. Host ← Server: initialize response
   * 3. Host → Server: initialized notification
   *
   * Based on Python POC client.py:connect() (lines 20-63)
   */
  public async connect(config: MCPServerConfig): Promise<void> {
    try {
      // Update connection state
      this.connectionState = { status: 'connecting' };

      // Record connection attempt
      recordMCPLog(
        `Connecting to MCP server: ${config.command} ${config.args.join(' ')}`,
        'host_app',
        'initialization',
        'info'
      );

      // Create stdio transport
      this.transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env,
      });

      // Create MCP client
      this.client = new Client(
        {
          name: 'mcp-inspector',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Record initialize request (SDK handles this internally)
      recordMCPLog(
        "Sending 'initialize' request",
        'host_app',
        'initialization',
        'info'
      );

      // Connect (handles 3-message handshake automatically)
      await this.client.connect(this.transport);

      // Record completion
      recordMCPLog(
        'Handshake complete ✓',
        'host_app',
        'initialization',
        'info'
      );

      // Update connection state
      this.connectionState = {
        status: 'connected',
        serverName: config.command,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Record error
      recordMCPLog(
        `Connection failed: ${errorMessage}`,
        'host_app',
        'initialization',
        'error'
      );

      // Update connection state
      this.connectionState = {
        status: 'error',
        error: errorMessage,
      };

      throw error;
    }
  }

  /**
   * List available tools from the connected server.
   *
   * Based on Python POC client.py:list_tools() (lines 65-92)
   */
  public async listTools(): Promise<MCPTool[]> {
    if (!this.client) {
      throw new Error('Not connected to a server');
    }

    try {
      // Record request
      recordMCPLog(
        "Requesting 'tools/list'",
        'host_app',
        'discovery',
        'info'
      );

      // Call tools/list
      const response = await this.client.listTools();

      // Record response
      recordMCPLog(
        `Discovered ${response.tools.length} tool(s)`,
        'host_app',
        'discovery',
        'info'
      );

      // Convert SDK tools to our MCPTool format
      const tools: MCPTool[] = response.tools.map((tool) => {
        // Log each discovered tool
        recordMCPLog(
          `Tool: ${tool.name} - ${tool.description}`,
          'mcp_server',
          'discovery',
          'info'
        );

        return {
          name: tool.name,
          description: tool.description || '',
          inputSchema: (tool.inputSchema as Record<string, unknown>) || {},
        };
      });

      return tools;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      recordMCPLog(
        `Tool discovery failed: ${errorMessage}`,
        'host_app',
        'discovery',
        'error'
      );

      throw error;
    }
  }

  /**
   * Call a tool on the connected server.
   *
   * Based on Python POC client.py:call_tool() (lines 94-119)
   */
  public async callTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult> {
    if (!this.client) {
      throw new Error('Not connected to a server');
    }

    try {
      // Record tool invocation
      recordMCPLog(
        `Calling tool: ${toolName}`,
        'host_app',
        'execution',
        'info'
      );

      recordMCPLog(
        `Arguments: ${JSON.stringify(args)}`,
        'host_app',
        'execution',
        'debug'
      );

      // Call tool
      const result = await this.client.callTool({
        name: toolName,
        arguments: args,
      });

      // Record result received
      recordMCPLog(
        `Received result from ${toolName}`,
        'host_app',
        'execution',
        'info'
      );

      // Convert SDK result to our MCPToolResult format
      const toolResult: MCPToolResult = {
        content: result.content.map((item) => {
          if (item.type === 'text') {
            return {
              type: 'text',
              text: item.text,
            };
          } else if (item.type === 'image') {
            return {
              type: 'image',
              data: item.data,
              mimeType: item.mimeType || 'image/png',
            };
          } else if (item.type === 'resource') {
            return {
              type: 'resource',
              resource: item.resource,
            };
          }
          // Default to text for unknown types
          return {
            type: 'text',
            text: JSON.stringify(item),
          };
        }),
        isError: result.isError,
      };

      return toolResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      recordMCPLog(
        `Tool call failed: ${errorMessage}`,
        'host_app',
        'execution',
        'error'
      );

      throw error;
    }
  }

  /**
   * Disconnect from the server and clean up resources.
   *
   * Based on Python POC client.py:cleanup() (lines 121-124)
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();

        recordMCPLog(
          'MCP client connection closed',
          'host_app',
          'initialization',
          'info'
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        recordMCPLog(
          `Disconnect error: ${errorMessage}`,
          'host_app',
          'initialization',
          'error'
        );
      }
    }

    this.client = null;
    this.transport = null;
    this.connectionState = { status: 'disconnected' };
  }
}

/**
 * Singleton MCP client instance.
 * Can be used across the application.
 */
export const mcpClient = new MCPClient();
