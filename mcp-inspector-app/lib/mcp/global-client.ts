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
  private client: MCPClient;
  private subscribers: Map<string, EventCallback>;
  private eventBuffer: TimelineEvent[];
  private maxBufferSize = 100;
  private currentSessionId: string;
  private currentSequence = 0;

  constructor() {
    this.client = new MCPClient();
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
   */
  public getConnectionState(): ConnectionState {
    return this.client.getConnectionState();
  }

  /**
   * Check if client is connected.
   */
  public isConnected(): boolean {
    return this.client.isConnected();
  }

  /**
   * Connect to MCP server (lazy initialization).
   *
   * This method is idempotent - calling it multiple times won't create
   * multiple connections. If already connected, it returns immediately.
   */
  public async connect(config: MCPServerConfig): Promise<void> {
    if (this.isConnected()) {
      console.log('[MCPGlobalClient] Already connected, skipping initialization');
      return;
    }

    console.log(
      `[MCPGlobalClient] Connecting to: ${config.command} ${config.args.join(' ')}`
    );

    await this.client.connect(config);

    console.log('[MCPGlobalClient] Connection established');
  }

  /**
   * List available tools from connected server.
   */
  public async listTools(): Promise<MCPTool[]> {
    return await this.client.listTools();
  }

  /**
   * Call a tool on the connected server.
   */
  public async callTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult> {
    return await this.client.callTool(toolName, args);
  }

  /**
   * Disconnect from server and clean up resources.
   *
   * Called by graceful shutdown handlers or manually.
   */
  public async disconnect(): Promise<void> {
    console.log('[MCPGlobalClient] Disconnecting...');

    // Close all SSE subscriptions
    const subscriberCount = this.subscribers.size;
    this.subscribers.clear();
    console.log(`[MCPGlobalClient] Closed ${subscriberCount} SSE subscriptions`);

    // Disconnect MCP client
    await this.client.disconnect();

    console.log('[MCPGlobalClient] Disconnected');
  }

  /**
   * Reconnect after error.
   *
   * Resets session and sequence numbers.
   */
  public async reconnect(config: MCPServerConfig): Promise<void> {
    console.log('[MCPGlobalClient] Reconnecting...');

    // Disconnect first
    await this.disconnect();

    // Reset session
    this.currentSessionId = this.generateSessionId();
    this.currentSequence = 0;

    // Reconnect
    await this.connect(config);
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
  } {
    return {
      sessionId: this.currentSessionId,
      sequence: this.currentSequence,
      subscribers: this.subscribers.size,
      bufferSize: this.eventBuffer.length,
      connected: this.isConnected(),
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
