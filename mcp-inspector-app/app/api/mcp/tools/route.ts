/**
 * API Route: List MCP Tools
 *
 * GET /api/mcp/tools
 *
 * Discovers available tools from the connected MCP server.
 */

import { NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp/client';

export async function GET() {
  try {
    // Check connection
    if (!mcpClient.isConnected()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not connected to MCP server. Call POST /api/mcp/connect first.',
        },
        { status: 400 }
      );
    }

    // List tools
    const tools = await mcpClient.listTools();

    return NextResponse.json({
      success: true,
      tools,
      count: tools.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
