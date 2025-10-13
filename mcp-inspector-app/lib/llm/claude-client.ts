/**
 * Claude API Client
 *
 * Provides two-phase inference pattern:
 * 1. Planning inference - LLM selects tools to use
 * 2. Synthesis inference - LLM generates final response with tool results
 *
 * Based on: POC claude_client.py
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  ClaudeTool,
  ClaudeToolUse,
  ClaudeToolResult
} from './tool-formatter';
import {
  extractToolCalls,
  extractTextResponse,
  buildConversationWithResults
} from './tool-formatter';

/**
 * Claude client configuration
 */
export interface ClaudeClientConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

/**
 * Inference context for event recording
 */
export interface InferenceContext {
  phase: 'planning' | 'synthesis';
  userMessage: string;
  tools: ClaudeTool[];
}

/**
 * Inference result
 */
export interface InferenceResult {
  message: Anthropic.Message;
  toolCalls: ClaudeToolUse[];
  textResponse: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Claude API Client
 *
 * Handles communication with Claude API for two-phase inference.
 */
export class ClaudeClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(config: ClaudeClientConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.maxTokens = config.maxTokens || 1024;
  }

  /**
   * First inference: Planning (tool selection)
   *
   * LLM analyzes user query and selects which tools to use.
   * Returns tool_use blocks if tools are needed, or text response if not.
   *
   * @param userMessage - User's query
   * @param tools - Available tools (Claude format)
   * @returns Inference result with tool calls or text
   */
  async planningInference(
    userMessage: string,
    tools: ClaudeTool[]
  ): Promise<InferenceResult> {
    const startTime = Date.now();

    console.log('[ClaudeClient] Planning inference started');
    console.log(`[ClaudeClient] User message: "${userMessage}"`);
    console.log(`[ClaudeClient] Available tools: ${tools.length}`);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      messages: [{ role: 'user', content: userMessage }],
      tools,
    });

    const processingTime = Date.now() - startTime;

    console.log(`[ClaudeClient] Planning inference completed in ${processingTime}ms`);
    console.log(`[ClaudeClient] Stop reason: ${response.stop_reason}`);
    console.log(`[ClaudeClient] Content blocks: ${response.content.length}`);

    // Extract tool calls and text
    const toolCalls = extractToolCalls(response.content);
    const textResponse = extractTextResponse(response.content);

    console.log(`[ClaudeClient] Tool calls: ${toolCalls.length}`);
    if (toolCalls.length > 0) {
      toolCalls.forEach((tc, i) => {
        console.log(`[ClaudeClient]   ${i + 1}. ${tc.name}`);
      });
    }

    return {
      message: response,
      toolCalls,
      textResponse,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      }
    };
  }

  /**
   * Second inference: Synthesis (final response)
   *
   * LLM generates natural language response using tool results.
   * Requires conversation history with tool_use and tool_result blocks.
   *
   * @param userMessage - Original user query
   * @param planningContent - Content from planning response (includes tool_use)
   * @param toolResults - Results from tool executions
   * @param tools - Available tools (same as planning)
   * @returns Inference result with final text response
   */
  async synthesisInference(
    userMessage: string,
    planningContent: any[],
    toolResults: ClaudeToolResult[],
    tools: ClaudeTool[]
  ): Promise<InferenceResult> {
    const startTime = Date.now();

    console.log('[ClaudeClient] Synthesis inference started');
    console.log(`[ClaudeClient] Tool results: ${toolResults.length}`);

    // Build conversation history
    const messages = buildConversationWithResults(
      userMessage,
      planningContent,
      toolResults
    );

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      messages,
      tools,
    });

    const processingTime = Date.now() - startTime;

    console.log(`[ClaudeClient] Synthesis inference completed in ${processingTime}ms`);
    console.log(`[ClaudeClient] Stop reason: ${response.stop_reason}`);
    console.log(`[ClaudeClient] Content blocks: ${response.content.length}`);

    // Extract text (should not have tool_use blocks in synthesis)
    const textResponse = extractTextResponse(response.content);
    const toolCalls = extractToolCalls(response.content); // Should be empty

    if (toolCalls.length > 0) {
      console.warn(`[ClaudeClient] WARNING: Synthesis returned tool calls (unexpected)`);
    }

    return {
      message: response,
      toolCalls,
      textResponse,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      }
    };
  }

  /**
   * Get current model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get max tokens setting
   */
  getMaxTokens(): number {
    return this.maxTokens;
  }
}

/**
 * Create Claude client instance with environment configuration
 */
export function createClaudeClient(apiKey?: string): ClaudeClient {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;

  if (!key) {
    throw new Error(
      'ANTHROPIC_API_KEY not found. Set it in .env.local or pass to createClaudeClient()'
    );
  }

  return new ClaudeClient({
    apiKey: key,
    model: 'claude-sonnet-4-20250514',
    maxTokens: 1024,
  });
}
