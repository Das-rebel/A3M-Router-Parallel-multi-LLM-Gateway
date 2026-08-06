"""
A3M Router Adapters for LLM Frameworks.

Provides drop-in adapters for:
- LangChain (A3MLangChainAdapter)
- LlamaIndex (A3MLlamaIndexAdapter)
- Configuration management (A3MConfig)
"""

from .adapter.langchain import A3MLangChainAdapter
from .adapter.llamaindex import A3MLlamaIndexAdapter
from .adapter.config import A3MConfig

__all__ = ['A3MLangChainAdapter', 'A3MLlamaIndexAdapter', 'A3MConfig']
__version__ = '1.0.0'
