/**
 * MCP Connect Endpoint (V2 - Global Singleton with Multi-Server Support)
 *
 * POST /api/mcp/connect-v2
 *
 * Connects to MCP server(s) using the global singleton client.
 * Server configuration is loaded from storage.
 *
 * Request body (optional):
 * - serverId: string (connect to specific server, defaults to ALL enabled servers)
 *
 * Improvements over V1 (/api/mcp/connect):
 * - Supports multiple simultaneous server connections
 * - Tools aggregated from all connected servers
 * - Uses global singleton (persistent connections)
 * - Lazy initialization (connects on first use)
 * - Events broadcast via SSE (real-time streaming)
 * - Connections survive across multiple requests
 * - Dynamic server configuration from storage
 */

import { getMCPClient } from '@/lib/mcp/global-client';
import { mcpServerStorage, toMCPServerConfig } from '@/lib/storage/mcp-servers';

export async function POST(request: Request) {
  try {
    const mcpClient = getMCPClient();

    // Check if already connected
    if (mcpClient.isConnected()) {
      const sessionInfo = mcpClient.getSessionInfo();
      return Response.json({
        success: true,
        message: 'Already connected',
        sessionInfo,
        connectionState: mcpClient.getConnectionState(),
      });
    }

    // Parse request body (optional serverId for connecting to single server)
    let serverId: string | undefined;
    try {
      const body = await request.json();
      serverId = body.serverId;
    } catch {
      // No body or invalid JSON - connect to all enabled servers
    }

    // Get server configuration(s) from storage
    if (serverId) {
      // Connect to specific server
      const server = await mcpServerStorage.findById(serverId);
      if (!server) {
        return Response.json(
          {
            success: false,
            error: `Server with ID "${serverId}" not found`,
          },
          { status: 404 }
        );
      }
      if (!server.enabled) {
        return Response.json(
          {
            success: false,
            error: `Server with ID "${serverId}" is disabled`,
          },
          { status: 400 }
        );
      }

      console.log(`[/api/mcp/connect-v2] Connecting to: ${server.name}...`);
      const config = toMCPServerConfig(server);
      await mcpClient.connect(config);

      const sessionInfo = mcpClient.getSessionInfo();
      console.log('[/api/mcp/connect-v2] Connection successful:', sessionInfo);

      return Response.json({
        success: true,
        message: 'Connected successfully',
        serverId: server.id,
        serverName: server.name,
        sessionInfo,
        connectionState: mcpClient.getConnectionState(),
      });
    } else {
      // Connect to ALL enabled servers
      const servers = await mcpServerStorage.findEnabled();
      if (servers.length === 0) {
        return Response.json(
          {
            success: false,
            error: 'No enabled MCP servers found in storage',
          },
          { status: 404 }
        );
      }

      console.log(
        `[/api/mcp/connect-v2] Connecting to ${servers.length} servers: ` +
        `${servers.map(s => s.name).join(', ')}...`
      );
      const configs = servers.map(toMCPServerConfig);
      await mcpClient.connectToMultipleServers(configs);

      const sessionInfo = mcpClient.getSessionInfo();
      console.log('[/api/mcp/connect-v2] All connections successful:', sessionInfo);

      return Response.json({
        success: true,
        message: `Connected to ${servers.length} servers successfully`,
        serverIds: servers.map(s => s.id),
        serverNames: servers.map(s => s.name),
        sessionInfo,
        connectionState: mcpClient.getConnectionState(),
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[/api/mcp/connect-v2] Connection failed:', errorMessage);

    return Response.json(
      {
        success: false,
        error: errorMessage,
        connectionState: getMCPClient().getConnectionState(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Check connection status
 */
export async function GET() {
  const mcpClient = getMCPClient();

  return Response.json({
    success: true,
    sessionInfo: mcpClient.getSessionInfo(),
    connectionState: mcpClient.getConnectionState(),
    isConnected: mcpClient.isConnected(),
  });
}

/**
 * DELETE: Gracefully disconnect
 */
export async function DELETE() {
  try {
    const mcpClient = getMCPClient();

    console.log('[/api/mcp/connect-v2] Disconnecting...');
    await mcpClient.disconnect();

    return Response.json({
      success: true,
      message: 'Disconnected successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[/api/mcp/connect-v2] Disconnect error:', errorMessage);

    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
