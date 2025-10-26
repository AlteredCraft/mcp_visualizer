# Test Modules Documentation

This directory contains development and validation test modules used during the incremental build-out of the MCP Inspector Teaching App. These modules are **NOT part of the production application** and exist solely for development validation purposes.

## Production Application

The main production application is accessed at:
- **Root path** (`/`) - Redirects to TimelineView
- **Timeline path** (`/timeline`) - Main actor-based timeline visualization

All production features use the components in `components/timeline/` and the full five-column actor-based layout.

---

## Test Module Status Overview

| Module | Route | Status | Purpose |
|--------|-------|--------|---------|
| test-module-2 | `/test-module-2` | ✅ Working | Event recording system validation |
| test-module-3 | `/test-module-3` | ⚠️ Deprecated | Grid rendering (legacy layout components removed) |
| test-module-4 | `/test-module-4` | ⚠️ Deprecated | Actor and lane cells (legacy layout components removed) |
| test-module-5 | `/test-module-5` | ⚠️ Deprecated | Layout engine with spacer insertion (legacy layout components removed) |
| test-module-6 | `/test-module-6` | ✅ Working | MCP client singleton pattern (uses V1 API routes) |
| test-module-6b | `/test-module-6b` | ✅ Working | Stateful MCP integration with SSE (uses V2 API routes) |
| test-module-7 | `/test-module-7` | ✅ Working | LLM integration (uses V2 API routes) |
| test-module-8 | `/test-module-8` | ✅ Working | Complete 5-phase workflow orchestration |

---

## Detailed Module Descriptions

### Module 2: Event Recording System
**Route:** `/test-module-2`
**Status:** ✅ Working
**Components:** Zustand store, event enrichment, session management

**Purpose:** Validates the core event recording system including:
- Event structure (sessionId, sequence, timestamp, eventType, actor, metadata)
- Automatic enrichment (sessionId injection, sequence numbering, timestamp)
- Store actions (addEvent, addEvents, clearEvents, startNewSession)
- Session metadata computation
- Event filtering by phase and actor

**Validation Results:** See `/docs/Module 2 Validation Results.md`

---

### Module 3: Grid Rendering
**Route:** `/test-module-3`
**Status:** ⚠️ Deprecated (legacy components removed)
**Components:** ~~TimelineContainer, TimelineHeader, AppHeader, StatusBar~~ (removed Oct 26, 2025)

**Purpose:** Validated basic grid rendering with five-column layout.

**Notes:**
- This module imported legacy components from `components/layout/` which have been superseded by `components/timeline/` versions
- To restore, update imports to use `components/timeline/` equivalents
- Grid rendering is now validated in the production TimelineView

---

### Module 4: Actor and Lane Cells
**Route:** `/test-module-4`
**Status:** ⚠️ Deprecated (legacy components removed)
**Components:** ActorCell, LaneCell, ChatBubble, ConsoleBlock, MessageCard

**Purpose:** Validated individual cell rendering for actors and communication lanes.

**Notes:**
- Imports legacy `TimelineContainer`, `TimelineHeader`, `StatusBar` from `components/layout/`
- Core components (ActorCell, LaneCell, etc.) are still used in production
- To restore, update layout component imports to `components/timeline/`

---

### Module 5: Layout Engine with Spacer Insertion
**Route:** `/test-module-5`
**Status:** ⚠️ Deprecated (legacy components removed)
**Components:** layout-engine, row-builder, phase-detector, SpacerBlock

**Purpose:** Validated automatic spacer block insertion for vertical alignment.

**Notes:**
- Layout engine logic is production-ready and used in TimelineView
- Module uses legacy layout components from `components/layout/`
- To restore, update imports to `components/timeline/`

**Validation Results:** See `/docs/Module 5 Validation Results.md`

---

### Module 6: MCP Client Singleton
**Route:** `/test-module-6`
**Status:** ✅ Working (uses V1 API routes)
**Components:** MCPClient, global-client, connection management

**Purpose:** Validates MCP client singleton pattern and basic operations:
- Connection establishment
- Tool discovery
- Tool invocation
- Singleton enforcement (prevents multiple client instances)

**API Routes Used:**
- `POST /api/mcp/connect` (V1)
- `GET /api/mcp/tools` (V1)
- `POST /api/mcp/call` (V1)

**Validation Results:** See `/docs/Module 6 Validation Results.md`

---

### Module 6B: Stateful MCP Integration with SSE
**Route:** `/test-module-6b`
**Status:** ✅ Working (uses V2 API routes)
**Components:** MCPClient, SSE streaming, stateful connection

**Purpose:** Validates stateful MCP integration with real-time event streaming:
- Persistent MCP connection across requests
- Server-Sent Events (SSE) for real-time updates
- Event recording to Zustand store
- Connection state management

**API Routes Used:**
- `POST /api/mcp/connect-v2` (V2 - enhanced error handling)
- `GET /api/mcp/tools-v2` (V2)
- `GET /api/events/stream` (SSE)

**Architecture:** This module introduced the SSE pattern now used in production TimelineView.

**Validation Results:** See `/docs/Module 6B Validation Results.md`

---

### Module 7: LLM Integration
**Route:** `/test-module-7`
**Status:** ✅ Working (uses V2 API routes)
**Components:** Claude client, inference, tool formatting

**Purpose:** Validates LLM integration and tool calling:
- Planning inference (first LLM call - tool selection)
- Synthesis inference (second LLM call - final response)
- MCP tool schema conversion to Claude format
- Tool call parsing and execution

**API Routes Used:**
- `POST /api/mcp/connect-v2` (V2)
- `GET /api/mcp/tools-v2` (V2)
- `POST /api/mcp/call-v2` (V2)
- `POST /api/llm/planning` (LLM inference)
- `POST /api/llm/synthesis` (LLM inference)

**Two-Inference Pattern:** This module demonstrates the core pedagogical concept that MCP requires TWO LLM calls:
1. **Planning:** LLM receives tool schemas and decides which tools to call
2. **Synthesis:** LLM receives tool results and generates final natural language response

**Validation Results:** See `/docs/Module 7 Validation Results.md`

---

### Module 8: Complete 5-Phase Workflow
**Route:** `/test-module-8`
**Status:** ✅ Working
**Components:** workflow orchestration, all 5 phases

**Purpose:** Validates the complete end-to-end workflow orchestration:

**Five Phases:**
1. **Initialization & Negotiation** - MCP server connection, capability exchange
2. **Discovery & Contextualization** - Tool list retrieval, schema formatting
3. **Model-Driven Selection** - Planning inference (LLM selects tools)
4. **Execution Round Trip** - MCP tool calls, external API delegation
5. **Synthesis & Final Response** - Synthesis inference (LLM generates response)

**API Routes Used:**
- `POST /api/workflow/execute` - Orchestrates all 5 phases
- `GET /api/events/stream` - SSE for real-time event updates

**Architecture:** This workflow API (`/api/workflow/execute`) is used by the production TimelineView via ChatInputRow.

**Validation Results:** See `/docs/Module 8 Validation Results.md`

---

## API Route Versions

### V1 Routes (Legacy - Used in Module 6)
- `POST /api/mcp/connect` - Basic connection
- `GET /api/mcp/tools` - Tool discovery
- `POST /api/mcp/call` - Tool invocation

**Status:** Working but superseded by V2 for enhanced error handling and event tracking.

### V2 Routes (Current - Used in Modules 6B, 7, 8, and Production)
- `POST /api/mcp/connect-v2` - Enhanced connection with better error messages
- `GET /api/mcp/tools-v2` - Tool discovery with additional metadata
- `POST /api/mcp/call-v2` - Tool invocation with event recording

**Improvements over V1:**
- Enhanced error messages
- Better connection state tracking
- Automatic event recording integration
- Detailed console logging for debugging

### High-Level Routes (Production)
- `POST /api/llm/planning` - Planning inference (first LLM call)
- `POST /api/llm/synthesis` - Synthesis inference (second LLM call)
- `POST /api/workflow/execute` - Complete 5-phase workflow orchestration
- `GET /api/events/stream` - Server-Sent Events for real-time updates

**Status:** Production-ready, used by TimelineView.

---

## Development Workflow

During development, modules were built incrementally:

1. **Module 2** - Event recording foundation
2. **Module 3** - Grid rendering
3. **Module 4** - Actor and lane cell components
4. **Module 5** - Layout engine with automatic spacer insertion
5. **Module 6** - MCP client basics
6. **Module 6B** - Stateful connections and SSE streaming
7. **Module 7** - LLM integration and two-inference pattern
8. **Module 8** - Complete workflow orchestration
9. **Module 11** - Actor-based timeline (production implementation)

Each module built upon the previous, with validation results documented in `/docs/`.

---

## Restoration Notes

To restore deprecated test modules 3, 4, 5:

1. Update imports from `components/layout/` to `components/timeline/`:
   ```typescript
   // Old (removed)
   import { AppHeader } from '@/components/layout/AppHeader';
   import { StatusBar } from '@/components/layout/StatusBar';
   import { TimelineContainer } from '@/components/layout/TimelineContainer';
   import { TimelineHeader } from '@/components/layout/TimelineHeader';

   // New (current)
   import { AppHeader } from '@/components/timeline/AppHeader';
   import { StatusBar } from '@/components/timeline/StatusBar';
   import { TimelineContainer } from '@/components/timeline/TimelineContainer';
   // TimelineHeader - check if still needed or can be removed
   ```

2. Note that the `components/timeline/` versions have enhanced features:
   - AppHeader includes recording badge
   - StatusBar shows event count and recording state
   - TimelineContainer has improved grid rendering

---

## Files Cleaned Up (October 26, 2025)

As part of codebase cleanup:
- **Removed:** Empty nested directory `/mcp-inspector-app/mcp-inspector-app/`
- **Removed:** Legacy layout components superseded by timeline/ versions:
  - `components/layout/AppHeader.tsx`
  - `components/layout/StatusBar.tsx`
  - `components/layout/TimelineContainer.tsx`
  - `components/layout/TimelineHeader.tsx`
- **Kept:** `components/layout/PhaseHeader.tsx` (actively used by RowCell)
- **Removed:** Duplicate test results file `MODULE_2_TEST_RESULTS.md` (canonical version in `/docs/`)

---

## For More Information

- **Production App:** See main README.md
- **Architecture:** See CLAUDE.md (project instructions)
- **Full Requirements:** See `/docs/MCP Inspector Teaching App - MVP Product Requirements Document.md`
- **Validation Results:** See `/docs/Module * Validation Results.md` files
- **MCP Protocol:** See `/docs/MCP Sequence diagram.md`
