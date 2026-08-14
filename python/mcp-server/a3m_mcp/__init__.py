"""A3M Router MCP Server — Model Context Protocol server for A3M Router.

Usage:
    python -m a3m_mcp          # Start the MCP server
    pip install a3m-mcp-server  # Install as package
"""
try:
    from .server import main, HAS_MCP, SERVER_NAME
except ImportError:
    main = None
    HAS_MCP = False
    SERVER_NAME = "a3m-router"

__version__ = "1.0.0"
__all__ = ["main", "HAS_MCP", "SERVER_NAME", "__version__"]
