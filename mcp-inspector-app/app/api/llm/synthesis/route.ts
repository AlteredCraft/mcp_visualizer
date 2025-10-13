/**
 * API Route: Synthesis Inference
 *
 * Executes the second LLM inference (synthesis phase) where Claude
 * generates the final natural language response using tool results.
 *
 * POST /api/llm/synthesis
 * Body: {
 *   userMessage: string,
 *   planningContent: any[],
 *   toolResults: ClaudeToolResult[],
 *   tools: ClaudeTool[]
 * }
 * Returns: { textResponse: string, usage: {...} }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClaudeClient } from '@/lib/llm/claude-client';
import { getMCPClient } from '@/lib/mcp/global-client';
import { executeSynthesisInference } from '@/lib/llm/inference';
import type { ClaudeTool, ClaudeToolResult } from '@/lib/llm/tool-formatter';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[/api/llm/synthesis] Synthesis inference request received');

  try {
    // Parse request body
    const body = await request.json();
    const { userMessage, planningContent, toolResults, tools } = body as {
      userMessage: string;
      planningContent: any[];
      toolResults: ClaudeToolResult[];
      tools: ClaudeTool[];
    };

    // Validate inputs
    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json(
        { error: 'userMessage is required and must be a string' },
        { status: 400 }
      );
    }

    if (!Array.isArray(planningContent)) {
      return NextResponse.json(
        { error: 'planningContent is required and must be an array' },
        { status: 400 }
      );
    }

    if (!Array.isArray(toolResults)) {
      return NextResponse.json(
        { error: 'toolResults is required and must be an array' },
        { status: 400 }
      );
    }

    if (!Array.isArray(tools)) {
      return NextResponse.json(
        { error: 'tools is required and must be an array' },
        { status: 400 }
      );
    }

    console.log(`[/api/llm/synthesis] User message: "${userMessage}"`);
    console.log(`[/api/llm/synthesis] Tool results: ${toolResults.length}`);
    console.log(`[/api/llm/synthesis] Tools: ${tools.length}`);

    // Get clients
    const claudeClient = createClaudeClient();
    const mcpClient = getMCPClient();

    // Execute synthesis inference with event recording
    const result = await executeSynthesisInference(
      claudeClient,
      mcpClient,
      userMessage,
      planningContent,
      toolResults,
      tools
    );

    const totalTime = Date.now() - startTime;
    console.log(`[/api/llm/synthesis] Synthesis inference completed in ${totalTime}ms`);
    console.log(`[/api/llm/synthesis] Stop reason: ${result.message.stop_reason}`);
    console.log(`[/api/llm/synthesis] Text response length: ${result.textResponse.length} chars`);

    // Return result
    return NextResponse.json({
      textResponse: result.textResponse,
      usage: result.usage,
      stopReason: result.message.stop_reason,
    }, { status: 200 });

  } catch (error) {
    console.error('[/api/llm/synthesis] Error:', error);

    return NextResponse.json(
      {
        error: 'Synthesis inference failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
