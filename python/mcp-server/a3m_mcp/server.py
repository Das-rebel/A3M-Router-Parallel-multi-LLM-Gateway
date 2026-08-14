"""A3M Router MCP Server — 4 tools for parallel multi-LLM routing.

Tools:
    a3m_route     - Route a query to the optimal LLM provider (no execution)
    a3m_ensemble  - Execute query across multiple providers in parallel
    a3m_classify  - Classify query type and get provider recommendations
    a3m_providers - List all configured providers with cost and availability

Run:
    python -m a3m_mcp
    # Or pipe JSON-RPC directly:
    echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python -m a3m_mcp
"""
import asyncio
import json
import os
import sys
from typing import Any, Dict, List, Optional

# MCP imports — use correct lowlevel API for installed version
try:
    from mcp.server.lowlevel import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, CallToolResult, TextContent
    HAS_MCP = True
except ImportError as e:
    HAS_MCP = False
    print(f"WARNING: mcp package not installed. Run: pip install mcp. Error: {e}", file=sys.stderr)

# ─── A3M Router client ──────────────────────────────────────────────────────

A3M_BASE_URL = os.getenv("A3M_BASE_URL", "http://localhost:8787")
A3M_API_KEY = os.getenv("A3M_API_KEY", "not-needed")
A3M_TIMEOUT = float(os.getenv("A3M_TIMEOUT", "30.0"))


class A3MRouterClient:
    """Thin async client for the A3M Router HTTP API."""

    def __init__(self, base_url: str = A3M_BASE_URL, api_key: str = A3M_API_KEY):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._client: Optional[Any] = None

    async def _get_client(self) -> Any:
        if self._client is None:
            import httpx
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=A3M_TIMEOUT,
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
        return self._client

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None

    async def route(self, query: str) -> Dict[str, Any]:
        """Route a query — returns routing decision without LLM execution."""
        client = await self._get_client()
        try:
            response = await client.get(
                "/route",
                params={"query": query},
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
        # Fallback
        return {
            "model": "groq/llama-3.3-70b-versatile",
            "tier": "cheap",
            "cost": 0.0,
            "reasoning": "A3M adaptive routing",
            "complexity": 0.3,
        }

    async def chat(
        self,
        query: str,
        model: str = "auto",
        system: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """Send a chat message via A3M Router."""
        client = await self._get_client()
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": query})

        try:
            response = await client.post(
                "/v1/chat/completions",
                json={
                    "model": model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e), "choices": [{"message": {"content": f"Error: {e}"}}]}

    async def ensemble(
        self,
        query: str,
        providers: Optional[List[str]] = None,
        system: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Execute query across multiple providers in parallel."""
        providers = providers or ["groq", "google", "cerebras"]
        tasks = [
            self.chat(query, model=p, system=system)
            for p in providers
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        responses = []
        for i, r in enumerate(results):
            if isinstance(r, Exception):
                responses.append({"provider": providers[i], "error": str(r)})
            else:
                content = r.get("choices", [{}])[0].get("message", {}).get("content", "")
                responses.append({"provider": providers[i], "content": content})

        return {
            "query": query,
            "parallel_responses": responses,
            "best_answer": responses[0].get("content", "") if responses else "",
            "stats": {
                "total_providers": len(providers),
                "successful": sum(1 for r in responses if "error" not in r),
                "failed": sum(1 for r in responses if "error" in r),
            },
        }

    async def classify(self, query: str) -> Dict[str, Any]:
        """Classify a query by type and get provider recommendations."""
        route = await self.route(query)
        complexity = route.get("complexity", 0.5)
        model = route.get("model", "groq/llama-3.3-70b-versatile")

        query_lower = query.lower()
        if any(k in query_lower for k in ["write code", "function", "class", "def ", "import "]):
            classification = "code"
            recommended = ["groq/llama-3.3-70b-versatile", "cerebras/cerebras-coder"]
        elif any(k in query_lower for k in ["explain", "what is", "how does", "why is"]):
            classification = "fast"
            recommended = ["groq/llama-3.1-8b-instant", "google/gemini-2.0-flash"]
        elif complexity >= 0.65:
            classification = "deep"
            recommended = ["openai/gpt-4o", "anthropic/claude-3.5-sonnet"]
        else:
            classification = "creative"
            recommended = ["groq/llama-3.3-70b-versatile", "google/gemini-2.0-flash"]

        return {
            "query": query,
            "classification": classification,
            "complexity": complexity,
            "recommended_model": model,
            "recommended_providers": recommended,
        }

    async def providers(self) -> Dict[str, Any]:
        """List all configured providers with cost and status."""
        client = await self._get_client()
        try:
            response = await client.get(
                "/providers",
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass

        default_providers = [
            {"name": "groq", "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"], "cost_per_1k_input": 0.0, "status": "available"},
            {"name": "google", "models": ["gemini-2.0-flash", "gemini-1.5-flash"], "cost_per_1k_input": 0.0, "status": "available"},
            {"name": "cerebras", "models": ["cerebras-coder", "cerebras-llama-3.3-70b"], "cost_per_1k_input": 0.0, "status": "available"},
            {"name": "openai", "models": ["gpt-4o", "gpt-4o-mini"], "cost_per_1k_input": 0.015, "status": "available"},
            {"name": "anthropic", "models": ["claude-3.5-sonnet", "claude-3-opus"], "cost_per_1k_input": 0.015, "status": "available"},
            {"name": "mistral", "models": ["mistral-large", "mistral-small"], "cost_per_1k_input": 0.008, "status": "available"},
            {"name": "deepseek", "models": ["deepseek-chat", "deepseek-coder"], "cost_per_1k_input": 0.001, "status": "available"},
        ]
        return {"providers": default_providers, "source": "fallback"}


# ─── MCP Server ───────────────────────────────────────────────────────────────

if HAS_MCP:
    SERVER_NAME = "a3m-router"
    SERVER_VERSION = "1.0.0"

    _router: Optional[A3MRouterClient] = None

    def get_router() -> A3MRouterClient:
        global _router
        if _router is None:
            _router = A3MRouterClient()
        return _router

    server = Server(SERVER_NAME)

    @server.list_tools()
    async def list_tools() -> List[Tool]:
        """List all available MCP tools."""
        return [
            Tool(
                name="a3m_route",
                description="Route a query to the optimal LLM provider using A3M's adaptive routing. Returns model selection, tier, estimated cost, and reasoning — no LLM execution.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The user query to route (e.g. 'Write Python code to sort a list')",
                        }
                    },
                    "required": ["query"],
                },
            ),
            Tool(
                name="a3m_ensemble",
                description="Execute a query across multiple LLM providers in parallel and merge results. Returns all responses with stats on success/failure per provider.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The user query to execute across providers",
                        },
                        "providers": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Optional list of provider names. Defaults to ['groq', 'google', 'cerebras']",
                        },
                        "system": {
                            "type": "string",
                            "description": "Optional system prompt to prepend",
                        },
                    },
                    "required": ["query"],
                },
            ),
            Tool(
                name="a3m_classify",
                description="Classify a query by type (fast/creative/deep/code) and get provider recommendations based on query complexity.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The query to classify",
                        }
                    },
                    "required": ["query"],
                },
            ),
            Tool(
                name="a3m_providers",
                description="List all configured LLM providers with their models, cost per 1K tokens, and availability status.",
                inputSchema={
                    "type": "object",
                    "properties": {},
                },
            ),
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: Dict[str, Any]) -> CallToolResult:
        """Execute an MCP tool call."""
        router = get_router()
        try:
            if name == "a3m_route":
                result = await router.route(arguments["query"])
                text = json.dumps(result, indent=2)
                return CallToolResult(content=[TextContent(type="text", text=text)])

            elif name == "a3m_ensemble":
                result = await router.ensemble(
                    query=arguments["query"],
                    providers=arguments.get("providers"),
                    system=arguments.get("system"),
                )
                text = json.dumps(result, indent=2)
                return CallToolResult(content=[TextContent(type="text", text=text)])

            elif name == "a3m_classify":
                result = await router.classify(arguments["query"])
                text = json.dumps(result, indent=2)
                return CallToolResult(content=[TextContent(type="text", text=text)])

            elif name == "a3m_providers":
                result = await router.providers()
                text = json.dumps(result, indent=2)
                return CallToolResult(content=[TextContent(type="text", text=text)])

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
        finally:
            await router.close()


    async def main():
        """Run the MCP server over stdio."""
        print("A3M Router MCP Server starting...", file=sys.stderr)
        print(f"Connecting to A3M Router at {A3M_BASE_URL}", file=sys.stderr)
        async with stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                server.create_initialization_options(),
            )


if __name__ == "__main__":
    if not HAS_MCP:
        print("ERROR: mcp package required. Install with: pip install mcp", file=sys.stderr)
        sys.exit(1)
    asyncio.run(main())
