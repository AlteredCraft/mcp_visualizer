# MCP Protocol Validation POC

A technical validation proof-of-concept that demonstrates the complete 5-phase MCP (Model Context Protocol) communication workflow using real protocol messages and the Claude API.

## Purpose

This POC validates the assumptions in the [MCP Inspector Teaching App PRD](../../docs/MCP%20Inspector%20Teaching%20App%20-%20MVP%20Product%20Requirements%20Document.md) by demonstrating:

1. **Phase 1: Initialization & Negotiation** - 3-message handshake (`initialize` → response → `initialized`)
2. **Phase 2: Discovery & Contextualization** - Tool discovery via `tools/list`
3. **Phase 3: Model-Driven Selection** - First Claude API call (planning/tool selection)
4. **Phase 4: Execution Round Trip** - Tool execution via `tools/call`
5. **Phase 5: Synthesis & Final Response** - Second Claude API call (synthesis)

## Key Validations

✅ **JSON-RPC 2.0 Protocol** - All MCP messages follow the standard format
✅ **3-Message Handshake** - Initialization follows the spec exactly
✅ **Tool Schema Conversion** - MCP format → Claude API format
✅ **Two LLM Calls** - Demonstrates planning call separate from synthesis call
✅ **Host Orchestration** - Host App coordinates all communication (no direct LLM↔MCP)
✅ **Stdio Transport** - Uses the same transport as the AWS Documentation MCP server

## Architecture

```
orchestrator.py (Host App)
    ├── client.py (MCP Client) ←→ simple_server.py (MCP Server)
    └── claude_client.py (Claude API)
```

**Critical Design Principle**: Claude never directly communicates with the MCP server. The Host App (orchestrator) bridges all communication.

## Setup

### Prerequisites

- Python 3.13+
- `uv` package manager

### Installation

```bash
# From project root
uv sync
```

This will install dependencies from `pyproject.toml`:
- `mcp` - Official MCP Python SDK
- `anthropic` - Claude API client
- `python-dotenv` - Environment variable management

### Configuration

Create a `.env.local` file in the project root:

```bash
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```

## Usage

### Run with Default Query

```bash
uv run python -m mcp_visualizer.poc.orchestrator
```

Default query: "What's the weather like in San Francisco?"

### Run with Custom Query

```bash
uv run python -m mcp_visualizer.poc.orchestrator "Calculate 42 * 8"
```

> **Note:** We use `python -m` to run the module, which automatically adds the project root to the Python path.

### Example Queries

**Single tool call:**
```bash
uv run python -m mcp_visualizer.poc.orchestrator "What's the weather in Tokyo?"
```

**Math calculation:**
```bash
uv run python -m mcp_visualizer.poc.orchestrator "What is 123 + 456?"
```

**Multiple tools (if Claude decides):**
```bash
uv run python -m mcp_visualizer.poc.orchestrator "What's the weather in London and what's 10 times 5?"
```

## Output

The POC produces detailed console output showing:

- **Phase headers** - Clear demarcation of each protocol phase
- **Actor labels** - `[HOST]`, `[CLAUDE]`, `[SERVER]` prefix all operations
- **Message direction** - `→` for requests, `←` for responses
- **Full JSON payloads** - Complete protocol messages for inspection
- **Tool schemas** - Both MCP and Claude formats
- **Validation summary** - Confirms all phases completed

### Sample Output

```
================================================================================
MCP PROTOCOL VALIDATION POC
================================================================================

User Query: "What's the weather in Tokyo?"

================================================================================
PHASE 1: INITIALIZATION & NEGOTIATION
================================================================================
[HOST] Connecting to MCP server: /Users/sam/Projects/mcp-visualizer/mcp_visualizer/poc/simple_server.py
[HOST] → MCP SERVER: Sending 'initialize' request
[SERVER] Starting simple-poc-server...
[SERVER] Available tools: get_weather, calculate
[HOST] ← MCP SERVER: Received 'initialize' response
[HOST] Server capabilities: {
  "meta": null,
  "protocolVersion": "2025-06-18",
  "capabilities": {
    "experimental": {},
    "logging": null,
    "prompts": {
      "listChanged": false
    },
    "resources": {
      "subscribe": false,
      "listChanged": false
    },
    "tools": {
      "listChanged": false
    },
    "completions": null
  },
  "serverInfo": {
    "name": "simple-poc-server",
    "title": null,
    "version": "1.16.0",
    "websiteUrl": null,
    "icons": null
  },
  "instructions": null
}
[HOST] → MCP SERVER: Sending 'initialized' notification
[HOST] Handshake complete ✓

================================================================================
PHASE 2: DISCOVERY & CONTEXTUALIZATION
================================================================================
[HOST] → MCP SERVER: Requesting 'tools/list'
Processing request of type ListToolsRequest
[HOST] ← MCP SERVER: Received 2 tool(s)

[HOST] Tool discovered: get_weather
       Description: Get the current weather for a city.

Args:
    city: The name of the city to get weather for

Returns:
    A description of the weather in the city

       Input schema: {
  "properties": {
    "city": {
      "title": "City",
      "type": "string"
    }
  },
  "required": [
    "city"
  ],
  "title": "get_weatherArguments",
  "type": "object"
}

[HOST] Tool discovered: calculate
       Description: Safely evaluate a mathematical expression.

Args:
    expression: A mathematical expression (e.g., "2 + 2", "10 * 5")

Returns:
    The result of the calculation

       Input schema: {
  "properties": {
    "expression": {
      "title": "Expression",
      "type": "string"
    }
  },
  "required": [
    "expression"
  ],
  "title": "calculateArguments",
  "type": "object"
}

[HOST] Converting MCP tool schemas to Claude API format...
[HOST] Converted tool: get_weather
[HOST] Converted tool: calculate

[HOST] Tool schemas formatted for Claude ✓
[HOST] Ready to send tools to Claude with user query

================================================================================
PHASE 3: MODEL-DRIVEN SELECTION (First LLM Inference - Planning)
================================================================================
[HOST] → CLAUDE: Sending first inference request (planning)
[HOST] Including 2 tool(s) in context

[CLAUDE] Sending request to Claude API (claude-sonnet-4-20250514)
[CLAUDE] Message count: 1
[CLAUDE] Available tools: ['get_weather', 'calculate']
[CLAUDE] Response received:
[CLAUDE] Stop reason: tool_use
[CLAUDE] Content blocks: 2
[CLAUDE] Block 0: text (48 chars)
[CLAUDE] Block 1: tool_use - get_weather
[CLAUDE]   Input: {
  "city": "Tokyo"
}

[HOST] ← CLAUDE: Received planning response

[CLAUDE] Claude selected 1 tool(s) to call:
[CLAUDE]   - get_weather with input: {"city": "Tokyo"}

================================================================================
PHASE 4: EXECUTION ROUND TRIP
================================================================================
[HOST] → MCP SERVER: Calling tool 'get_weather'
[HOST] Arguments: {
  "city": "Tokyo"
}
Processing request of type CallToolRequest
[SERVER] Tool 'get_weather' called with city='Tokyo'
[SERVER] Returning: Clear, 68°F (20°C)
[HOST] ← MCP SERVER: Received tool result
[HOST] Result: {
  "meta": null,
  "content": [
    {
      "type": "text",
      "text": "Clear, 68\u00b0F (20\u00b0C)",
      "annotations": null,
      "meta": null
    }
  ],
  "structuredContent": {
    "result": "Clear, 68\u00b0F (20\u00b0C)"
  },
  "isError": false
}

[HOST] All tool calls completed. Preparing synthesis request...

================================================================================
PHASE 5: SYNTHESIS & FINAL RESPONSE (Second LLM Inference - Synthesis)
================================================================================
[HOST] → CLAUDE: Sending second inference request (synthesis)
[HOST] Including conversation history with 1 tool result(s)

[CLAUDE] Sending request to Claude API (claude-sonnet-4-20250514)
[CLAUDE] Message count: 3
[CLAUDE] Available tools: ['get_weather', 'calculate']
[CLAUDE] Response received:
[CLAUDE] Stop reason: end_turn
[CLAUDE] Content blocks: 1
[CLAUDE] Block 0: text (114 chars)

[HOST] ← CLAUDE: Received synthesis response

================================================================================
FINAL RESPONSE TO USER
================================================================================

The current weather in Tokyo is clear with a temperature of 68°F (20°C). It's a pleasant day with good visibility!


================================================================================
POC COMPLETE - ALL 5 PHASES VALIDATED ✓
================================================================================

Validation Summary:
✓ Phase 1: Initialization & Negotiation (3-message handshake)
✓ Phase 2: Discovery & Contextualization (tools/list)
✓ Phase 3: Model-Driven Selection (First Claude call)
✓ Phase 4: Execution Round Trip (tools/call)
✓ Phase 5: Synthesis & Final Response (Second Claude call)

Key Observations:
  - Host App orchestrated all communication
  - Claude never directly communicated with MCP server
  - Two distinct Claude API calls (planning + synthesis)
  - MCP tool schemas successfully converted to Claude format
  - JSON-RPC 2.0 protocol observed throughout

[HOST] MCP client connection closed
```

## Components

### `simple_server.py`

A minimal MCP server built with FastMCP providing two tools:

- **`get_weather(city: str)`** - Returns mock weather data
- **`calculate(expression: str)`** - Safely evaluates math expressions

Uses stdio transport and logs to stderr (stdout is reserved for JSON-RPC).

### `client.py`

MCP client wrapper that:
- Connects to MCP servers via stdio
- Handles initialization handshake
- Lists available tools
- Calls tools with arguments
- Logs all protocol messages

### `claude_client.py`

Claude API integration that:
- Converts MCP tool schemas to Claude API format
- Makes Claude API calls with tools
- Extracts tool calls from Claude responses
- Formats tool results for Claude

### `orchestrator.py`

Main POC script that:
- Coordinates the complete 5-phase workflow
- Acts as the "Host App" from the PRD
- Demonstrates Host orchestration of all communication
- Validates protocol assumptions
- Produces detailed logging

## What This POC Validates

### Message Structure

- ✅ JSON-RPC 2.0 format for all MCP messages
- ✅ Proper `initialize` / `InitializeResult` / `initialized` sequence
- ✅ `tools/list` request/response format
- ✅ `tools/call` request/response format
- ✅ Tool result content blocks structure

### Communication Patterns

- ✅ Host App orchestrates all communication
- ✅ No direct Claude ↔ MCP Server communication
- ✅ Two distinct Claude API calls (planning, then synthesis)
- ✅ Tool schemas converted from MCP format to Claude format
- ✅ Tool results converted from MCP format to Claude format

### Protocol Compliance

- ✅ 3-message initialization handshake
- ✅ Stdio transport mechanism
- ✅ Server capability negotiation
- ✅ Tool discovery before execution
- ✅ Proper message sequencing

## Next Steps

This POC validates the technical assumptions needed to build the full MCP Inspector Teaching App. The main application will:

1. Add the 5-column actor-based UI visualization
2. Record all events with timestamps and sequences
3. Visualize message flow in real-time
4. Support the AWS Documentation MCP server
5. Add interactive features (expand/collapse, syntax highlighting)

## Troubleshooting

**"ANTHROPIC_API_KEY not found"**
- Ensure `.env.local` exists in project root with valid API key

**"Not connected to a server"**
- Check that `simple_server.py` can run: `python mcp_visualizer/poc/simple_server.py`
- Ensure `mcp` package is installed: `uv sync`

**"Module not found" errors**
- Run from project root directory
- Ensure virtual environment is activated: `source .venv/bin/activate`

## References

- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Project PRD](../../docs/MCP%20Inspector%20Teaching%20App%20-%20MVP%20Product%20Requirements%20Document.md)
