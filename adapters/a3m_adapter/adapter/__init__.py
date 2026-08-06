"""A3M Router adapter implementations."""

from .langchain import A3MLangChainAdapter
from .llamaindex import A3MLlamaIndexAdapter
from .autogen import A3MAutoGenAdapter
from .vercel import A3MVercelAdapter, createA3MProvider
from .haystack import A3MHaystackAdapter
from .pinecone import A3MPineconeAdapter
from .langgraph import A3MLangGraphAdapter
from .config import A3MConfig

__all__ = [
    'A3MLangChainAdapter',
    'A3MLlamaIndexAdapter',
    'A3MAutoGenAdapter',
    'A3MVercelAdapter',
    'createA3MProvider',
    'A3MHaystackAdapter',
    'A3MPineconeAdapter',
    'A3MLangGraphAdapter',
    'A3MConfig',
]
