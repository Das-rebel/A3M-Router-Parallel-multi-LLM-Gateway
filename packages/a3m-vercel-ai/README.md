# a3m-vercel-ai

**A3M Router provider for Vercel AI SDK** — intelligent cost-based routing with parallel execution, automatic fallback, and 60%+ cost savings.

## Features

- 🔀 **Automatic Model Selection** — Routes to the cheapest capable provider automatically
- ⚡ **Parallel Ensemble** — Runs multiple providers simultaneously, picks the best result
- 💰 **60%+ Cost Savings** — Routes simple queries to free/cheap providers automatically
- 🔄 **Automatic Fallback** — If primary provider fails, routes to next best option
- 🛡️ **Circuit Breakers** — Skips degraded providers automatically
- 📊 **Cost Tracking** — Per-request cost visibility in response metadata

## Installation

```bash
npm install a3m-vercel-ai ai
```

## Quick Start

```typescript
import { createA3MProvider } from 'a3m-vercel-ai';
import { generateText } from 'ai';

const a3m = createA3MProvider();

const result = await generateText({
  model: a3m('auto'),
  prompt: 'What is the capital of France?',
});

console.log(result.text);
// A3M automatically routes to the cheapest capable provider
```

## Configuration

```typescript
const a3m = createA3MProvider({
  // A3M Router endpoint (default: http://localhost:8787)
  baseURL: process.env.A3M_ROUTER_URL || 'http://localhost:8787',

  // API key (default: 'not-needed' for local)
  apiKey: process.env.A3M_API_KEY,

  // Enable parallel ensemble execution
  parallelEnsemble: true,

  // Number of providers to run in parallel (default: 3)
  parallelCount: 3,

  // Enable stealth mode for browser automation
  stealth: false,

  // Cache configuration
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
  },

  // Provider API keys (if not using environment variables)
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
    groq: { apiKey: process.env.GROQ_API_KEY },
  },
});
```

## Next.js App Router Example

```typescript
// app/api/chat/route.ts
import { createA3MProvider } from 'a3m-vercel-ai';
import { streamText } from 'ai';

const a3m = createA3MProvider({
  parallelEnsemble: true,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: a3m('auto'),
    messages,
  });

  return result.toDataStreamResponse();
}
```

## Streaming Response

```typescript
const result = await streamText({
  model: a3m('auto'),
  prompt: 'Write a story about a robot...',
});

// Stream to response
return result.toDataStreamResponse();

// Or accumulate and use
const { text } = await result.consumeStream();
console.log(text);
```

## How It Works

A3M Router analyzes each request and routes to the optimal provider:

| Request Type | Example | Routed To | Why |
|-------------|---------|-----------|-----|
| Simple Q&A | "What is 2+2?" | Groq (free) | Basic math，不需要高级模型 |
| Code generation | "Write a sorting function" | DeepSeek Coder | 专用代码模型 |
| Complex analysis | "Analyze this legal contract" | Claude 3.5 | 需要长上下文 |
| Creative writing | "Write a poem" | GPT-4o | 创意任务 |

## Cost Savings

| Setup | Monthly Cost (100K requests) |
|-------|-------------------------------|
| GPT-4o only | $3,000 |
| Claude only | $2,500 |
| **A3M Router** | **$800** |

## Environment Variables

Configure your provider API keys:

```bash
# .env.local
A3M_ROUTER_URL=http://localhost:8787
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
```

## Requirements

- Node.js 18+
- Vercel AI SDK 3.0+
- A3M Router running (or use hosted version)

## Start A3M Router

```bash
# Install A3M Router
npm install -g adaptive-memory-multi-model-router

# Start the router
a3m-router serve

# Router now running at http://localhost:8787
```

## License

MIT
