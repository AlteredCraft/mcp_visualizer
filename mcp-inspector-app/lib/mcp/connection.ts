/**
 * MCP Connection Lifecycle Management
 *
 * Higher-level API for managing MCP server connections.
 * Provides auto-connect, retry logic, and connection state management.
 */

import { mcpClient } from './client';
import { mcpServerStorage, toMCPServerConfig } from '@/lib/storage/mcp-servers';
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
   * Connect to MCP server by ID.
   *
   * Loads server configuration from storage and establishes connection.
   * @param serverId - The ID of the server to connect to
   */
  public async connectToServerById(serverId: string): Promise<void> {
    if (mcpClient.isConnected()) {
      console.log('[ConnectionManager] Already connected');
      return;
    }

    console.log(`[ConnectionManager] Connecting to MCP server: ${serverId}...`);

    try {
      const server = await mcpServerStorage.findById(serverId);

      if (!server) {
        throw new Error(`Server with ID "${serverId}" not found`);
      }

      if (!server.enabled) {
        throw new Error(`Server with ID "${serverId}" is disabled`);
      }

      const config = toMCPServerConfig(server);
      await mcpClient.connect(config);
      console.log('[ConnectionManager] Connected successfully');
    } catch (error) {
      console.error('[ConnectionManager] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect to the default MCP server.
   *
   * Connects to the first enabled server in storage.
   * This is the primary connection method used by the app.
   */
  public async connectToDefaultServer(): Promise<void> {
    if (mcpClient.isConnected()) {
      console.log('[ConnectionManager] Already connected');
      return;
    }

    console.log('[ConnectionManager] Connecting to default MCP server...');

    try {
      const servers = await mcpServerStorage.findEnabled();

      if (servers.length === 0) {
        throw new Error('No enabled MCP servers found in storage');
      }

      const defaultServer = servers[0];
      const config = toMCPServerConfig(defaultServer);

      console.log(`[ConnectionManager] Using server: ${defaultServer.name}`);
      await mcpClient.connect(config);
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
      throw new Error('Not connected to a server. Call connectToDefaultServer() or connectToServerById() first.');
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
      throw new Error('Not connected to a server. Call connectToDefaultServer() or connectToServerById() first.');
    }

    return await mcpClient.callTool(toolName, args);
  }

  /**
   * Auto-connect to default MCP server on first use.
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
      await this.connectToDefaultServer();
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
