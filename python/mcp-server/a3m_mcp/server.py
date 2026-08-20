"""
A3M Router MCP Server - MCP Protocol Server for A3M Router

MCP 2.0.0 compatible server that provides A3M Router functionality
as MCP tools for AI agents.
"""

import os
import asyncio
import json
from typing import Optional, List, Any

try:
    from mcp.server.lowlevel import Server
    from mcp import Tool, ListToolsResult
    from mcp.types import CallToolResult, TextContent
    from mcp.server.stdio import stdio_server
    HAS_MCP = True
except ImportError:
    HAS_MCP = False
    print("WARNING: mcp package not installed. Run: pip install mcp", flush=True)

# A3M Router client
try:
    import a3m
    A3MRouter = a3m.A3MRouter
except ImportError:
    A3MRouter = None


SERVER_NAME = "a3m-router"
SERVER_VERSION = "1.0.0"

_router: Optional["A3MRouter"] = None


def get_router() -> "A3MRouter":
    """Get or create A3MRouter instance."""
    global _router
    if _router is None:
        base_url = os.environ.get("A3M_BASE_URL", "http://localhost:8787")
        api_key = os.environ.get("A3M_API_KEY", "")
        _router = A3MRouter(base_url=base_url, api_key=api_key)
    return _router


# Tool definitions
TOOLS = [
    Tool(
        name="a3m_route",
        title="Route Query",
        description="Route a query to the optimal LLM provider using A3M's adaptive routing. Returns model selection, tier, estimated cost, and reasoning.",
        inputSchema={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The user query to route (e.g. 'Write Python code to sort a list')",
                },
                "provider": {
                    "type": "string",
                    "description": "Optional: Force a specific provider (e.g. 'groq', 'google')",
                },
            },
            "required": ["query"],
        },
    ),
    Tool(
        name="a3m_chat",
        title="Chat with A3M",
        description="Send a chat message through A3M Router's adaptive routing.",
        inputSchema={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The user query",
                },
            },
            "required": ["query"],
        },
    ),
    Tool(
        name="a3m_cost_report",
        title="Cost Report",
        description="Get cost analytics across all providers.",
        inputSchema={
            "type": "object",
            "properties": {},
        },
    ),
    Tool(
        name="a3m_models",
        title="List Models",
        description="List all available models with cost/latency info.",
        inputSchema={
            "type": "object",
            "properties": {},
        },
    ),
]


class A3MServer:
    """A3M Router MCP Server with tool handlers."""

    def __init__(self):
        pass

    async def handle_list_tools(self, request_context=None) -> ListToolsResult:
        """Handle tools/list request."""
        return ListToolsResult(
            tools=[
                {
                    "name": t.name,
                    "description": t.description,
                    "inputSchema": t.inputSchema,
                }
                for t in TOOLS
            ]
        )

    async def handle_call_tool(self, request_context, name: str, arguments: dict) -> CallToolResult:
        """Handle tools/call request."""
        try:
            if name == "a3m_route":
                router = get_router()
                query = arguments.get("query")
                provider = arguments.get("provider")

                result = router.route(query, provider=provider)
                return CallToolResult(
                    content=[TextContent(type="text", text=json.dumps(result, indent=2))]
                )

            elif name == "a3m_chat":
                router = get_router()
                query = arguments.get("query")

                result = router.chat(query)
                return CallToolResult(
                    content=[TextContent(type="text", text=str(result))]
                )

            elif name == "a3m_cost_report":
                router = get_router()
                report = router.cost_report()
                return CallToolResult(
                    content=[TextContent(type="text", text=json.dumps(report, indent=2))]
                )

            elif name == "a3m_models":
                router = get_router()
                models = router.models()
                return CallToolResult(
                    content=[TextContent(type="text", text=json.dumps(models, indent=2))]
                )

            else:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Unknown tool: {name}")],
                    isError=True,
                )

        except Exception as e:
            return CallToolResult(
                content=[TextContent(type="text", text=f"Error: {str(e)}")],
                isError=True,
            )


if HAS_MCP:
    # Create server with handlers
    a3m_server = A3MServer()

    server = Server(
        SERVER_NAME,
        version=SERVER_VERSION,
        on_list_tools=a3m_server.handle_list_tools,
        on_call_tool=a3m_server.handle_call_tool,
    )


async def main():
    """Main entry point for MCP server."""
    if not HAS_MCP:
        print("ERROR: mcp package not installed", flush=True)
        return

    print(f"Starting {SERVER_NAME} MCP Server v{SERVER_VERSION}", flush=True)

    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    if HAS_MCP:
        asyncio.run(main())
    else:
        print("ERROR: mcp package required", flush=True)
        print("Run: pip install mcp", flush=True)
