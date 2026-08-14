"""
A3M Router LlamaIndex adapter.

Drop-in LLM for LlamaIndex that routes through A3M Router.

Usage:
    from llama_index import VectorStoreIndex, SimpleWebPageReader
    from a3m.adapters import LlamaIndexAdapter
    
    llm = LlamaIndexAdapter(
        base_url="http://localhost:8787",
        model="auto",
        temperature=0.7,
    )
    
    index = VectorStoreIndex.from_documents(
        documents,
        llm=llm,  # Use A3M Router as the LLM
    )
"""

from __future__ import annotations

import logging
from typing import Any, Awaitable, List, Optional

logger = logging.getLogger(__name__)

LLAMAINDEX_AVAILABLE = False
try:
    from llama_index.llms import BaseLLM
    from llama_index.llms.custom import CustomLLM
    from llama_index.types import ModelType
    from llama_index.output_parsers.base import BaseOutputParser
    LLAMAINDEX_AVAILABLE = True
except ImportError:
    logger.warning("LlamaIndex not installed. pip install llama-index")

from a3m.client import A3MRouter, A3MRouterError

if LLAMAINDEX_AVAILABLE:
    class LlamaIndexAdapter(BaseLLM):
        """
        LlamaIndex LLM that routes through A3M Router.
        
        Drop-in replacement for OpenAI/GPT LLMs in LlamaIndex pipelines.
        
        Args:
            base_url: A3M Router server URL.
            model: Model name or "auto" for intelligent routing.
            temperature: Sampling temperature.
            max_tokens: Max tokens to generate.
            parallel_ensemble: Number of providers for ensemble calls.
        """

        base_url: str = "http://localhost:8787"
        model: str = "auto"
        temperature: float = 0.7
        max_tokens: Optional[int] = 4096
        parallel_ensemble: int = 1
        api_key: Optional[str] = None

        def __init__(self, **kwargs: Any) -> None:
            super().__init__(**kwargs)
            self._router: Optional[A3MRouter] = None

        def _get_router(self) -> A3MRouter:
            """Get or create A3M Router client."""
            if self._router is None:
                self._router = A3MRouter(
                    base_url=self.base_url,
                    api_key=self.api_key,
                    default_model=self.model,
                    default_temperature=self.temperature,
                    default_max_tokens=self.max_tokens,
                    parallel_ensemble=self.parallel_ensemble,
                )
            return self._router

        @property
        def model_type(self) -> ModelType:
            return ModelType.LLM

        @property
        def class_name(self) -> str:
            return "A3MRouter"

        def complete(
            self,
            prompt: str,
            formatted: bool = False,
            **kwargs: Any,
        ) -> Any:
            """
            Synchronous completion.
            
            LlamaIndex calls this for text completion.
            """
            router = self._get_router()
            
            try:
                response = router.chat(
                    messages=[{"role": "user", "content": prompt}],
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    parallel_ensemble=self.parallel_ensemble,
                    **kwargs,
                )
                return response.content
            except A3MRouterError as e:
                logger.error(f"A3M Router error: {e}")
                raise

        async def acomplete(
            self,
            prompt: str,
            formatted: bool = False,
            **kwargs: Any,
        ) -> Any:
            """Async completion."""
            router = self._get_router()
            
            try:
                response = await router.achat(
                    messages=[{"role": "user", "content": prompt}],
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    parallel_ensemble=self.parallel_ensemble,
                    **kwargs,
                )
                return response.content
            except A3MRouterError as e:
                logger.error(f"A3M Router error: {e}")
                raise

        def stream_complete(
            self,
            prompt: str,
            **kwargs: Any,
        ) -> Any:
            """
            Streaming completion.
            
            Returns a generator that yields response chunks.
            """
            router = self._get_router()
            
            try:
                chunks = router.stream_chat(
                    messages=[{"role": "user", "content": prompt}],
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    **kwargs,
                )
                for chunk in chunks:
                    yield chunk.content
            except A3MRouterError as e:
                logger.error(f"A3M Router error: {e}")
                raise

        async def astream_complete(
            self,
            prompt: str,
            **kwargs: Any,
        ) -> Awaitable[Any]:
            """Async streaming completion."""
            router = self._get_router()
            
            async def gen():
                async for chunk in router.astream_chat(
                    messages=[{"role": "user", "content": prompt}],
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    **kwargs,
                ):
                    yield chunk.content
            
            return gen()

        def chat(self, messages: List[Any], **kwargs: Any) -> Any:
            """
            Synchronous chat.
            
            Converts messages to a single prompt.
            """
            router = self._get_router()
            
            # Convert message objects to content strings
            if hasattr(messages[0], "content"):
                content = "\n".join([getattr(m, "content", str(m)) for m in messages])
            else:
                content = str(messages[0])
            
            try:
                response = router.chat(
                    messages=[{"role": "user", "content": content}],
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    **kwargs,
                )
                # Return a simple object that LlamaIndex expects
                return ChatMessage(content=response.content)
            except A3MRouterError as e:
                logger.error(f"A3M Router error: {e}")
                raise

        async def achat(self, messages: List[Any], **kwargs: Any) -> Any:
            """Async chat."""
            router = self._get_router()
            
            if hasattr(messages[0], "content"):
                content = "\n".join([getattr(m, "content", str(m)) for m in messages])
            else:
                content = str(messages[0])
            
            try:
                response = await router.achat(
                    messages=[{"role": "user", "content": content}],
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    **kwargs,
                )
                return ChatMessage(content=response.content)
            except A3MRouterError as e:
                logger.error(f"A3M Router error: {e}")
                raise

else:
    # Stub class when LlamaIndex is not installed
    class LlamaIndexAdapter:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            raise ImportError(
                "LlamaIndex is not installed. "
                "Install with: pip install llama-index"
            )


# Simple message class for LlamaIndex compatibility
class ChatMessage:
    """Simple chat message for LlamaIndex compatibility."""
    def __init__(self, content: str) -> None:
        self.content = content
        self.raw = {}
