/**
 * MCP Connect Endpoint (V2 - Global Singleton)
 *
 * POST /api/mcp/connect-v2
 *
 * Connects to an MCP server using the global singleton client.
 * Server configuration is loaded from storage.
 *
 * Request body (optional):
 * - serverId: string (defaults to first enabled server)
 *
 * Improvements over V1 (/api/mcp/connect):
 * - Uses global singleton (persistent connection)
 * - Lazy initialization (connects on first use)
 * - Events broadcast via SSE (real-time streaming)
 * - Connection survives across multiple requests
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

    // Parse request body (optional serverId)
    let serverId: string | undefined;
    try {
      const body = await request.json();
      serverId = body.serverId;
    } catch {
      // No body or invalid JSON - use default server
    }

    // Get server configuration from storage
    let server;
    if (serverId) {
      server = await mcpServerStorage.findById(serverId);
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
    } else {
      // Use first enabled server
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
      server = servers[0];
    }

    // Connect (lazy initialization)
    console.log(`[/api/mcp/connect-v2] Initiating connection to: ${server.name}...`);
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
