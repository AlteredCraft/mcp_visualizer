
## **Executive Summary**

A focused, educational tool that visualizes Model Context Protocol (MCP) communication between an LLM-powered chat interface and MCP servers, designed to teach users how MCP orchestrates tool calling through transparent, real-time message flow visualization.

Current HTML mockup: [mcp-inspector-actor-based.html](mcp-inspector-actor-based.html)

---
## **MVP Core Requirements**

### **1. Application Architecture**

#### **1.1 Five-Column Actor-Based Layout**

The application uses an actor-based architecture that mirrors sequence diagrams, with each actor getting its own column and communication lanes between actors:

- **Column 1 (20%)**: Host App Actor
- **Column 2 (15%)**: Communication Lane (ingress/egress to LLM)
- **Column 3 (15%)**: LLM Actor
- **Column 4 (15%)**: Communication Lane (ingress/egress to MCP Server)
- **Column 5 (35%)**: MCP Server Actor

**Communication Lane Purpose**: Communication lanes (Columns 2 and 4) are general-purpose conduits that show ingress and egress communication for the actor column to their right, regardless of the origin of the communication. For example, Column 4 shows Host App ↔ MCP Server communication directly, with no LLM involvement, even though the LLM column appears between them spatially. This visual separation is pedagogically important: it demonstrates that the LLM never directly communicates with MCP servers. Vertical alignment implicitly illustrates the communication path. See ![[supporting images/communication to mcp server.png]] for visual reference.

This layout pedagogically demonstrates that:
- The LLM is a separate inference service, not part of the Host App
- The LLM never directly communicates with MCP servers
- The Host App orchestrates all communication between actors
- Communication happens through explicit message passing

#### **1.2 Vertical Alignment and Spacer Blocks**

**Critical UI Requirement**: All columns must maintain strict vertical alignment to correlate events across actors and communication lanes. This alignment is the primary mechanism for understanding the flow of communication and causality in the MCP protocol.

**Spacer Blocks**: When an actor or communication lane has no activity during a given event, empty spacer blocks MUST be rendered to maintain vertical alignment. This allows multiple console log blocks or message cards in other columns to align properly with their corresponding events.

**Example Use Cases**:
- When the MCP Server logs multiple console statements (e.g., "Searching AWS documentation..." and "Found 15 results"), spacer blocks appear in the Host App column to give vertical space for these operations
- When Host App sends a message to MCP Server (skipping LLM), the LLM column shows a spacer block to maintain alignment

See ![[supporting images/spacer colum blocks.png]] for visual demonstration of spacer blocks maintaining vertical alignment.

**Vertical Flow**:
- Time flows top-to-bottom
- Each row represents a discrete step or event in chronological order
- All content at the same vertical position occurs at approximately the same time
- Users can trace causality by following vertical alignment from left to right

#### **1.3 Data Recording**

- All interactions must be recorded with timestamps and sequence numbers
- Store complete JSON-RPC message payloads
- Maintain message correlation (request-response pairs)
- Design storage format to support future playback and 'step through' features

### **2. Column 1 - Host App Actor**

This column shows the Host App's role as the orchestrator of all MCP and LLM interactions.

#### **2.1 Chat Interface Components**

- User message bubbles (right-aligned, blue background)
- Assistant (LLM) message bubbles (left-aligned, gray background)
- Text input field with send button at bottom
- Clear visual distinction between user and AI messages

**Vertical Alignment**: Chat bubbles and console logs in this column must align vertically with all corresponding events in other columns. When the user initiates an action (e.g., "Search AWS documentation for S3 bucket naming rules"), this triggers a cascade of events across all columns to the right. Spacer blocks must be used in this column to provide vertical space when other columns (especially MCP Server) have multiple console log blocks that need to align with the initiating event.

#### **2.2 Host App Console Logs**

Console blocks showing Host App internal operations:
- User input received
- System events (connecting to MCP, calling LLM)
- Internal processing (formatting tool schemas, appending context)
- Response completion and timing

Console log format:
- Timestamp prefix
- Badge indicating type (USER INPUT, SYSTEM, INTERNAL, COMPLETE)
- Monospace font
- Gray background to distinguish from chat bubbles

### **3. Column 2 - Communication Lane (to LLM)**

This lane shows messages exchanged between Host App and LLM, providing ingress/egress communication space for the LLM actor.

#### **3.1 Message Cards**

Request cards (Host → LLM):
- LLM API request with messages and tools
- Shows "First Inference (Planning)" or "Second Inference (Synthesis)"
- Arrow indicator: →

Response cards (LLM → Host):
- Contains `tool_use` content blocks or final text response
- Timing information
- Arrow indicator: ←

#### **3.2 Message Interaction**

- **Click**: Toggles expansion to show full message payload
- Collapsed state: Compact card with method name and expand button `{ }`
- Expanded state: Full formatted payload with syntax highlighting

### **4. Column 3 - LLM Actor**

This column shows LLM processing as a separate, independent service. **Pedagogically critical**: The LLM column has no direct connection to MCP Server, teaching that the LLM never directly calls MCP.

#### **4.1 LLM Console Logs**

Console blocks showing LLM operations:
- Received prompt with tool schemas
- Analyzing available tools
- Decided to call specific tool (may include explanatory text in response)
- Received context with tool result
- Generating final response

**Note**: The LLM's planning response (Phase 3) may include both explanatory text blocks and tool_use blocks. The UI should display both content types to show the LLM's reasoning process.

#### **4.2 Thinking Indicators**

Visual indicators during LLM processing:
- Animated three-dot indicator
- Status text: "Analyzing available tools..." or "Generating final response..."
- Italic, gray styling to indicate processing state

### **5. Column 4 - Communication Lane (to MCP Server)**

This lane shows JSON-RPC messages exchanged between Host App and MCP Server, providing ingress/egress communication space for the MCP Server actor. Messages in this lane may originate from the Host App (Column 1), skipping over the LLM column entirely, as the LLM never directly communicates with MCP servers.

#### **5.1 Message Cards**

Request cards (Host → MCP Server):
- Methods: `initialize`, `tools/list`, `tools/call`
- Sequence number (#1, #2, #3...)
- Tool name for `tools/call` requests
- Arrow indicator: →
- Green left border

Response cards (MCP Server → Host):
- Response to corresponding request ID
- Timing information (e.g., "33ms", "540ms")
- Arrow indicator: ←
- Blue right border

Notification cards (Host → MCP Server):
- Method: `initialized`
- No response expected
- Purple left border

#### **5.2 Message Representation**

Each message card shows:
- Badge: REQUEST, RESPONSE, or NOTIFY
- Method name (e.g., "initialize", "tools/call")
- Sequence number for correlation
- Direction and timing
- Expand button `{ }` to toggle payload

#### **5.3 Interaction**

- **Click**: Toggles card expansion
- **Collapsed**: Shows card with key details only
- **Expanded**: Shows full JSON-RPC payload with syntax highlighting
- Color-coded borders based on message type

### **6. Column 5 - MCP Server Actor**

This column shows MCP Server-side operations and processing.

#### **6.1 Server Console Logs**

Console blocks showing MCP Server operations:
- Received requests (initialize, tools/list, tools/call)
- Server processing steps
- External API calls (e.g., "Searching AWS documentation API...")
- External API responses (e.g., "AWS Documentation API returned 15 results")
- Sent responses

Console log format:
- Timestamp prefix
- Badge indicating type (SERVER, LOG)
- Monospace font
- Shows delegation to external services without cluttering the communication lane

#### **6.2 External Service Integration**

The MCP Server column pedagogically demonstrates:
- MCP servers act as adapters to external services
- Servers handle the complexity of external API calls
- Results are formatted and returned via MCP protocol
- Clear separation between MCP protocol and external integrations

### **7. Core Message Sequences**

The application must visualize all five phases of the complete MCP tool invocation workflow as defined in the Model Context Protocol specification.

#### **7.1 Phase 1: Initialization & Negotiation**

Must clearly display across columns:

```
Row 1: Host App connects to MCP Client (internal, shown in Host App console)
Row 2: Host App → MCP Server: initialize request (#1)
        - Lane 4 shows message card
        - MCP Server column shows "Received initialize request"
Row 3: MCP Server → Host App: initialize response (#1)
        - Lane 4 shows message card with timing
        - Host App console shows "Received server capabilities"
Row 4: Host App → MCP Server: initialized notification
        - Lane 4 shows notification card
        - MCP Server column shows "Client ready for operations"
```

#### **7.2 Phase 2: Discovery & Contextualization**

Must clearly display:

```
Row 5: Host App → MCP Server: tools/list request (#2)
Row 6: MCP Server → Host App: tools/list response (tool schemas)
Row 7: Host App formats tool schemas for LLM (internal, shown in Host App console)
```

#### **7.3 Phase 3: Model-Driven Selection (First LLM Inference)**

Must clearly display:

```
Row 8: Host App → LLM: LLM API request with messages and tool schemas
        - Lane 2 shows request card labeled "First Inference (Planning)"
Row 9: LLM processing (shown in LLM column with thinking indicator)
        - LLM console: "Analyzing available tools..."
Row 10: LLM → Host App: Returns response with tool_use content blocks
        - Lane 2 shows response card
        - Host App console: "LLM returned tool selections"
```

#### **7.4 Phase 4: Execution Round Trip**

**Note**: When the LLM selects multiple tools in Phase 3, ALL tool executions occur sequentially within Phase 4 before proceeding to Phase 5. Each tool call follows the same pattern below.

Must clearly display (per tool execution):

```
Row 11: (Optional) User consent checkpoint (shown in Host App if implemented)
         - When multiple tools are selected, consent may be requested once for all tools
Row 12: Host App → MCP Server: tools/call request (#3)
Row 13: MCP Server processing - calls AWS Documentation API
         - MCP Server console: "Searching AWS documentation API..."
Row 14: External API responds
         - MCP Server console: "AWS Documentation API returned 15 results"
Row 15: MCP Server → Host App: tools/call response with result
Row 16: Host App appends tool result to conversation context (internal)
         - Host App console: "Appending tool result to conversation"

(If multiple tools were selected in Phase 3, rows 12-16 repeat for each tool call)
```

#### **7.5 Phase 5: Synthesis & Final Response (Second LLM Inference)**

Must clearly display:

```
Row 17: Host App → LLM: LLM API request with conversation history including tool result(s)
         - Lane 2 shows request card labeled "Second Inference (Synthesis)"
         - Includes all tool results from Phase 4 (whether one or multiple tools were executed)
Row 18: LLM processing (shown in LLM column with thinking indicator)
         - LLM console: "Generating final response..."
Row 19: LLM → Host App: Returns final natural language text
         - Lane 2 shows response card
Row 20: Host App displays assistant message in chat
Row 21: Complete indicator
         - Host App console: "Response delivered. Total time: 3050ms"
```

#### **7.6 Vertical Alignment Implementation**

All columns must maintain strict vertical alignment as defined in section 1.2:
- Each row represents a discrete step or message in time
- Time flows top-to-bottom
- **Spacer blocks** (empty cells) MUST be rendered when an actor/lane has no activity in that step
- Group headers span all columns to indicate phase transitions
- Vertical position correlates events across all columns, enabling users to trace causality from left to right
- See ![[supporting images/spacer colum blocks.png]] for implementation reference

### **8. Visual Design Requirements**

#### **8.1 Message Card Color Coding**

Message cards use border colors to indicate type and direction:

- **Request cards** (Host → Server): Green left border (#10B981)
- **Response cards** (Server → Host): Blue right border (#3B82F6)
- **Notification cards** (Host → Server): Purple left border (#8b5cf6)
- **Errors**: Red border (#EF4444)

#### **8.2 Console Badge Color Coding**

Console log badges use background colors:

- **USER INPUT**: Gray (#f3f4f6)
- **SYSTEM**: Blue (#dbeafe)
- **INTERNAL**: Gray (#f3f4f6)
- **LLM**: Indigo (#e0e7ff)
- **SERVER**: Green (#d1fae5)
- **LOG**: Yellow (#fef3c7)
- **COMPLETE**: Gray (#f3f4f6)

#### **8.3 Typography and Spacing**

- **Monospace font** for JSON content and console logs (Monaco, Menlo)
- **Sans-serif font** for UI elements (system fonts)
- **Clear visual hierarchy**: Headers > Message cards > Console logs
- **Adequate padding**: 12px cell padding, 8px internal spacing
- **Consistent timestamp formatting**: HH:MM:SS.mmm format
- **Vertical alignment**: Grid layout maintains strict column alignment across all rows using spacer blocks as defined in section 1.2
- **Spacer block styling**: Empty cells must be visually minimal (transparent or very subtle background) to not distract from content while maintaining layout structure

#### **8.4 Group Headers**

Phase headers spanning all columns:
- Sticky positioning during scroll
- Gray background (#f3f4f6)
- Uppercase text with letter spacing
- Phase timing on the right side
- 2px top border for visual separation

### **9. Technical Implementation Requirements**

#### **9.1 Key Protocol Message Structures**

**MCP Tool Result Structure (tools/call response)**:

MCP servers return tool results with the following structure:

```javascript
{
  content: [
    {
      type: 'text' | 'image' | 'resource',
      text?: string,           // For text content
      data?: string,           // For image content (base64)
      mimeType?: string,       // For image content
      annotations?: object,
      meta?: object
    }
  ],
  structuredContent?: object,  // Optional structured data
  isError: boolean,            // Indicates if execution failed
  meta?: object                // Optional metadata
}
```

**LLM Response Structure (Planning Phase)**:

When the LLM selects tools, it returns a response with content blocks:

```javascript
{
  id: string,
  content: [
    {
      type: 'text',
      text: string              // Optional explanation
    },
    {
      type: 'tool_use',
      id: string,               // Tool use ID for correlation
      name: string,             // Tool name
      input: object             // Tool arguments
    }
  ],
  stop_reason: 'tool_use' | 'end_turn'
}
```

**Key Integration Points**:
- **Tool Discovery (Phase 2)**: MCP tool schema (`inputSchema`) → LLM tool format (`input_schema`)
  - Field name conversion: `inputSchema` → `input_schema`
  - Structure remains the same (JSON Schema format)
- **Tool Selection (Phase 3)**: LLM `tool_use` blocks → MCP `tools/call` request
  - Extract `name` and `input` from LLM response
  - Format as MCP JSON-RPC request
- **Tool Results (Phase 4)**: MCP `content` array → LLM `tool_result` format
  - Extract text from MCP content blocks
  - Create `tool_result` block with `tool_use_id` for correlation
  - Communicate `isError: true` status to LLM if tool execution failed
- **Response Content**: The LLM may include explanatory text blocks alongside tool_use blocks

#### **9.2 Message Recording Structure**

Record all events (protocol messages, internal operations, console logs):

```javascript
{
  sessionId: string, // Global unique
  sequence: number,  // Global sequence across all events
  timestamp: number,
  eventType: 'protocol_message' | 'internal_operation' | 'console_log',
  actor: 'host_app' | 'llm' | 'mcp_server' | 'external_api',

  // For protocol messages
  direction?: 'sent' | 'received',
  lane?: 'host_llm' | 'host_mcp',
  message?: {
    jsonrpc: '2.0',
    // ... full JSON-RPC or LLM API content
  },

  // For console logs
  logLevel?: 'info' | 'debug' | 'error',
  logMessage?: string,

  // Common metadata
  metadata: {
    processingTime?: number,
    correlatedMessageId?: string,
    messageType: string,
    phase?: 'initialization' | 'discovery' | 'selection' | 'execution' | 'synthesis',

    // Tool-specific metadata (for tool execution events)
    toolName?: string,           // Name of tool being called
    toolId?: string,             // Tool use ID for correlation
    toolArguments?: object,      // Arguments passed to tool
    toolResultContent?: string,  // Extracted content from tool result
    toolError?: boolean          // Whether tool execution failed
  }
}
```

#### **9.2 Modular Architecture**

- **Actor components**: Separate React components for each actor column
- **Lane components**: Communication lane components for message cards
- **Spacer component**: Reusable component for rendering empty cells that maintain vertical alignment
- **Event bus**: Centralized event dispatcher for cross-component communication
- **State management**: Redux or Context for global timeline state
- **Pluggable renderers**: Custom renderers for different message types
- **Clear interfaces**: Well-defined props for actor and lane components
- **Layout engine**: Grid system that automatically inserts spacer blocks to maintain vertical alignment across all columns

### **10. User Interactions**

#### **10.1 Message Card Interactions**

- **Click card**: Toggles expansion to show/hide full JSON payload
- **Expanded state**: Shows formatted JSON with syntax highlighting
- **Collapsed state**: Shows compact summary with expand button `{ }`
- **Hover effect**: Subtle elevation and shadow

#### **10.2 Essential Controls**

- **Clear/Reset button**: Start new session and clear timeline
- **Copy session log button**: Export all recorded events

#### **10.3 View Controls**

- **Chat input**: Text field at bottom of Host App column
- **Send button**: Trigger new user message
- **Scroll behavior**: Timeline scrolls vertically, all columns stay strictly aligned using the spacer block system defined in section 1.2

### **11. Live Learning Experience**

The MVP must support live, interactive learning from first use. Users learn by doing, not by watching pre-recorded examples.

#### **11.1 Pre-configured MCP Server**

**AWS Documentation MCP Server** (https://github.com/awslabs/aws-documentation-mcp-server):
- No API keys or authentication required
- Publicly accessible AWS documentation
- Multiple tools demonstrating different interaction patterns:
  - `search_documentation`: Search AWS docs by phrase
  - `read_documentation`: Fetch specific doc page by URL
  - `recommend`: Get related content recommendations

**Pre-configuration Requirements**:
- MCP server must be automatically connected on application startup
- Connection status clearly visible in UI
- If connection fails, provide clear instructions for manual setup

#### **11.2 Suggested First Queries**

The application should provide suggested queries that demonstrate the complete MCP workflow:

**Suggested Query 1**: "Search AWS documentation for S3 bucket naming rules"
- Demonstrates: Single tool call (`search_documentation`)
- Simple workflow: Planning → Execution → Synthesis
- Fast feedback loop for first-time users

**Suggested Query 2**: "Look up S3 bucket naming rules and show me related topics"
- Demonstrates: Multiple tool calls (`search_documentation` + `read_documentation` + `recommend`)
- Complex workflow with multiple sequential tool executions within Phase 4
- Shows vertical alignment with spacer blocks across multiple server operations
- Illustrates that all tools execute before synthesis begins

**Suggested Query 3**: "What are the security best practices for Lambda functions?"
- Demonstrates: LLM selecting appropriate tools based on query intent
- Shows multi-step reasoning and tool selection process

#### **11.3 Pedagogical Goals**

Through live interaction, users learn:
1. **LLM makes two calls**: One for planning (tool selection), one for synthesis (final response)
2. **LLM never calls MCP directly**: No connection between LLM and MCP Server columns - visually obvious through vertical alignment
3. **Host App orchestrates everything**: Bridges between LLM and MCP, shown in communication lanes
4. **MCP servers are adapters**: AWS Documentation server delegates to AWS's public documentation API
5. **Complete transparency**: Every operation is visible in real-time across the timeline
6. **Vertical alignment reveals causality**: Users trace the flow from their question through all phases to the final response

#### **11.4 Progressive Disclosure**

**First Use Experience**:
- Display suggested queries prominently
- Show connection status for AWS Documentation MCP server
- Provide "Try this query" buttons for one-click exploration

**After First Query**:
- Users can enter their own questions
- Timeline persists, showing full history
- Users can compare different query patterns

**Learning by Experimentation**:
- Users discover tool selection behavior by asking different questions
- Vertical alignment makes it easy to see which query triggered which tools
- Real-time feedback reinforces understanding of the 5-phase workflow

---

## **Appendix A: Future Feature Ideas**

### **Playback and Analysis Features**

- Playback controls (play, pause, step-through, speed control)
- Session recording and replay
- Replay timeline scrubber
- Message sequence export (Mermaid diagrams)
- Performance metrics and latency graphs

### **Enhanced Visualizations**

- Animated message flow arrows
- Parallel operation swim lanes
- Message queue visualization
- State diagram display
- Capability negotiation matrix
- Resource usage indicators

### **Educational Enhancements**

- Interactive tutorials with guided walkthroughs
- Scenario library with pre-built examples
- Quiz mode for testing understanding
- Inline documentation and tooltips
- Glossary panel for MCP terminology
- Code generation from observed patterns
- Annotation system for adding notes

### **Advanced Interaction Features**

- Message filtering by type/method
- Search within messages
- Breakpoint setting for debugging
- Message modification and replay
- Error injection for testing
- Side-by-side comparison mode

### **Export and Sharing**

- Export as HAR-like format
- Share specific sequences via URL
- Generate documentation from sessions
- Create bug reports with context
- Export to various diagram formats

### **Developer Tools**

- Mock server capabilities
- Custom response scripting
- Latency simulation
- Transport mechanism selection (STDIO vs HTTP/SSE)
- WebSocket transport support
- Custom transport plugins

### **Advanced UI Features**

- Multi-theme support
- Customizable panel layouts
- Keyboard shortcuts
- High contrast/accessibility modes
- Adjustable message verbosity levels
- Collapsible message groups
- Color-blind friendly palettes

### **Monitoring and Debugging**

- Connection health indicators
- Message validation against schema
- Performance profiling
- Memory usage tracking
- Network traffic analysis
- Error recovery visualization

### **Collaboration Features**

- Share live sessions
- Collaborative annotations
- Team learning modes
- Instructor/student views

---

## **Appendix B: Technical Considerations for Future**

### **Storage and Persistence**

- Local session storage
- Cloud sync capabilities
- Session database design
- Efficient message indexing

### **Extensibility Architecture**

- Plugin system for custom visualizers
- Theme engine
- Custom message handlers
- Integration APIs

### **Performance Optimizations**

- Virtual scrolling for large message lists
- Message pagination
- Lazy loading of message details
- Efficient JSON parsing and rendering

---

## **Success Metrics for MVP**

1. **Architectural Clarity**: Users can clearly see that LLM and MCP Server are separate actors with no direct communication
2. **Two-Phase LLM Pattern**: Users recognize that the LLM is called twice (planning and synthesis)
3. **Host App Orchestration**: Users understand the Host App's role in bridging LLM and MCP
4. **Complete Message Visibility**: Users can see and inspect all protocol messages and internal operations
5. **Message Inspection**: Users can expand any message card to view full JSON payloads
6. **Data Recording**: All events are recorded with proper structure for future playback implementation
7. **Performance**: Interface remains responsive with 100+ events in timeline
8. **Learning Speed**: New users understand the complete MCP communication flow within 5 minutes
9. **Vertical Alignment Comprehension**: Users can trace causality across columns by following vertical alignment, understanding that events at the same vertical position are causally related

---

## **MVP Development Priorities**

1. **Phase 1**: Five-column grid layout with vertical alignment system
   - Implement actor columns (Host App, LLM, MCP Server)
   - Implement communication lanes (to LLM, to MCP Server)
   - Basic CSS grid with proper column widths
   - **Implement spacer block component and layout engine** (critical for vertical alignment as defined in section 1.2)

2. **Phase 2**: Message recording and event storage
   - Implement event recording structure
   - Create event bus for cross-component communication
   - Store all events (protocol messages, internal ops, console logs)
   - Implement phase tracking
   - Track vertical positioning metadata for spacer block generation

3. **Phase 3**: Actor and lane rendering with spacer blocks
   - Host App: Chat bubbles + console logs
   - LLM: Thinking indicators + console logs
   - MCP Server: Console logs with external API calls
   - Communication lanes: Message cards with expand/collapse
   - **Automatic spacer block insertion** to maintain vertical alignment

4. **Phase 4**: Interactive features
   - Click-to-expand message cards
   - JSON syntax highlighting
   - Hover effects
   - Group headers with sticky positioning

5. **Phase 5**: Live learning experience implementation
   - Pre-configure AWS Documentation MCP server connection
   - Implement suggested query UI with one-click "Try this" buttons
   - Demonstrate all pedagogical goals through live interaction

6. **Phase 6**: Polish and testing
   - Visual refinement
   - Performance testing with 100+ events
   - User testing for comprehension
   - Documentation

This MVP focuses on the essential teaching elements while accurately representing the complete MCP protocol flow as defined in the Model Context Protocol specification. The actor-based architecture supports future features outlined in the appendix.

