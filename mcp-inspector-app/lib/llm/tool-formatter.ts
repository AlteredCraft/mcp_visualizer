/**
 * Tool Schema Formatter
 *
 * Converts MCP tool schemas to Claude API format.
 * Key difference: inputSchema → input_schema (field rename)
 *
 * Based on: POC claude_client.py
 */

import type { Tool as MCPTool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Claude API tool format
 */
export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: object;
}

/**
 * Claude API tool use block
 */
export interface ClaudeToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: object;
}

/**
 * Claude API tool result block
 */
export interface ClaudeToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

/**
 * Convert MCP tool schemas to Claude API format.
 *
 * The only change required is renaming inputSchema → input_schema.
 * Everything else (JSON Schema structure) remains identical.
 *
 * @param mcpTools - Tools from MCP server (tools/list response)
 * @returns Tools formatted for Claude API
 */
export function convertMCPToolsToClaudeFormat(mcpTools: MCPTool[]): ClaudeTool[] {
  return mcpTools.map(tool => ({
    name: tool.name,
    description: tool.description || '',
    input_schema: tool.inputSchema, // Key transformation: inputSchema → input_schema
  }));
}

/**
 * Extract tool use blocks from Claude response.
 *
 * @param content - Content blocks from Claude message response
 * @returns Tool use blocks only
 */
export function extractToolCalls(content: any[]): ClaudeToolUse[] {
  return content
    .filter(block => block.type === 'tool_use')
    .map(block => ({
      type: 'tool_use' as const,
      id: block.id,
      name: block.name,
      input: block.input,
    }));
}

/**
 * Extract text response from Claude message.
 *
 * @param content - Content blocks from Claude message response
 * @returns Concatenated text from all text blocks
 */
export function extractTextResponse(content: any[]): string {
  return content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');
}

/**
 * Format MCP tool result for Claude.
 *
 * Converts MCP's structured content array to Claude's string format.
 *
 * @param toolUseId - ID from ClaudeToolUse (for correlation)
 * @param mcpResult - Result from MCP tools/call
 * @returns Formatted tool result for Claude
 */
export function formatToolResultForClaude(
  toolUseId: string,
  mcpResult: any
): ClaudeToolResult {
  // Extract text content from MCP result
  let content: string;

  if (mcpResult.content && Array.isArray(mcpResult.content)) {
    // MCP returns content as array of blocks
    content = mcpResult.content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('\n');
  } else if (typeof mcpResult.content === 'string') {
    content = mcpResult.content;
  } else {
    // Fallback: stringify the entire result
    content = JSON.stringify(mcpResult);
  }

  return {
    type: 'tool_result',
    tool_use_id: toolUseId,
    content: content || 'No content returned',
    is_error: mcpResult.isError || false,
  };
}

/**
 * Build conversation history for synthesis inference.
 *
 * Claude API requires alternating user/assistant messages.
 * Pattern: user → assistant (tool_use) → user (tool_result)
 *
 * @param userMessage - Original user query
 * @param planningContent - Content from planning response (includes tool_use blocks)
 * @param toolResults - Results from tool executions
 * @returns Message array for Claude API
 */
export function buildConversationWithResults(
  userMessage: string,
  planningContent: any[],
  toolResults: ClaudeToolResult[]
): any[] {
  return [
    // User's original query
    { role: 'user', content: userMessage },

    // Assistant's tool selection (from planning response)
    {
      role: 'assistant',
      content: planningContent
    },

    // Tool results (as user message)
    {
      role: 'user',
      content: toolResults
    }
  ];
}
