/**
 * LLM Integration Module
 *
 * Exports all LLM-related functionality for Claude API integration.
 */

export {
  ClaudeClient,
  createClaudeClient,
  type ClaudeClientConfig,
  type InferenceContext,
  type InferenceResult
} from './claude-client';

export {
  convertMCPToolsToClaudeFormat,
  extractToolCalls,
  extractTextResponse,
  formatToolResultForClaude,
  buildConversationWithResults,
  type ClaudeTool,
  type ClaudeToolUse,
  type ClaudeToolResult
} from './tool-formatter';

export {
  executePlanningInference,
  executeSynthesisInference,
  executeSingleTool
} from './inference';
