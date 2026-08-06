"""
A3M Router Adapters for LLM Frameworks.

Provides drop-in adapters to integrate A3M Router with popular frameworks:
- LangChain (A3MLangChainAdapter)
- LlamaIndex (A3MLlamaIndexAdapter)
- AutoGen (A3MAutoGenAdapter)
- Vercel AI SDK (A3MVercelAdapter)
- Haystack (A3MHaystackAdapter)
- Pinecone (A3MPineconeAdapter)
- LangGraph (A3MLangGraphAdapter)
- Configuration management (A3MConfig)

Usage:
    from a3m_adapter import (
        A3MLangChainAdapter,
        A3MLlamaIndexAdapter,
        A3MAutoGenAdapter,
        A3MVercelAdapter,
        A3MHaystackAdapter,
        A3MPineconeAdapter,
        A3MLangGraphAdapter,
        A3MConfig,
    )
"""

from .adapter.langchain import A3MLangChainAdapter
from .adapter.llamaindex import A3MLlamaIndexAdapter
from .adapter.autogen import A3MAutoGenAdapter
from .adapter.vercel import A3MVercelAdapter, createA3MProvider
from .adapter.haystack import A3MHaystackAdapter
from .adapter.pinecone import A3MPineconeAdapter
from .adapter.langgraph import A3MLangGraphAdapter
from .adapter.config import A3MConfig

__all__ = [
    # Core adapters
    'A3MLangChainAdapter',
    'A3MLlamaIndexAdapter',
    'A3MAutoGenAdapter',
    'A3MVercelAdapter',
    'A3MHaystackAdapter',
    'A3MPineconeAdapter',
    'A3MLangGraphAdapter',
    # Config
    'A3MConfig',
    # Utilities
    'createA3MProvider',
]

__version__ = '2.0.0'
