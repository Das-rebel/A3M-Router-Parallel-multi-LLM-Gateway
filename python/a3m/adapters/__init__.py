"""
A3M Router framework adapters.

Lazy-loaded adapter classes for popular frameworks:
- LangChain: from a3m.adapters import LangChainAdapter
- LlamaIndex: from a3m.adapters import LlamaIndexAdapter
- Qdrant: from a3m.adapters import QdrantAdapter
- Weaviate: from a3m.adapters import WeaviateAdapter
"""

from .langchain import LangChainAdapter
from .llamaindex import LlamaIndexAdapter
from .qdrant import QdrantAdapter
from .weaviate import WeaviateAdapter

__all__ = [
    "LangChainAdapter",
    "LlamaIndexAdapter", 
    "QdrantAdapter",
    "WeaviateAdapter",
]
