/**
 * MCP Tools Endpoint (V2 - Global Singleton)
 *
 * GET /api/mcp/tools-v2
 *
 * List available tools from the connected MCP server using the global singleton.
 * This version properly maintains connection state, so tool discovery will work
 * after calling /api/mcp/connect-v2.
 *
 * Improvements over V1 (/api/mcp/tools):
 * - Uses global singleton (connection persists)
 * - Actually works (V1 failed with "not connected" error)
 * - Events broadcast via SSE
 */

import { getMCPClient } from '@/lib/mcp/global-client';

export async function GET() {
  try {
    const mcpClient = getMCPClient();

    // Check connection
    if (!mcpClient.isConnected()) {
      return Response.json(
        {
          success: false,
          error:
            'Not connected to MCP server. Call POST /api/mcp/connect-v2 first.',
          sessionInfo: mcpClient.getSessionInfo(),
        },
        { status: 400 }
      );
    }

    // List tools
    console.log('[/api/mcp/tools-v2] Discovering tools...');
    const tools = await mcpClient.listTools();
    console.log(`[/api/mcp/tools-v2] Discovered ${tools.length} tools`);

    return Response.json({
      success: true,
      tools,
      count: tools.length,
      sessionInfo: mcpClient.getSessionInfo(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[/api/mcp/tools-v2] Error:', errorMessage);

    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
