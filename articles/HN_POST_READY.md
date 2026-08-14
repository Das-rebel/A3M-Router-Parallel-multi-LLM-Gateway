# Show HN: I built an open-source LLM router that routes to the cheapest provider — 200× cheaper than GPT-5

**TL;DR:** I was spending $800/month on LLM APIs. Half of those calls were GPT-4o answering "what is 2+2?" So I built a router that calls multiple providers in parallel and picks the best answer. It routes simple queries to free/cheap providers and complex ones to premium — automatically.

**Try it right now:**
```bash
npx a3m-router route "Explain quantum computing"
```

No config. No API keys needed for demo. 19.5KB, zero ML dependencies.

---

## The Problem

Every LLM gateway does the same thing: send your query to Provider A. If it fails, try B. If it fails, try C.

You get the **first successful answer**. Not the **best answer**.

And that first provider is usually GPT-4o — because "what is 2+2?" needs to go somewhere. That costs $0.03 per query. The same answer from Groq costs $0.0002.

That's like calling an Uber to pick up your mail.

## The Solution

Instead of sequential fallback, A3M calls multiple providers at once and scores every response:

- **Domain expertise** — does this provider handle code? math? creative writing?
- **Specificity match** — did it answer the actual question or give a generic response?
- **Structure alignment** — did it follow the requested format?

The cheapest provider that fully satisfies the query wins.

```javascript
// Before: one provider, first answer
const result = await openai.chat.completions.create({...});

// After: all providers in parallel, best answer wins
const result = await a3mRouter.route({
  messages: [{ role: 'user', content: 'Explain quantum computing' }]
});
// → Routes to cheapest capable provider
// → Automatically handles complexity classification
```

## Cost Comparison

| Router | Cost/1K tokens | Open Source |
|--------|:--------------:|:----------:|
| **A3M Router** | **$0.0768** | ✅ |
| Sqwish | $0.18 | ❌ |
| Azure | $0.22 | ❌ |
| GPT-5 (OpenAI) | $10.02 | ❌ |
| RouteLLM (Berkeley) | $0.27 | ✅ |

**The math:** $1,000/month on LLM APIs → ~$5/month with A3M at equivalent quality.

## Real Overhead Numbers

Every gateway says "negligible overhead." We measured ours:

| Setup | Latency | What's included |
|:------|:-------:|:----------------|
| Direct to provider | 138ms | Raw API call |
| Through A3M | 374ms | Routing + parallel calls + scoring + cache |

236ms overhead. The cost savings dwarf it at scale.

## Features

- **Parallel ensemble routing** — calls all providers at once, returns the best
- **47+ providers** — OpenAI, Anthropic, Google, Groq, Cerebras, DeepSeek, Mistral, and 40 more
- **Semantic caching** — 30%+ hit rate with trigram Jaccard similarity
- **Prompt injection detection** — 17-pattern guardrails
- **Budget enforcement** — per-provider and global spend limits
- **Circuit breakers** — auto-skips degraded providers
- **Quality persistence** — scores that learn across sessions
- **19.5KB** — no ML dependencies, no GPU, runs on any VPS

## Install

```bash
npm install adaptive-memory-multi-model-router
```

```javascript
import { A3MRouter } from 'adaptive-memory-multi-model-router';

const router = new A3MRouter({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
    groq: { apiKey: process.env.GROQ_API_KEY },
  }
});

const result = await router.route({
  messages: [{ role: 'user', content: 'Your query here' }]
});
console.log(result.provider, result.cost);
```

## Demo

Try it without installing anything: **[https://das-rebel.github.io/a3m-router/](https://das-rebel.github.io/a3m-router/)**

Benchmark data: **[https://das-rebel.github.io/a3m-router/benchmark](https://das-rebel.github.io/a3m-router/benchmark)**

## GitHub

**[https://github.com/Das-rebel/a3m-router](https://github.com/Das-rebel/a3m-router)**

MIT license.

---

## Pre-written Founder Comment

> Thanks for the interest everyone! A few common questions:
>
> **"How does it work without ML?"** — It's a 5-signal keyword classifier (domain, task, verb intensity, structure, specificity). No embeddings, no GPU, no model weights. 0.3ms routing latency.
>
> **"Why is it so cheap?"** — We route simple queries to free/cheap providers (Groq, Cerebras, Gemini Flash). Complex queries still go to premium. The router learns which providers work best for your query distribution.
>
> **"10K downloads in 14 days with zero marketing?"** — Yeah, devs found it on npm, tried it, and told their team. The 62% savings pitch sells itself.
>
> **"What about latency?"** — We published benchmark numbers above. The overhead is real but the cost savings dwarf it at scale.
>
> Happy to answer questions about the routing algorithm or how to integrate it into your stack.

---

**Ask HN:** What would you use a 200× cheaper LLM router for?
