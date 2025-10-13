/**
 * Workflow Execution API Route
 *
 * Endpoint: POST /api/workflow/execute
 *
 * Executes complete 5-phase MCP workflow:
 * 1. Initialization & Negotiation
 * 2. Discovery & Contextualization
 * 3. Model-Driven Selection (Planning)
 * 4. Execution Round Trip
 * 5. Synthesis & Final Response
 *
 * Events are broadcast via SSE (listen to /api/events/stream).
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeWorkflow, hasAPIKey } from '@/lib/orchestration';

/**
 * POST /api/workflow/execute
 *
 * Request body:
 * {
 *   userMessage: string;
 *   apiKey?: string;  // Optional, uses env var if not provided
 * }
 *
 * Response:
 * {
 *   finalResponse: string;
 *   success: boolean;
 *   error?: string;
 *   metadata: {
 *     toolsUsed: string[];
 *     totalTime: number;
 *     phaseTimings: {...};
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userMessage, apiKey } = body;

    // Validate user message
    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid userMessage' },
        { status: 400 }
      );
    }

    // Check API key availability
    if (!apiKey && !hasAPIKey()) {
      return NextResponse.json(
        {
          error: 'ANTHROPIC_API_KEY not configured. Please set it in .env.local or provide it in the request.'
        },
        { status: 400 }
      );
    }

    console.log('[POST /api/workflow/execute] Starting workflow...');
    console.log('[POST /api/workflow/execute] User message:', userMessage);

    // Execute complete workflow
    const result = await executeWorkflow(userMessage, apiKey);

    console.log('[POST /api/workflow/execute] Workflow complete:', {
      success: result.success,
      toolsUsed: result.metadata.toolsUsed,
      totalTime: result.metadata.totalTime
    });

    // Return result
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[POST /api/workflow/execute] Error:', error);

    return NextResponse.json(
      {
        finalResponse: '',
        success: false,
        error: error.message || 'Unknown error',
        metadata: {
          toolsUsed: [],
          totalTime: 0,
          phaseTimings: {
            initialization: 0,
            discovery: 0,
            selection: 0,
            execution: 0,
            synthesis: 0
          }
        }
      },
      { status: 500 }
    );
  }
}
