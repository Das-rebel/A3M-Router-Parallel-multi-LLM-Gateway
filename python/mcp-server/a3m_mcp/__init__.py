"""
A3M Router MCP Server

MCP (Model Context Protocol) server for A3M Router.
Provides intelligent LLM routing and ensemble execution as MCP tools.
"""

__version__ = "1.0.0"

# Try to import MCP components
HAS_MCP = False
SERVER_NAME = "a3m-router"

try:
    from mcp.server.lowlevel import Server
    from mcp import Tool
    HAS_MCP = True
except ImportError:
    pass

# Import main if available
try:
    from .server import main
except ImportError:
    main = None
