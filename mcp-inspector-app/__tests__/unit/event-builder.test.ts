/**
 * Unit tests for event-builder.ts
 * Tests all event creation functions and message inference
 */

import {
  createProtocolMessageEvent,
  createConsoleLogEvent,
  createInternalOperationEvent,
  createUserInputLog,
  createSystemLog,
  createServerLog,
  createLLMLog,
  createCompleteLog,
  createJSONRPCRequest,
  createJSONRPCResponse,
  createJSONRPCNotification,
  createJSONRPCError,
} from '../../lib/event-builder';

describe('Event Builder', () => {
  describe('createProtocolMessageEvent', () => {
    it('should create a valid protocol message event', () => {
      const message = createJSONRPCRequest(1, 'initialize', {
        protocolVersion: '2024-11-05',
      });

      const event = createProtocolMessageEvent({
        actor: 'host_app',
        direction: 'sent',
        lane: 'host_mcp',
        message,
        phase: 'initialization',
      });

      expect(event.eventType).toBe('protocol_message');
      expect(event.actor).toBe('host_app');
      expect(event.direction).toBe('sent');
      expect(event.lane).toBe('host_mcp');
      expect(event.message).toBe(message);
      expect(event.metadata.phase).toBe('initialization');
      expect(event.metadata.messageType).toBe('jsonrpc_request');
    });

    it('should infer message type for JSON-RPC request', () => {
      const message = createJSONRPCRequest(1, 'tools/list');

      const event = createProtocolMessageEvent({
        actor: 'host_app',
        direction: 'sent',
        lane: 'host_mcp',
        message,
      });

      expect(event.metadata.messageType).toBe('jsonrpc_request');
    });

    it('should infer message type for JSON-RPC response', () => {
      const message = createJSONRPCResponse(1, { tools: [] });

      const event = createProtocolMessageEvent({
        actor: 'mcp_server',
        direction: 'received',
        lane: 'host_mcp',
        message,
      });

      expect(event.metadata.messageType).toBe('jsonrpc_response');
    });

    it('should infer message type for JSON-RPC notification', () => {
      const message = createJSONRPCNotification('initialized');

      const event = createProtocolMessageEvent({
        actor: 'host_app',
        direction: 'sent',
        lane: 'host_mcp',
        message,
      });

      expect(event.metadata.messageType).toBe('jsonrpc_notification');
    });

    it('should infer message type for LLM API message', () => {
      const message = { role: 'user', content: 'Hello' };

      const event = createProtocolMessageEvent({
        actor: 'host_app',
        direction: 'sent',
        lane: 'host_llm',
        message: message as any,
      });

      expect(event.metadata.messageType).toBe('llm_message');
    });

    it('should allow manual messageType override', () => {
      const message = createJSONRPCRequest(1, 'initialize');

      const event = createProtocolMessageEvent({
        actor: 'host_app',
        direction: 'sent',
        lane: 'host_mcp',
        message,
        messageType: 'custom_type',
      });

      expect(event.metadata.messageType).toBe('custom_type');
    });
  });

  describe('createConsoleLogEvent', () => {
    it('should create a valid console log event', () => {
      const event = createConsoleLogEvent({
        actor: 'host_app',
        logLevel: 'info',
        logMessage: 'Connecting to MCP server...',
        badgeType: 'SYSTEM',
        phase: 'initialization',
      });

      expect(event.eventType).toBe('console_log');
      expect(event.actor).toBe('host_app');
      expect(event.logLevel).toBe('info');
      expect(event.logMessage).toBe('Connecting to MCP server...');
      expect(event.badgeType).toBe('SYSTEM');
      expect(event.metadata.phase).toBe('initialization');
      expect(event.metadata.messageType).toBe('console_log');
    });

    it('should create error level logs', () => {
      const event = createConsoleLogEvent({
        actor: 'mcp_server',
        logLevel: 'error',
        logMessage: 'Connection failed',
        badgeType: 'SERVER',
      });

      expect(event.logLevel).toBe('error');
    });

    it('should create debug level logs', () => {
      const event = createConsoleLogEvent({
        actor: 'llm',
        logLevel: 'debug',
        logMessage: 'Processing request',
        badgeType: 'LLM',
      });

      expect(event.logLevel).toBe('debug');
    });
  });

  describe('createInternalOperationEvent', () => {
    it('should create a valid internal operation event', () => {
      const event = createInternalOperationEvent({
        actor: 'host_app',
        operationType: 'schema_conversion',
        description: 'Formatting tool schemas for LLM context',
        phase: 'discovery',
      });

      expect(event.eventType).toBe('internal_operation');
      expect(event.actor).toBe('host_app');
      expect(event.operationType).toBe('schema_conversion');
      expect(event.description).toBe('Formatting tool schemas for LLM context');
      expect(event.metadata.phase).toBe('discovery');
      expect(event.metadata.messageType).toBe('internal_operation');
    });

    it('should include custom metadata', () => {
      const event = createInternalOperationEvent({
        actor: 'host_app',
        operationType: 'tool_execution',
        description: 'Executing search_documentation',
        metadata: {
          toolName: 'search_documentation',
          toolArguments: { search_phrase: 'S3', limit: 10 },
        },
      });

      expect(event.metadata.toolName).toBe('search_documentation');
      expect(event.metadata.toolArguments).toEqual({
        search_phrase: 'S3',
        limit: 10,
      });
    });
  });

  describe('Convenience functions', () => {
    it('createUserInputLog should create user input console log', () => {
      const event = createUserInputLog('Search AWS docs for S3');

      expect(event.eventType).toBe('console_log');
      expect(event.actor).toBe('host_app');
      expect(event.badgeType).toBe('USER_INPUT');
      expect(event.logMessage).toBe('Search AWS docs for S3');
      expect(event.metadata.phase).toBe('initialization');
    });

    it('createSystemLog should create system console log', () => {
      const event = createSystemLog('Handshake complete ✓', 'initialization');

      expect(event.eventType).toBe('console_log');
      expect(event.actor).toBe('host_app');
      expect(event.badgeType).toBe('SYSTEM');
      expect(event.logMessage).toBe('Handshake complete ✓');
      expect(event.metadata.phase).toBe('initialization');
    });

    it('createServerLog should create server console log', () => {
      const event = createServerLog('Searching AWS documentation...', 'execution');

      expect(event.eventType).toBe('console_log');
      expect(event.actor).toBe('mcp_server');
      expect(event.badgeType).toBe('SERVER');
      expect(event.logMessage).toBe('Searching AWS documentation...');
      expect(event.metadata.phase).toBe('execution');
    });

    it('createLLMLog should create LLM console log', () => {
      const event = createLLMLog('Analyzing available tools...', 'selection');

      expect(event.eventType).toBe('console_log');
      expect(event.actor).toBe('llm');
      expect(event.badgeType).toBe('LLM');
      expect(event.logMessage).toBe('Analyzing available tools...');
      expect(event.metadata.phase).toBe('selection');
    });

    it('createCompleteLog should create completion console log', () => {
      const event = createCompleteLog('Response delivered', 'synthesis');

      expect(event.eventType).toBe('console_log');
      expect(event.actor).toBe('host_app');
      expect(event.badgeType).toBe('COMPLETE');
      expect(event.logMessage).toBe('Response delivered');
      expect(event.metadata.phase).toBe('synthesis');
    });
  });

  describe('JSON-RPC message builders', () => {
    it('createJSONRPCRequest should create valid request', () => {
      const message = createJSONRPCRequest(1, 'initialize', {
        protocolVersion: '2024-11-05',
      });

      expect(message.jsonrpc).toBe('2.0');
      expect(message.id).toBe(1);
      expect(message.method).toBe('initialize');
      expect(message.params).toEqual({ protocolVersion: '2024-11-05' });
    });

    it('createJSONRPCRequest should omit params if not provided', () => {
      const message = createJSONRPCRequest(2, 'tools/list');

      expect(message.jsonrpc).toBe('2.0');
      expect(message.id).toBe(2);
      expect(message.method).toBe('tools/list');
      expect(message.params).toBeUndefined();
    });

    it('createJSONRPCResponse should create valid response', () => {
      const message = createJSONRPCResponse(1, {
        protocolVersion: '2024-11-05',
        capabilities: {},
      });

      expect(message.jsonrpc).toBe('2.0');
      expect(message.id).toBe(1);
      expect(message.result).toEqual({
        protocolVersion: '2024-11-05',
        capabilities: {},
      });
    });

    it('createJSONRPCNotification should create valid notification', () => {
      const message = createJSONRPCNotification('initialized');

      expect(message.jsonrpc).toBe('2.0');
      expect(message.method).toBe('initialized');
      expect(message.id).toBeUndefined();
    });

    it('createJSONRPCNotification should include params if provided', () => {
      const message = createJSONRPCNotification('progress', {
        step: 1,
        total: 5,
      });

      expect(message.method).toBe('progress');
      expect(message.params).toEqual({ step: 1, total: 5 });
    });

    it('createJSONRPCError should create valid error response', () => {
      const message = createJSONRPCError(1, -32600, 'Invalid Request');

      expect(message.jsonrpc).toBe('2.0');
      expect(message.id).toBe(1);
      expect(message.error).toEqual({
        code: -32600,
        message: 'Invalid Request',
      });
    });

    it('createJSONRPCError should include data if provided', () => {
      const message = createJSONRPCError(1, -32600, 'Invalid Request', {
        details: 'Missing required field',
      });

      expect(message.error?.data).toEqual({ details: 'Missing required field' });
    });
  });

  describe('Edge cases', () => {
    it('should handle string IDs in JSON-RPC messages', () => {
      const message = createJSONRPCRequest('req-123', 'initialize');

      expect(message.id).toBe('req-123');
    });

    it('should handle empty params object', () => {
      const message = createJSONRPCRequest(1, 'test', {});

      expect(message.params).toEqual({});
    });

    it('should handle metadata with undefined values', () => {
      const event = createConsoleLogEvent({
        actor: 'host_app',
        logLevel: 'info',
        logMessage: 'Test',
        badgeType: 'SYSTEM',
        metadata: {
          phase: undefined,
        },
      });

      expect(event.metadata.phase).toBeUndefined();
    });
  });
});
