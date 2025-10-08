"""
Main orchestrator demonstrating the complete 5-phase MCP workflow.

This POC validates the PRD assumptions by demonstrating:
1. Initialization & Negotiation (3-message handshake)
2. Discovery & Contextualization (tools/list)
3. Model-Driven Selection (First Claude call - planning)
4. Execution Round Trip (tools/call)
5. Synthesis & Final Response (Second Claude call - synthesis)
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from mcp_visualizer.poc.claude_client import ClaudeClient
from mcp_visualizer.poc.client import MCPClient


async def run_poc_workflow(user_query: str):
    """Run the complete 5-phase MCP workflow.

    Args:
        user_query: The user's question that will trigger tool usage
    """
    print("\n" + "=" * 80)
    print("MCP PROTOCOL VALIDATION POC")
    print("=" * 80)
    print(f"\nUser Query: \"{user_query}\"")

    # Load API key
    load_dotenv(".env.local")
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not found in .env.local")

    # Initialize clients
    mcp_client = MCPClient()
    claude_client = ClaudeClient(api_key)

    # Get path to server script
    server_path = Path(__file__).parent / "simple_server.py"

    try:
        # ===================================================================
        # PHASE 1: INITIALIZATION & NEGOTIATION
        # ===================================================================
        init_result = await mcp_client.connect(str(server_path))

        # ===================================================================
        # PHASE 2: DISCOVERY & CONTEXTUALIZATION
        # ===================================================================
        mcp_tools = await mcp_client.list_tools()
        claude_tools = claude_client.convert_mcp_tools_to_claude_format(mcp_tools)

        print(f"\n[HOST] Tool schemas formatted for Claude ✓")
        print(f"[HOST] Ready to send tools to Claude with user query")

        # ===================================================================
        # PHASE 3: MODEL-DRIVEN SELECTION (First Claude Call - Planning)
        # ===================================================================
        print(f"\n{'='*80}")
        print("PHASE 3: MODEL-DRIVEN SELECTION (First LLM Inference - Planning)")
        print(f"{'='*80}")

        messages = [{"role": "user", "content": user_query}]

        print(f"[HOST] → CLAUDE: Sending first inference request (planning)")
        print(f"[HOST] Including {len(claude_tools)} tool(s) in context")

        # First Claude call - planning (tool selection)
        planning_response = claude_client.call_claude(
            messages=messages,
            tools=claude_tools,
            max_tokens=1024,
        )

        print(f"\n[HOST] ← CLAUDE: Received planning response")

        # Extract tool calls
        tool_calls = claude_client.extract_tool_calls(planning_response)

        if not tool_calls:
            print("\n[HOST] Claude did not select any tools. Response:")
            for block in planning_response["content"]:
                if block["type"] == "text":
                    print(f"[CLAUDE] {block['text']}")
            print("\n[HOST] POC complete - no tool execution needed")
            return

        print(f"\n[CLAUDE] Claude selected {len(tool_calls)} tool(s) to call:")
        for tool_call in tool_calls:
            print(f"[CLAUDE]   - {tool_call['name']} with input: {json.dumps(tool_call['input'])}")

        # ===================================================================
        # PHASE 4: EXECUTION ROUND TRIP
        # ===================================================================
        # Note: In a real implementation, user consent would be requested here

        # Execute each tool call
        tool_results = []
        for tool_call in tool_calls:
            mcp_result = await mcp_client.call_tool(
                tool_call["name"],
                tool_call["input"]
            )

            # Format result for Claude
            claude_result = claude_client.format_tool_result_for_claude(
                tool_call["id"],
                mcp_result
            )
            tool_results.append(claude_result)

        print(f"\n[HOST] All tool calls completed. Preparing synthesis request...")

        # ===================================================================
        # PHASE 5: SYNTHESIS & FINAL RESPONSE (Second Claude Call)
        # ===================================================================
        print(f"\n{'='*80}")
        print("PHASE 5: SYNTHESIS & FINAL RESPONSE (Second LLM Inference - Synthesis)")
        print(f"{'='*80}")

        # Build conversation with tool results
        # Add assistant's tool use
        messages.append({
            "role": "assistant",
            "content": planning_response["content"]
        })

        # Add tool results
        messages.append({
            "role": "user",
            "content": tool_results
        })

        print(f"[HOST] → CLAUDE: Sending second inference request (synthesis)")
        print(f"[HOST] Including conversation history with {len(tool_results)} tool result(s)")

        # Second Claude call - synthesis (final response)
        synthesis_response = claude_client.call_claude(
            messages=messages,
            tools=claude_tools,
            max_tokens=1024,
        )

        print(f"\n[HOST] ← CLAUDE: Received synthesis response")

        # Extract final text response
        final_text = ""
        for block in synthesis_response["content"]:
            if block["type"] == "text":
                final_text += block["text"]

        print(f"\n{'='*80}")
        print("FINAL RESPONSE TO USER")
        print(f"{'='*80}")
        print(f"\n{final_text}\n")

        print(f"\n{'='*80}")
        print("POC COMPLETE - ALL 5 PHASES VALIDATED ✓")
        print(f"{'='*80}")
        print("\nValidation Summary:")
        print("✓ Phase 1: Initialization & Negotiation (3-message handshake)")
        print("✓ Phase 2: Discovery & Contextualization (tools/list)")
        print("✓ Phase 3: Model-Driven Selection (First Claude call)")
        print("✓ Phase 4: Execution Round Trip (tools/call)")
        print("✓ Phase 5: Synthesis & Final Response (Second Claude call)")
        print("\nKey Observations:")
        print(f"  - Host App orchestrated all communication")
        print(f"  - Claude never directly communicated with MCP server")
        print(f"  - Two distinct Claude API calls (planning + synthesis)")
        print(f"  - MCP tool schemas successfully converted to Claude format")
        print(f"  - JSON-RPC 2.0 protocol observed throughout")

    finally:
        await mcp_client.cleanup()


def main():
    """Entry point for the POC."""
    # Default query that should trigger tool usage
    default_query = "What's the weather like in San Francisco?"

    # Allow custom query from command line
    query = sys.argv[1] if len(sys.argv) > 1 else default_query

    asyncio.run(run_poc_workflow(query))


if __name__ == "__main__":
    main()
