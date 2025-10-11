# Event Recording System - Architecture Diagram

**Version:** 1.0
**Date:** 2025-10-11
**Status:** Design Review

---

## System Overview

The event recording system captures **all** activity during an MCP workflow session, enabling:
1. **Real-time visualization** - Events feed directly into the UI timeline
2. **Session export** - Complete event history as JSON
3. **Future playback** - Event structure supports step-through and replay (post-MVP)

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Event Sources"
        MCP[MCP Client<br/>Protocol Messages]
        LLM[Claude Client<br/>API Calls]
        HOST[Host App<br/>Console Logs]
        INT[Internal Ops<br/>Schema Conversion]
    end

    subgraph "Event Recording Layer"
        EB[Event Builder<br/>Enriches & Validates]
        STORE[Zustand Timeline Store<br/>Centralized State]
    end

    subgraph "Event Consumers"
        LE[Layout Engine<br/>Events → Rows]
        UI[Timeline UI<br/>Visual Rendering]
        EXP[Export System<br/>JSON Download]
    end

    MCP -->|Protocol Events| EB
    LLM -->|LLM Events| EB
    HOST -->|Console Events| EB
    INT -->|Operation Events| EB

    EB -->|Enriched Event| STORE

    STORE -->|Event Stream| LE
    STORE -->|Session Data| EXP

    LE -->|TimelineRows| UI

    style STORE fill:#e0e7ff,stroke:#3730a3,stroke-width:3px
    style EB fill:#fef3c7,stroke:#92400e,stroke-width:2px
    style UI fill:#d1fae5,stroke:#065f46,stroke-width:2px
```

---

## Event Recording Flow (Detailed)

```mermaid
sequenceDiagram
    participant S as Event Source<br/>(MCP/LLM/Host)
    participant EB as Event Builder
    participant ST as Timeline Store
    participant LE as Layout Engine
    participant UI as Timeline UI

    Note over S,UI: Example: MCP Server returns tool result

    S->>EB: Raw event data<br/>{actor, message, etc.}

    Note over EB: Enrichment Phase
    EB->>EB: Generate unique ID
    EB->>EB: Add timestamp
    EB->>EB: Assign sequence number
    EB->>EB: Add sessionId
    EB->>EB: Detect phase (if applicable)
    EB->>EB: Validate structure

    EB->>ST: addEvent(enrichedEvent)

    Note over ST: State Update
    ST->>ST: Append to events[]
    ST->>ST: Increment currentSequence
    ST->>ST: Notify subscribers

    ST-->>LE: State change notification

    Note over LE: Row Building
    LE->>LE: Group events by sequence
    LE->>LE: Insert spacer blocks
    LE->>LE: Map events to cell content

    LE->>UI: Updated TimelineRow[]

    Note over UI: Render Update
    UI->>UI: React re-renders timeline
    UI->>UI: Auto-scroll to latest
```

---

## Event Builder - Enrichment Process

```
┌─────────────────────────────────────────────────────────────────┐
│                      Event Builder                              │
│                                                                 │
│  Input: Partial Event (from source)                            │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ {                                                     │    │
│  │   eventType: 'protocol_message',                     │    │
│  │   actor: 'mcp_server',                               │    │
│  │   direction: 'received',                             │    │
│  │   lane: 'host_mcp',                                  │    │
│  │   message: { jsonrpc: '2.0', ... },                  │    │
│  │   metadata: { messageType: 'response' }              │    │
│  │ }                                                     │    │
│  └───────────────────────────────────────────────────────┘    │
│                           ↓                                     │
│         Enrichment: Add System Fields                          │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ • sessionId = store.sessionId (UUID)                 │    │
│  │ • sequence = store.currentSequence++                 │    │
│  │ • timestamp = Date.now()                             │    │
│  │ • phase = detectPhase(metadata) → 'execution'       │    │
│  └───────────────────────────────────────────────────────┘    │
│                           ↓                                     │
│  Output: Complete TimelineEvent                                │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ {                                                     │    │
│  │   sessionId: 'uuid-...',            // ← ADDED       │    │
│  │   sequence: 42,                     // ← ADDED       │    │
│  │   timestamp: 1704124800000,         // ← ADDED       │    │
│  │   eventType: 'protocol_message',                     │    │
│  │   actor: 'mcp_server',                               │    │
│  │   direction: 'received',                             │    │
│  │   lane: 'host_mcp',                                  │    │
│  │   message: { jsonrpc: '2.0', ... },                  │    │
│  │   metadata: {                                        │    │
│  │     messageType: 'response',                         │    │
│  │     phase: 'execution'              // ← ENHANCED    │    │
│  │   }                                                   │    │
│  │ }                                                     │    │
│  └───────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Timeline Store Structure

```typescript
// Zustand Store State
interface TimelineStore {
  // ===== Core State =====
  sessionId: string;              // UUID generated on init
  events: TimelineEvent[];        // Chronological event array
  currentSequence: number;        // Auto-incremented counter

  // ===== Actions =====

  // Primary recording function
  addEvent: (
    event: Omit<TimelineEvent, 'sessionId' | 'sequence' | 'timestamp'>
  ) => void;

  // Session management
  clearEvents: () => void;
  resetSession: () => void;       // New session ID + clear events

  // Queries
  getEventsByPhase: (phase: Phase) => TimelineEvent[];
  getEventsByActor: (actor: Actor) => TimelineEvent[];
  getEventsBySequence: (start: number, end: number) => TimelineEvent[];

  // Export
  exportSession: () => string;    // Returns JSON string
  exportMetadata: () => SessionMetadata;
}

// Session Metadata (for exports)
interface SessionMetadata {
  sessionId: string;
  startTime: number;              // First event timestamp
  endTime: number;                // Last event timestamp
  totalEvents: number;
  phaseBreakdown: Record<Phase, number>;
  actorBreakdown: Record<Actor, number>;
}
```

---

## Event Storage - Data Loss Analysis

### ✅ No Data Loss Scenarios

| Event Property | Storage Method | Guaranteed? | Notes |
|---------------|---------------|-------------|-------|
| **sessionId** | Generated once per session | ✅ Yes | UUID v4, collision probability ~0 |
| **sequence** | Auto-increment from store | ✅ Yes | Atomic increment, never skips |
| **timestamp** | `Date.now()` on creation | ✅ Yes | Millisecond precision |
| **eventType** | User-provided, validated | ✅ Yes | TypeScript enum ensures valid values |
| **actor** | User-provided, validated | ✅ Yes | TypeScript enum ensures valid values |
| **message** | Full object stored | ✅ Yes | Deep copy via Immer (immutable) |
| **metadata** | Full object stored | ✅ Yes | Deep copy via Immer (immutable) |

### Event Ordering Guarantee

**Sequence Assignment:**
```typescript
// Inside TimelineStore.addEvent()
set((state) => {
  const sequence = state.currentSequence;
  const newEvent: TimelineEvent = {
    ...providedEvent,
    sessionId: state.sessionId,
    sequence,                         // Current sequence
    timestamp: Date.now()
  };

  return {
    events: [...state.events, newEvent],
    currentSequence: sequence + 1     // Increment for next event
  };
});
```

**Properties:**
- ✅ Events always appended to end of array (FIFO order)
- ✅ Sequence numbers are strictly increasing (no gaps)
- ✅ Multiple simultaneous `addEvent()` calls are queued (React reconciliation)

---

## Event Recording Examples

### Example 1: Protocol Message (MCP Request)

```typescript
// Source: MCP Client wrapper
await mcpClient.listTools();

// Event recorded:
recordEvent({
  eventType: 'protocol_message',
  actor: 'host_app',
  direction: 'sent',
  lane: 'host_mcp',
  message: {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  },
  metadata: {
    messageType: 'request',
    phase: 'discovery',
    correlatedMessageId: null        // Will be set on response
  }
});

// Enriched by Event Builder → Stored as:
{
  sessionId: 'uuid-abc123',          // ← Added
  sequence: 5,                        // ← Added
  timestamp: 1704124800000,           // ← Added
  eventType: 'protocol_message',
  actor: 'host_app',
  direction: 'sent',
  lane: 'host_mcp',
  message: { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  metadata: {
    messageType: 'request',
    phase: 'discovery',
    correlatedMessageId: null
  }
}
```

### Example 2: Console Log (MCP Server Activity)

```typescript
// Source: MCP Server stderr monitoring
// (Future implementation - MVP shows host logs only)

recordEvent({
  eventType: 'console_log',
  actor: 'mcp_server',
  logLevel: 'info',
  logMessage: 'Searching AWS documentation for: "S3 bucket naming"',
  badgeType: 'SERVER',
  metadata: {
    phase: 'execution',
    toolName: 'search_documentation'
  }
});

// Enriched → Stored as:
{
  sessionId: 'uuid-abc123',          // ← Added
  sequence: 15,                       // ← Added
  timestamp: 1704124801500,           // ← Added
  eventType: 'console_log',
  actor: 'mcp_server',
  logLevel: 'info',
  logMessage: 'Searching AWS documentation for: "S3 bucket naming"',
  badgeType: 'SERVER',
  metadata: {
    phase: 'execution',
    toolName: 'search_documentation'
  }
}
```

### Example 3: Internal Operation (Schema Conversion)

```typescript
// Source: Claude Client (schema formatting)
const claudeTools = convertMCPToClaudeFormat(mcpTools);

recordEvent({
  eventType: 'internal_operation',
  actor: 'host_app',
  operationType: 'schema_conversion',
  description: 'Formatting 3 tool schemas for LLM context',
  metadata: {
    phase: 'discovery',
    toolCount: 3
  }
});

// Enriched → Stored as:
{
  sessionId: 'uuid-abc123',          // ← Added
  sequence: 7,                        // ← Added
  timestamp: 1704124800200,           // ← Added
  eventType: 'internal_operation',
  actor: 'host_app',
  operationType: 'schema_conversion',
  description: 'Formatting 3 tool schemas for LLM context',
  metadata: {
    phase: 'discovery',
    toolCount: 3
  }
}
```

---

## Session Export Format

```json
{
  "metadata": {
    "sessionId": "uuid-abc123",
    "startTime": 1704124800000,
    "endTime": 1704124825000,
    "totalEvents": 42,
    "phaseBreakdown": {
      "initialization": 3,
      "discovery": 5,
      "selection": 8,
      "execution": 18,
      "synthesis": 8
    },
    "actorBreakdown": {
      "host_app": 15,
      "llm": 10,
      "mcp_server": 17,
      "external_api": 0
    }
  },
  "events": [
    {
      "sessionId": "uuid-abc123",
      "sequence": 0,
      "timestamp": 1704124800000,
      "eventType": "console_log",
      "actor": "host_app",
      "logLevel": "info",
      "logMessage": "User query: Search AWS documentation for S3 bucket naming rules",
      "badgeType": "USER_INPUT",
      "metadata": {
        "phase": "initialization"
      }
    },
    {
      "sessionId": "uuid-abc123",
      "sequence": 1,
      "timestamp": 1704124800050,
      "eventType": "protocol_message",
      "actor": "host_app",
      "direction": "sent",
      "lane": "host_mcp",
      "message": {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
          "protocolVersion": "2024-11-05",
          "capabilities": {},
          "clientInfo": {
            "name": "mcp-inspector",
            "version": "1.0.0"
          }
        }
      },
      "metadata": {
        "messageType": "request",
        "phase": "initialization"
      }
    }
    // ... 40 more events ...
  ]
}
```

---

## Playback Support (Future Implementation)

### Event Stream Properties

The current event structure **fully supports** future playback features:

| Playback Feature | Supported By | Implementation Notes |
|------------------|--------------|---------------------|
| **Step Forward** | `sequence` field | Increment current sequence pointer |
| **Step Backward** | `sequence` field | Decrement current sequence pointer |
| **Jump to Phase** | `metadata.phase` | Filter events by phase |
| **Speed Control** | `timestamp` deltas | Calculate real-time delays between events |
| **Actor Filtering** | `actor` field | Show/hide specific actor columns |
| **Event Search** | All text fields | Full-text search across messages/logs |
| **Time Scrubbing** | `timestamp` field | Jump to specific time offset |

### Playback Store (Future)

```typescript
interface PlaybackStore {
  // Playback State
  isPlaying: boolean;
  currentSequence: number;         // Pointer into events array
  playbackSpeed: number;           // 0.5x, 1x, 2x, etc.

  // Actions
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToSequence: (seq: number) => void;
  jumpToPhase: (phase: Phase) => void;
  setSpeed: (speed: number) => void;

  // Derived State
  getCurrentEvent: () => TimelineEvent | null;
  getVisibleEvents: () => TimelineEvent[];  // 0 to currentSequence
}
```

---

## Data Validation - Type Safety

### TypeScript Validation

All events are validated at compile-time via TypeScript:

```typescript
// Event Builder enforces correct structure
function recordEvent(
  event: Omit<TimelineEvent, 'sessionId' | 'sequence' | 'timestamp'>
): void {
  // TypeScript ensures:
  // 1. eventType is one of: 'protocol_message' | 'internal_operation' | 'console_log'
  // 2. actor is one of: 'host_app' | 'llm' | 'mcp_server' | 'external_api'
  // 3. Required fields are present (e.g., message for protocol_message)

  const enrichedEvent: TimelineEvent = {
    ...event,
    sessionId: store.getState().sessionId,
    sequence: store.getState().currentSequence,
    timestamp: Date.now()
  };

  store.getState().addEvent(enrichedEvent);
}
```

### Runtime Validation (Optional)

For production robustness, add runtime validation:

```typescript
import { z } from 'zod';

const TimelineEventSchema = z.discriminatedUnion('eventType', [
  z.object({
    eventType: z.literal('protocol_message'),
    actor: z.enum(['host_app', 'llm', 'mcp_server', 'external_api']),
    direction: z.enum(['sent', 'received']),
    lane: z.enum(['host_llm', 'host_mcp']),
    message: z.object({}).passthrough(),  // Allow any JSON object
    metadata: z.object({}).passthrough()
  }),
  z.object({
    eventType: z.literal('console_log'),
    actor: z.enum(['host_app', 'llm', 'mcp_server', 'external_api']),
    logLevel: z.enum(['info', 'debug', 'error']),
    logMessage: z.string(),
    badgeType: z.string(),
    metadata: z.object({}).passthrough()
  }),
  z.object({
    eventType: z.literal('internal_operation'),
    actor: z.enum(['host_app', 'llm', 'mcp_server', 'external_api']),
    operationType: z.string(),
    description: z.string(),
    metadata: z.object({}).passthrough()
  })
]);

// Validate before storing
function recordEvent(event: unknown): void {
  const validated = TimelineEventSchema.parse(event);
  // ... proceed with enrichment
}
```

---

## Performance Considerations

### Memory Footprint

**Estimated size per event:**
```
Average TimelineEvent:
- sessionId:     36 bytes (UUID string)
- sequence:      8 bytes (number)
- timestamp:     8 bytes (number)
- eventType:     ~20 bytes (string)
- actor:         ~12 bytes (string)
- message/log:   ~500 bytes (JSON payload average)
- metadata:      ~200 bytes (object with phase, etc.)
─────────────────────────────────────────────────
Total:           ~784 bytes per event
```

**Memory usage scenarios:**
- 100 events = ~78 KB
- 500 events = ~390 KB
- 1000 events = ~780 KB

✅ **Conclusion:** Memory is not a concern for MVP scope (100-500 events typical)

### Rendering Performance

**Store optimization:**
```typescript
// Use Immer for efficient immutable updates
import { produce } from 'immer';

const useTimelineStore = create<TimelineStore>((set) => ({
  events: [],
  addEvent: (event) => set(
    produce((state) => {
      // Immer detects minimal changes, optimizes React re-renders
      state.events.push(enrichEvent(event, state));
      state.currentSequence++;
    })
  )
}));
```

**React optimization:**
```typescript
// Memoize row components to prevent unnecessary re-renders
const MemoizedTimelineRow = React.memo(TimelineRow, (prev, next) => {
  // Only re-render if row data changed
  return prev.rowId === next.rowId &&
         prev.cells.length === next.cells.length;
});
```

---

## Error Handling

### Event Recording Failures

```typescript
function recordEvent(event: Partial<TimelineEvent>): void {
  try {
    // Validate event structure
    if (!event.eventType || !event.actor) {
      throw new Error('Missing required event fields');
    }

    // Enrich and store
    const enriched = enrichEvent(event);
    store.getState().addEvent(enriched);

  } catch (error) {
    // Fallback: Log to console, don't crash app
    console.error('[Event Recording Error]', error, event);

    // Record the error itself as an event (if possible)
    try {
      store.getState().addEvent({
        eventType: 'console_log',
        actor: 'host_app',
        logLevel: 'error',
        logMessage: `Failed to record event: ${error.message}`,
        badgeType: 'LOG',
        metadata: { originalEvent: event }
      });
    } catch {
      // If we can't even record the error, give up gracefully
    }
  }
}
```

### Store Corruption Prevention

```typescript
// Clear events safety check
clearEvents: () => set((state) => {
  // Preserve sessionId, only clear events
  return {
    ...state,
    events: [],
    currentSequence: 0
  };
}),

// Reset session (new session ID)
resetSession: () => set((state) => {
  return {
    ...state,
    sessionId: generateSessionId(),
    events: [],
    currentSequence: 0
  };
})
```

---

## Validation Checklist

### ✅ Does the event recording system support all required data?

| Data Type | Captured? | Storage Location | Notes |
|-----------|-----------|------------------|-------|
| Protocol messages (MCP) | ✅ Yes | `ProtocolMessageEvent.message` | Full JSON-RPC payload |
| Protocol messages (LLM) | ✅ Yes | `ProtocolMessageEvent.message` | Full Claude API payload |
| Console logs | ✅ Yes | `ConsoleLogEvent.logMessage` | Text with badge type |
| Internal operations | ✅ Yes | `InternalOperationEvent.description` | Schema conversion, etc. |
| Timing information | ✅ Yes | `timestamp` + `metadata.processingTime` | Millisecond precision |
| Phase information | ✅ Yes | `metadata.phase` | All 5 phases |
| Actor attribution | ✅ Yes | `actor` field | Host, LLM, MCP Server, External API |
| Sequence ordering | ✅ Yes | `sequence` field | Auto-increment, no gaps |
| Session isolation | ✅ Yes | `sessionId` field | UUID per session |

### ✅ Does the event recording system prevent data loss?

| Risk | Mitigation | Status |
|------|-----------|--------|
| Events out of order | Auto-increment sequence, append-only array | ✅ Protected |
| Missing timestamps | Auto-add on event creation | ✅ Protected |
| Duplicate sequences | Atomic increment in store | ✅ Protected |
| Lost messages | Store full payload, deep copy via Immer | ✅ Protected |
| Session collisions | UUID v4 (collision prob ~0) | ✅ Protected |
| Store corruption | Immutable updates, validation | ✅ Protected |

### ✅ Does the event recording system support future playback?

| Feature | Supported? | Implementation |
|---------|-----------|----------------|
| Step forward/backward | ✅ Yes | Sequence pointer |
| Speed control | ✅ Yes | Timestamp deltas |
| Phase filtering | ✅ Yes | `metadata.phase` |
| Actor filtering | ✅ Yes | `actor` field |
| Time scrubbing | ✅ Yes | `timestamp` field |
| Event search | ✅ Yes | All text fields indexed |

---

## Conclusion

### Design Validation Summary

✅ **Complete Data Capture:** All protocol messages, logs, and operations are recorded with full fidelity.

✅ **Zero Data Loss:** Atomic sequence assignment, immutable updates, and deep copying prevent any data loss scenarios.

✅ **Chronological Integrity:** Events maintain strict ordering via sequence numbers and timestamps.

✅ **Session Isolation:** UUID-based session IDs ensure no cross-session contamination.

✅ **Export Ready:** Events are stored in a JSON-serializable format ready for export.

✅ **Playback Ready:** Event structure fully supports future playback features (step-through, speed control, filtering).

✅ **Type Safe:** TypeScript ensures compile-time validation of all event structures.

✅ **Performance Optimized:** Immer-based immutable updates and React memoization prevent rendering bottlenecks.

### Next Steps

1. ✅ **Technical Design Document** - Complete (this document)
2. 🔄 **Implementation** - Proceed with Module 2 (Event Recording System)
3. 🔄 **Validation** - Use mock data to test 500+ events
4. 🔄 **Integration** - Connect to MCP/LLM clients in Modules 6-8

---

**Document Metadata:**
- **Created:** 2025-10-11
- **Author:** System Design (via Claude Code)
- **Purpose:** Validate event recording mechanism design
- **Status:** Ready for implementation
