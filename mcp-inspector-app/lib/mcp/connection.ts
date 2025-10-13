/**
 * MCP Connection Lifecycle Management
 *
 * Higher-level API for managing MCP server connections.
 * Provides auto-connect, retry logic, and connection state management.
 */

import { mcpClient } from './client';
import { AWS_DOCS_SERVER_CONFIG } from './aws-docs-server';
import type { MCPServerConfig, MCPTool, ConnectionState } from '@/types/mcp';

/**
 * Connection manager for MCP servers.
 *
 * Provides simplified connection lifecycle management:
 * - Auto-connect on initialization
 * - Connection state tracking
 * - Error handling and recovery
 */
export class ConnectionManager {
  private autoConnectAttempted = false;

  /**
   * Get current connection state.
   */
  public getConnectionState(): ConnectionState {
    return mcpClient.getConnectionState();
  }

  /**
   * Check if connected.
   */
  public isConnected(): boolean {
    return mcpClient.isConnected();
  }

  /**
   * Connect to AWS Documentation MCP server.
   *
   * This is the primary connection method used by the app.
   * Auto-connects to AWS docs server on first call.
   */
  public async connectToAWSDocsServer(): Promise<void> {
    if (mcpClient.isConnected()) {
      console.log('[ConnectionManager] Already connected');
      return;
    }

    console.log('[ConnectionManager] Connecting to AWS Documentation MCP server...');

    try {
      await mcpClient.connect(AWS_DOCS_SERVER_CONFIG);
      console.log('[ConnectionManager] Connected successfully');
    } catch (error) {
      console.error('[ConnectionManager] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect to a custom MCP server.
   */
  public async connectToServer(config: MCPServerConfig): Promise<void> {
    if (mcpClient.isConnected()) {
      console.log('[ConnectionManager] Disconnecting existing connection...');
      await mcpClient.disconnect();
    }

    console.log('[ConnectionManager] Connecting to custom server...');

    try {
      await mcpClient.connect(config);
      console.log('[ConnectionManager] Connected successfully');
    } catch (error) {
      console.error('[ConnectionManager] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from current server.
   */
  public async disconnect(): Promise<void> {
    if (!mcpClient.isConnected()) {
      console.log('[ConnectionManager] Already disconnected');
      return;
    }

    console.log('[ConnectionManager] Disconnecting...');

    try {
      await mcpClient.disconnect();
      console.log('[ConnectionManager] Disconnected successfully');
    } catch (error) {
      console.error('[ConnectionManager] Disconnect error:', error);
      throw error;
    }
  }

  /**
   * List tools from connected server.
   */
  public async listTools(): Promise<MCPTool[]> {
    if (!mcpClient.isConnected()) {
      throw new Error('Not connected to a server. Call connectToAWSDocsServer() first.');
    }

    return await mcpClient.listTools();
  }

  /**
   * Call a tool on the connected server.
   */
  public async callTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    if (!mcpClient.isConnected()) {
      throw new Error('Not connected to a server. Call connectToAWSDocsServer() first.');
    }

    return await mcpClient.callTool(toolName, args);
  }

  /**
   * Auto-connect to AWS Documentation server on first use.
   *
   * This is called automatically when the app initializes.
   * Safe to call multiple times - only connects once.
   */
  public async autoConnect(): Promise<void> {
    if (this.autoConnectAttempted) {
      return;
    }

    this.autoConnectAttempted = true;

    try {
      await this.connectToAWSDocsServer();
    } catch (error) {
      console.error('[ConnectionManager] Auto-connect failed:', error);
      // Don't throw - allow app to continue even if auto-connect fails
    }
  }
}

/**
 * Singleton connection manager instance.
 */
export const connectionManager = new ConnectionManager();
