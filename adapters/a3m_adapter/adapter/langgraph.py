"""
A3M Router Adapter for LangGraph (Microsoft's agent framework).

Drop-in replacement for LangGraph's stateful agent that routes through A3M Router
for intelligent, cost-optimized multi-step conversations.

Usage:
    from langgraph.prebuilt import create_react_agent
    from a3m_adapter import A3MLangGraphAdapter
    
    adapter = A3MLangGraphAdapter(model='auto', parallel_ensemble=2)
    
    agent = create_react_agent(adapter, tools=[...])
    
    result = agent.invoke({"messages": [{"role": "user", "content": "Hello"]})
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, TypedDict

logger = logging.getLogger(__name__)

LANGGRAPH_AVAILABLE = False
try:
    import langgraph
    from langgraph.prebuilt import create_react_agent
    from langchain_core.messages import BaseMessage, AIMessage, HumanMessage
    LANGGRAPH_AVAILABLE = True
except ImportError:
    logger.warning("LangGraph not installed. Install with: pip install langgraph")

A3M_AVAILABLE = False
try:
    from a3m.router import A3MRouter, RouteResponse
    A3M_AVAILABLE = True
except ImportError:
    logger.warning(
        "A3M Router not installed. Install with: pip install adaptive-memory-multi-model-router"
    )


class A3MLangGraphAdapter:
    """
    A3M Router adapter for LangGraph's prebuilt agents.

    Enables LangGraph agents to use A3M Router for automatic model selection
    across 47+ providers with cost optimization and stateful conversations.
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
        Initialize A3M Router adapter for LangGraph.
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
            "A3M Router initialized for LangGraph: model=%s, ensemble=%d",
            self.model,
            self.parallel_ensemble,
        )

    def get_model(self):
        """
        Get the underlying model for LangGraph.
        
        Returns an object compatible with LangGraph's prebuilt agents.
        """
        self._ensure_router()
        return self

    def __call__(
        self,
        state: Dict[str, Any],
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        LangGraph-compatible callable for node execution.
        
        Args:
            state: LangGraph state dict with 'messages' key
            
        Returns:
            Updated state dict
        """
        self._ensure_router()
        
        messages = state.get("messages", [])
        
        # Convert LangGraph messages to A3M format
        a3m_messages = self._convert_messages(messages)
        
        import asyncio
        loop = asyncio.get_event_loop()
        route_result = loop.run_in_executor(
            None,
            lambda: self._a3m_router.route(
                messages=a3m_messages,
                temperature=kwargs.get("temperature", self.temperature),
                max_tokens=kwargs.get("max_tokens", self.max_tokens),
                **kwargs,
            ),
        )
        
        # Add response to messages
        new_messages = messages + [
            AIMessage(content=route_result.content)
        ]
        
        return {
            **state,
            "messages": new_messages,
        }

    def _convert_messages(
        self,
        messages: List[BaseMessage],
    ) -> List[Dict[str, Any]]:
        """Convert LangGraph messages to A3M format."""
        a3m_messages = []
        for msg in messages:
            if isinstance(msg, HumanMessage):
                a3m_messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                a3m_messages.append({"role": "assistant", "content": msg.content})
            else:
                a3m_messages.append({"role": "user", "content": str(msg)})
        return a3m_messages

    async def ainvoke(
        self,
        state: Dict[str, Any],
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Async version of __call__."""
        self._ensure_router()
        
        messages = state.get("messages", [])
        a3m_messages = self._convert_messages(messages)
        
        route_result = await self._a3m_router.aroute(
            messages=a3m_messages,
            temperature=kwargs.get("temperature", self.temperature),
            max_tokens=kwargs.get("max_tokens", self.max_tokens),
            **kwargs,
        )
        
        new_messages = messages + [
            AIMessage(content=route_result.content)
        ]
        
        return {
            **state,
            "messages": new_messages,
        }

    def __repr__(self) -> str:
        return (
            f"A3MLangGraphAdapter("
            f"model={self.model!r}, "
            f"temperature={self.temperature}, "
            f"ensemble={self.parallel_ensemble})"
        )
