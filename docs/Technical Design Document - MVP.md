# MCP Inspector Teaching App - Technical Design Document (MVP)

**Version:** 1.0
**Last Updated:** 2025-10-09
**Status:** Draft for Review

---

## Implementation Progress

### Design Phase
- [x] Complete MVP PRD
- [x] Validate Python POC (all 5 phases working)
- [x] Create sequence diagrams
- [x] Write Technical Design Document
- [x] Design event recording architecture

### Module Implementation (23 days total)
- [x] **Module 1:** Layout & Grid System ✅ [Validation Results](Module%201%20Validation%20Results.md)
- [x] **Module 2:** Event Recording System ✅ [Validation Results](Module%202%20Validation%20Results.md)
- [x] **Module 3:** Actor Components ✅ [Validation Results](Module%203%20Validation%20Results.md)
- [x] **Module 4:** Communication Lane Components ✅ [Validation Results](Module%204%20Validation%20Results.md)
- [ ] **Module 5:** Layout Engine (3 days)
- [ ] **Module 6:** MCP Integration Layer (3 days)
- [ ] **Module 7:** LLM Integration (2 days)
- [ ] **Module 8:** Orchestration Engine (3 days)
- [ ] **Module 9:** Interactive Features & Polish (2 days)
- [ ] **Module 10:** Performance & Testing (3 days)

### Next Action
👉 **Ready to begin Module 5** - Implement Layout Engine with automatic spacer insertion

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Validated Foundation (Python POC)](#validated-foundation-python-poc)
3. [Architecture Overview](#architecture-overview)
4. [Technology Stack](#technology-stack)
5. [Domain Model](#domain-model)
6. [Progressive Implementation Modules](#progressive-implementation-modules)
7. [Key Integration Patterns](#key-integration-patterns)
8. [API References and Resources](#api-references-and-resources)
9. [Implementation Timeline](#implementation-timeline)
10. [Validation Strategy](#validation-strategy)

---

## Executive Summary

This technical design outlines a **progressive, module-based implementation** of the MCP Inspector Teaching App using **Next.js 15 (App Router)** with TypeScript. The design is informed by:

1. **Validated Python POC** ([mcp_visualizer/poc/](../mcp_visualizer/poc/)) - Proves all 5 MCP protocol phases work correctly
2. **Production-Ready Requirements** - Detailed in the [MVP PRD](MCP%20Inspector%20Teaching%20App%20-%20MVP%20Product%20Requirements%20Document.md)
3. **Official MCP Specification** - Model Context Protocol architecture and protocol flow. [online spec](https://modelcontextprotocol.io/specification/2025-06-18)

**Core Principle:** Build incrementally with testable validation at each stage. Each module is self-contained and can be verified independently before moving to the next.

---

## Validated Foundation (Python POC)

### What the POC Proves ✅

The Python POC ([README](../mcp_visualizer/poc/README.md)) successfully validates:

1. **Real Protocol Traffic** - 100% authentic MCP JSON-RPC 2.0 messages (no mocking)
2. **3-Message Handshake** - `initialize` → `InitializeResult` → `initialized` notification
3. **Tool Discovery** - `tools/list` returns real tool schemas with `inputSchema`
4. **Tool Execution** - `tools/call` with proper request/response structure
5. **Two-Phase LLM Pattern** - Planning inference separate from synthesis inference
6. **Host Orchestration** - All communication flows through Host App (no direct LLM↔MCP)
7. **Schema Conversion** - MCP `inputSchema` → Claude API `input_schema` (field rename only)
8. **Stdio Transport** - Process spawning with stdin/stdout communication

### Key Code References

| Component | Python POC | Purpose |
|-----------|------------|---------|
| MCP Client | [client.py](../mcp_visualizer/poc/client.py) | Connection, handshake, tool operations |
| Claude Integration | [claude_client.py](../mcp_visualizer/poc/claude_client.py) | Schema conversion, two-phase inference |
| Orchestrator | [orchestrator.py](../mcp_visualizer/poc/orchestrator.py) | Complete 5-phase workflow |
| Test Server | [simple_server.py](../mcp_visualizer/poc/simple_server.py) | FastMCP server with tools |

### Validation Documentation

- **Protocol Verification**: [PROTOCOL_VERIFICATION.md](../mcp_visualizer/poc/PROTOCOL_VERIFICATION.md)
- **Sequence Diagram**: [MCP Sequence diagram.md](MCP%20Sequence%20diagram.md)
- **Event Recording Architecture**: [Event Recording System Diagram.md](Event%20Recording%20System%20Diagram.md)

---

## Architecture Overview

### Official MCP Architecture

**Source:** [Model Context Protocol - Architecture](https://modelcontextprotocol.io/docs/learn/architecture)

```
┌─────────────────────────────────────────────────────────┐
│                        MCP Host                         │
│                    (AI Application)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │                   MCP Client                      │  │
│  │            (Connection Component)                 │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ JSON-RPC 2.0 (stdio/HTTP)
┌────────────────────┴────────────────────────────────────┐
│                      MCP Server                         │
│                  (Context Provider)                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Primitives: Tools, Resources, Prompts          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Our Implementation: Actor-Based Visualization

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Host App     │ Host ↔ LLM   │ LLM          │ Host ↔ MCP   │ MCP Server   │
│ (20%)        │ (15%)        │ (15%)        │ (15%)        │ (35%)        │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Chat UI      │ LLM Request  │ Processing   │ initialize   │ Handshake    │
│ Console Logs │ Cards        │ Indicators   │ tools/list   │ Tool Exec    │
│ User Input   │              │              │ tools/call   │ External API │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
    ▲                                                              ▲
    │                                                              │
    └──────────  Host orchestrates all communication   ────────────┘

(LLM never talks directly to MCP)

```

**Pedagogical Goal:** Visualize that the Host App bridges LLM and MCP Server, proving they never directly communicate.

---

## Technology Stack

### Core Framework

- **Next.js 15** (App Router) - [https://nextjs.org/](https://nextjs.org/)
  - Client-side rendering for interactive visualization
  - TypeScript 5.x with strict mode
  - App Router for modern React patterns

### Styling

- **Tailwind CSS 3.x** - [https://tailwindcss.com/](https://tailwindcss.com/)
  - Custom theme matching HTML mockup colors
  - Utility-first styling for rapid development

### State Management

- **Zustand 5.x** - [https://zustand.docs.pmnd.rs/](https://zustand.docs.pmnd.rs/)
  - Lightweight state management for timeline events
  - Minimal boilerplate, excellent TypeScript support

### MCP Integration

- **@modelcontextprotocol/sdk** - [https://github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
  - Official TypeScript SDK for MCP protocol
  - Classes: `Client`, `StdioClientTransport`, `Tool`, `Resource`
  - Protocol version: `2024-11-05` (latest stable)

### LLM Integration

- **@anthropic-ai/sdk** - [https://github.com/anthropics/anthropic-sdk-typescript](https://github.com/anthropics/anthropic-sdk-typescript)
  - Official Claude API client
  - Model: `claude-sonnet-4-20250514` (as validated in POC)

### Additional Libraries

- **Immer 10.x** - Immutable state updates for event recording
- **react-syntax-highlighter** - JSON syntax highlighting for message cards
- **date-fns** - Timestamp formatting (HH:MM:SS.mmm)

### Development Tools

- **TypeScript 5.x** - Type safety throughout
- **ESLint + Prettier** - Code quality and formatting
- **Jest + React Testing Library** - Unit and integration tests

---

## Domain Model

### Core Types

```typescript
// ============================================================================
// Event System (Timeline Recording)
// ============================================================================

type EventType = 'protocol_message' | 'internal_operation' | 'console_log';
type Actor = 'host_app' | 'llm' | 'mcp_server' | 'external_api';
type CommunicationLane = 'host_llm' | 'host_mcp';
type Phase = 'initialization' | 'discovery' | 'selection' | 'execution' | 'synthesis';

interface TimelineEvent {
  sessionId: string;
  sequence: number;           // Global sequence across all events
  timestamp: number;          // Unix timestamp in milliseconds
  eventType: EventType;
  actor: Actor;
  metadata: EventMetadata;
}

interface ProtocolMessageEvent extends TimelineEvent {
  eventType: 'protocol_message';
  direction: 'sent' | 'received';
  lane: CommunicationLane;
  message: JSONRPCMessage | LLMAPIMessage;
}

interface ConsoleLogEvent extends TimelineEvent {
  eventType: 'console_log';
  logLevel: 'info' | 'debug' | 'error';
  logMessage: string;
  badgeType: ConsoleBadgeType;
}

interface InternalOperationEvent extends TimelineEvent {
  eventType: 'internal_operation';
  operationType: string;
  description: string;
}

// ============================================================================
// Message Cards (Communication Lanes)
// ============================================================================

type MessageCardType = 'request' | 'response' | 'notification';

interface MessageCard {
  id: string;
  type: MessageCardType;
  method: string;              // e.g., "initialize", "tools/call"
  sequence?: number;           // For requests/responses (correlates req #1 with resp #1)
  direction: 'sent' | 'received';
  timing?: number;             // For responses (processing time in ms)
  payload: object;             // Full JSON-RPC or LLM API payload
  isExpanded: boolean;         // UI state for expand/collapse
}

// JSON-RPC Message Structure (from MCP spec)
interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: number | string;         // Present in requests (expects response)
  method: string;
  params?: object;
}

interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: number | string;         // Matches request ID
  result?: object;
  error?: JSONRPCError;
}

interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;              // No id field (fire-and-forget)
  params?: object;
}

// ============================================================================
// Grid Layout System
// ============================================================================

interface ColumnDefinition {
  id: string;
  type: 'actor' | 'lane';
  actor?: Actor;
  lane?: CommunicationLane;
  width: string;               // Tailwind width class (e.g., "w-1/5")
  title: string;
}

interface TimelineRow {
  rowId: string;
  sequence: number;
  cells: RowCell[];
}

interface RowCell {
  columnId: string;
  cellType: 'content' | 'spacer';
  content?: CellContent;
}

type CellContent =
  | { type: 'chat_bubble'; role: 'user' | 'assistant'; text: string }
  | { type: 'console_log'; event: ConsoleLogEvent }
  | { type: 'message_card'; card: MessageCard }
  | { type: 'thinking_indicator'; message: string }
  | { type: 'phase_header'; phase: Phase; timing: number };

// ============================================================================
// MCP Integration Types
// ============================================================================

interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;         // JSON Schema format
}

interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;             // Base64 for images
    mimeType?: string;
  }>;
  isError: boolean;
  meta?: object;
}

// ============================================================================
// Claude API Types
// ============================================================================

interface ClaudeTool {
  name: string;
  description: string;
  input_schema: object;        // Renamed from MCP's inputSchema
}

interface ClaudeToolUse {
  type: 'tool_use';
  id: string;                  // Tool use ID for correlation
  name: string;
  input: object;
}

interface ClaudeToolResult {
  type: 'tool_result';
  tool_use_id: string;         // Matches ClaudeToolUse.id
  content: string;
}
```

### Column Configuration

```typescript
const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  {
    id: 'host_app',
    type: 'actor',
    actor: 'host_app',
    width: 'w-[20%]',
    title: 'Host App'
  },
  {
    id: 'lane_host_llm',
    type: 'lane',
    lane: 'host_llm',
    width: 'w-[15%]',
    title: 'Host ↔ LLM'
  },
  {
    id: 'llm',
    type: 'actor',
    actor: 'llm',
    width: 'w-[15%]',
    title: 'LLM'
  },
  {
    id: 'lane_host_mcp',
    type: 'lane',
    lane: 'host_mcp',
    width: 'w-[15%]',
    title: 'Host ↔ MCP'
  },
  {
    id: 'mcp_server',
    type: 'actor',
    actor: 'mcp_server',
    width: 'w-[35%]',
    title: 'MCP Server'
  }
];
```

---

## Progressive Implementation Modules

Each module is self-contained with clear validation criteria. Implementation proceeds sequentially, with each module building on the previous.

### Module 1: Foundation - Layout & Grid System

**Duration:** 2 days
**Goal:** Establish five-column grid with vertical alignment and spacer block system

#### Deliverables

```
src/
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Main page (client component)
│   └── globals.css          # Tailwind imports + custom styles
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx           # Header with recording badge
│   │   ├── TimelineContainer.tsx   # Main timeline wrapper
│   │   ├── TimelineHeader.tsx      # 5-column header
│   │   └── StatusBar.tsx           # Bottom status bar
│   ├── grid/
│   │   ├── TimelineRow.tsx         # Row wrapper
│   │   ├── RowCell.tsx             # Cell wrapper (content or spacer)
│   │   └── SpacerBlock.tsx         # Empty cell for alignment
│   └── column-definitions.ts       # COLUMN_DEFINITIONS constant
├── types/
│   └── domain.ts            # All domain model types
└── lib/
    └── constants.ts         # Colors, badge types, etc.
```

#### Implementation Notes

**Tailwind Configuration:**
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        request: '#10B981',      // Green left border
        response: '#3B82F6',     // Blue right border
        notification: '#8b5cf6', // Purple left border
        error: '#EF4444',        // Red border
      },
      fontFamily: {
        mono: ['Monaco', 'Menlo', 'monospace'],
      }
    }
  }
}
```

**Grid Layout Pattern:**
```typescript
// TimelineRow.tsx
<div className="grid grid-cols-[20%_15%_15%_15%_35%] min-h-[60px] border-b">
  {cells.map(cell => (
    <RowCell key={cell.columnId} cell={cell} />
  ))}
</div>
```

#### Validation Criteria

- [ ] Render 5 mock rows with mixed content and spacer blocks
- [ ] Verify column widths: 20%, 15%, 15%, 15%, 35%
- [ ] Verify strict vertical alignment visually
- [ ] Test responsive behavior (minimum width requirement)

---

### Module 2: Event Recording System

**Duration:** 1 day
**Goal:** Build event store and timeline state management

> **📊 Detailed Architecture:** See [Event Recording System Diagram.md](Event%20Recording%20System%20Diagram.md) for comprehensive diagrams, data loss analysis, and playback support validation.

#### Deliverables

```
src/
├── store/
│   ├── timeline-store.ts    # Zustand store
│   └── types.ts             # Store-specific types
├── lib/
│   ├── event-builder.ts     # Helper functions to create events
│   ├── session.ts           # Session ID generation (UUID)
│   └── mock-events.ts       # Generate realistic mock events
└── hooks/
    └── use-timeline.ts      # React hook wrapping store
```

#### Store Design

```typescript
// timeline-store.ts
interface TimelineStore {
  // State
  sessionId: string;
  events: TimelineEvent[];
  currentSequence: number;

  // Actions
  addEvent: (event: Omit<TimelineEvent, 'sessionId' | 'sequence' | 'timestamp'>) => void;
  clearEvents: () => void;
  getEventsByPhase: (phase: Phase) => TimelineEvent[];
  getEventsByActor: (actor: Actor) => TimelineEvent[];
  exportSession: () => string; // JSON export
}
```

#### Validation Criteria

- [ ] Record 100+ events with proper sequence numbers
- [ ] Verify events maintain chronological order
- [ ] Test session ID uniqueness
- [ ] Generate complete 5-phase workflow mock data
- [ ] Performance test: 500 events without lag

---

### Module 3: Actor Components (Content Blocks)

**Duration:** 2 days
**Goal:** Build all content block components for actor columns

#### Deliverables

```
src/components/actors/
├── ChatBubble.tsx           # User/assistant message bubbles
├── ConsoleBlock.tsx         # Console logs with badges
├── ThinkingIndicator.tsx    # Animated dots
└── ActorCell.tsx            # Wrapper component
```

#### Component Specifications

**ChatBubble:**
- User: Right-aligned, blue background (#2563eb)
- Assistant: Left-aligned, gray background (#f0f0f0)

**ConsoleBlock Badges:**
| Badge Type | Background | Text Color | Use Case |
|------------|------------|------------|----------|
| USER_INPUT | #f3f4f6 | #6b7280 | User message received |
| SYSTEM | #dbeafe | #1e40af | System events |
| INTERNAL | #f3f4f6 | #6b7280 | Internal processing |
| LLM | #e0e7ff | #3730a3 | LLM operations |
| SERVER | #d1fae5 | #065f46 | MCP server operations |
| LOG | #fef3c7 | #92400e | Generic logs |
| COMPLETE | #f3f4f6 | #6b7280 | Completion markers |

**ThinkingIndicator:**
- Three animated dots with staggered animation
- Gray color (#9ca3af)
- Italic text: "Analyzing available tools..." or "Generating final response..."

#### Validation Criteria

- [ ] Render all console badge types with correct colors
- [ ] Render user/assistant chat bubbles with proper alignment
- [ ] Verify animated thinking indicator
- [ ] Test with mock events from Module 2

---

### Module 4: Communication Lane Components (Message Cards)

**Duration:** 2 days
**Goal:** Build message card components with expand/collapse functionality

#### Deliverables

```
src/components/lanes/
├── MessageCard.tsx          # Request/response/notification variants
├── LaneCell.tsx             # Lane cell wrapper
└── JSONPayloadView.tsx      # Syntax-highlighted JSON
```

#### Message Card Design

**Visual Indicators:**
- REQUEST: Green left border (#10B981), sequence number (#1, #2, etc.), arrow →
- RESPONSE: Blue right border (#3B82F6), timing info (e.g., "33ms"), arrow ←
- NOTIFICATION: Purple left border (#8b5cf6), no sequence number, arrow →

**Interaction:**
1. Collapsed: Shows method name, sequence, direction, expand button `{ }`
2. Expanded: Shows full JSON payload with syntax highlighting
3. Click anywhere on card to toggle

**JSON Syntax Highlighting:**
```typescript
// Using react-syntax-highlighter
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

<SyntaxHighlighter language="json" style={vscDarkPlus}>
  {JSON.stringify(payload, null, 2)}
</SyntaxHighlighter>
```

#### Validation Criteria

- [ ] Render all three message card types (REQUEST, RESPONSE, NOTIFY)
- [ ] Click to expand/collapse cards
- [ ] Verify JSON syntax highlighting
- [ ] Test correlation: request #1 matches response #1
- [ ] Verify timing display on responses

---

### Module 5: Layout Engine (Automatic Spacer Insertion)

**Duration:** 3 days
**Goal:** Implement automatic spacer block generation to maintain vertical alignment

#### Deliverables

```
src/lib/
├── layout-engine.ts         # Main algorithm
├── row-builder.ts           # Events → TimelineRow[]
└── phase-detector.ts        # Detect phase boundaries
```

#### Row Builder Algorithm

```typescript
/**
 * Converts timeline events into rows with automatic spacer insertion.
 *
 * Key Principle: All columns must have content or spacer at every sequence.
 * This maintains strict vertical alignment across all actors.
 */
function buildRows(events: TimelineEvent[]): TimelineRow[] {
  const rows: TimelineRow[] = [];

  // Group events by sequence number
  const eventsBySequence = groupBy(events, 'sequence');

  for (const [sequence, eventsAtSequence] of eventsBySequence) {
    const row: TimelineRow = {
      rowId: generateId(),
      sequence,
      cells: []
    };

    // For each column, check if there's an event
    for (const column of COLUMN_DEFINITIONS) {
      const eventForColumn = findEventForColumn(eventsAtSequence, column);

      if (eventForColumn) {
        row.cells.push({
          columnId: column.id,
          cellType: 'content',
          content: mapEventToContent(eventForColumn)
        });
      } else {
        // Insert spacer block to maintain alignment
        row.cells.push({
          columnId: column.id,
          cellType: 'spacer'
        });
      }
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Finds the event that belongs in a specific column.
 */
function findEventForColumn(
  events: TimelineEvent[],
  column: ColumnDefinition
): TimelineEvent | null {
  if (column.type === 'actor') {
    return events.find(e => e.actor === column.actor) || null;
  } else if (column.type === 'lane') {
    return events.find(e =>
      e.eventType === 'protocol_message' &&
      e.lane === column.lane
    ) || null;
  }
  return null;
}
```

#### Phase Header Insertion

```typescript
/**
 * Inserts phase headers at boundaries between phases.
 */
function insertPhaseHeaders(rows: TimelineRow[]): TimelineRow[] {
  const result: TimelineRow[] = [];
  let currentPhase: Phase | null = null;

  for (const row of rows) {
    const rowPhase = detectPhase(row);

    if (rowPhase && rowPhase !== currentPhase) {
      // Insert phase header row
      result.push(createPhaseHeaderRow(rowPhase));
      currentPhase = rowPhase;
    }

    result.push(row);
  }

  return result;
}
```

#### Validation Criteria

- [ ] Render complete 5-phase workflow from mock events
- [ ] Verify spacer blocks appear in correct positions
- [ ] Visual test: all rows maintain vertical alignment
- [ ] Test edge case: MCP Server with 3 console logs → other columns show 3 spacers
- [ ] Verify phase headers appear at correct boundaries

---

### Module 6: MCP Integration Layer

**Duration:** 3 days
**Goal:** Connect to MCP servers via TypeScript SDK

#### Deliverables

```
src/lib/mcp/
├── client.ts                # MCP client wrapper (TypeScript port of POC client.py)
├── connection.ts            # Connection lifecycle management
├── message-handlers.ts      # Protocol message handlers
└── aws-docs-server.ts       # AWS Documentation server configuration
```

#### SDK Integration Pattern

**Based on:** [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) and POC [client.py](../mcp_visualizer/poc/client.py)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

class MCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;

  async connect(serverCommand: string, serverArgs: string[]) {
    // Create stdio transport
    this.transport = new StdioClientTransport({
      command: serverCommand,
      args: serverArgs,
    });

    // Create client
    this.client = new Client(
      { name: "mcp-inspector", version: "1.0.0" },
      { capabilities: {} }
    );

    // Connect (handles 3-message handshake automatically)
    await this.client.connect(this.transport);

    // Record initialization events
    this.recordEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logMessage: 'Handshake complete ✓'
    });
  }

  async listTools(): Promise<MCPTool[]> {
    const response = await this.client.listTools();

    // Record tool discovery
    this.recordEvent({
      eventType: 'protocol_message',
      actor: 'host_app',
      direction: 'received',
      lane: 'host_mcp',
      message: response
    });

    return response.tools.map(tool => ({
      name: tool.name,
      description: tool.description || '',
      inputSchema: tool.inputSchema
    }));
  }

  async callTool(name: string, args: object): Promise<MCPToolResult> {
    const result = await this.client.callTool({ name, arguments: args });

    // Record tool execution
    this.recordEvent({
      eventType: 'protocol_message',
      actor: 'mcp_server',
      direction: 'received',
      lane: 'host_mcp',
      message: result
    });

    return result;
  }
}
```

#### AWS Documentation MCP Server Configuration

**Source:** [AWS Documentation MCP Server](https://awslabs.github.io/mcp/servers/aws-documentation-mcp-server)

```typescript
const AWS_DOCS_SERVER_CONFIG = {
  command: 'uvx',
  args: ['awslabs.aws-documentation-mcp-server@latest'],
  env: {
    FASTMCP_LOG_LEVEL: 'ERROR',
    AWS_DOCUMENTATION_PARTITION: 'aws'
  }
};

// Available tools (automatically discovered):
// - search_documentation(search_phrase: string, limit?: number)
// - read_documentation(url: string)
// - recommend(url: string)
```

#### Event Recording Integration

Every MCP operation records timeline events:

| Operation | Events Recorded |
|-----------|----------------|
| connect() | Console log: "Connecting to MCP server..." |
| initialize handshake | Protocol messages: initialize → response → initialized |
| listTools() | Protocol messages: tools/list request → response |
| callTool() | Protocol messages: tools/call request → response |
| Server logs | Console logs from stderr (if available) |

#### Validation Criteria

- [ ] Auto-connect to AWS Documentation MCP server on app load
- [ ] Successfully complete 3-message initialization handshake
- [ ] Discover all 3 tools (search_documentation, read_documentation, recommend)
- [ ] Record all protocol messages as timeline events
- [ ] Display connection status in UI
- [ ] Handle connection errors gracefully

---

### Module 7: LLM Integration (Anthropic Claude)

**Duration:** 2 days
**Goal:** Integrate Claude API for two-phase inference (planning + synthesis)

#### Deliverables

```
src/lib/llm/
├── claude-client.ts         # Claude API wrapper (TypeScript port of POC claude_client.py)
├── tool-formatter.ts        # MCP → Claude schema conversion
└── inference.ts             # Planning and synthesis functions
```

#### Claude Client Implementation

**Based on:** POC [claude_client.py](../mcp_visualizer/poc/claude_client.py)

```typescript
import Anthropic from '@anthropic-ai/sdk';

class ClaudeClient {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Convert MCP tool schemas to Claude API format.
   * Key difference: inputSchema → input_schema (field rename)
   */
  convertMCPToolsToClaudeFormat(mcpTools: MCPTool[]): ClaudeTool[] {
    return mcpTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema, // Rename field
    }));
  }

  /**
   * First inference: Planning (tool selection)
   */
  async planningInference(
    userMessage: string,
    tools: ClaudeTool[]
  ): Promise<Anthropic.Message> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: userMessage }],
      tools,
    });

    // Record LLM request/response as timeline events
    this.recordInferenceEvents(response, 'planning');

    return response;
  }

  /**
   * Extract tool calls from Claude response.
   */
  extractToolCalls(response: Anthropic.Message): ClaudeToolUse[] {
    return response.content
      .filter(block => block.type === 'tool_use')
      .map(block => ({
        type: 'tool_use',
        id: block.id,
        name: block.name,
        input: block.input,
      }));
  }

  /**
   * Format MCP tool result for Claude.
   */
  formatToolResultForClaude(
    toolUseId: string,
    mcpResult: MCPToolResult
  ): ClaudeToolResult {
    // Extract text from MCP content blocks
    const text = mcpResult.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n');

    return {
      type: 'tool_result',
      tool_use_id: toolUseId,
      content: text || JSON.stringify(mcpResult),
    };
  }

  /**
   * Second inference: Synthesis (final response)
   */
  async synthesisInference(
    conversationHistory: Anthropic.MessageParam[],
    tools: ClaudeTool[]
  ): Promise<Anthropic.Message> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: conversationHistory,
      tools,
    });

    // Record LLM request/response as timeline events
    this.recordInferenceEvents(response, 'synthesis');

    return response;
  }
}
```

#### Conversation History Building

```typescript
/**
 * Build conversation history for synthesis inference.
 * Includes: user message → assistant tool_use → user tool_result
 */
function buildConversationWithResults(
  userMessage: string,
  planningResponse: Anthropic.Message,
  toolResults: ClaudeToolResult[]
): Anthropic.MessageParam[] {
  return [
    // User's original query
    { role: 'user', content: userMessage },

    // Assistant's tool selection (from planning response)
    {
      role: 'assistant',
      content: planningResponse.content
    },

    // Tool results
    {
      role: 'user',
      content: toolResults
    }
  ];
}
```

#### Validation Criteria

- [ ] Format AWS Documentation tools for Claude
- [ ] Perform first inference with tool schemas
- [ ] Verify tool_use blocks in response
- [ ] Extract tool calls correctly
- [ ] Format MCP tool results for Claude
- [ ] Perform second inference with tool results
- [ ] Verify final natural language response
- [ ] Record all LLM interactions as timeline events

---

### Module 8: Orchestration Engine (Complete Workflow)

**Duration:** 3 days
**Goal:** Tie together MCP + LLM to execute full 5-phase workflow

#### Deliverables

```
src/lib/orchestration/
├── workflow.ts              # Main orchestrator (TypeScript port of POC orchestrator.py)
├── phases.ts                # Individual phase functions
└── tool-executor.ts         # Execute multiple tools sequentially
```

#### Complete Workflow Implementation

**Based on:** POC [orchestrator.py](../mcp_visualizer/poc/orchestrator.py)

```typescript
/**
 * Execute complete 5-phase MCP workflow.
 * Mirrors the Python POC orchestrator pattern.
 */
async function executeWorkflow(userMessage: string): Promise<string> {
  // ===================================================================
  // PHASE 1: INITIALIZATION & NEGOTIATION
  // ===================================================================

  if (!mcpClient.isConnected()) {
    await mcpClient.connect(
      AWS_DOCS_SERVER_CONFIG.command,
      AWS_DOCS_SERVER_CONFIG.args
    );

    recordEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logMessage: 'Handshake complete ✓',
      metadata: { phase: 'initialization' }
    });
  }

  // ===================================================================
  // PHASE 2: DISCOVERY & CONTEXTUALIZATION
  // ===================================================================

  const mcpTools = await mcpClient.listTools();

  recordEvent({
    eventType: 'console_log',
    actor: 'host_app',
    logMessage: `Discovered ${mcpTools.length} tool(s)`,
    metadata: { phase: 'discovery' }
  });

  const claudeTools = claudeClient.convertMCPToolsToClaudeFormat(mcpTools);

  recordEvent({
    eventType: 'internal_operation',
    actor: 'host_app',
    operationType: 'schema_conversion',
    description: 'Formatting tool schemas for LLM context',
    metadata: { phase: 'discovery' }
  });

  // ===================================================================
  // PHASE 3: MODEL-DRIVEN SELECTION (First LLM Inference)
  // ===================================================================

  recordEvent({
    eventType: 'console_log',
    actor: 'host_app',
    logMessage: 'Calling LLM for tool planning',
    metadata: { phase: 'selection' }
  });

  const planningResponse = await claudeClient.planningInference(
    userMessage,
    claudeTools
  );

  const toolCalls = claudeClient.extractToolCalls(planningResponse);

  if (toolCalls.length === 0) {
    // LLM chose not to use tools
    return extractTextResponse(planningResponse);
  }

  recordEvent({
    eventType: 'console_log',
    actor: 'host_app',
    logMessage: `LLM selected ${toolCalls.length} tool(s)`,
    metadata: { phase: 'selection' }
  });

  // ===================================================================
  // PHASE 4: EXECUTION ROUND TRIP
  // ===================================================================
  // Note: All tools execute sequentially within this phase

  const toolResults: ClaudeToolResult[] = [];

  for (const toolCall of toolCalls) {
    recordEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logMessage: `Invoking tool: ${toolCall.name}`,
      metadata: {
        phase: 'execution',
        toolName: toolCall.name,
        toolArguments: toolCall.input
      }
    });

    const mcpResult = await mcpClient.callTool(
      toolCall.name,
      toolCall.input
    );

    const claudeResult = claudeClient.formatToolResultForClaude(
      toolCall.id,
      mcpResult
    );

    toolResults.push(claudeResult);

    recordEvent({
      eventType: 'console_log',
      actor: 'host_app',
      logMessage: `Received result from ${toolCall.name}`,
      metadata: { phase: 'execution' }
    });
  }

  recordEvent({
    eventType: 'internal_operation',
    actor: 'host_app',
    operationType: 'context_append',
    description: 'Appending tool results to conversation',
    metadata: { phase: 'execution' }
  });

  // ===================================================================
  // PHASE 5: SYNTHESIS & FINAL RESPONSE (Second LLM Inference)
  // ===================================================================

  recordEvent({
    eventType: 'console_log',
    actor: 'host_app',
    logMessage: 'Calling LLM for final synthesis',
    metadata: { phase: 'synthesis' }
  });

  const conversationHistory = buildConversationWithResults(
    userMessage,
    planningResponse,
    toolResults
  );

  const synthesisResponse = await claudeClient.synthesisInference(
    conversationHistory,
    claudeTools
  );

  const finalText = extractTextResponse(synthesisResponse);

  recordEvent({
    eventType: 'console_log',
    actor: 'host_app',
    logMessage: `Response delivered. Total time: ${totalTime}ms`,
    badgeType: 'COMPLETE',
    metadata: { phase: 'synthesis' }
  });

  return finalText;
}
```

#### Multi-Tool Execution Pattern

```typescript
/**
 * Execute multiple tools sequentially.
 * Important: Phase 4 completes ALL tool executions before moving to Phase 5.
 */
async function executeAllTools(
  toolCalls: ClaudeToolUse[]
): Promise<ClaudeToolResult[]> {
  const results: ClaudeToolResult[] = [];

  for (const toolCall of toolCalls) {
    // Each tool execution is recorded as a separate set of events
    const result = await executeSingleTool(toolCall);
    results.push(result);
  }

  return results;
}
```

#### Validation Criteria

- [ ] Execute suggested query #1: "Search AWS documentation for S3 bucket naming rules"
- [ ] Verify all 5 phases execute correctly
- [ ] Verify timeline shows complete workflow with proper vertical alignment
- [ ] Execute suggested query #2 (multiple tools)
- [ ] Verify Phase 4 executes all tools sequentially before Phase 5
- [ ] Display final assistant response in chat
- [ ] Verify all events recorded with correct phases

---

### Module 9: Interactive Features & Polish

**Duration:** 2 days
**Goal:** Add suggested queries, controls, and UI polish

#### Deliverables

```
src/components/controls/
├── SuggestedQueries.tsx     # Pre-configured query buttons
├── SessionControls.tsx      # Clear/reset controls
└── CopyLogButton.tsx        # Export session logs
```

#### Suggested Queries

**From PRD Section 11.2:**

```typescript
const SUGGESTED_QUERIES = [
  {
    id: 'q1',
    label: 'Single Tool Example',
    query: 'Search AWS documentation for S3 bucket naming rules',
    description: 'Demonstrates single tool call workflow'
  },
  {
    id: 'q2',
    label: 'Multiple Tools Example',
    query: 'Look up S3 bucket naming rules and show me related topics',
    description: 'Demonstrates multiple tool calls with complex alignment'
  },
  {
    id: 'q3',
    label: 'Model-Driven Selection',
    query: 'What are the security best practices for Lambda functions?',
    description: 'Demonstrates LLM autonomously selecting appropriate tools'
  }
];
```

#### Session Controls

```typescript
// SessionControls.tsx
function SessionControls() {
  const { clearEvents, exportSession } = useTimeline();

  return (
    <div className="flex gap-2">
      <button onClick={clearEvents}>
        Clear Timeline
      </button>
      <button onClick={() => {
        const json = exportSession();
        navigator.clipboard.writeText(json);
      }}>
        Copy Session Log
      </button>
    </div>
  );
}
```

#### UI Polish Checklist

- [ ] Sticky phase headers during scroll
- [ ] Hover effects on message cards (elevation + shadow)
- [ ] Loading states during LLM inference (thinking indicator)
- [ ] Error display in timeline (red border message cards)
- [ ] Smooth scrolling to latest event
- [ ] Connection status indicator in status bar
- [ ] Event count display in status bar

#### Validation Criteria

- [ ] Click suggested query → auto-fills input and executes
- [ ] Click clear → resets timeline and session
- [ ] Click copy log → exports all events as JSON
- [ ] Scroll timeline → phase headers stick to top
- [ ] Hover message card → elevation effect visible
- [ ] Display loading state during LLM calls

---

### Module 10: Performance & Testing

**Duration:** 3 days
**Goal:** Optimize for 100+ events and add comprehensive testing

#### Deliverables

```
src/__tests__/
├── unit/
│   ├── layout-engine.test.ts        # Row builder algorithm
│   ├── event-builder.test.ts        # Event creation
│   ├── schema-conversion.test.ts    # MCP → Claude format
│   └── row-builder.test.ts          # Spacer insertion logic
├── integration/
│   ├── workflow.test.ts             # Complete 5-phase workflow
│   └── mcp-connection.test.ts       # MCP client operations
└── mocks/
    └── mock-data.ts                 # Mock events and responses
```

#### Performance Optimizations

1. **Memoization:**
```typescript
// Memoize row rendering
const MemoizedTimelineRow = React.memo(TimelineRow);

// Memoize cell rendering
const MemoizedRowCell = React.memo(RowCell);
```

2. **Virtual Scrolling (if needed):**
```typescript
// Use react-window for large timelines (500+ events)
import { FixedSizeList } from 'react-window';
```

3. **Zustand Selectors:**
```typescript
// Use selectors to prevent unnecessary re-renders
const events = useTimeline(state => state.events);
```

#### Test Coverage Goals

- [ ] Unit tests: 80%+ coverage
- [ ] Integration tests: All workflows
- [ ] Performance: 500 events < 100ms render time
- [ ] Memory: No leaks after 1000 events
- [ ] Error scenarios: Connection failures, API errors

#### Validation Criteria

- [ ] Load 500 events without lag
- [ ] Verify no memory leaks (Chrome DevTools)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Measure render performance < 100ms

---

## Key Integration Patterns

### MCP Client Integration

**Official Documentation:**
- [Build MCP Clients](https://modelcontextprotocol.io/docs/develop/build-client)
- [MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

**Connection Pattern:**
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Create transport
const transport = new StdioClientTransport({
  command: "uvx",
  args: ["awslabs.aws-documentation-mcp-server@latest"],
});

// Create client
const client = new Client(
  { name: "mcp-inspector", version: "1.0.0" },
  { capabilities: {} }
);

// Connect (handles initialization handshake)
await client.connect(transport);
```

**Tool Operations:**
```typescript
// List tools
const toolsResponse = await client.listTools();
const tools = toolsResponse.tools;

// Call tool
const result = await client.callTool({
  name: "search_documentation",
  arguments: { search_phrase: "S3 bucket naming", limit: 10 }
});
```

### Claude API Integration

**Official Documentation:**
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Claude API Reference](https://docs.anthropic.com/en/api/)

**Two-Phase Pattern:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Phase 1: Planning (tool selection)
const planningResponse = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: userMessage }],
  tools: claudeTools,
});

// Extract tool calls
const toolCalls = planningResponse.content.filter(
  block => block.type === 'tool_use'
);

// Execute tools...

// Phase 2: Synthesis (final response)
const synthesisResponse = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: userMessage },
    { role: 'assistant', content: planningResponse.content },
    { role: 'user', content: toolResults }
  ],
  tools: claudeTools,
});
```

### Event Recording Pattern

Every operation records timeline events:

```typescript
// Protocol message
recordEvent({
  eventType: 'protocol_message',
  actor: 'host_app',
  direction: 'sent',
  lane: 'host_mcp',
  message: { jsonrpc: '2.0', method: 'tools/list', id: 2 },
  metadata: { phase: 'discovery', messageType: 'request' }
});

// Console log
recordEvent({
  eventType: 'console_log',
  actor: 'mcp_server',
  logLevel: 'info',
  logMessage: 'Searching AWS documentation...',
  badgeType: 'SERVER',
  metadata: { phase: 'execution' }
});

// Internal operation
recordEvent({
  eventType: 'internal_operation',
  actor: 'host_app',
  operationType: 'schema_conversion',
  description: 'Formatting tool schemas for LLM',
  metadata: { phase: 'discovery' }
});
```

---

## API References and Resources

### Official MCP Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| MCP Homepage | https://modelcontextprotocol.io | Main landing page |
| MCP Architecture | https://modelcontextprotocol.io/docs/learn/architecture | Protocol architecture and flow |
| Build MCP Clients | https://modelcontextprotocol.io/docs/develop/build-client | Client implementation guide |
| TypeScript SDK | https://github.com/modelcontextprotocol/typescript-sdk | Official TypeScript SDK |
| Example Servers | https://modelcontextprotocol.io/examples | Community MCP servers |

### AWS Documentation MCP Server

| Resource | URL | Purpose |
|----------|-----|---------|
| Server Documentation | https://awslabs.github.io/mcp/servers/aws-documentation-mcp-server | Configuration and usage |
| AWS MCP Servers | https://awslabs.github.io/mcp/ | AWS MCP server collection |
| GitHub Repository | https://github.com/awslabs/mcp | Source code |

### Anthropic Claude API

| Resource | URL | Purpose |
|----------|-----|---------|
| API Documentation | https://docs.anthropic.com/en/api/ | Complete API reference |
| TypeScript SDK | https://github.com/anthropics/anthropic-sdk-typescript | Official SDK |
| Tool Use Guide | https://docs.anthropic.com/en/docs/tool-use | Tool/function calling guide |

### Development Tools

| Tool | URL | Purpose |
|------|-----|---------|
| Next.js 15 | https://nextjs.org/ | React framework |
| Tailwind CSS | https://tailwindcss.com/ | Utility-first CSS |
| Zustand | https://zustand.docs.pmnd.rs/ | State management |
| TypeScript | https://www.typescriptlang.org/ | Type safety |

---

## Implementation Timeline

| Module | Focus | Duration | Dependencies | Key Validation |
|--------|-------|----------|--------------|----------------|
| 1 | Layout & Grid | 2 days | None | Visual grid alignment |
| 2 | Event Recording | 1 day | Module 1 | 100+ events recorded |
| 3 | Actor Components | 2 days | Modules 1-2 | All badges render |
| 4 | Message Cards | 2 days | Modules 1-2 | Expand/collapse works |
| 5 | Layout Engine | 3 days | Modules 1-4 | Spacer insertion correct |
| 6 | MCP Integration | 3 days | Modules 1-2 | AWS server connects |
| 7 | LLM Integration | 2 days | Module 6 | Two-phase inference |
| 8 | Orchestration | 3 days | Modules 6-7 | Complete workflow |
| 9 | Polish | 2 days | Modules 1-8 | Suggested queries work |
| 10 | Testing | 3 days | All modules | All tests pass |

**Total Estimated Duration:** 23 days (~4.5 weeks)

**Critical Path:** Modules 6 → 7 → 8 (MCP + LLM + Orchestration)

---

## Validation Strategy

### Chrome DevTools Integration

This project uses the **Chrome DevTools MCP server** for comprehensive automated UI validation. Claude Code has access to the following capabilities:

#### Visual Validation
- `take_screenshot` - Capture full page or specific elements for visual comparison
- `take_snapshot` - Extract DOM structure with element UIDs for inspection
- Compare actual rendering against design mockups

#### Interactive Testing
- `click`, `hover`, `fill`, `fill_form` - Simulate user interactions
- Test expand/collapse functionality on message cards
- Validate suggested query buttons and controls
- Verify chat input and submission

#### Layout Inspection
- Extract DOM structure and element positioning
- Verify five-column grid alignment (20%, 15%, 15%, 15%, 35%)
- Validate spacer blocks maintain vertical alignment across all rows
- Check sticky phase headers during scroll

#### Performance Testing
- `performance_start_trace` / `performance_stop_trace` - Record performance metrics
- Measure render time with 100+ events (target: < 100ms)
- Check Core Web Vitals (CWV) scores
- Validate no lag during timeline updates

#### Console & Network Monitoring
- `list_console_messages` - Check for JavaScript errors/warnings
- `list_network_requests` - Monitor API calls to Claude and MCP servers
- Validate protocol message structure
- Debug integration issues

#### JavaScript Execution
- `evaluate_script` - Run custom validation scripts in browser context
- Query Zustand store state to verify event recording
- Check sequence numbers and event ordering
- Measure DOM metrics (column widths, cell heights, alignment)

#### Example: Module 1 Grid Validation Script
```javascript
// Verify column widths match specification
await evaluate_script({
  function: `() => {
    const columns = document.querySelectorAll('[data-column]');
    return Array.from(columns).map(col => ({
      id: col.dataset.column,
      actualWidth: col.offsetWidth,
      percentage: (col.offsetWidth / window.innerWidth * 100).toFixed(1),
      expected: col.dataset.widthPercent
    }));
  }`
});

// Validate vertical alignment across rows
await evaluate_script({
  function: `() => {
    const rows = document.querySelectorAll('[data-row]');
    return Array.from(rows).map(row => {
      const cells = row.querySelectorAll('[data-cell]');
      const heights = Array.from(cells).map(c => c.offsetHeight);
      return {
        rowId: row.dataset.row,
        cellHeights: heights,
        aligned: new Set(heights).size === 1 // All cells same height
      };
    });
  }`
});
```

### Per-Module Validation

Each module has explicit validation criteria that must be met before proceeding. Validation uses:

1. **Visual Inspection** - UI components render correctly (via screenshots)
2. **Functional Testing** - Features work as expected (via DevTools interaction)
3. **Performance Testing** - No lag with 100+ events (via performance traces)
4. **Data Validation** - Events recorded with correct structure (via script execution)

### Integration Validation

After Module 8 (Orchestration), validate complete workflow:

1. Execute all 3 suggested queries
2. Verify 5 phases execute for each query
3. Verify vertical alignment maintained throughout
4. Verify all events recorded with correct metadata
5. Verify final responses are correct

### Acceptance Criteria

**From PRD Success Metrics (Section: Success Metrics for MVP):**

- [ ] Users can clearly see LLM and MCP Server are separate actors
- [ ] Users recognize two LLM calls (planning + synthesis)
- [ ] Users understand Host App orchestrates communication
- [ ] Users can inspect all protocol messages (expand JSON payloads)
- [ ] All events recorded for future playback
- [ ] Interface responsive with 100+ events
- [ ] New users understand MCP flow within 5 minutes
- [ ] Users can trace causality via vertical alignment

---

## Notes and Considerations

### Technical Debt Prevention

1. **Type Safety** - Strict TypeScript throughout, no `any` types
2. **Component Isolation** - Each component is self-contained and testable
3. **State Management** - Centralized Zustand store, no prop drilling
4. **Error Handling** - Graceful degradation for connection/API failures

### Future Extensibility

This MVP design supports future features (PRD Appendix A):

- **Playback Controls** - Event recording structure supports step-through
- **Session Export** - Events already in exportable JSON format
- **Multiple Servers** - Client wrapper can support multiple connections
- **Performance Monitoring** - Event metadata includes timing information

### Known Limitations (MVP Scope)

- **No Playback Controls** - Timeline shows only live execution
- **Single Server** - Connects only to AWS Documentation MCP server
- **No User Consent UI** - Tools execute automatically (future: confirmation dialog)
- **No Filtering** - Shows all events (future: filter by actor/phase)
- **No Search** - Cannot search within messages (future: full-text search)

---

## Appendix: Environment Setup

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm or pnpm** (package manager)
- **Python 3.10+** (for MCP servers)
- **uv** (for Python package management) - [Install uv](https://docs.astral.sh/uv/)

### Project Initialization

```bash
# Create Next.js project
npx create-next-app@latest mcp-inspector --typescript --tailwind --app

# Install dependencies
npm install @modelcontextprotocol/sdk @anthropic-ai/sdk zustand immer

# Install dev dependencies
npm install -D @types/node @types/react react-syntax-highlighter @types/react-syntax-highlighter

# Install AWS Documentation MCP server
uvx awslabs.aws-documentation-mcp-server@latest --help
```

### Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

---

**Document Version History:**

- **v1.0 (2025-10-09):** Initial draft with complete module breakdown and API references
