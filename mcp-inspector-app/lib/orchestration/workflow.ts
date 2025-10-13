/**
 * Complete 5-Phase MCP Workflow Orchestrator
 *
 * Implements the validated POC pattern from orchestrator.py:
 * 1. Initialization & Negotiation
 * 2. Discovery & Contextualization
 * 3. Model-Driven Selection (Planning Inference)
 * 4. Execution Round Trip
 * 5. Synthesis & Final Response
 *
 * Based on: mcp_visualizer/poc/orchestrator.py
 */

import { getMCPClient } from '../mcp/global-client';
import { createClaudeClient } from '../llm/claude-client';
import {
  convertMCPToolsToClaudeFormat,
  extractToolCalls,
  extractTextResponse,
  formatToolResultForClaude,
  type ClaudeToolUse,
  type ClaudeToolResult
} from '../llm/tool-formatter';
import {
  executePlanningInference,
  executeSynthesisInference,
  executeSingleTool
} from '../llm/inference';
import { AWS_DOCS_SERVER_CONFIG } from '../mcp/aws-docs-server';
import type { MCPTool } from '@/types/mcp';

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  finalResponse: string;
  success: boolean;
  error?: string;
  metadata: {
    toolsUsed: string[];
    totalTime: number;
    phaseTimings: {
      initialization: number;
      discovery: number;
      selection: number;
      execution: number;
      synthesis: number;
    };
  };
}

/**
 * Execute complete 5-phase MCP workflow.
 *
 * This function mirrors the Python POC orchestrator pattern and orchestrates
 * all communication between Host App, LLM, and MCP Server.
 *
 * Key principle: LLM never directly communicates with MCP Server.
 * Host App orchestrates everything.
 *
 * @param userMessage - User's query
 * @param apiKey - Optional Anthropic API key (uses env var if not provided)
 * @returns Workflow result with final response
 */
export async function executeWorkflow(
  userMessage: string,
  apiKey?: string
): Promise<WorkflowResult> {
  const startTime = Date.now();
  const phaseTimings = {
    initialization: 0,
    discovery: 0,
    selection: 0,
    execution: 0,
    synthesis: 0
  };

  try {
    // Get global MCP client (singleton)
    const mcpClient = getMCPClient();

    // Create Claude client
    const claudeClient = createClaudeClient(apiKey);

    // ===================================================================
    // PHASE 1: INITIALIZATION & NEGOTIATION
    // ===================================================================
    const phase1Start = Date.now();

    // Record: User input
    mcpClient.recordEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logLevel: 'info',
      logMessage: `User query: "${userMessage}"`,
      badgeType: 'USER_INPUT',
      metadata: {
        phase: 'initialization',
        messageType: 'user_input'
      }
    });

    // Connect to MCP server if not already connected
    if (!mcpClient.isConnected()) {
      mcpClient.recordEvent({
        eventType: 'console_log',
        actor: 'host_app',
        logLevel: 'info',
        logMessage: 'Connecting to MCP server...',
        badgeType: 'SYSTEM',
        metadata: {
          phase: 'initialization',
          messageType: 'connection_start'
        }
      });

      await mcpClient.connect(AWS_DOCS_SERVER_CONFIG);

      mcpClient.recordEvent({
        eventType: 'console_log',
        actor: 'host_app',
        logLevel: 'info',
        logMessage: 'Handshake complete ✓',
        badgeType: 'SYSTEM',
        metadata: {
          phase: 'initialization',
          messageType: 'connection_complete'
        }
      });
    } else {
      mcpClient.recordEvent({
        eventType: 'console_log',
        actor: 'host_app',
        logLevel: 'info',
        logMessage: 'Using existing MCP connection',
        badgeType: 'SYSTEM',
        metadata: {
          phase: 'initialization',
          messageType: 'connection_reuse'
        }
      });
    }

    phaseTimings.initialization = Date.now() - phase1Start;

    // ===================================================================
    // PHASE 2: DISCOVERY & CONTEXTUALIZATION
    // ===================================================================
    const phase2Start = Date.now();

    mcpClient.recordEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logLevel: 'info',
      logMessage: 'Discovering available tools...',
      badgeType: 'INTERNAL',
      metadata: {
        phase: 'discovery',
        messageType: 'discovery_start'
      }
    });

    // Discover tools from MCP server
    const mcpTools: MCPTool[] = await mcpClient.listTools();

    mcpClient.recordEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logLevel: 'info',
      logMessage: `Discovered ${mcpTools.length} tool(s)`,
      badgeType: 'INTERNAL',
      metadata: {
        phase: 'discovery',
        messageType: 'discovery_complete',
        toolCount: mcpTools.length
      }
    });

    // Convert MCP tools to Claude format
    mcpClient.recordEvent({
      eventType: 'internal_operation',
      actor: 'host_app',
      operationType: 'schema_conversion',
      description: 'Formatting tool schemas for LLM context',
      metadata: {
        phase: 'discovery',
        messageType: 'schema_conversion'
      }
    });

    const claudeTools = convertMCPToolsToClaudeFormat(mcpTools);

    mcpClient.recordEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logLevel: 'info',
      logMessage: 'Tool schemas formatted for LLM ✓',
      badgeType: 'INTERNAL',
      metadata: {
        phase: 'discovery',
        messageType: 'schema_conversion_complete'
      }
    });

    phaseTimings.discovery = Date.now() - phase2Start;

    // ===================================================================
    // PHASE 3: MODEL-DRIVEN SELECTION (First LLM Inference - Planning)
    // ===================================================================
    const phase3Start = Date.now();

    // Execute planning inference (records its own events)
    const planningResult = await executePlanningInference(
      claudeClient,
      mcpClient,
      userMessage,
      claudeTools
    );

    // Extract tool calls from planning response
    const toolCalls = planningResult.toolCalls;

    // If no tools selected, return direct response
    if (toolCalls.length === 0) {
      const textResponse = extractTextResponse(planningResult.message.content);

      mcpClient.recordEvent({
        eventType: 'console_log',
        actor: 'host_app',
        logLevel: 'info',
        logMessage: 'Response delivered (no tools used)',
        badgeType: 'COMPLETE',
        metadata: {
          phase: 'selection',
          messageType: 'complete',
          noToolsUsed: true
        }
      });

      phaseTimings.selection = Date.now() - phase3Start;

      return {
        finalResponse: textResponse,
        success: true,
        metadata: {
          toolsUsed: [],
          totalTime: Date.now() - startTime,
          phaseTimings
        }
      };
    }

    phaseTimings.selection = Date.now() - phase3Start;

    // ===================================================================
    // PHASE 4: EXECUTION ROUND TRIP
    // ===================================================================
    // Note: All tools execute sequentially within this phase
    const phase4Start = Date.now();

    const toolResults: ClaudeToolResult[] = [];

    for (const toolCall of toolCalls) {
      // Execute tool (records its own events)
      const mcpResult = await executeSingleTool(
        mcpClient,
        toolCall.name,
        toolCall.input
      );

      // Format result for Claude
      const claudeResult = formatToolResultForClaude(
        toolCall.id,
        mcpResult
      );

      toolResults.push(claudeResult);
    }

    phaseTimings.execution = Date.now() - phase4Start;

    // ===================================================================
    // PHASE 5: SYNTHESIS & FINAL RESPONSE (Second LLM Inference)
    // ===================================================================
    const phase5Start = Date.now();

    // Execute synthesis inference (records its own events)
    const synthesisResult = await executeSynthesisInference(
      claudeClient,
      mcpClient,
      userMessage,
      planningResult.message.content,
      toolResults,
      claudeTools
    );

    // Extract final text response
    const finalResponse = extractTextResponse(synthesisResult.message.content);

    phaseTimings.synthesis = Date.now() - phase5Start;

    // Record: Workflow complete
    const totalTime = Date.now() - startTime;
    mcpClient.recordEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logLevel: 'info',
      logMessage: `Workflow complete. Total time: ${totalTime}ms`,
      badgeType: 'COMPLETE',
      metadata: {
        phase: 'synthesis',
        messageType: 'workflow_complete',
        totalTime,
        phaseTimings
      }
    });

    return {
      finalResponse,
      success: true,
      metadata: {
        toolsUsed: toolCalls.map(tc => tc.name),
        totalTime,
        phaseTimings
      }
    };

  } catch (error: any) {
    // Record error
    const mcpClient = getMCPClient();
    mcpClient.recordEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logLevel: 'error',
      logMessage: `Workflow error: ${error.message}`,
      badgeType: 'SYSTEM',
      metadata: {
        phase: 'error',
        messageType: 'workflow_error',
        error: error.message,
        stack: error.stack
      }
    });

    return {
      finalResponse: '',
      success: false,
      error: error.message,
      metadata: {
        toolsUsed: [],
        totalTime: Date.now() - startTime,
        phaseTimings
      }
    };
  }
}

/**
 * Validate that API key is available.
 *
 * @returns True if API key is available, false otherwise
 */
export function hasAPIKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Get workflow status (for debugging).
 */
export function getWorkflowStatus(): {
  connected: boolean;
  sessionInfo: ReturnType<typeof getMCPClient.prototype.getSessionInfo>;
} {
  const mcpClient = getMCPClient();
  return {
    connected: mcpClient.isConnected(),
    sessionInfo: mcpClient.getSessionInfo()
  };
}
