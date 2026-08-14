"""
A3M Router Adapter for LangChain.

Drop-in replacement for LangChain's ChatOpenAI that routes through A3M Router
for intelligent, cost-optimized model selection across 47+ providers.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Check availability
LANGCHAIN_AVAILABLE = False
try:
    from langchain_core.language_models import BaseChatModel
    from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage
    from langchain_core.outputs import ChatGeneration, ChatResult, LLMResult
    LANGCHAIN_AVAILABLE = True
except ImportError:
    logger.warning("LangChain not installed. Install with: pip install langchain langchain-core")

A3M_AVAILABLE = False
try:
    from a3m.router import A3MRouter, RouteResponse
    A3M_AVAILABLE = True
except ImportError:
    logger.warning("A3M Router not installed. Install with: pip install adaptive-memory-multi-model-router")


class A3MLangChainAdapter:
    """
    A3M Router adapter for LangChain's ChatOpenAI interface.

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

        Args:
            model: Model name or "auto" for automatic routing
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            parallel_ensemble: Number of providers to run in parallel
            api_key: A3M API key (optional)
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
    def _llm_type(self) -> str:
        return "a3m_router"

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> LLMResult:
        """Generate a response using A3M Router."""
        self._ensure_router()
        
        # Convert messages
        a3m_messages = self._convert_messages(messages)

        # Route through A3M
        import asyncio
        loop = asyncio.get_event_loop()
        route_result = loop.run_in_executor(
            None,
            lambda: self._a3m_router.route(
                messages=a3m_messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                stop=stop,
                **kwargs,
            ),
        )

        ai_message = AIMessage(content=route_result.content)
        generation = ChatGeneration(message=ai_message)
        return LLMResult(generations=[[generation]])

    def _convert_messages(self, messages: List[BaseMessage]) -> List[Dict[str, Any]]:
        """Convert LangChain messages to A3M format."""
        a3m_messages = []
        for msg in messages:
            if isinstance(msg, SystemMessage):
                a3m_messages.append({"role": "system", "content": msg.content})
            elif isinstance(msg, HumanMessage):
                a3m_messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                a3m_messages.append({"role": "assistant", "content": msg.content})
            elif isinstance(msg, ToolMessage):
                a3m_messages.append(
                    {"role": "tool", "content": msg.content, "tool_call_id": msg.tool_call_id}
                )
            else:
                a3m_messages.append({"role": "user", "content": str(msg)})
        return a3m_messages

    def bind_tools(self, tools: List[Dict[str, Any]], **kwargs: Any) -> "A3MLangChainAdapter":
        """Bind tools for function calling."""
        return self

    def __repr__(self) -> str:
        return (
            f"A3MLangChainAdapter("
            f"model={self.model!r}, "
            f"temperature={self.temperature}, "
            f"max_tokens={self.max_tokens}, "
            f"ensemble={self.parallel_ensemble})"
        )
