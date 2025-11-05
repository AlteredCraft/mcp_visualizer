/**
 * Unit tests for otlp-exporter.ts
 * Tests OTLP trace export from timeline events
 */

import { exportTraceAsOTLP, exportTraceAsOTLPJSON } from '../../lib/otlp-exporter';
import type { TimelineEvent } from '../../types/domain';
import type { OTLPTrace } from '../../types/otlp';

describe('OTLP Exporter', () => {
  describe('exportTraceAsOTLP', () => {
    it('should generate valid OTLP trace structure', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
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
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData);

      // Should have top-level structure
      expect(otlpTrace).toHaveProperty('resourceSpans');
      expect(Array.isArray(otlpTrace.resourceSpans)).toBe(true);
      expect(otlpTrace.resourceSpans.length).toBeGreaterThan(0);
    });

    it('should create spans with required fields', () => {
      const traceData = {
        sessionId: 'test-session-abc',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-abc',
            sequence: 0,
            timestamp: 1699999999000,
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
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData);
      const firstSpan = otlpTrace.resourceSpans[0].scopeSpans[0].spans[0];

      // Verify required span fields
      expect(firstSpan).toHaveProperty('traceId');
      expect(firstSpan).toHaveProperty('spanId');
      expect(firstSpan).toHaveProperty('name');
      expect(firstSpan).toHaveProperty('kind');
      expect(firstSpan).toHaveProperty('startTimeUnixNano');
      expect(firstSpan).toHaveProperty('endTimeUnixNano');
      expect(firstSpan).toHaveProperty('attributes');
      expect(firstSpan).toHaveProperty('status');

      // Verify trace ID format (32 hex characters)
      expect(firstSpan.traceId).toMatch(/^[0-9a-f]{32}$/);

      // Verify span ID format (16 hex characters)
      expect(firstSpan.spanId).toMatch(/^[0-9a-f]{16}$/);

      // Verify timestamps are in nanoseconds (string)
      expect(typeof firstSpan.startTimeUnixNano).toBe('string');
      expect(typeof firstSpan.endTimeUnixNano).toBe('string');
    });

    it('should include resource attributes with actor information', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
            eventType: 'protocol_message' as const,
            actor: 'mcp_server' as const,
            direction: 'received' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, result: {} },
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData);
      const resource = otlpTrace.resourceSpans[0].resource;

      expect(resource).toBeDefined();
      expect(resource?.attributes).toBeDefined();

      const attrs = resource!.attributes;
      expect(attrs.find((a) => a.key === 'service.name')).toBeDefined();
      expect(attrs.find((a) => a.key === 'mcp.actor')?.value.stringValue).toBe('mcp_server');
    });

    it('should group spans by phase when groupByPhase is true', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 2,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, method: 'initialize' },
            metadata: { phase: 'initialization' as const, messageType: 'test' },
          },
          {
            sessionId: 'test-session-123',
            sequence: 1,
            timestamp: 1699999999100,
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 2, method: 'tools/list' },
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData, { groupByPhase: true });
      const scopeSpans = otlpTrace.resourceSpans[0].scopeSpans;

      // Should have separate scopes for different phases
      expect(scopeSpans.length).toBe(2);
      expect(scopeSpans[0].scope?.name).toBe('phase.initialization');
      expect(scopeSpans[1].scope?.name).toBe('phase.discovery');
    });

    it('should set correct span kind for sent messages (CLIENT)', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData);
      const span = otlpTrace.resourceSpans[0].scopeSpans[0].spans[0];

      expect(span.kind).toBe(3); // SPAN_KIND_CLIENT
    });

    it('should set correct span kind for received messages (SERVER)', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
            eventType: 'protocol_message' as const,
            actor: 'mcp_server' as const,
            direction: 'received' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, result: {} },
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData);
      const span = otlpTrace.resourceSpans[0].scopeSpans[0].spans[0];

      expect(span.kind).toBe(2); // SPAN_KIND_SERVER
    });

    it('should set correct span kind for internal operations (INTERNAL)', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
            eventType: 'internal_operation' as const,
            actor: 'host_app' as const,
            operationType: 'schema_conversion',
            description: 'Converting MCP schemas to Claude format',
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData);
      const span = otlpTrace.resourceSpans[0].scopeSpans[0].spans[0];

      expect(span.kind).toBe(1); // SPAN_KIND_INTERNAL
    });

    it('should include protocol message data in span attributes', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: {
              jsonrpc: '2.0',
              id: 42,
              method: 'tools/call',
              params: { name: 'search', arguments: { query: 'test' } },
            },
            metadata: { phase: 'execution' as const, messageType: 'tools_call_request' },
          },
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData);
      const attrs = otlpTrace.resourceSpans[0].scopeSpans[0].spans[0].attributes || [];

      const methodAttr = attrs.find((a) => a.key === 'jsonrpc.method');
      expect(methodAttr?.value.stringValue).toBe('tools/call');

      const idAttr = attrs.find((a) => a.key === 'jsonrpc.id');
      expect(idAttr?.value.intValue).toBe(42);

      const directionAttr = attrs.find((a) => a.key === 'direction');
      expect(directionAttr?.value.stringValue).toBe('sent');

      const laneAttr = attrs.find((a) => a.key === 'lane');
      expect(laneAttr?.value.stringValue).toBe('host_mcp');
    });

    it('should convert console logs to span events', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
            eventType: 'console_log' as const,
            actor: 'mcp_server' as const,
            logLevel: 'info' as const,
            logMessage: 'Searching AWS documentation...',
            badgeType: 'SERVER' as const,
            metadata: { phase: 'execution' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData);
      const span = otlpTrace.resourceSpans[0].scopeSpans[0].spans[0];

      expect(span.events).toBeDefined();
      expect(span.events?.length).toBe(1);
      expect(span.events?.[0].name).toBe('Searching AWS documentation...');

      const eventAttrs = span.events?.[0].attributes || [];
      expect(eventAttrs.find((a) => a.key === 'log.level')?.value.stringValue).toBe('info');
      expect(eventAttrs.find((a) => a.key === 'badge.type')?.value.stringValue).toBe('SERVER');
    });

    it('should filter console logs when includeConsoleLogs is false', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 2,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
            eventType: 'console_log' as const,
            actor: 'mcp_server' as const,
            logLevel: 'info' as const,
            logMessage: 'This should be filtered',
            badgeType: 'SERVER' as const,
            metadata: { phase: 'execution' as const, messageType: 'test' },
          },
          {
            sessionId: 'test-session-123',
            sequence: 1,
            timestamp: 1699999999100,
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, method: 'tools/call' },
            metadata: { phase: 'execution' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData, { includeConsoleLogs: false });
      const allSpans = otlpTrace.resourceSpans.flatMap((rs) =>
        rs.scopeSpans.flatMap((ss) => ss.spans)
      );

      // Should only have the protocol message span
      expect(allSpans.length).toBe(1);
      expect(allSpans[0].name).toBe('tools/call');
    });

    it('should filter internal operations when includeInternalOperations is false', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 2,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
            eventType: 'internal_operation' as const,
            actor: 'host_app' as const,
            operationType: 'schema_conversion',
            description: 'Should be filtered',
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
          {
            sessionId: 'test-session-123',
            sequence: 1,
            timestamp: 1699999999100,
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData, { includeInternalOperations: false });
      const allSpans = otlpTrace.resourceSpans.flatMap((rs) =>
        rs.scopeSpans.flatMap((ss) => ss.spans)
      );

      // Should only have the protocol message span
      expect(allSpans.length).toBe(1);
      expect(allSpans[0].name).toBe('tools/list');
    });

    it('should label LLM calls with correct naming', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 2,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_llm' as const,
            message: { role: 'user', content: 'test' },
            metadata: { phase: 'selection' as const, messageType: 'llm_request' },
          },
          {
            sessionId: 'test-session-123',
            sequence: 1,
            timestamp: 1699999999100,
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_llm' as const,
            message: { role: 'user', content: 'test' },
            metadata: { phase: 'synthesis' as const, messageType: 'llm_request' },
          },
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData);
      const spans = otlpTrace.resourceSpans[0].scopeSpans.flatMap((ss) => ss.spans);

      expect(spans[0].name).toBe('LLM Call #1 (Planning)');
      expect(spans[1].name).toBe('LLM Call #2 (Synthesis)');
    });

    it('should handle empty events array', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 0,
        events: [] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData);

      expect(otlpTrace.resourceSpans).toBeDefined();
      expect(Array.isArray(otlpTrace.resourceSpans)).toBe(true);
      // Empty events should result in no resource spans
      expect(otlpTrace.resourceSpans.length).toBe(0);
    });

    it('should group events by actor', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 2,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
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
            timestamp: 1699999999100,
            eventType: 'protocol_message' as const,
            actor: 'mcp_server' as const,
            direction: 'received' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, result: {} },
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const otlpTrace = exportTraceAsOTLP(traceData);

      // Should have separate resource spans for each actor
      expect(otlpTrace.resourceSpans.length).toBe(2);

      const actors = otlpTrace.resourceSpans.map(
        (rs) => rs.resource?.attributes.find((a) => a.key === 'mcp.actor')?.value.stringValue
      );
      expect(actors).toContain('host_app');
      expect(actors).toContain('mcp_server');
    });
  });

  describe('exportTraceAsOTLPJSON', () => {
    it('should generate valid JSON string', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 1,
        events: [
          {
            sessionId: 'test-session-123',
            sequence: 0,
            timestamp: 1699999999000,
            eventType: 'protocol_message' as const,
            actor: 'host_app' as const,
            direction: 'sent' as const,
            lane: 'host_mcp' as const,
            message: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
            metadata: { phase: 'discovery' as const, messageType: 'test' },
          },
        ] as TimelineEvent[],
      };

      const jsonString = exportTraceAsOTLPJSON(traceData);

      // Should be valid JSON
      expect(() => JSON.parse(jsonString)).not.toThrow();

      const parsed = JSON.parse(jsonString);
      expect(parsed).toHaveProperty('metadata');
      expect(parsed).toHaveProperty('trace');
      expect(parsed.metadata.format).toBe('otlp');
      expect(parsed.metadata.sessionId).toBe('test-session-123');
    });

    it('should include metadata in export', () => {
      const traceData = {
        sessionId: 'test-session-abc',
        eventCount: 5,
        events: [] as TimelineEvent[],
      };

      const jsonString = exportTraceAsOTLPJSON(traceData);
      const parsed = JSON.parse(jsonString);

      expect(parsed.metadata).toHaveProperty('exportedAt');
      expect(parsed.metadata).toHaveProperty('sessionId');
      expect(parsed.metadata).toHaveProperty('eventCount');
      expect(parsed.metadata).toHaveProperty('format');
      expect(parsed.metadata).toHaveProperty('formatVersion');
      expect(parsed.metadata).toHaveProperty('exporter');

      expect(parsed.metadata.sessionId).toBe('test-session-abc');
      expect(parsed.metadata.eventCount).toBe(5);
      expect(parsed.metadata.exporter).toBe('mcp-inspector');
    });

    it('should format JSON with indentation', () => {
      const traceData = {
        sessionId: 'test-session-123',
        eventCount: 0,
        events: [] as TimelineEvent[],
      };

      const jsonString = exportTraceAsOTLPJSON(traceData);

      // Check for indentation (pretty printing)
      expect(jsonString).toContain('  ');
      expect(jsonString).toContain('\n');
    });
  });
});
