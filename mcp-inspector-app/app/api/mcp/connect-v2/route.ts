/**
 * MCP Connect Endpoint (V2 - Global Singleton)
 *
 * POST /api/mcp/connect-v2
 *
 * Connects to the AWS Documentation MCP server using the global singleton client.
 * This version properly maintains connection state across multiple API requests.
 *
 * Improvements over V1 (/api/mcp/connect):
 * - Uses global singleton (persistent connection)
 * - Lazy initialization (connects on first use)
 * - Events broadcast via SSE (real-time streaming)
 * - Connection survives across multiple requests
 */

import { getMCPClient } from '@/lib/mcp/global-client';
import { AWS_DOCS_SERVER_CONFIG } from '@/lib/mcp/aws-docs-server';

export async function POST() {
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

    // Connect (lazy initialization)
    console.log('[/api/mcp/connect-v2] Initiating connection...');
    await mcpClient.connect(AWS_DOCS_SERVER_CONFIG);

    const sessionInfo = mcpClient.getSessionInfo();
    console.log('[/api/mcp/connect-v2] Connection successful:', sessionInfo);

    return Response.json({
      success: true,
      message: 'Connected successfully',
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
