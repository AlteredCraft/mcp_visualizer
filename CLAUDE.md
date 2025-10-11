# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MCP Inspector Teaching App** - An educational tool that visualizes Model Context Protocol (MCP) communication between an LLM-powered chat interface and MCP servers. The goal is to teach users how MCP orchestrates tool calling through transparent, real-time message flow visualization.

This is an early-stage project (Python 3.13+) with extensive design documentation but minimal code implementation.

## Architecture

### Five-Column Actor-Based Layout

The application uses an **actor-based architecture** that mirrors sequence diagrams, with strict vertical alignment:

- **Column 1 (20%)**: Host App Actor - Chat interface and console logs
- **Column 2 (15%)**: Communication Lane (ingress/egress to LLM)
- **Column 3 (15%)**: LLM Actor - Inference service processing
- **Column 4 (15%)**: Communication Lane (ingress/egress to MCP Server)
- **Column 5 (35%)**: MCP Server Actor - Server operations and external API calls

**Critical Design Principle**: The LLM never directly communicates with MCP servers. The Host App orchestrates all communication. This is the primary pedagogical point of the visualization.

### Vertical Alignment System

**Most Important UI Requirement**: All columns maintain strict vertical alignment to correlate events across actors. Time flows top-to-bottom. Events at the same vertical position are causally related.

**Spacer Blocks**: When an actor has no activity during a step, empty spacer blocks MUST be rendered to maintain alignment. This is essential when one column (e.g., MCP Server) has multiple console logs while other columns are idle.

Example: When MCP Server logs "Searching AWS documentation..." and "Found 15 results", other columns show spacer blocks to give vertical space.

### Five-Phase MCP Workflow

The application visualizes all five phases of MCP tool invocation:

1. **Initialization & Negotiation**: `initialize` → response → `initialized` notification
2. **Discovery & Contextualization**: `tools/list` → Host App formats schemas for LLM
3. **Model-Driven Selection**: First LLM inference (planning) → returns `tool_calls` object
4. **Execution Round Trip**: `tools/call` → MCP server delegates to external API → result returned
5. **Synthesis & Final Response**: Second LLM inference (synthesis) → final natural language response

**Key Teaching Point**: The LLM makes TWO calls - one for planning (tool selection) and one for synthesis (final response).

### Event Recording Structure

All events (protocol messages, internal operations, console logs) are recorded with this structure:

```javascript
{
  sessionId: string,
  sequence: number,  // Global sequence across all events
  timestamp: number,
  eventType: 'protocol_message' | 'internal_operation' | 'console_log',
  actor: 'host_app' | 'llm' | 'mcp_server' | 'external_api',

  // For protocol messages
  direction?: 'sent' | 'received',
  lane?: 'host_llm' | 'host_mcp',
  message?: { /* JSON-RPC or LLM API content */ },

  // For console logs
  logLevel?: 'info' | 'debug' | 'error',
  logMessage?: string,

  metadata: {
    processingTime?: number,
    correlatedMessageId?: string,
    messageType: string,
    phase?: 'initialization' | 'discovery' | 'selection' | 'execution' | 'synthesis'
  }
}
```

This structure supports future playback and step-through features.

## Pre-configured MCP Server

**AWS Documentation MCP Server** (https://github.com/awslabs/aws-documentation-mcp-server)
- No API keys required (uses public AWS documentation)
- Must auto-connect on startup
- Tools: `search_documentation`, `read_documentation`, `recommend`

**Suggested First Queries**:
1. "Search AWS documentation for S3 bucket naming rules" - demonstrates single tool call
2. "Look up S3 bucket naming rules and show me related topics" - demonstrates multiple tool calls with complex vertical alignment
3. "What are the security best practices for Lambda functions?" - demonstrates LLM tool selection

## Visual Design

### Message Card Color Coding
- **Request cards** (Host → Server): Green left border (#10B981)
- **Response cards** (Server → Host): Blue right border (#3B82F6)
- **Notification cards**: Purple left border (#8b5cf6)
- **Errors**: Red border (#EF4444)

### Console Badge Colors
- **USER INPUT**: Gray (#f3f4f6)
- **SYSTEM**: Blue (#dbeafe)
- **INTERNAL**: Gray (#f3f4f6)
- **LLM**: Indigo (#e0e7ff)
- **SERVER**: Green (#d1fae5)
- **LOG**: Yellow (#fef3c7)
- **COMPLETE**: Gray (#f3f4f6)

### Typography
- Monospace font (Monaco, Menlo) for JSON and console logs
- Sans-serif (system fonts) for UI elements
- Timestamp format: HH:MM:SS.mmm
- Group headers: Sticky positioning, span all columns, show phase timing

## Implementation Notes

### Modular Component Architecture
- **Actor components**: Separate components for each actor column
- **Lane components**: Communication lane components for message cards
- **Spacer component**: Reusable component for empty cells maintaining alignment
- **Event bus**: Centralized event dispatcher
- **Layout engine**: Grid system that automatically inserts spacer blocks

### Message Interactions
- Click message card to expand/collapse full JSON payload
- Collapsed: Shows compact summary with `{ }` expand button
- Expanded: Shows formatted JSON with syntax highlighting
- Hover: Subtle elevation and shadow

## Development Priorities

1. **Phase 1**: Five-column grid with vertical alignment and spacer blocks
2. **Phase 2**: Message recording and event storage
3. **Phase 3**: Actor and lane rendering with automatic spacer block insertion
4. **Phase 4**: Interactive features (expand/collapse, syntax highlighting)
5. **Phase 5**: Live learning experience (AWS MCP server integration, suggested queries)
6. **Phase 6**: Polish and testing (100+ events performance testing)

## Testing & Validation

**Use Chrome DevTools MCP Server for all UI validation.** After implementing each feature or module:

1. **Start the dev server** and navigate to `http://localhost:3000` using `mcp__chrome-devtools__navigate_page`
2. **Take screenshots** (`take_screenshot`) to verify visual rendering against mockups
3. **Take snapshots** (`take_snapshot`) to extract DOM structure and element positions
4. **Run validation scripts** (`evaluate_script`) to programmatically verify:
   - Column widths match specification (20%, 15%, 15%, 15%, 35%)
   - Vertical alignment across all rows (all cells in a row have equal height)
   - Zustand store state (event recording, sequence numbers)
   - Component functionality (expand/collapse, interactions)
5. **Test interactions** (`click`, `hover`, `fill`) to verify user flows
6. **Check console** (`list_console_messages`) for JavaScript errors
7. **Monitor performance** (`performance_start_trace` / `performance_stop_trace`) for render times and Core Web Vitals

**Validation is mandatory before moving to the next module.** Document all validation results inline with implementation progress.

## Key Documentation

- [docs/MCP Inspector Teaching App - MVP Product Requirements Document.md](docs/MCP%20Inspector%20Teaching%20App%20-%20MVP%20Product%20Requirements%20Document.md) - Complete MVP specification with detailed requirements
- [docs/MCP Sequence diagram.md](docs/MCP%20Sequence%20diagram.md) - Protocol-compliant sequence diagram showing all five phases
- [docs/Mockups.md](docs/Mockups.md) - Visual mockups
- [docs/mcp-inspector-actor-based.html](docs/mcp-inspector-actor-based.html) - HTML mockup of the UI

## Critical Design Constraints

1. **Never allow direct LLM-to-MCP communication**: This violates the core teaching principle
2. **Always maintain vertical alignment**: Use spacer blocks religiously
3. **Record everything**: All events must be captured for future playback
4. **Two LLM calls**: Always show planning inference separate from synthesis inference
5. **Host App orchestrates everything**: Make this visually obvious through the column layout
