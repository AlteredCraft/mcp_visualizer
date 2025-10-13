/**
 * API Route: Call MCP Tool
 *
 * POST /api/mcp/call
 *
 * Executes a tool on the connected MCP server.
 *
 * Request body:
 * {
 *   "toolName": "search_documentation",
 *   "arguments": { "search_phrase": "S3", "limit": 5 }
 * }
 */

import { NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp/client';

export async function POST(request: Request) {
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

    // Parse request body
    const body = await request.json();
    const { toolName, arguments: args } = body;

    if (!toolName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: toolName',
        },
        { status: 400 }
      );
    }

    // Call tool
    const result = await mcpClient.callTool(toolName, args || {});

    return NextResponse.json({
      success: true,
      result,
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
