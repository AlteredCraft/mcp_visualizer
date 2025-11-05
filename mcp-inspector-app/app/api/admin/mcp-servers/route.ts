import { NextRequest, NextResponse } from 'next/server';
import { mcpServerStorage, MCPServerRecord } from '@/lib/storage/mcp-servers';

/**
 * GET /api/admin/mcp-servers
 * List all MCP servers
 */
export async function GET() {
  try {
    const servers = await mcpServerStorage.readAll();
    return NextResponse.json({ servers }, { status: 200 });
  } catch (error) {
    console.error('[API] Failed to list MCP servers:', error);
    return NextResponse.json(
      { error: 'Failed to list servers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/mcp-servers
 * Create a new MCP server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { id, name, description, command, args, env, enabled, metadata } = body;

    if (!id || !name || !command || !args) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, command, args' },
        { status: 400 }
      );
    }

    // Create server record
    const newServer = await mcpServerStorage.create({
      id,
      name,
      description: description || '',
      command,
      args: Array.isArray(args) ? args : [],
      env: env || {},
      enabled: enabled !== undefined ? enabled : true,
      metadata: metadata || {},
    });

    return NextResponse.json({ server: newServer }, { status: 201 });
  } catch (error) {
    console.error('[API] Failed to create MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to create server', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
