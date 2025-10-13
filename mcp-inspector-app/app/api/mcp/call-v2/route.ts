/**
 * MCP Call Tool Endpoint (V2 - Global Singleton)
 *
 * POST /api/mcp/call-v2
 *
 * Executes a tool on the connected MCP server using the global singleton client.
 * This version properly uses the persistent connection from Module 6B.
 *
 * Request body:
 * {
 *   "name": "search_documentation",
 *   "arguments": { "search_phrase": "S3", "limit": 5 }
 * }
 */

import { getMCPClient } from '@/lib/mcp/global-client';

export async function POST(request: Request) {
  try {
    const mcpClient = getMCPClient();

    // Check connection
    if (!mcpClient.isConnected()) {
      return Response.json(
        {
          success: false,
          error: 'Not connected to MCP server. Call POST /api/mcp/connect-v2 first.',
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, arguments: args } = body;

    if (!name) {
      return Response.json(
        {
          success: false,
          error: 'Missing required field: name',
        },
        { status: 400 }
      );
    }

    console.log(`[/api/mcp/call-v2] Calling tool: ${name}`);

    // Call tool via global client
    const result = await mcpClient.callTool(name, args || {});

    console.log(`[/api/mcp/call-v2] Tool call successful: ${name}`);

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[/api/mcp/call-v2] Tool call failed:', errorMessage);

    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
