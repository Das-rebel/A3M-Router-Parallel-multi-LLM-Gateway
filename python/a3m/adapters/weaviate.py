"""
A3M Router Weaviate adapter.

Enables A3M Router as the embedding layer for Weaviate vector search.

Usage:
    import weaviate
    from a3m.adapters import WeaviateAdapter
    
    # Create A3M-powered Weaviate client
    client = WeaviateAdapter(
        a3m_base_url="http://localhost:8787",
        weaviate_url="http://localhost:8080",
    )
    
    # Generate embeddings via A3M
    query_embedding = client.embed_query("What is AI?")
    
    # Search Weaviate
    results = client.query.get("Article", ["title", "content"]).with_near_vector({
        "vector": query_embedding
    }).with_limit(5).do()
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

WEAVIATE_AVAILABLE = False
try:
    import weaviate
    from weaviate import Client as WeaviateClient
    from weaviate.types import NUMBERS
    WEAVIATE_AVAILABLE = True
except ImportError:
    logger.warning("Weaviate client not installed. pip install weaviate-client")

from a3m.client import A3MRouter, A3MRouterError

if WEAVIATE_AVAILABLE:
    class WeaviateAdapter(WeaviateClient):
        """
        Weaviate client wrapper that uses A3M Router for embeddings.
        
        Provides intelligent embedding generation for Weaviate's
        vector search with automatic model selection.
        
        Args:
            a3m_base_url: A3M Router server URL (for embeddings).
            embed_model: Embedding model ("auto" for A3M selection).
            weaviate_url: Weaviate server URL.
            weaviate_client: Existing Weaviate client (for hybrid use).
            **kwargs: Additional WeaviateClient options.
        """

        def __init__(
            self,
            a3m_base_url: str = "http://localhost:8787",
            embed_model: str = "auto",
            weaviate_url: Optional[str] = None,
            weaviate_client: Optional[WeaviateClient] = None,
            **kwargs: Any,
        ) -> None:
            # Initialize Weaviate client if URL provided
            if weaviate_client:
                # Copy internal state from provided client
                self._connection = weaviate_client._connection
                self._batch = weaviate_client._batch
                self._schema = weaviate_client._schema
            elif weaviate_url:
                super().__init__(url=weaviate_url, **kwargs)
            else:
                # Initialize with empty client for embedding-only use
                self._connection = None
                self._batch = None
                self._schema = None
            
            self._a3m_router = A3MRouter(base_url=a3m_base_url, default_model=embed_model)
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

        def embed_texts(
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

        def with_near_text(
            self,
            query: str,
            **kwargs: Any,
        ) -> "WeaviateNearText":
            """
            Create a near-text search using A3M embeddings.
            
            Args:
                query: Text to search for.
                
            Returns:
                WeaviateNearText object ready for .do()
            """
            embedding = self.embed_query(query)
            return WeaviateNearText(
                client=self,
                text=query,
                embedding=embedding,
                **kwargs,
            )

        def rag_search(
            self,
            query: str,
            class_name: str,
            properties: List[str],
            limit: int = 5,
            **kwargs: Any,
        ) -> Dict[str, Any]:
            """
            Perform RAG search: embed query + Weaviate search + context build.
            
            Args:
                query: User query string.
                class_name: Weaviate class to search.
                properties: Properties to return.
                limit: Number of results.
                
            Returns:
                Dict with 'chunks', 'context', 'answer', 'provider'.
            """
            # 1. Embed query via A3M
            query_embedding = self.embed_query(query)
            
            # 2. Search Weaviate
            try:
                results = (
                    self.query
                    .get(class_name, properties)
                    .with_near_vector({"vector": query_embedding})
                    .with_limit(limit)
                    .do()
                )
            except Exception as e:
                logger.warning(f"Weaviate search error: {e}")
                results = {"data": {"Get": {class_name: []}}}
            
            # 3. Extract chunks
            data = results.get("data", {}).get("Get", {}).get(class_name, [])
            chunks = []
            for item in data:
                text = " ".join([str(item.get(p, "")) for p in properties if p in item])
                chunks.append(text)
            
            context = "\n\n".join(chunks)
            
            # 4. Generate answer via A3M
            answer = None
            provider = None
            if chunks:
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
                    answer = chunks[0] if chunks else ""
                    provider = "weaviate"
            
            return {
                "chunks": chunks,
                "context": context,
                "answer": answer,
                "provider": provider,
            }

    class WeaviateNearText:
        """Helper class for near-text search with A3M embeddings."""
        
        def __init__(
            self,
            client: WeaviateAdapter,
            text: str,
            embedding: List[float],
            certainty: Optional[float] = None,
            distance: Optional[float] = None,
        ) -> None:
            self._client = client
            self._text = text
            self._embedding = embedding
            self._certainty = certainty
            self._distance = distance
            
        def with_limit(self, limit: int) -> "WeaviateNearText":
            """Set result limit."""
            self._limit = limit
            return self
            
        def do(self) -> Dict[str, Any]:
            """Execute the search."""
            near_vector = {"vector": self._embedding}
            if self._certainty is not None:
                near_vector["certainty"] = self._certainty
            if self._distance is not None:
                near_vector["distance"] = self._distance
            
            return self._client.query.get(
                self._class_name,
                self._properties
            ).with_near_vector(near_vector).with_limit(
                getattr(self, "_limit", 10)
            ).do()

else:
    class WeaviateAdapter:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            raise ImportError(
                "Weaviate client not installed. "
                "Install with: pip install weaviate-client"
            )
