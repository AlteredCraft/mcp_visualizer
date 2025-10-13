/**
 * MCP Integration Layer - Module 6
 *
 * Central export point for all MCP-related functionality.
 */

export { MCPClient, mcpClient } from './client';
export { ConnectionManager, connectionManager } from './connection';
export {
  recordProtocolMessage,
  recordMCPLog,
  recordInternalOperation,
  getPhaseForMethod,
} from './message-handlers';
export { AWS_DOCS_SERVER_CONFIG, AWS_DOCS_SERVER_INFO } from './aws-docs-server';
