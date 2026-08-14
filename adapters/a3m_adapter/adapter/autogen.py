"""
A3M Router Adapter for AutoGen (Microsoft).

Drop-in replacement for AutoGen's LLMAgent that routes through A3M Router
for intelligent, cost-optimized multi-agent conversations.

Usage:
    from autogen import ConversableAgent
    from a3m_adapter import A3MAutoGenAdapter

    llm_config = {
        "model": "auto",
        "temperature": 0.7,
        "parallel_ensemble": 2,
    }
    
    assistant = ConversableAgent(
        name="assistant",
        llm_config=llm_config,
    )
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)

A3M_AVAILABLE = False
try:
    from a3m.router import A3MRouter, RouteResponse
    A3M_AVAILABLE = True
except ImportError:
    logger.warning(
        "A3M Router not installed. Install with: pip install adaptive-memory-multi-model-router"
    )


class A3MAutoGenAdapter:
    """
    A3M Router adapter for AutoGen's ConversableAgent.

    Enables AutoGen agents to use A3M Router for automatic model selection
    across 47+ providers with cost optimization.
    """

    def __init__(
        self,
        model: str = "auto",
        temperature: float = 0.7,
        max_tokens: Optional[int] = 4096,
        parallel_ensemble: int = 1,
        api_key: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize A3M Router adapter for AutoGen.
        """
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.parallel_ensemble = parallel_ensemble
        self.api_key = api_key
        self._a3m_router = None
        self._initialized = False

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
            "A3M Router initialized for AutoGen: model=%s, ensemble=%d",
            self.model,
            self.parallel_ensemble,
        )

    def create_agent_config(self) -> Dict[str, Any]:
        """
        Create AutoGen-compatible agent config.
        
        Returns a config dict that can be passed to ConversableAgent.
        """
        return {
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "parallel_ensemble": self.parallel_ensemble,
            "a3m_router": self,  # Pass self as the router
        }

    def chat(
        self,
        messages: List[Dict[str, str]],
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Generate a response using A3M Router.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            
        Returns:
            Response dict with 'content', 'provider', 'cost'
        """
        self._ensure_router()
        
        import asyncio
        loop = asyncio.get_event_loop()
        route_result = loop.run_in_executor(
            None,
            lambda: self._a3m_router.route(
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                **kwargs,
            ),
        )
        
        return {
            "content": route_result.content,
            "provider": getattr(route_result, 'provider', 'unknown'),
            "cost": getattr(route_result, 'cost', 0.0),
            "finish_reason": getattr(route_result, 'finish_reason', 'stop'),
        }

    async def achat(
        self,
        messages: List[Dict[str, str]],
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Async version of chat."""
        self._ensure_router()
        
        route_result = await self._a3m_router.aroute(
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            **kwargs,
        )
        
        return {
            "content": route_result.content,
            "provider": getattr(route_result, 'provider', 'unknown'),
            "cost": getattr(route_result, 'cost', 0.0),
            "finish_reason": getattr(route_result, 'finish_reason', 'stop'),
        }

    def __repr__(self) -> str:
        return (
            f"A3MAutoGenAdapter("
            f"model={self.model!r}, "
            f"temperature={self.temperature}, "
            f"max_tokens={self.max_tokens}, "
            f"ensemble={self.parallel_ensemble})"
        )
