/**
 * Global MCP Client Singleton
 *
 * Provides a persistent, stateful MCP connection that survives across
 * multiple API route invocations. Uses globalThis to maintain singleton
 * across Next.js server context.
 *
 * Key Features:
 * - Lazy initialization (connects on first use)
 * - Event broadcasting to SSE subscribers
 * - Graceful shutdown handlers (SIGTERM/SIGINT)
 * - Automatic reconnection on errors
 * - Event buffer for late-joining clients
 *
 * Research validated: This pattern works in next dev, next start, and Vercel serverless.
 * See: docs/Module 6B Architecture - SSE and Stateful Connections.md
 */

import { MCPClient } from './client';
import type {
  MCPServerConfig,
  MCPTool,
  MCPToolResult,
  ConnectionState,
} from '@/types/mcp';
import type {
  TimelineEvent,
  ConsoleLogEvent,
  ProtocolMessageEvent,
  InternalOperationEvent,
} from '@/types/domain';

/**
 * SSE subscriber callback type.
 */
type EventCallback = (event: TimelineEvent) => void;

/**
 * Global MCP Client with SSE broadcasting capabilities.
 *
 * This class wraps the base MCPClient and adds:
 * - Global singleton pattern (persists across API routes)
 * - Event broadcasting to SSE subscribers
 * - Event buffering for late-joining clients
 * - Lifecycle management (startup, shutdown, cleanup)
 */
export class MCPGlobalClient {
  private clients: Map<string, MCPClient>; // serverId -> MCPClient
  private serverConfigs: Map<string, MCPServerConfig>; // serverId -> config
  private toolToServerMap: Map<string, string>; // toolName -> serverId
  private subscribers: Map<string, EventCallback>;
  private eventBuffer: TimelineEvent[];
  private maxBufferSize = 100;
  private currentSessionId: string;
  private currentSequence = 0;

  constructor() {
    this.clients = new Map();
    this.serverConfigs = new Map();
    this.toolToServerMap = new Map();
    this.subscribers = new Map();
    this.eventBuffer = [];
    this.currentSessionId = this.generateSessionId();

    // Log initialization
    console.log('[MCPGlobalClient] Singleton instance created');
  }

  /**
   * Generate a unique session ID.
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate next sequence number.
   */
  private nextSequence(): number {
    return ++this.currentSequence;
  }

  /**
   * Add event to buffer (FIFO, maintains max size).
   */
  private addToBuffer(event: TimelineEvent): void {
    this.eventBuffer.push(event);

    // Maintain max buffer size
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.shift(); // Remove oldest
    }
  }

  /**
   * Broadcast event to all SSE subscribers.
   */
  private broadcast(event: TimelineEvent): void {
    // Add to buffer first
    this.addToBuffer(event);

    // Notify all subscribers
    for (const [subscriptionId, callback] of this.subscribers.entries()) {
      try {
        callback(event);
      } catch (error) {
        console.error(
          `[MCPGlobalClient] Error broadcasting to subscriber ${subscriptionId}:`,
          error
        );
        // Remove failed subscriber
        this.subscribers.delete(subscriptionId);
      }
    }
  }

  /**
   * Record event and broadcast to SSE clients.
   *
   * This is the central event recording function that replaces direct
   * Zustand store updates. All events flow through here to be broadcast via SSE.
   */
  public recordEvent(
    event:
      | Omit<ConsoleLogEvent, 'sessionId' | 'sequence' | 'timestamp'>
      | Omit<ProtocolMessageEvent, 'sessionId' | 'sequence' | 'timestamp'>
      | Omit<InternalOperationEvent, 'sessionId' | 'sequence' | 'timestamp'>
  ): void {
    const completeEvent: TimelineEvent = {
      sessionId: this.currentSessionId,
      sequence: this.nextSequence(),
      timestamp: Date.now(),
      ...event,
    } as TimelineEvent;

    this.broadcast(completeEvent);
  }

  /**
   * Subscribe to event stream (for SSE clients).
   *
   * @returns Subscription ID for cleanup
   */
  public subscribe(callback: EventCallback): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.subscribers.set(subscriptionId, callback);

    console.log(
      `[MCPGlobalClient] New subscriber: ${subscriptionId} (total: ${this.subscribers.size})`
    );

    return subscriptionId;
  }

  /**
   * Unsubscribe from event stream.
   */
  public unsubscribe(subscriptionId: string): void {
    const removed = this.subscribers.delete(subscriptionId);
    if (removed) {
      console.log(
        `[MCPGlobalClient] Removed subscriber: ${subscriptionId} (remaining: ${this.subscribers.size})`
      );
    }
  }

  /**
   * Get buffered events (for late-joining SSE clients).
   */
  public getEventBuffer(): TimelineEvent[] {
    return [...this.eventBuffer];
  }

  /**
   * Get current connection state.
   * Returns the state of the first connected server, or disconnected if none.
   */
  public getConnectionState(): ConnectionState {
    for (const client of this.clients.values()) {
      const state = client.getConnectionState();
      if (state.status === 'connected') {
        return state;
      }
    }
    return { status: 'disconnected' };
  }

  /**
   * Check if any client is connected.
   */
  public isConnected(): boolean {
    for (const client of this.clients.values()) {
      if (client.isConnected()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get connection states for all servers.
   */
  public getAllConnectionStates(): Map<string, ConnectionState> {
    const states = new Map<string, ConnectionState>();
    for (const [serverId, client] of this.clients.entries()) {
      states.set(serverId, client.getConnectionState());
    }
    return states;
  }

  /**
   * Connect to a single MCP server.
   *
   * This method is idempotent - calling it multiple times for the same server
   * won't create multiple connections.
   */
  public async connect(config: MCPServerConfig): Promise<void> {
    const serverId = config.id || 'default';

    // Check if already connected to this server
    if (this.clients.has(serverId)) {
      console.log(`[MCPGlobalClient] Already connected to ${serverId}, skipping`);
      return;
    }

    console.log(
      `[MCPGlobalClient] Connecting to ${serverId}: ${config.command} ${config.args.join(' ')}`
    );

    const client = new MCPClient();
    await client.connect(config);

    this.clients.set(serverId, client);
    this.serverConfigs.set(serverId, config);

    console.log(`[MCPGlobalClient] Connected to ${serverId}`);
  }

  /**
   * Connect to multiple MCP servers in parallel.
   *
   * This is more efficient than calling connect() multiple times sequentially.
   */
  public async connectToMultipleServers(configs: MCPServerConfig[]): Promise<void> {
    console.log(`[MCPGlobalClient] Connecting to ${configs.length} servers...`);

    const connectionPromises = configs.map(async (config) => {
      try {
        await this.connect(config);
      } catch (error) {
        console.error(
          `[MCPGlobalClient] Failed to connect to ${config.id || config.command}:`,
          error
        );
        // Continue with other connections even if one fails
      }
    });

    await Promise.all(connectionPromises);

    const connectedCount = this.clients.size;
    console.log(`[MCPGlobalClient] Connected to ${connectedCount}/${configs.length} servers`);
  }

  /**
   * List available tools from all connected servers.
   *
   * Tools are aggregated from all servers and tagged with their source server.
   */
  public async listTools(): Promise<MCPTool[]> {
    const allTools: MCPTool[] = [];

    for (const [serverId, client] of this.clients.entries()) {
      try {
        const tools = await client.listTools();
        const serverName = this.serverConfigs.get(serverId)?.name || serverId;

        // Tag each tool with its server and add to mapping
        for (const tool of tools) {
          const taggedTool: MCPTool = {
            ...tool,
            serverId,
            serverName,
          };
          allTools.push(taggedTool);

          // Build tool-to-server mapping for routing
          this.toolToServerMap.set(tool.name, serverId);
        }
      } catch (error) {
        console.error(
          `[MCPGlobalClient] Failed to list tools from ${serverId}:`,
          error
        );
        // Continue with other servers even if one fails
      }
    }

    return allTools;
  }

  /**
   * Call a tool on the appropriate connected server.
   *
   * Uses the tool-to-server mapping to route the call to the correct server.
   */
  public async callTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult> {
    // Find which server has this tool
    const serverId = this.toolToServerMap.get(toolName);

    if (!serverId) {
      throw new Error(
        `Tool "${toolName}" not found in any connected server. ` +
        `Available tools: ${Array.from(this.toolToServerMap.keys()).join(', ')}`
      );
    }

    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(
        `Server "${serverId}" not connected (expected to have tool "${toolName}")`
      );
    }

    return await client.callTool(toolName, args);
  }

  /**
   * Disconnect from all servers and clean up resources.
   *
   * Called by graceful shutdown handlers or manually.
   * Optionally clears session state (event buffer, session ID, sequence).
   */
  public async disconnect(clearSession = false): Promise<void> {
    console.log('[MCPGlobalClient] Disconnecting from all servers...');

    // Close all SSE subscriptions
    const subscriberCount = this.subscribers.size;
    this.subscribers.clear();
    console.log(`[MCPGlobalClient] Closed ${subscriberCount} SSE subscriptions`);

    // Disconnect all MCP clients
    const disconnectPromises = Array.from(this.clients.entries()).map(
      async ([serverId, client]) => {
        try {
          await client.disconnect();
          console.log(`[MCPGlobalClient] Disconnected from ${serverId}`);
        } catch (error) {
          console.error(`[MCPGlobalClient] Error disconnecting ${serverId}:`, error);
        }
      }
    );

    await Promise.all(disconnectPromises);

    // Clear all maps
    this.clients.clear();
    this.serverConfigs.clear();
    this.toolToServerMap.clear();

    // Optionally clear session state for fresh start
    if (clearSession) {
      this.eventBuffer = [];
      this.currentSessionId = this.generateSessionId();
      this.currentSequence = 0;
      console.log('[MCPGlobalClient] Session state cleared, new session:', this.currentSessionId);
    }

    console.log('[MCPGlobalClient] All servers disconnected');
  }

  /**
   * Reconnect to all servers after error.
   *
   * Resets session and sequence numbers.
   */
  public async reconnect(configs: MCPServerConfig[]): Promise<void> {
    console.log('[MCPGlobalClient] Reconnecting to all servers...');

    // Disconnect first
    await this.disconnect();

    // Reset session
    this.currentSessionId = this.generateSessionId();
    this.currentSequence = 0;

    // Reconnect to all servers
    await this.connectToMultipleServers(configs);
  }

  /**
   * Get current session info (for debugging).
   */
  public getSessionInfo(): {
    sessionId: string;
    sequence: number;
    subscribers: number;
    bufferSize: number;
    connected: boolean;
    connectedServers: string[];
    totalTools: number;
  } {
    return {
      sessionId: this.currentSessionId,
      sequence: this.currentSequence,
      subscribers: this.subscribers.size,
      bufferSize: this.eventBuffer.length,
      connected: this.isConnected(),
      connectedServers: Array.from(this.clients.keys()),
      totalTools: this.toolToServerMap.size,
    };
  }
}

/**
 * Global singleton accessor.
 *
 * Uses globalThis to persist singleton across API route invocations.
 * This is a standard pattern in Next.js for database connections, etc.
 *
 * Research validated: Works in next dev, next start, and Vercel serverless.
 */
declare global {
  var mcpClient: MCPGlobalClient | undefined;
}

/**
 * Get or create the global MCP client singleton.
 */
export function getMCPClient(): MCPGlobalClient {
  if (!global.mcpClient) {
    console.log('[getMCPClient] Creating new global MCP client singleton');
    global.mcpClient = new MCPGlobalClient();

    // Register cleanup handlers (one-time setup)
    setupCleanupHandlers(global.mcpClient);
  }

  return global.mcpClient;
}

/**
 * Setup graceful shutdown handlers.
 *
 * Ensures MCP child process is properly terminated on server shutdown.
 */
function setupCleanupHandlers(client: MCPGlobalClient): void {
  let cleanupInProgress = false;

  const cleanup = async (signal: string) => {
    if (cleanupInProgress) {
      console.log(`[Cleanup] Already in progress, ignoring ${signal}`);
      return;
    }

    cleanupInProgress = true;
    console.log(`[Cleanup] Received ${signal}, shutting down MCP client...`);

    try {
      await client.disconnect();
      console.log('[Cleanup] MCP client shutdown complete');
    } catch (error) {
      console.error('[Cleanup] Error during shutdown:', error);
    }

    process.exit(0);
  };

  // Handle SIGTERM (graceful shutdown request from OS)
  process.on('SIGTERM', () => cleanup('SIGTERM'));

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => cleanup('SIGINT'));

  // Handle process exit
  process.on('beforeExit', () => {
    if (!cleanupInProgress) {
      cleanup('beforeExit');
    }
  });

  console.log('[getMCPClient] Cleanup handlers registered');
}

/**
 * Helper function to get session info (for debugging/monitoring).
 */
export function getSessionInfo() {
  const client = getMCPClient();
  return client.getSessionInfo();
}
