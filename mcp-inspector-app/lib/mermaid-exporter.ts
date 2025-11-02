import { TimelineEvent } from '@/types/timeline';

interface TraceData {
  sessionId: string;
  eventCount: number;
  events: TimelineEvent[];
  exportedAt?: string;
}

interface PhaseGroup {
  phase: string;
  events: TimelineEvent[];
}

/**
 * Maps internal actor names to Mermaid participant names
 */
function mapActor(actor: string): string {
  const actorMap: Record<string, string> = {
    host_app: 'HostApp',
    llm: 'LLM',
    mcp_server: 'MCPServer',
    external_api: 'ExternalAPI',
  };
  return actorMap[actor] || actor;
}

/**
 * Maps phase names to display-friendly labels
 */
function mapPhase(phase: string): string {
  const phaseMap: Record<string, string> = {
    initialization: 'Initialization & Negotiation',
    discovery: 'Discovery & Contextualization',
    selection: 'Model-Driven Selection',
    execution: 'Execution Round Trip',
    synthesis: 'Synthesis & Final Response',
  };
  return phaseMap[phase] || phase;
}

/**
 * Generates a concise label for a protocol message arrow
 */
function generateMessageLabel(event: TimelineEvent): string {
  const { message, metadata } = event;

  // Handle LLM calls with explicit numbering
  if (metadata.messageType === 'llm_request') {
    if (metadata.phase === 'selection') {
      return 'LLM Call #1 (Planning)';
    } else if (metadata.phase === 'synthesis') {
      return 'LLM Call #2 (Synthesis)';
    }
  }

  if (metadata.messageType === 'llm_response') {
    if (metadata.phase === 'selection') {
      return 'Response with tool_use';
    } else if (metadata.phase === 'synthesis') {
      return 'Final natural language response';
    }
  }

  // Extract method from JSON-RPC message
  if (message && 'method' in message) {
    return message.method as string;
  }

  // Use messageType as fallback
  return metadata.messageType.replace(/_/g, ' ');
}

/**
 * Generates a Mermaid arrow for a protocol message
 */
function generateArrow(event: TimelineEvent): string {
  const { actor, direction, lane } = event;

  if (!lane) return '';

  const label = generateMessageLabel(event);
  const mappedActor = mapActor(actor);

  // Determine the other participant based on lane
  let from: string;
  let to: string;

  if (lane === 'host_llm') {
    if (direction === 'sent') {
      from = 'HostApp';
      to = 'LLM';
    } else {
      from = 'LLM';
      to = 'HostApp';
    }
  } else if (lane === 'host_mcp') {
    if (direction === 'sent') {
      from = 'HostApp';
      to = 'MCPServer';
    } else {
      from = 'MCPServer';
      to = 'HostApp';
    }
  } else {
    return '';
  }

  return `    ${from}->>${to}: ${label}`;
}

/**
 * Groups protocol messages by workflow phase
 */
function groupByPhase(events: TimelineEvent[]): PhaseGroup[] {
  const groups: PhaseGroup[] = [];
  let currentPhase: string | null = null;
  let currentEvents: TimelineEvent[] = [];

  for (const event of events) {
    const phase = event.metadata.phase || 'unknown';

    if (phase !== currentPhase) {
      if (currentPhase !== null && currentEvents.length > 0) {
        groups.push({ phase: currentPhase, events: currentEvents });
      }
      currentPhase = phase;
      currentEvents = [event];
    } else {
      currentEvents.push(event);
    }
  }

  // Add the last group
  if (currentPhase !== null && currentEvents.length > 0) {
    groups.push({ phase: currentPhase, events: currentEvents });
  }

  return groups;
}

/**
 * Generates a Mermaid sequence diagram from trace data
 */
function generateMermaidDiagram(traceData: TraceData): string {
  const protocolMessages = traceData.events.filter(
    (event) => event.eventType === 'protocol_message'
  );

  const phaseGroups = groupByPhase(protocolMessages);

  let diagram = 'sequenceDiagram\n';
  diagram += '    participant User\n';
  diagram += '    participant HostApp\n';
  diagram += '    participant LLM\n';
  diagram += '    participant MCPServer\n\n';

  // Add initial user input
  diagram += '    User->>HostApp: Query\n\n';

  // Generate phase groups
  for (const group of phaseGroups) {
    const phaseLabel = mapPhase(group.phase);
    diagram += `    rect rgb(240, 240, 245)\n`;
    diagram += `        Note over User,MCPServer: ${phaseLabel}\n`;

    for (const event of group.events) {
      const arrow = generateArrow(event);
      if (arrow) {
        diagram += arrow + '\n';
      }
    }

    diagram += '    end\n\n';
  }

  return diagram.trim();
}

/**
 * Exports trace data as a Markdown file with embedded Mermaid sequence diagram
 */
export function exportTraceAsMermaid(traceData: TraceData): string {
  const diagram = generateMermaidDiagram(traceData);
  const timestamp = new Date().toISOString();

  const markdown = `# MCP Inspector Sequence Diagram

**Session ID**: ${traceData.sessionId}
**Generated**: ${timestamp}
**Event Count**: ${traceData.eventCount}

## Sequence Diagram

This diagram shows the communication flow between the Host App, LLM, and MCP Server during a single query execution.

\`\`\`mermaid
${diagram}
\`\`\`

## Key Points

- The **Host App** orchestrates all communication
- The **LLM** makes two separate calls:
  1. **Call #1 (Planning)**: Selects which tools to use
  2. **Call #2 (Synthesis)**: Generates final response using tool results
- The **MCP Server** executes tools and returns results
- The LLM never directly communicates with the MCP Server

---

*Generated by MCP Inspector Teaching App*
`;

  return markdown;
}
