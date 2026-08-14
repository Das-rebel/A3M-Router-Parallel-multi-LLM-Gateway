"""
A3M Router Adapter Package

This package provides drop-in adapters to integrate A3M Router
with popular LLM frameworks including LangChain, LlamaIndex, and more.

Usage:
    from adapters import A3MLangChainAdapter, A3MLlamaIndexAdapter, A3MConfig
    
    # LangChain
    llm = A3MLangChainAdapter(model="auto", temperature=0.7)
    
    # LlamaIndex
    llm = A3MLlamaIndexAdapter(model="auto")
    
    # Configuration
    config = A3MConfig(model="auto", parallel_ensemble=2)
"""

from .a3m_adapter.adapter.langchain import A3MLangChainAdapter
from .a3m_adapter.adapter.llamaindex import A3MLlamaIndexAdapter
from .a3m_adapter.adapter.config import A3MConfig

__all__ = ['A3MLangChainAdapter', 'A3MLlamaIndexAdapter', 'A3MConfig']
__version__ = '1.0.0'
