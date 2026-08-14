# [Package] a3m-vercel-ai — Drop-in Vercel AI SDK provider with automatic cost-based routing

Hey Vercel AI community 👋

Built a provider package for the Vercel AI SDK that handles automatic model selection based on cost and capability. 

## Why I Built This

I was building a SaaS with heavy AI features. My LLM costs hit $800/month on a side project. Most queries were simple — "summarize this", "list the features", "what is X" — but I was using GPT-4o for everything because it was already configured.

Switching models manually wasn't scalable. So I built automatic routing.

## The Package

**`a3m-vercel-ai`** — a Vercel AI SDK provider that:

- Routes to cheapest capable model automatically (no manual selection)
- Runs parallel ensemble (3 providers, picks best)
- Tracks per-request costs
- Handles streaming and tools

```typescript
import { createA3MProvider } from 'a3m-vercel-ai';
import { streamText } from 'ai';

const a3m = createA3MProvider({
  parallelEnsemble: true,
  baseURL: process.env.A3M_ROUTER_URL
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = await streamText({
    model: a3m('auto'),  // ← automatic routing
    messages
  });
  
  return result.toDataStreamResponse();
}
```

## Setup

1. Install: `npm install a3m-vercel-ai ai`
2. Start A3M Router: `npm install -g adaptive-memory-multi-model-router && a3m-router serve`
3. Configure providers in `.env.local`

## What It Routes To

| Query | Routed To | Why |
|-------|-----------|-----|
| "What is 2+2?" | Groq | Free, fast, accurate |
| "Write a Python script" | DeepSeek Coder | Code-specialized |
| "Summarize this 50-page doc" | Claude 3.5 Sonnet | Long context |
| "Design a system architecture" | GPT-4o | Complex reasoning |

## Documentation

Full docs with Next.js App Router examples, streaming setup, and configuration options:
- GitHub: [https://github.com/Das-rebel/a3m-router/tree/main/packages/a3m-vercel-ai](https://github.com/Das-rebel/a3m-router/tree/main/packages/a3m-vercel-ai)
- npm: [https://www.npmjs.com/package/a3m-vercel-ai](https://www.npmjs.com/package/a3m-vercel-ai)

## Feedback Wanted

This is v0.1 — looking for feedback on:
- Routing accuracy for edge cases
- Latency overhead acceptable?
- Missing features for production use?

Happy to answer questions.
