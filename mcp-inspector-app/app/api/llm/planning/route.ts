/**
 * API Route: Planning Inference
 *
 * Executes the first LLM inference (planning phase) where Claude
 * analyzes the user query and selects which tools to use.
 *
 * POST /api/llm/planning
 * Body: { userMessage: string, tools: ClaudeTool[] }
 * Returns: { toolCalls: ClaudeToolUse[], textResponse: string, usage: {...} }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClaudeClient } from '@/lib/llm/claude-client';
import { getMCPClient } from '@/lib/mcp/global-client';
import { executePlanningInference } from '@/lib/llm/inference';
import type { ClaudeTool } from '@/lib/llm/tool-formatter';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[/api/llm/planning] Planning inference request received');

  try {
    // Parse request body
    const body = await request.json();
    const { userMessage, tools } = body as {
      userMessage: string;
      tools: ClaudeTool[];
    };

    // Validate inputs
    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json(
        { error: 'userMessage is required and must be a string' },
        { status: 400 }
      );
    }

    if (!Array.isArray(tools)) {
      return NextResponse.json(
        { error: 'tools is required and must be an array' },
        { status: 400 }
      );
    }

    console.log(`[/api/llm/planning] User message: "${userMessage}"`);
    console.log(`[/api/llm/planning] Tools: ${tools.length}`);

    // Get clients
    const claudeClient = createClaudeClient();
    const mcpClient = getMCPClient();

    // Execute planning inference with event recording
    const result = await executePlanningInference(
      claudeClient,
      mcpClient,
      userMessage,
      tools
    );

    const totalTime = Date.now() - startTime;
    console.log(`[/api/llm/planning] Planning inference completed in ${totalTime}ms`);
    console.log(`[/api/llm/planning] Tool calls: ${result.toolCalls.length}`);
    console.log(`[/api/llm/planning] Stop reason: ${result.message.stop_reason}`);

    // Return result
    return NextResponse.json({
      toolCalls: result.toolCalls,
      textResponse: result.textResponse,
      usage: result.usage,
      stopReason: result.message.stop_reason,
      planningContent: result.message.content, // Needed for synthesis
    }, { status: 200 });

  } catch (error) {
    console.error('[/api/llm/planning] Error:', error);

    return NextResponse.json(
      {
        error: 'Planning inference failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
