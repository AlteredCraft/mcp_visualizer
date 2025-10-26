/**
 * Inference Helpers
 *
 * High-level functions for planning and synthesis inference.
 * Integrates with global MCP client for event recording.
 *
 * Based on: POC orchestrator.py pattern
 */

import type { ClaudeClient, InferenceResult } from './claude-client';
import type { ClaudeTool, ClaudeToolResult } from './tool-formatter';
import type { MCPGlobalClient } from '../mcp/global-client';

/**
 * Execute planning inference and record events
 *
 * @param claudeClient - Claude API client
 * @param mcpClient - Global MCP client (for event recording)
 * @param userMessage - User's query
 * @param tools - Available tools (Claude format)
 * @returns Inference result
 */
export async function executePlanningInference(
  claudeClient: ClaudeClient,
  mcpClient: MCPGlobalClient,
  userMessage: string,
  tools: ClaudeTool[]
): Promise<InferenceResult> {
  // Record: Calling LLM for tool planning
  mcpClient.recordEvent({
    eventType: 'console_log',
    actor: 'host_app',
    logLevel: 'info',
    logMessage: 'Calling LLM for tool planning',
    badgeType: 'INTERNAL',
    metadata: {
      phase: 'selection',
      messageType: 'planning_start'
    }
  });

  // Record: LLM request (sent)
  mcpClient.recordEvent({
    eventType: 'protocol_message',
    actor: 'host_app',
    direction: 'sent',
    lane: 'host_llm',
    message: {
      model: claudeClient.getModel(),
      messages: [{ role: 'user', content: userMessage }],
      tools: tools.map(t => ({ name: t.name, description: t.description })),
      max_tokens: claudeClient.getMaxTokens()
    },
    metadata: {
      phase: 'selection',
      messageType: 'llm_request'
    }
  });

  // Record: LLM processing indicator
  mcpClient.recordEvent({
    eventType: 'internal_operation',
    actor: 'llm',
    operationType: 'inference',
    description: 'Analyzing available tools...',
    metadata: {
      phase: 'selection',
      messageType: 'thinking'
    }
  });

  // Execute planning inference
  const result = await claudeClient.planningInference(userMessage, tools);

  // Record: LLM response (received)
  mcpClient.recordEvent({
    eventType: 'protocol_message',
    actor: 'host_app',
    direction: 'received',
    lane: 'host_llm',
    message: {
      stop_reason: result.message.stop_reason,
      usage: result.usage,
      content: result.message.content
    },
    metadata: {
      phase: 'selection',
      messageType: 'llm_response',
      processingTime: 0 // Will be calculated by backend
    }
  });

  // Record: Tool selection result
  if (result.toolCalls.length > 0) {
    mcpClient.recordEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logLevel: 'info',
      logMessage: `LLM selected ${result.toolCalls.length} tool(s): ${result.toolCalls.map(tc => tc.name).join(', ')}`,
      badgeType: 'INTERNAL',
      metadata: {
        phase: 'selection',
        messageType: 'tool_selection',
        toolNames: result.toolCalls.map(tc => tc.name)
      }
    });
  } else {
    mcpClient.recordEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logLevel: 'info',
      logMessage: 'LLM chose not to use tools (direct response)',
      badgeType: 'INTERNAL',
      metadata: {
        phase: 'selection',
        messageType: 'no_tools'
      }
    });
  }

  return result;
}

/**
 * Execute synthesis inference and record events
 *
 * @param claudeClient - Claude API client
 * @param mcpClient - Global MCP client (for event recording)
 * @param userMessage - Original user query
 * @param planningContent - Content from planning response
 * @param toolResults - Results from tool executions
 * @param tools - Available tools (same as planning)
 * @returns Inference result with final response
 */
export async function executeSynthesisInference(
  claudeClient: ClaudeClient,
  mcpClient: MCPGlobalClient,
  userMessage: string,
  planningContent: any[],
  toolResults: ClaudeToolResult[],
  tools: ClaudeTool[]
): Promise<InferenceResult> {
  // Record: Calling LLM for final synthesis
  mcpClient.recordEvent({
    eventType: 'console_log',
    actor: 'host_app',
    logLevel: 'info',
    logMessage: 'Calling LLM for final synthesis',
    badgeType: 'INTERNAL',
    metadata: {
      phase: 'synthesis',
      messageType: 'synthesis_start'
    }
  });

  // Record: Appending tool results to conversation
  mcpClient.recordEvent({
    eventType: 'internal_operation',
    actor: 'host_app',
    operationType: 'context_append',
    description: `Appending ${toolResults.length} tool result(s) to conversation`,
    metadata: {
      phase: 'synthesis',
      messageType: 'context_append',
      toolResultCount: toolResults.length
    }
  });

  // Record: LLM request (sent)
  mcpClient.recordEvent({
    eventType: 'protocol_message',
    actor: 'host_app',
    direction: 'sent',
    lane: 'host_llm',
    message: {
      model: claudeClient.getModel(),
      messages: [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: planningContent },
        { role: 'user', content: toolResults }
      ],
      tools: tools.map(t => ({ name: t.name, description: t.description })),
      max_tokens: claudeClient.getMaxTokens()
    },
    metadata: {
      phase: 'synthesis',
      messageType: 'llm_request'
    }
  });

  // Record: LLM processing indicator
  mcpClient.recordEvent({
    eventType: 'internal_operation',
    actor: 'llm',
    operationType: 'inference',
    description: 'Generating final response...',
    metadata: {
      phase: 'synthesis',
      messageType: 'thinking'
    }
  });

  // Execute synthesis inference
  const result = await claudeClient.synthesisInference(
    userMessage,
    planningContent,
    toolResults,
    tools
  );

  // Record: LLM response (received)
  mcpClient.recordEvent({
    eventType: 'protocol_message',
    actor: 'host_app',
    direction: 'received',
    lane: 'host_llm',
    message: {
      stop_reason: result.message.stop_reason,
      usage: result.usage,
      content: result.message.content
    },
    metadata: {
      phase: 'synthesis',
      messageType: 'llm_response',
      processingTime: 0 // Will be calculated by backend
    }
  });

  // Record: Response delivered
  mcpClient.recordEvent({
    eventType: 'console_log',
    actor: 'host_app',
    logLevel: 'info',
    logMessage: 'Response delivered',
    badgeType: 'COMPLETE',
    metadata: {
      phase: 'synthesis',
      messageType: 'complete'
    }
  });

  return result;
}

/**
 * Execute single tool and record events
 *
 * Helper function for executing one tool with proper event recording.
 * Used by orchestrator during Phase 4 (Execution).
 *
 * @param mcpClient - Global MCP client
 * @param toolName - Name of tool to execute
 * @param toolArgs - Arguments for tool
 * @returns MCP tool result
 */
export async function executeSingleTool(
  mcpClient: MCPGlobalClient,
  toolName: string,
  toolArgs: Record<string, unknown>
): Promise<any> {
  // Record: Invoking tool (console log)
  mcpClient.recordEvent({
    eventType: 'console_log',
    actor: 'host_app',
    logLevel: 'info',
    logMessage: `Invoking tool: ${toolName}`,
    badgeType: 'INTERNAL',
    metadata: {
      phase: 'execution',
      messageType: 'tool_invoke',
      toolName,
      toolArguments: toolArgs
    }
  });

  // Record: MCP tools/call request (protocol message)
  mcpClient.recordEvent({
    eventType: 'protocol_message',
    actor: 'host_app',
    direction: 'sent',
    lane: 'host_mcp',
    message: {
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: toolArgs
      }
    },
    metadata: {
      phase: 'execution',
      messageType: 'mcp_request'
    }
  });

  // Record: MCP server processing
  mcpClient.recordEvent({
    eventType: 'internal_operation',
    actor: 'mcp_server',
    operationType: 'tool_execution',
    description: `Executing ${toolName}...`,
    metadata: {
      phase: 'execution',
      messageType: 'server_processing'
    }
  });

  // Execute tool via MCP client
  const result = await mcpClient.callTool(toolName, toolArgs);

  // Record: MCP tools/call response (protocol message)
  mcpClient.recordEvent({
    eventType: 'protocol_message',
    actor: 'host_app',
    direction: 'received',
    lane: 'host_mcp',
    message: {
      result: {
        content: result.content,
        isError: result.isError || false
      }
    },
    metadata: {
      phase: 'execution',
      messageType: 'mcp_response'
    }
  });

  // Record: Received result (console log)
  mcpClient.recordEvent({
    eventType: 'console_log',
    actor: 'host_app',
    logLevel: 'info',
    logMessage: `Received result from ${toolName}`,
    badgeType: 'INTERNAL',
    metadata: {
      phase: 'execution',
      messageType: 'tool_result',
      toolName
    }
  });

  return result;
}
