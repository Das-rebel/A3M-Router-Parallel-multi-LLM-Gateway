"""
A3M Router Adapter for Pinecone Vector Database.

Enables Pinecone's managed vector database to use A3M Router for
intelligent query routing and cost-optimized embeddings.

Usage:
    from pinecone import Pinecone
    from a3m_adapter import A3MPineconeAdapter
    
    # Create A3M-powered embeddings
    embed_adapter = A3MPineconeAdapter(model="auto")
    
    # Generate embeddings
    embedding = embed_adapter.embed("What is quantum computing?")
    
    # Query Pinecone
    results = index.query(
        vector=embedding,
        top_k=5,
    )
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

A3M_AVAILABLE = False
try:
    from a3m.router import A3MRouter
    A3M_AVAILABLE = True
except ImportError:
    logger.warning(
        "A3M Router not installed. Install with: pip install adaptive-memory-multi-model-router"
    )


class A3MPineconeAdapter:
    """
    A3M Router adapter for Pinecone embeddings.

    Provides intelligent embedding generation through A3M Router
    with automatic model selection for cost optimization.
    """

    def __init__(
        self,
        model: str = "auto",
        embed_model: str = "auto",
        parallel_ensemble: int = 1,
        api_key: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize A3M Router adapter for Pinecone.
        """
        self.model = model
        self.embed_model = embed_model or "auto"
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
            parallel_ensemble=self.parallel_ensemble,
        )
        self._initialized = True
        logger.info(
            "A3M Router initialized for Pinecone: embed_model=%s",
            self.embed_model,
        )

    def embed(
        self,
        texts: List[str],
        **kwargs: Any,
    ) -> List[List[float]]:
        """
        Generate embeddings for texts using A3M Router.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors
        """
        self._ensure_router()
        
        import asyncio
        loop = asyncio.get_event_loop()
        
        # For embeddings, we typically call the router with a special embedding mode
        # Since A3M supports /v1/embeddings endpoint
        results = loop.run_in_executor(
            None,
            lambda: self._a3m_router.embed(
                texts=texts,
                model=self.embed_model,
                **kwargs,
            ),
        )
        
        return results

    def embed_query(
        self,
        text: str,
        **kwargs: Any,
    ) -> List[float]:
        """
        Generate embedding for a single query.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector
        """
        embeddings = self.embed([text], **kwargs)
        return embeddings[0] if embeddings else []

    async def aembed(
        self,
        texts: List[str],
        **kwargs: Any,
    ) -> List[List[float]]:
        """Async version of embed."""
        self._ensure_router()
        
        results = await self._a3m_router.aembed(
            texts=texts,
            model=self.embed_model,
            **kwargs,
        )
        
        return results

    def rag_query(
        self,
        query: str,
        index,
        top_k: int = 5,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Perform RAG query: embed + Pinecone search + context.
        
        Args:
            query: The search query
            index: Pinecone index to query
            top_k: Number of results to retrieve
            
        Returns:
            Dict with 'results', 'context', 'provider', 'cost'
        """
        # 1. Embed query
        query_embedding = self.embed_query(query)
        
        # 2. Search Pinecone
        search_results = index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True,
        )
        
        # 3. Build context from results
        context = "\n\n".join([
            match.get('metadata', {}).get('text', str(match.get('id', '')))
            for match in search_results.get('matches', [])[:3]
        ])
        
        # 4. Route the full query through A3M
        import asyncio
        loop = asyncio.get_event_loop()
        route_result = loop.run_in_executor(
            None,
            lambda: self._a3m_router.route(
                messages=[{
                    "role": "user",
                    "content": f"Context:\n{context}\n\nQuestion: {query}"
                }],
                temperature=self._kwargs.get("temperature", 0.7),
                **kwargs,
            ),
        )
        
        return {
            "results": search_results.get('matches', []),
            "context": context,
            "answer": route_result.content,
            "provider": getattr(route_result, 'provider', 'a3m'),
            "cost": getattr(route_result, 'cost', 0.0),
        }

    def __repr__(self) -> str:
        return (
            f"A3MPineconeAdapter("
            f"model={self.model!r}, "
            f"embed_model={self.embed_model!r}, "
            f"ensemble={self.parallel_ensemble})"
        )
