"""
A3M Router Adapter for LlamaIndex.

Drop-in replacement for LlamaIndex's BaseLLM that routes through A3M Router
for intelligent, cost-optimized model selection.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Sequence

logger = logging.getLogger(__name__)

# Check availability
LLAMAINDEX_AVAILABLE = False
_llama_metadata_class = None
try:
    from llama_index.core.base.llms.base import BaseLLM, CompletionResponse
    from llama_index.core.base.llms.types import ChatMessage
    LLAMAINDEX_AVAILABLE = True
    try:
        from llama_index.core.base.llms.base import LLMMetadata
        _llama_metadata_class = LLMMetadata
    except ImportError:
        pass
except ImportError:
    logger.warning("LlamaIndex not installed. Install with: pip install llama-index")

A3M_AVAILABLE = False
try:
    from a3m.router import A3MRouter, RouteResponse
    A3M_AVAILABLE = True
except ImportError:
    logger.warning("A3M Router not installed. Install with: pip install adaptive-memory-multi-model-router")


class A3MLlamaIndexAdapter:
    """
    A3M Router adapter for LlamaIndex's BaseLLM interface.

    Routes prompts through A3M Router to automatically select the cheapest
    capable model across 47+ LLM providers.
    """

    def __init__(
        self,
        model: str = "auto",
        temperature: float = 0.0,
        max_tokens: Optional[int] = 4096,
        parallel_ensemble: int = 1,
        api_key: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize A3M Router adapter.
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
            "A3M Router initialized: model=%s, ensemble=%d",
            self.model,
            self.parallel_ensemble,
        )

    @property
    def metadata(self) -> Dict[str, Any]:
        """Return LLM metadata as a dict (framework-agnostic)."""
        return {
            "context_window": 128000,
            "num_output": self.max_tokens or 4096,
            "model_name": self.model,
            "is_chat_model": True,
        }

    def complete(self, prompt: str, **kwargs: Any) -> CompletionResponse:
        """Complete a prompt using A3M Router."""
        self._ensure_router()
        
        messages = [{"role": "user", "content": prompt}]
        
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
        
        return CompletionResponse(text=route_result.content, raw=route_result)

    def chat(self, messages: Sequence[ChatMessage], **kwargs: Any) -> CompletionResponse:
        """Chat completion using A3M Router."""
        self._ensure_router()
        
        a3m_messages = self._convert_messages(messages)
        
        import asyncio
        loop = asyncio.get_event_loop()
        route_result = loop.run_in_executor(
            None,
            lambda: self._a3m_router.route(
                messages=a3m_messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                **kwargs,
            ),
        )
        
        return CompletionResponse(text=route_result.content, raw=route_result)

    def _convert_messages(self, messages: Sequence[ChatMessage]) -> List[Dict[str, Any]]:
        """Convert LlamaIndex ChatMessages to A3M format."""
        a3m_messages = []
        for msg in messages:
            role = msg.role.value if hasattr(msg.role, 'value') else str(msg.role).lower()
            role_map = {
                "system": "system",
                "user": "user", 
                "assistant": "assistant",
                "tool": "tool",
                "function": "function",
            }
            a3m_role = role_map.get(role, "user")
            a3m_messages.append({"role": a3m_role, "content": msg.content})
        return a3m_messages

    def __repr__(self) -> str:
        return (
            f"A3MLlamaIndexAdapter("
            f"model={self.model!r}, "
            f"temperature={self.temperature}, "
            f"max_tokens={self.max_tokens}, "
            f"ensemble={self.parallel_ensemble})"
        )
