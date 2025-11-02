/**
 * Unit tests for mermaid-exporter.ts
 * Tests Mermaid sequence diagram generation from trace data
 */

import { exportTraceAsMermaid } from '../../lib/mermaid-exporter';
import type { TimelineEvent } from '../../types/timeline';

describe('Mermaid Exporter', () => {
  describe('exportTraceAsMermaid', () => {
    it('should generate valid Markdown with Mermaid code block', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 2,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: {
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/list',
            },
            metadata: {
              phase: 'discovery' as const,
              messageType: 'tools_list_request',
            },
          },
          {
            sessionId: 'test-session-123',
            sequence: 1,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'mcp_server' as const,
            direction: 'received' as const,
            lane: 'host_mcp' as const,
            message: {
              jsonrpc: '2.0',
              id: 1,
              result: { tools: [] },
            },
            metadata: {
              phase: 'discovery' as const,
              messageType: 'tools_list_response',
            },
          },
        ] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('# MCP Inspector Sequence Diagram');
      expect(markdown).toContain('**Session ID**: test-session-123');
      expect(markdown).toContain('**Event Count**: 2');
      expect(markdown).toContain('```mermaid');
      expect(markdown).toContain('sequenceDiagram');
      expect(markdown).toContain('```');
    });

    it('should include all four participants', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('participant User');
      expect(markdown).toContain('participant HostApp');
      expect(markdown).toContain('participant LLM');
      expect(markdown).toContain('participant MCPServer');
    });

    it('should include initial user query arrow', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 0,
        events: [] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('User->>HostApp: Query');
    });

    it('should generate correct arrows for host_mcp lane (sent)', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('HostApp->>MCPServer: tools/list');
    });

    it('should generate correct arrows for host_mcp lane (received)', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'mcp_server' as const,
            direction: 'received' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, result: {} },
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('MCPServer->>HostApp:');
    });

    it('should generate correct arrows for host_llm lane (sent)', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_llm' as const,
            message: { role: 'user', content: 'test' },
            metadata: { phase: 'selection' as const, messageType: 'llm_request' },
          },
        ] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('HostApp->>LLM: LLM Call #1 (Planning)');
    });

    it('should generate correct arrows for host_llm lane (received)', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'llm' as const,
            direction: 'received' as const,
            lane: 'host_llm' as const,
            message: { role: 'assistant', content: 'response' },
            metadata: { phase: 'selection' as const, messageType: 'llm_response' },
          },
        ] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('LLM->>HostApp: Response with tool_use');
    });

    it('should label first LLM call as "Call #1 (Planning)"', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_llm' as const,
            message: { role: 'user', content: 'test' },
            metadata: { phase: 'selection' as const, messageType: 'llm_request' },
          },
        ] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('LLM Call #1 (Planning)');
    });

    it('should label second LLM call as "Call #2 (Synthesis)"', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_llm' as const,
            message: { role: 'user', content: 'test' },
            metadata: { phase: 'synthesis' as const, messageType: 'llm_request' },
          },
        ] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('LLM Call #2 (Synthesis)');
    });

    it('should group events by phase using rect boxes', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 2,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
          {
            sessionId: 'test-session-123',
            sequence: 1,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_llm' as const,
            message: { role: 'user', content: 'test' },
            metadata: { phase: 'selection' as const, messageType: 'llm_request' },
          },
        ] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('rect rgb(240, 240, 245)');
      expect(markdown).toContain('Note over User,MCPServer: Discovery & Contextualization');
      expect(markdown).toContain('Note over User,MCPServer: Model-Driven Selection');
      expect(markdown).toContain('end');
    });

    it('should use display-friendly phase names', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, method: 'tools/call' },
            metadata: { phase: 'execution' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('Execution Round Trip');
    });

    it('should only include protocol_message events', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 3,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: Date.now(),
            eventType: 'console_log' as const,
            actor: 'host_app' as const,
            logLevel: 'info' as const,
            logMessage: 'Starting...',
            badgeType: 'SYSTEM' as const,
            metadata: { phase: 'initialization' as const, messageType: 'test' },
          },
          {
            sessionId: 'test-session-123',
            sequence: 1,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
          {
            sessionId: 'test-session-123',
            sequence: 2,
            timestamp: Date.now(),
            eventType: 'internal_operation' as const,
            actor: 'host_app' as const,
            operationType: 'schema_conversion',
            description: 'Converting schemas',
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      // Should only include the protocol_message arrow
      expect(markdown).toContain('HostApp->>MCPServer: tools/list');
      // Should not include console logs or internal operations
      expect(markdown).not.toContain('Starting...');
      expect(markdown).not.toContain('Converting schemas');
    });

    it('should include educational key points section', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 0,
        events: [] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('## Key Points');
      expect(markdown).toContain('Host App** orchestrates all communication');
      expect(markdown).toContain('Call #1 (Planning)');
      expect(markdown).toContain('Call #2 (Synthesis)');
      expect(markdown).toContain('LLM never directly communicates with the MCP Server');
    });

    it('should handle empty events array', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 0,
        events: [] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('sequenceDiagram');
      expect(markdown).toContain('participant User');
      expect(markdown).toContain('User->>HostApp: Query');
    });

    it('should use method name from message as arrow label', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: Date.now(),
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, method: 'tools/call' },
            metadata: { phase: 'execution' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const markdown = exportTraceAsMermaid(traceData);

      expect(markdown).toContain('tools/call');
    });
  });
});
