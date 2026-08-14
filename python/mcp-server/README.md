# A3M Router MCP Server (Python)

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for [A3M Router](https://github.com/Das-rebel/a3m-router) — parallel multi-LLM execution for AI agents.

Allows any MCP-compatible AI agent (Claude Desktop, Cursor, Windsurf, Codex, n8n, etc.) to use A3M's intelligent routing and ensemble execution directly from Python.

## Tools

| Tool | Description |
|------|-------------|
| `a3m_route` | Route a query to the optimal LLM provider — returns model, tier, cost, reasoning |
| `a3m_ensemble` | Execute a query across multiple providers in parallel and merge results |
| `a3m_classify` | Classify query type (fast/creative/deep/code) and get provider recommendations |
| `a3m_providers` | List all configured providers with cost and availability |

## Installation

```bash
# From source
cd python/mcp-server
pip install -e .

# Or install the package directly (when published)
pip install a3m-mcp-server
```

## Configuration

Set environment variables:

```bash
# Required: A3M Router URL (must be running)
export A3M_BASE_URL=http://localhost:8787

# Optional
export A3M_API_KEY=not-needed  # default
export A3M_TIMEOUT=30.0
```

## Start A3M Router

```bash
# Node.js way
npx a3m-router serve

# Python way
pip install a3m-router
a3m-router serve
```

## Usage

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "a3m-router": {
      "command": "python",
      "args": ["-m", "a3m_mcp"],
      "env": {
        "A3M_BASE_URL": "http://localhost:8787"
      }
    }
  }
}
```

### Cursor

Settings → Features → MCP Servers → Add:

```
Name: A3M Router
Command: python
Arguments: -m a3m_mcp
```

### n8n MCP Trigger

Add MCP Trigger node with:

```json
{
  "server": "a3m-router",
  "command": "python",
  "args": ["-m", "a3m_mcp"]
}
```

### Direct stdio (pipe JSON-RPC)

```bash
# List tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python -m a3m_mcp

# Call a3m_route
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"a3m_route","arguments":{"query":"Write a Python quicksort"}}}' | python -m a3m_mcp
```

## Examples

### Route a query

```python
# a3m_route tool
Input:  {"query": "Write a Python function to sort a list"}
Output:
{
  "model": "groq/llama-3.3-70b-versatile",
  "tier": "cheap",
  "cost": 0.000012,
  "reasoning": "Code query detected, routing to fast coding provider",
  "classification": "code"
}
```

### Ensemble execution

```python
# a3m_ensemble tool
Input:  {"query": "Explain quantum computing in 3 sentences", "providers": ["groq", "google", "cerebras"]}
Output:
{
  "query": "Explain quantum computing in 3 sentences",
  "parallel_responses": [
    {"provider": "groq", "content": "Quantum computing is..."},
    {"provider": "google", "content": "At its core, quantum..."},
    {"provider": "cerebras", "content": "Quantum computing leverages..."}
  ],
  "best_answer": "Quantum computing is...",
  "stats": {"total_providers": 3, "successful": 3, "failed": 0}
}
```

## Architecture

```
┌──────────────────────────────────────────────────────┐
│           MCP Client (Claude, Cursor, Codex, n8n)      │
└──────────────────────┬───────────────────────────────┘
                       │ MCP Protocol (stdio)
┌──────────────────────▼───────────────────────────────┐
│           A3M Router MCP Server (Python)              │
│                                                        │
│  a3m_route   a3m_ensemble   a3m_classify  a3m_providers │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP API
┌──────────────────────▼───────────────────────────────┐
│              A3M Router (a3m-router serve)             │
│                                                        │
│  routeQuery()  parallelEnsemble()  providers           │
└───────┬────────────┬────────────┬─────────────────────┘
        │            │            │
   ┌────▼───┐  ┌────▼───┐  ┌────▼───┐
   │  Groq  │  │ Google │  │Cerebras│  ...
   └────────┘  └────────┘  └────────┘
```

## Testing

```bash
cd python/mcp-server
pip install -e ".[dev]"
pytest
```

## License

MIT
