"""Simple MCP server with basic tools for POC validation."""

import sys
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("simple-poc-server")


@mcp.tool()
def get_weather(city: str) -> str:
    """Get the current weather for a city.

    Args:
        city: The name of the city to get weather for

    Returns:
        A description of the weather in the city
    """
    # Mock weather data - in real scenario this would call an API
    weather_data = {
        "San Francisco": "Sunny, 72°F (22°C)",
        "New York": "Cloudy, 65°F (18°C)",
        "London": "Rainy, 55°F (13°C)",
        "Tokyo": "Clear, 68°F (20°C)",
    }

    result = weather_data.get(
        city,
        f"Weather data not available for {city}. Showing default: Partly cloudy, 70°F (21°C)"
    )

    # Log to stderr (stdout is reserved for JSON-RPC)
    print(f"[SERVER] Tool 'get_weather' called with city='{city}'", file=sys.stderr)
    print(f"[SERVER] Returning: {result}", file=sys.stderr)

    return result


@mcp.tool()
def calculate(expression: str) -> str:
    """Safely evaluate a mathematical expression.

    Args:
        expression: A mathematical expression (e.g., "2 + 2", "10 * 5")

    Returns:
        The result of the calculation
    """
    print(f"[SERVER] Tool 'calculate' called with expression='{expression}'", file=sys.stderr)

    try:
        # Safe evaluation - only allow basic math operators
        allowed_chars = set("0123456789+-*/(). ")
        if not all(c in allowed_chars for c in expression):
            return f"Error: Expression contains invalid characters. Only numbers and +, -, *, /, (, ) are allowed."

        result = eval(expression, {"__builtins__": {}}, {})
        print(f"[SERVER] Calculation result: {result}", file=sys.stderr)
        return f"The result is: {result}"
    except Exception as e:
        error_msg = f"Error calculating expression: {str(e)}"
        print(f"[SERVER] {error_msg}", file=sys.stderr)
        return error_msg


def main():
    """Run the MCP server."""
    print("[SERVER] Starting simple-poc-server...", file=sys.stderr)
    print("[SERVER] Available tools: get_weather, calculate", file=sys.stderr)
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
