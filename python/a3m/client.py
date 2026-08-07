"""A3M Router Python SDK — Async client"""
import json
import httpx
from typing import Optional, List, Dict, Any, AsyncIterator
from .models import RoutingDecision, CostReport


class A3MRouter:
    """Python client for A3M Router.

    Usage:
        # Auto-start proxy: pip install a3m-router, then:
        router = A3MRouter(base_url="http://localhost:8787")

        # Route a query (returns OpenAI-compatible response)
        response = await router.chat("What is 2+2?")

        # Get routing decision only (no LLM call)
        decision = await router.route("What is 2+2?")
        print(decision.model, decision.tier, decision.cost)

        # Use with OpenAI SDK
        from openai import AsyncOpenAI
        client = AsyncOpenAI(base_url="http://localhost:8787/v1", api_key="not-needed")
        response = await client.chat.completions.create(
            model="auto",
            messages=[{"role": "user", "content": "Hello"}]
        )
    """

    def __init__(
        self,
        base_url: str = "http://localhost:8787",
        timeout: float = 30.0,
        api_key: str = "not-needed",
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=timeout,
            headers={"Authorization": f"Bearer {api_key}"},
        )

    async def chat(
        self,
        message: str,
        model: str = "auto",
        max_tokens: int = 100,
        temperature: float = 0.7,
        system: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send a chat message and get a routed response.

        Args:
            message: User message
            model: Model to use (default "auto" for intelligent routing)
            max_tokens: Max response tokens
            temperature: Response temperature
            system: Optional system prompt

        Returns:
            OpenAI-compatible response dict
        """
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": message})

        response = await self._client.post(
            "/v1/chat/completions",
            json={
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
        )
        response.raise_for_status()
        return response.json()

    async def route(self, query: str) -> RoutingDecision:
        """Get routing decision for a query without executing it.

        Args:
            query: The query to analyze

        Returns:
            RoutingDecision with model, tier, cost, reasoning
        """
        response = await self._client.post(
            "/v1/route",
            json={"query": query},
        )
        response.raise_for_status()
        data = response.json()
        return RoutingDecision(
            model=data.get("model", "unknown"),
            tier=data.get("tier", "unknown"),
            cost=data.get("cost", 0),
            complexity=data.get("complexity", 0),
            reasoning=data.get("reasoning", ""),
            fallback_models=data.get("fallback_models", []),
        )

    async def route_batch(self, queries: List[str]) -> List[RoutingDecision]:
        """Route multiple queries in batch.

        Args:
            queries: List of queries to route

        Returns:
            List of RoutingDecision objects
        """
        decisions = []
        for q in queries:
            d = await self.route(q)
            decisions.append(d)
        return decisions

    async def models(self) -> List[Dict[str, Any]]:
        """List available models and their metadata."""
        response = await self._client.get("/v1/models")
        response.raise_for_status()
        return response.json().get("data", [])

    async def health(self) -> Dict[str, Any]:
        """Check router health and provider availability."""
        response = await self._client.get("/health")
        response.raise_for_status()
        return response.json()

    async def cost_report(self) -> CostReport:
        """Get cost analytics and savings report."""
        response = await self._client.get("/dashboard")
        response.raise_for_status()
        data = response.json()
        return CostReport(
            total_requests=data.get("total_requests", 0),
            total_cost=data.get("total_cost", 0),
            savings_vs_premium=data.get("savings_vs_premium", 0),
            by_provider=data.get("by_provider", {}),
        )

    async def stream_chat(
        self,
        message: str,
        model: str = "auto",
        max_tokens: int = 100,
    ) -> AsyncIterator[str]:
        """Stream a chat response token by token.

        Args:
            message: User message
            model: Model to use
            max_tokens: Max response tokens

        Yields:
            Response tokens as they arrive
        """
        async with self._client.stream(
            "POST",
            "/v1/chat/completions",
            json={
                "model": model,
                "messages": [{"role": "user", "content": message}],
                "max_tokens": max_tokens,
                "stream": True,
            },
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    chunk = json.loads(data)
                    content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if content:
                        yield content

    async def close(self):
        """Close the HTTP client."""
        await self._client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.close()


class A3MRouterError(Exception):
    """Base exception for A3MRouter errors."""
    pass
