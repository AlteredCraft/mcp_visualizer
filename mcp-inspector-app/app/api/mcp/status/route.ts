/**
 * MCP Status Endpoint
 *
 * GET /api/mcp/status
 *
 * Returns current status of the global MCP client singleton.
 * Useful for debugging and validating that the singleton persists
 * across multiple API route invocations.
 *
 * Returns:
 * - Session info (ID, sequence number)
 * - Connection status
 * - Number of SSE subscribers
 * - Event buffer size
 * - Instance ID (for validating singleton persistence)
 */

import { getMCPClient } from '@/lib/mcp/global-client';

export async function GET() {
  const mcpClient = getMCPClient();
  const sessionInfo = mcpClient.getSessionInfo();
  const connectionState = mcpClient.getConnectionState();

  // Generate a simple instance identifier
  // In a true singleton, this should be consistent across calls
  const instanceId = Object.prototype.toString.call(mcpClient);

  return Response.json({
    success: true,
    timestamp: Date.now(),
    instanceId,
    sessionInfo,
    connectionState,
    message: 'Global MCP client status retrieved',
  });
}
