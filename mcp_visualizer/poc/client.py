"""MCP client wrapper for connecting to and communicating with MCP servers."""

import json
import sys
from contextlib import AsyncExitStack
from typing import Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


class MCPClient:
    """Wrapper for MCP client operations."""

    def __init__(self):
        """Initialize the MCP client."""
        self.session: ClientSession | None = None
        self.exit_stack = AsyncExitStack()

    async def connect(self, server_script_path: str) -> dict[str, Any]:
        """Connect to an MCP server and initialize the session.

        Args:
            server_script_path: Path to the server script to run

        Returns:
            The initialization result from the server
        """
        print(f"\n{'='*80}", file=sys.stderr)
        print("PHASE 1: INITIALIZATION & NEGOTIATION", file=sys.stderr)
        print(f"{'='*80}", file=sys.stderr)
        print(f"[HOST] Connecting to MCP server: {server_script_path}", file=sys.stderr)

        # Create server parameters for stdio transport
        server_params = StdioServerParameters(
            command="python",
            args=[server_script_path],
            env=None
        )

        # Connect to server
        stdio_transport = await self.exit_stack.enter_async_context(
            stdio_client(server_params)
        )
        stdio, write = stdio_transport

        # Create session
        self.session = await self.exit_stack.enter_async_context(
            ClientSession(stdio, write)
        )

        print("[HOST] → MCP SERVER: Sending 'initialize' request", file=sys.stderr)

        # Initialize the session
        init_result = await self.session.initialize()

        print("[HOST] ← MCP SERVER: Received 'initialize' response", file=sys.stderr)
        print(f"[HOST] Server capabilities: {json.dumps(init_result.model_dump(), indent=2)}", file=sys.stderr)

        print("[HOST] → MCP SERVER: Sending 'initialized' notification", file=sys.stderr)
        print("[HOST] Handshake complete ✓", file=sys.stderr)

        return init_result.model_dump()

    async def list_tools(self) -> list[dict[str, Any]]:
        """List available tools from the connected server.

        Returns:
            List of tool definitions
        """
        if not self.session:
            raise RuntimeError("Not connected to a server")

        print(f"\n{'='*80}", file=sys.stderr)
        print("PHASE 2: DISCOVERY & CONTEXTUALIZATION", file=sys.stderr)
        print(f"{'='*80}", file=sys.stderr)
        print("[HOST] → MCP SERVER: Requesting 'tools/list'", file=sys.stderr)

        response = await self.session.list_tools()

        print(f"[HOST] ← MCP SERVER: Received {len(response.tools)} tool(s)", file=sys.stderr)

        tools = []
        for tool in response.tools:
            tool_dict = tool.model_dump()
            tools.append(tool_dict)
            print(f"\n[HOST] Tool discovered: {tool.name}", file=sys.stderr)
            print(f"       Description: {tool.description}", file=sys.stderr)
            if tool.inputSchema:
                print(f"       Input schema: {json.dumps(tool.inputSchema, indent=2)}", file=sys.stderr)

        return tools

    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """Call a tool on the connected server.

        Args:
            tool_name: Name of the tool to call
            arguments: Arguments to pass to the tool

        Returns:
            The result from the tool
        """
        if not self.session:
            raise RuntimeError("Not connected to a server")

        print(f"\n{'='*80}", file=sys.stderr)
        print("PHASE 4: EXECUTION ROUND TRIP", file=sys.stderr)
        print(f"{'='*80}", file=sys.stderr)
        print(f"[HOST] → MCP SERVER: Calling tool '{tool_name}'", file=sys.stderr)
        print(f"[HOST] Arguments: {json.dumps(arguments, indent=2)}", file=sys.stderr)

        result = await self.session.call_tool(tool_name, arguments)

        print(f"[HOST] ← MCP SERVER: Received tool result", file=sys.stderr)
        result_dict = result.model_dump()
        print(f"[HOST] Result: {json.dumps(result_dict, indent=2)}", file=sys.stderr)

        return result_dict

    async def cleanup(self):
        """Clean up the client connection."""
        await self.exit_stack.aclose()
        print("\n[HOST] MCP client connection closed", file=sys.stderr)
