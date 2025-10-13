/**
 * API Route: Connect to MCP Server
 *
 * POST /api/mcp/connect
 *
 * Connects to the AWS Documentation MCP server and performs
 * the 3-message handshake (initialize → response → initialized).
 */

import { NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp/client';
import { AWS_DOCS_SERVER_CONFIG } from '@/lib/mcp/aws-docs-server';

export async function POST() {
  try {
    // Check if already connected
    if (mcpClient.isConnected()) {
      return NextResponse.json({
        success: true,
        message: 'Already connected',
        connectionState: mcpClient.getConnectionState(),
      });
    }

    // Connect to AWS Documentation server
    await mcpClient.connect(AWS_DOCS_SERVER_CONFIG);

    return NextResponse.json({
      success: true,
      message: 'Connected successfully',
      connectionState: mcpClient.getConnectionState(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        connectionState: mcpClient.getConnectionState(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return current connection status
  return NextResponse.json({
    connectionState: mcpClient.getConnectionState(),
    isConnected: mcpClient.isConnected(),
  });
}

export async function DELETE() {
  // Disconnect from server
  try {
    await mcpClient.disconnect();

    return NextResponse.json({
      success: true,
      message: 'Disconnected successfully',
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
