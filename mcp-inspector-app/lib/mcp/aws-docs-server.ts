/**
 * AWS Documentation MCP Server Configuration
 *
 * Configuration for the official AWS Documentation MCP server.
 * Documentation: https://awslabs.github.io/mcp/servers/aws-documentation-mcp-server
 *
 * Available Tools:
 * - search_documentation(search_phrase: string, limit?: number)
 * - read_documentation(url: string)
 * - recommend(url: string)
 */

import { MCPServerConfig } from '@/types/mcp';

/**
 * AWS Documentation MCP Server configuration.
 *
 * Uses uvx to run the AWS Labs MCP server package.
 * No API keys required - uses public AWS documentation.
 */
export const AWS_DOCS_SERVER_CONFIG: MCPServerConfig = {
  command: 'uvx',
  args: ['awslabs.aws-documentation-mcp-server@latest'],
  env: {
    // Set log level to ERROR to reduce noise in stderr
    FASTMCP_LOG_LEVEL: 'ERROR',

    // Use 'aws' partition (global AWS documentation)
    AWS_DOCUMENTATION_PARTITION: 'aws',
  },
};

/**
 * Server metadata for display purposes.
 */
export const AWS_DOCS_SERVER_INFO = {
  name: 'AWS Documentation',
  description: 'Search and retrieve AWS service documentation',
  expectedTools: [
    {
      name: 'search_documentation',
      description: 'Search AWS documentation by phrase',
      requiredParams: ['search_phrase'],
      optionalParams: ['limit'],
    },
    {
      name: 'read_documentation',
      description: 'Read specific AWS documentation page',
      requiredParams: ['url'],
    },
    {
      name: 'recommend',
      description: 'Get related documentation recommendations',
      requiredParams: ['url'],
    },
  ],
};
