"""
A3M Router Adapter for Vercel AI SDK.

Drop-in replacement for Vercel AI SDK's AI function that routes through A3M Router
for intelligent, cost-optimized responses in Next.js and other JavaScript environments.

Usage (JavaScript):
    import { generateText } from 'ai';
    import { createA3MProvider } from 'a3m-adapter/vercel';

    const result = await generateText({
        model: createA3MProvider({ model: 'auto', parallel_ensemble: 2 }),
        prompt: 'What is the meaning of life?',
    });

Usage (Python):
    from a3m_adapter import A3MVercelAdapter
    
    adapter = A3MVercelAdapter(model='auto', temperature=0.7)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

A3M_AVAILABLE = False
try:
    from a3m.router import A3MRouter, RouteResponse
    A3M_AVAILABLE = True
except ImportError:
    logger.warning(
        "A3M Router not installed. Install with: pip install adaptive-memory-multi-model-router"
    )


class A3MVercelAdapter:
    """
    A3M Router adapter for Vercel AI SDK compatibility.

    Provides a drop-in replacement that routes through A3M Router
    instead of calling OpenAI/Anthropic directly.
    """

    def __init__(
        self,
        model: str = "auto",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        parallel_ensemble: int = 1,
        api_key: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize A3M Router adapter for Vercel AI SDK.
        """
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.parallel_ensemble = parallel_ensemble
        self.api_key = api_key
        self._a3m_router = None
        self._initialized = False
        self._kwargs = kwargs

    def _ensure_router(self) -> None:
        """Lazily initialize the A3M router."""
        if self._initialized:
            return
        
        if not A3M_AVAILABLE:
            raise ImportError(
                "A3M Router is not installed. "
                "Install with: pip install adaptive-memory-multi-model-router"
            )
        
        self._a3m_router = A3MRouter(
            model=self.model,
            temperature=self.temperature,
            parallel_ensemble=self.parallel_ensemble,
        )
        self._initialized = True
        logger.info(
            "A3M Router initialized for Vercel AI SDK: model=%s",
            self.model,
        )

    def __call__(
        self,
        prompt: str,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Generate text from prompt (Vercel AI SDK compatible interface).
        
        Args:
            prompt: The prompt string
            
        Returns:
            Dict with 'text', 'provider', 'usage', 'finishReason'
        """
        self._ensure_router()
        
        messages = [{"role": "user", "content": prompt}]
        
        import asyncio
        loop = asyncio.get_event_loop()
        route_result = loop.run_in_executor(
            None,
            lambda: self._a3m_router.route(
                messages=messages,
                temperature=kwargs.get("temperature", self.temperature),
                max_tokens=kwargs.get("max_tokens", self.max_tokens),
                **kwargs,
            ),
        )
        
        return {
            "text": route_result.content,
            "provider": getattr(route_result, 'provider', 'a3m'),
            "finishReason": getattr(route_result, 'finish_reason', 'stop'),
            "usage": {
                "promptTokens": getattr(route_result, 'prompt_tokens', 0),
                "completionTokens": getattr(route_result, 'completion_tokens', 0),
                "totalTokens": getattr(route_result, 'total_tokens', 0),
            },
        }

    async def generate(
        self,
        prompt: str,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Async generate for Vercel AI SDK."""
        self._ensure_router()
        
        messages = [{"role": "user", "content": prompt}]
        
        route_result = await self._a3m_router.aroute(
            messages=messages,
            temperature=kwargs.get("temperature", self.temperature),
            max_tokens=kwargs.get("max_tokens", self.max_tokens),
            **kwargs,
        )
        
        return {
            "text": route_result.content,
            "provider": getattr(route_result, 'provider', 'a3m'),
            "finishReason": getattr(route_result, 'finish_reason', 'stop'),
            "usage": {
                "promptTokens": getattr(route_result, 'prompt_tokens', 0),
                "completionTokens": getattr(route_result, 'completion_tokens', 0),
                "totalTokens": getattr(route_result, 'total_tokens', 0),
            },
        }

    def __repr__(self) -> str:
        return (
            f"A3MVercelAdapter("
            f"model={self.model!r}, "
            f"temperature={self.temperature}, "
            f"max_tokens={self.max_tokens})"
        )


# JavaScript-compatible factory function
def createA3MProvider(config: Dict[str, Any]) -> A3MVercelAdapter:
    """
    Create an A3M Provider for Vercel AI SDK (JavaScript usage).
    
    Usage:
        import { generateText } from 'ai';
        import { createA3MProvider } from 'a3m-adapter/vercel';
        
        const result = await generateText({
            model: createA3MProvider({ model: 'auto', parallel_ensemble: 2 }),
            prompt: 'What is 2+2?',
        });
    """
    return A3MVercelAdapter(
        model=config.get("model", "auto"),
        temperature=config.get("temperature", 0.7),
        max_tokens=config.get("max_tokens", 4096),
        parallel_ensemble=config.get("parallel_ensemble", 1),
        api_key=config.get("api_key"),
    )
