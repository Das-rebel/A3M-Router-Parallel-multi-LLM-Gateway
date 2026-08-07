"""
A3M Router Qdrant adapter.

Enables A3M Router as the embedding + reranking layer for Qdrant vector search.

Usage:
    from qdrant_client import QdrantClient
    from a3m.adapters import QdrantAdapter
    
    # Create A3M-powered Qdrant client
    client = QdrantAdapter(
        base_url="http://localhost:8787",
        collection_name="my_docs",
    )
    
    # Generate embeddings via A3M
    query_embedding = client.embed_query("What is machine learning?")
    
    # Search Qdrant
    results = client.search(query_vector=query_embedding, limit=5)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)

QDRANT_AVAILABLE = False
try:
    from qdrant_client import QdrantClient
    from qdrant_client.http.exceptions import UnexpectedResponse
    QDRANT_AVAILABLE = True
except ImportError:
    logger.warning("Qdrant client not installed. pip install qdrant-client")

from a3m.client import A3MRouter, A3MRouterError

if QDRANT_AVAILABLE:
    class QdrantAdapter(QdrantClient):
        """
        Qdrant client wrapper that uses A3M Router for embeddings.
        
        Provides intelligent embedding generation and can be used as a
        drop-in replacement for QdrantClient in most use cases.
        
        Args:
            base_url: A3M Router server URL (for embeddings).
            collection_name: Default collection to search.
            embed_model: Embedding model ("auto" for A3M selection).
            host: Qdrant server host.
            port: Qdrant server port.
            **kwargs: Additional QdrantClient options.
        """

        def __init__(
            self,
            base_url: str = "http://localhost:8787",
            collection_name: Optional[str] = None,
            embed_model: str = "auto",
            host: Optional[str] = None,
            port: Optional[int] = None,
            **kwargs: Any,
        ) -> None:
            # Initialize QdrantClient
            if host and port:
                super().__init__(host=host, port=port, **kwargs)
            else:
                super().__init__(**kwargs)
            
            self._a3m_router = A3MRouter(base_url=base_url, default_model=embed_model)
            self._collection_name = collection_name
            self._embed_model = embed_model

        def embed_query(
            self,
            query: str,
            **kwargs: Any,
        ) -> List[float]:
            """
            Generate embedding for a query string.
            
            Args:
                query: Text to embed.
                
            Returns:
                Embedding vector (list of floats).
            """
            try:
                response = self._a3m_router.embed(texts=[query], model=self._embed_model)
                return response.embedding
            except A3MRouterError as e:
                logger.error(f"A3M Router embedding error: {e}")
                raise

        def embedTexts(
            self,
            texts: List[str],
            **kwargs: Any,
        ) -> List[List[float]]:
            """
            Generate embeddings for multiple texts.
            
            Args:
                texts: List of texts to embed.
                
            Returns:
                List of embedding vectors.
            """
            try:
                response = self._a3m_router.embed(texts=texts, model=self._embed_model)
                if isinstance(response, list):
                    return [r.embedding for r in response]
                return [response.embedding]
            except A3MRouterError as e:
                logger.error(f"A3M Router embedding error: {e}")
                raise

        def search(
            self,
            collection_name: Optional[str] = None,
            query_vector: Optional[List[float]] = None,
            query_filter: Optional[Any] = None,
            limit: int = 10,
            offset: Optional[int] = None,
            with_vectors: bool = False,
            with_payload: bool = True,
            **kwargs: Any,
        ) -> List[Any]:
            """
            Search Qdrant with A3M-generated query embedding.
            
            Args:
                collection_name: Collection to search. Uses default if None.
                query_vector: Query embedding. If None, uses A3M to embed a query.
                query_filter: Qdrant filter condition.
                limit: Number of results to return.
                offset: Pagination offset.
                with_vectors: Include vectors in results.
                with_payload: Include payload in results.
                
            Returns:
                List of search results.
            """
            collection = collection_name or self._collection_name
            if not collection:
                raise ValueError("collection_name is required")
            
            if query_vector is None:
                raise ValueError("query_vector is required")
            
            return super().search(
                collection_name=collection,
                query_vector=query_vector,
                query_filter=query_filter,
                limit=limit,
                offset=offset,
                with_vectors=with_vectors,
                with_payload=with_payload,
                **kwargs,
            )

        def rag_search(
            self,
            query: str,
            collection_name: Optional[str] = None,
            limit: int = 5,
            rerank: bool = True,
            **kwargs: Any,
        ) -> Dict[str, Any]:
            """
            Perform RAG search: embed query + Qdrant search + context build.
            
            Args:
                query: User query string.
                collection_name: Collection to search.
                limit: Number of chunks to retrieve.
                rerank: Whether to rerank results using A3M.
                
            Returns:
                Dict with 'chunks', 'context', 'answer', 'provider'.
            """
            collection = collection_name or self._collection_name
            if not collection:
                raise ValueError("collection_name is required")
            
            # 1. Embed query via A3M
            query_embedding = self.embed_query(query)
            
            # 2. Search Qdrant
            results = self.search(
                collection_name=collection,
                query_vector=query_embedding,
                limit=limit,
                with_payload=True,
            )
            
            # 3. Build context from results
            chunks = []
            for r in results:
                payload = r.payload or {}
                text = payload.get("text", payload.get("content", str(r.id)))
                chunks.append({"id": r.id, "text": text, "score": r.score})
            
            context = "\n\n".join([c["text"] for c in chunks])
            
            # 4. Generate answer via A3M if reranking
            answer = None
            provider = None
            if rerank and chunks:
                try:
                    response = self._a3m_router.chat(
                        messages=[{
                            "role": "user",
                            "content": f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer concisely:"
                        }],
                        model=self._embed_model,
                    )
                    answer = response.content
                    provider = response.provider
                except A3MRouterError:
                    answer = chunks[0]["text"] if chunks else ""
                    provider = "qdrant"
            
            return {
                "chunks": chunks,
                "context": context,
                "answer": answer,
                "provider": provider,
                "query_embedding": query_embedding[:10],  # First 10 dims for debug
            }

else:
    class QdrantAdapter:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            raise ImportError(
                "Qdrant client not installed. "
                "Install with: pip install qdrant-client"
            )
