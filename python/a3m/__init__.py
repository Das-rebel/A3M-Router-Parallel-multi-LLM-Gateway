"""A3M Router Python SDK"""
from .client import A3MRouter, A3MRouterError
from .sync_client import A3MRouterSync
from .models import RoutingDecision, CostReport

__version__ = "2.2.0"

__all__ = [
    "A3MRouter",
    "A3MRouterSync",
    "A3MRouterError",
    "RoutingDecision",
    "CostReport",
    # Framework adapters
    "LangChainAdapter",
    "LlamaIndexAdapter",
    "QdrantAdapter",
    "WeaviateAdapter",
]

# Lazy-load adapters
def __getattr__(name: str):
    if name == "LangChainAdapter":
        from .adapters.langchain import LangChainAdapter
        return LangChainAdapter
    if name == "LlamaIndexAdapter":
        from .adapters.llamaindex import LlamaIndexAdapter
        return LlamaIndexAdapter
    if name == "QdrantAdapter":
        from .adapters.qdrant import QdrantAdapter
        return QdrantAdapter
    if name == "WeaviateAdapter":
        from .adapters.weaviate import WeaviateAdapter
        return WeaviateAdapter
    raise AttributeError(f"module 'a3m' has no attribute '{name}'")
