# A3M Router MCP Server for Browser Automation

**Use A3M's intelligent routing as an MCP server for AI agents.**

This integration exposes A3M Router's capabilities via the Model Context Protocol (MCP), enabling AI agents (Claude Desktop, Cursor, Codex, n8n, etc.) to use intelligent LLM routing for browser automation tasks.

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open standard for connecting AI assistants to external tools and data sources. MCP servers expose capabilities as "tools" that AI agents can call.

## Installation

```bash
npm install a3m-mcp-browser
# or
npx a3m-mcp-browser
```

## Setup

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "a3m-browser": {
      "command": "npx",
      "args": ["a3m-mcp-browser"]
    }
  }
}
```

### Cursor

Settings → MCP → Add new server:

```json
{
  "name": "a3m-browser",
  "command": "npx",
  "args": ["a3m-mcp-browser"]
}
```

### n8n

Add MCP Trigger node with server config above.

## Available Tools

### `route_for_browser_task`

Route a browser task to the optimal LLM provider.

```json
{
  "task": "Extract all job listings from this page including title, company, and apply URL",
  "context": "web_scraping"
}
```

**Context options:**
- `web_scraping` - Data extraction from web pages
- `form_filling` - Filling out web forms
- `form_analysis` - Analyzing form structure
- `content_generation` - Generating content for web
- `decision_making` - Making decisions based on page content

### `extract_form_data`

Extract structured data from a web page.

```json
{
  "page_html": "<html>...</html>",
  "schema": {
    "name": "string",
    "email": "string",
    "jobs": "array"
  }
}
```

### `fill_form_intelligently`

Get optimal values to fill a form field.

```json
{
  "field_name": "email",
  "field_type": "email",
  "user_profile": {
    "email": "user@example.com"
  }
}
```

### `get_stealth_routing`

Get routing configuration optimized for stealth.

```json
{
  "minimize_detection": true,
  "provider_rotation": true
}
```

## Example Workflow

### Claude Desktop

```
You: Use A3M to extract all job listings from linkedin.com/jobs/search?q=marketing

Claude: I'll use the A3M router to extract the job data...

[Calls route_for_browser_task with task="Extract all job listings..."]

Claude: I found 25 jobs. Here's the first few:

1. **Head of Marketing** @ TechCorp
   - URL: https://linkedin.com/jobs/view/123
   - Location: Bengaluru
   - Posted: 2 days ago

2. **VP Growth** @ StartupXYZ
   - URL: https://linkedin.com/jobs/view/456
   - Location: Mumbai
   - Posted: 5 days ago
```

### Cursor

```
User: Fill out this job application form using my resume data

Cursor: I'll use A3M to intelligently fill the form...

[Calls fill_form_intelligently for each field]

[Calls route_for_browser_task to verify form completion]
```

## Cost Savings

| Task Type | Without A3M | With A3M | Savings |
|-----------|-------------|----------|---------|
| Form filling | $0.03/task | $0.002/task | 93% |
| Data extraction | $0.01/task | $0.003/task | 70% |
| Page analysis | $0.02/task | $0.005/task | 75% |

## Features

- **Automatic routing** - Routes to cheapest capable model
- **Stealth mode** - Minimize bot detection
- **Parallel ensemble** - Run multiple providers for reliability
- **Fallback handling** - Automatic retry on failure
- **Cost tracking** - Monitor spending per task

## Configuration

```json
{
  "model": "auto",
  "stealth": true,
  "parallelEnsemble": 3,
  "providers": ["openai", "anthropic", "google", "groq"]
}
```

## License

MIT - Same as A3M Router
