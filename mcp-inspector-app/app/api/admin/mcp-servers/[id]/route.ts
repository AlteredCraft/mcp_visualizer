import { NextRequest, NextResponse } from 'next/server';
import { mcpServerStorage } from '@/lib/storage/mcp-servers';

/**
 * GET /api/admin/mcp-servers/[id]
 * Get a single MCP server by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const server = await mcpServerStorage.findById(id);

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    return NextResponse.json({ server }, { status: 200 });
  } catch (error) {
    console.error('[API] Failed to get MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to get server', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/mcp-servers/[id]
 * Update an existing MCP server
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Extract updatable fields
    const { name, description, command, args, env, enabled, metadata } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (command !== undefined) updates.command = command;
    if (args !== undefined) updates.args = args;
    if (env !== undefined) updates.env = env;
    if (enabled !== undefined) updates.enabled = enabled;
    if (metadata !== undefined) updates.metadata = metadata;

    const updatedServer = await mcpServerStorage.update(id, updates);

    return NextResponse.json({ server: updatedServer }, { status: 200 });
  } catch (error) {
    console.error('[API] Failed to update MCP server:', error);
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    return NextResponse.json(
      { error: 'Failed to update server', details: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}

/**
 * DELETE /api/admin/mcp-servers/[id]
 * Delete an MCP server
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await mcpServerStorage.delete(id);

    return NextResponse.json({ message: 'Server deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[API] Failed to delete MCP server:', error);
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    return NextResponse.json(
      { error: 'Failed to delete server', details: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
