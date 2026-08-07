"""
A3M Router Adapter for Haystack (Deepset's RAG framework).

Drop-in replacement for Haystack's OpenAIGenerator that routes through A3M Router
for intelligent, cost-optimized RAG pipelines.

Usage:
    from haystack import Pipeline
    from haystack.nodes import Retriever, PromptNode
    from a3m_adapter import A3MHaystackAdapter
    
    prompt_node = PromptNode(
        "auto",
        api_key=None,
        generator_type='openai',
        model_adapter=A3MHaystackAdapter(model='auto', parallel_ensemble=2),
    )
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

HAYSTACK_AVAILABLE = False
try:
    from haystack.nodes.base import BaseGenerator
    HAYSTACK_AVAILABLE = True
except ImportError:
    logger.warning("Haystack not installed. Install with: pip install farm-haystack")

A3M_AVAILABLE = False
try:
    from a3m.router import A3MRouter, RouteResponse
    A3M_AVAILABLE = True
except ImportError:
    logger.warning(
        "A3M Router not installed. Install with: pip install adaptive-memory-multi-model-router"
    )


class A3MHaystackAdapter:
    """
    A3M Router adapter for Haystack's PromptNode.

    Enables Haystack RAG pipelines to use A3M Router for automatic model selection
    across 47+ providers with cost optimization.
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
        Initialize A3M Router adapter for Haystack.
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
            "A3M Router initialized for Haystack: model=%s",
            self.model,
        )

    def predict(
        self,
        query: str,
        documents: Optional[List[Any]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Generate answer from query and optional retrieved documents.
        
        Args:
            query: The search query
            documents: Optional list of retrieved documents for RAG
            
        Returns:
            Dict with 'answers', 'provider', 'cost'
        """
        self._ensure_router()
        
        # Build context from documents if provided
        if documents:
            context = "\n\n".join([
                f"Document {i+1}: {getattr(doc, 'content', str(doc))}"
                for i, doc in enumerate(documents[:5])  # Limit to 5 docs
            ])
            prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:"
        else:
            prompt = query
        
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
            "answers": [{"answer": route_result.content, "score": 1.0}],
            "provider": getattr(route_result, 'provider', 'a3m'),
            "cost": getattr(route_result, 'cost', 0.0),
        }

    async def apredict(
        self,
        query: str,
        documents: Optional[List[Any]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Async predict for Haystack."""
        self._ensure_router()
        
        if documents:
            context = "\n\n".join([
                f"Document {i+1}: {getattr(doc, 'content', str(doc))}"
                for i, doc in enumerate(documents[:5])
            ])
            prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:"
        else:
            prompt = query
        
        messages = [{"role": "user", "content": prompt}]
        
        route_result = await self._a3m_router.aroute(
            messages=messages,
            temperature=kwargs.get("temperature", self.temperature),
            max_tokens=kwargs.get("max_tokens", self.max_tokens),
            **kwargs,
        )
        
        return {
            "answers": [{"answer": route_result.content, "score": 1.0}],
            "provider": getattr(route_result, 'provider', 'a3m'),
            "cost": getattr(route_result, 'cost', 0.0),
        }

    def run(
        self,
        query: str,
        documents: Optional[List[Any]] = None,
        **kwargs: Any,
    ) -> tuple[Dict[str, Any], str]:
        """
        Haystack-compatible run method.
        
        Returns:
            Tuple of (results dict, pipeline run metadata)
        """
        result = self.predict(query, documents, **kwargs)
        return (result, "a3m-haystack")

    def __repr__(self) -> str:
        return (
            f"A3MHaystackAdapter("
            f"model={self.model!r}, "
            f"temperature={self.temperature}, "
            f"max_tokens={self.max_tokens})"
        )
