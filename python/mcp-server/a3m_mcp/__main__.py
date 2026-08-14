"""Entry point: python -m a3m_mcp"""
import sys
import os

# Add parent directory to path so a3m_mcp can find sibling packages
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .server import main, HAS_MCP

if __name__ == "__main__":
    if not HAS_MCP:
        print("ERROR: mcp package required. Install with: pip install mcp", file=sys.stderr)
        sys.exit(1)
    import asyncio
    asyncio.run(main())
