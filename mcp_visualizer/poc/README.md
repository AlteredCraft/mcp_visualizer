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

### Sample Output Structure

```
================================================================================
MCP PROTOCOL VALIDATION POC
================================================================================

User Query: "What's the weather like in San Francisco?"

================================================================================
PHASE 1: INITIALIZATION & NEGOTIATION
================================================================================
[HOST] Connecting to MCP server: .../simple_server.py
[HOST] → MCP SERVER: Sending 'initialize' request
[SERVER] Starting simple-poc-server...
[HOST] ← MCP SERVER: Received 'initialize' response
[HOST] Server capabilities: {...}
[HOST] → MCP SERVER: Sending 'initialized' notification
[HOST] Handshake complete ✓

================================================================================
PHASE 2: DISCOVERY & CONTEXTUALIZATION
================================================================================
[HOST] → MCP SERVER: Requesting 'tools/list'
[HOST] ← MCP SERVER: Received 2 tool(s)
[HOST] Tool discovered: get_weather
       Description: Get the current weather for a city.
       Input schema: {...}
[HOST] Tool discovered: calculate
       Description: Safely evaluate a mathematical expression.
       Input schema: {...}

[HOST] Converting MCP tool schemas to Claude API format...
[HOST] Tool schemas formatted for Claude ✓

================================================================================
PHASE 3: MODEL-DRIVEN SELECTION (First LLM Inference - Planning)
================================================================================
[HOST] → CLAUDE: Sending first inference request (planning)
[CLAUDE] Response received:
[CLAUDE] Block 0: tool_use - get_weather
[CLAUDE]   Input: {"city": "San Francisco"}
[CLAUDE] Claude selected 1 tool(s) to call

================================================================================
PHASE 4: EXECUTION ROUND TRIP
================================================================================
[HOST] → MCP SERVER: Calling tool 'get_weather'
[SERVER] Tool 'get_weather' called with city='San Francisco'
[HOST] ← MCP SERVER: Received tool result

================================================================================
PHASE 5: SYNTHESIS & FINAL RESPONSE (Second LLM Inference - Synthesis)
================================================================================
[HOST] → CLAUDE: Sending second inference request (synthesis)
[CLAUDE] Response received:
[CLAUDE] Block 0: text (...)

================================================================================
FINAL RESPONSE TO USER
================================================================================

The weather in San Francisco is currently sunny with a temperature of 72°F (22°C).

================================================================================
POC COMPLETE - ALL 5 PHASES VALIDATED ✓
================================================================================
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
