"""
A3M Router LangChain adapter.

Drop-in replacement for ChatOpenAI that routes through A3M Router.

Usage:
    from langchain.chat_models import ChatOpenAI
    from a3m.adapters import LangChainAdapter
    
    # As replacement for ChatOpenAI
    llm = LangChainAdapter(
        base_url="http://localhost:8787",
        model="auto",
        temperature=0.7,
    )
    
    from langchain.schema import HumanMessage
    response = llm([HumanMessage(content="What is 2+2?")])
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Type

from pydantic import Field

logger = logging.getLogger(__name__)

LANCHAIN_AVAILABLE = False
try:
    from langchain.chat_models import BaseChatModel
    from langchain.schema import (
        BaseMessage,
        ChatResult,
        AIMessage,
        HumanMessage,
        SystemMessage,
    )
    from langchain.callbacks.manager import CallbackManagerForLLMRun
    LANCHAIN_AVAILABLE = True
except ImportError:
    logger.warning("LangChain not installed. pip install langchain")

from a3m.client import A3MRouter, A3MRouterError

if LANCHAIN_AVAILABLE:
    class LangChainAdapter(BaseChatModel):
        """
        LangChain chat model that routes through A3M Router.
        
        Drop-in replacement for ChatOpenAI with automatic model selection.
        
        Args:
            base_url: A3M Router server URL.
            model: Model name or "auto" for intelligent routing.
            temperature: Sampling temperature.
            max_tokens: Max tokens to generate.
            parallel_ensemble: Number of providers for ensemble calls.
            **kwargs: Additional A3MRouter options.
        """

        base_url: str = Field(default="http://localhost:8787")
        model: str = Field(default="auto")
        temperature: float = Field(default=0.7)
        max_tokens: Optional[int] = Field(default=None)
        parallel_ensemble: int = Field(default=1)
        api_key: Optional[str] = Field(default=None)

        class Config:
            arbitrary_types_allowed = True

        def _get_router(self) -> A3MRouter:
            """Get or create A3M Router client."""
            if not hasattr(self, "_router"):
                self._router = A3MRouter(
                    base_url=self.base_url,
                    api_key=self.api_key,
                    default_model=self.model,
                    default_temperature=self.temperature,
                    default_max_tokens=self.max_tokens,
                    parallel_ensemble=self.parallel_ensemble,
                )
            return self._router

        def _convert_messages(
            self,
            messages: List[BaseMessage],
        ) -> List[Dict[str, str]]:
            """Convert LangChain messages to A3M format."""
            result = []
            for msg in messages:
                if isinstance(msg, HumanMessage):
                    result.append({"role": "user", "content": msg.content})
                elif isinstance(msg, AIMessage):
                    result.append({"role": "assistant", "content": msg.content})
                elif isinstance(msg, SystemMessage):
                    result.append({"role": "system", "content": msg.content})
                else:
                    result.append({"role": "user", "content": str(msg.content)})
            return result

        def _convert_response(
            self,
            response_content: str,
        ) -> AIMessage:
            """Convert A3M response to LangChain message."""
            return AIMessage(content=response_content)

        @property
        def _llm_type(self) -> str:
            return "a3m-router"

        def _generate(
            self,
            messages: List[BaseMessage],
            stop: Optional[List[str]] = None,
            run_manager: Optional[CallbackManagerForLLMRun] = None,
            **kwargs: Any,
        ) -> ChatResult:
            """Generate a chat response."""
            router = self._get_router()
            
            a3m_messages = self._convert_messages(messages)
            
            try:
                response = router.chat(
                    messages=a3m_messages,
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    parallel_ensemble=self.parallel_ensemble,
                    **kwargs,
                )
            except A3MRouterError as e:
                logger.error(f"A3M Router error: {e}")
                raise
            
            return ChatResult(
                generations=[{"message": self._convert_response(response.content), "text": response.content}],
                llm_output={
                    "provider": response.provider,
                    "model": response.route.model,
                    "cost": response.cost,
                    "route": str(response.route),
                },
            )

        async def _agenerate(
            self,
            messages: List[BaseMessage],
            stop: Optional[List[str]] = None,
            run_manager: Optional[CallbackManagerForLLMRun] = None,
            **kwargs: Any,
        ) -> ChatResult:
            """Async generate a chat response."""
            router = self._get_router()
            a3m_messages = self._convert_messages(messages)
            
            try:
                response = await router.achat(
                    messages=a3m_messages,
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    parallel_ensemble=self.parallel_ensemble,
                    **kwargs,
                )
            except A3MRouterError as e:
                logger.error(f"A3M Router error: {e}")
                raise
            
            return ChatResult(
                generations=[{"message": self._convert_response(response.content), "text": response.content}],
                llm_output={
                    "provider": response.provider,
                    "model": response.route.model,
                    "cost": response.cost,
                    "route": str(response.route),
                },
            )

else:
    # Stub class when LangChain is not installed
    class LangChainAdapter:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            raise ImportError(
                "LangChain is not installed. "
                "Install with: pip install langchain"
            )
