"""Claude API client with MCP tool schema conversion."""

import json
import sys
from typing import Any

from anthropic import Anthropic


class ClaudeClient:
    """Client for interacting with Claude API with MCP tool support."""

    def __init__(self, api_key: str):
        """Initialize the Claude client.

        Args:
            api_key: Anthropic API key
        """
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"

    def convert_mcp_tools_to_claude_format(
        self, mcp_tools: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Convert MCP tool schemas to Claude API tool format.

        Args:
            mcp_tools: List of MCP tool definitions

        Returns:
            List of Claude API tool definitions
        """
        print("\n[HOST] Converting MCP tool schemas to Claude API format...", file=sys.stderr)

        claude_tools = []
        for mcp_tool in mcp_tools:
            claude_tool = {
                "name": mcp_tool["name"],
                "description": mcp_tool.get("description", ""),
                "input_schema": mcp_tool.get("inputSchema", {"type": "object", "properties": {}}),
            }
            claude_tools.append(claude_tool)

            print(f"[HOST] Converted tool: {mcp_tool['name']}", file=sys.stderr)

        return claude_tools

    def call_claude(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        max_tokens: int = 1024,
    ) -> dict[str, Any]:
        """Call Claude API with messages and optional tools.

        Args:
            messages: Conversation messages
            tools: Optional list of tools in Claude format
            max_tokens: Maximum tokens for response

        Returns:
            Claude API response as dict
        """
        kwargs: dict[str, Any] = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": messages,
        }

        if tools:
            kwargs["tools"] = tools

        print(f"\n[CLAUDE] Sending request to Claude API ({self.model})", file=sys.stderr)
        print(f"[CLAUDE] Message count: {len(messages)}", file=sys.stderr)
        if tools:
            print(f"[CLAUDE] Available tools: {[t['name'] for t in tools]}", file=sys.stderr)

        response = self.client.messages.create(**kwargs)

        response_dict = {
            "id": response.id,
            "type": response.type,
            "role": response.role,
            "content": [block.model_dump() for block in response.content],
            "model": response.model,
            "stop_reason": response.stop_reason,
            "usage": response.usage.model_dump(),
        }

        print(f"[CLAUDE] Response received:", file=sys.stderr)
        print(f"[CLAUDE] Stop reason: {response.stop_reason}", file=sys.stderr)
        print(f"[CLAUDE] Content blocks: {len(response.content)}", file=sys.stderr)

        # Log content blocks
        for i, block in enumerate(response.content):
            if block.type == "text":
                print(f"[CLAUDE] Block {i}: text ({len(block.text)} chars)", file=sys.stderr)
            elif block.type == "tool_use":
                print(f"[CLAUDE] Block {i}: tool_use - {block.name}", file=sys.stderr)
                print(f"[CLAUDE]   Input: {json.dumps(block.input, indent=2)}", file=sys.stderr)

        return response_dict

    def extract_tool_calls(self, response: dict[str, Any]) -> list[dict[str, Any]]:
        """Extract tool calls from Claude response.

        Args:
            response: Claude API response

        Returns:
            List of tool calls with id, name, and input
        """
        tool_calls = []
        for block in response["content"]:
            if block["type"] == "tool_use":
                tool_calls.append(
                    {
                        "id": block["id"],
                        "name": block["name"],
                        "input": block["input"],
                    }
                )
        return tool_calls

    def format_tool_result_for_claude(
        self, tool_call_id: str, tool_result: dict[str, Any]
    ) -> dict[str, Any]:
        """Format MCP tool result for Claude API.

        Args:
            tool_call_id: The tool call ID from Claude's tool_use block
            tool_result: The result from MCP server

        Returns:
            Formatted tool result for Claude
        """
        # Extract text content from MCP result
        content_text = ""
        if "content" in tool_result and tool_result["content"]:
            for content_item in tool_result["content"]:
                if content_item.get("type") == "text":
                    content_text += content_item.get("text", "")

        return {
            "type": "tool_result",
            "tool_use_id": tool_call_id,
            "content": content_text or json.dumps(tool_result),
        }
