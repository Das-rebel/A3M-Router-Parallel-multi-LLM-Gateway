# A3M Router

**Universal LLM routing gateway — routes requests to the cheapest capable provider across 47+ models.**

A3M Router is a stateless proxy between your application and 47+ LLM providers. It inspects each request, estimates how complex it is, and routes it to the cheapest capable provider — without retraining a model or managing GPU infrastructure.

The API uses the OpenAI format (same endpoints, same request/response shapes), so existing SDKs and prompts work without changes. But it routes across any provider you configure, not just OpenAI.

---

## Quick Start

```bash
npm install adaptive-memory-multi-model-router
npx a3m-router serve
```

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8787/v1", api_key="not-needed")

response = client.chat.completions.create(
    model="auto",  # "auto" = heuristic routing
    messages=[{"role": "user", "content": "Explain quantum computing in 3 bullets"}]
)
```

That's it. `model="auto"` triggers routing. All other OpenAI SDK calls work unchanged.

---

## How Routing Works

For every request, A3M Router scores complexity across five signals:

| Signal | What it detects |
|--------|----------------|
| **Domain** | Legal, medical, code, finance, ML keywords |
| **Task type** | Code generation, translation, analysis, creative |
| **Query structure** | Clause count, length, qualifier words |
| **Verb intensity** | "design/architect" → complex, "what/who" → simple |
| **Multi-step** | Explicit step markers (first...then, step 1/2/3) |

The combined score maps to a tier (free → cheap → mid → premium). Within that tier, A3M picks the cheapest available provider with a passing health score.

This is the same approach other routing systems use — the key differences between implementations are:

- **Signal weights** — how much each dimension contributes
- **Provider tiers** — which models live in which tier
- **Health scoring** — how failures and latency affect provider selection
- **Fallback behavior** — what happens when the preferred provider is down

A3M stores no training data, requires no GPU, and routes in ~140ms overhead.

---

## Why Not Just Use LiteLLM?

LiteLLM is the dominant open-source AI gateway (54K stars). It handles unified API access well. A3M Router adds two capabilities LiteLLM doesn't have built-in:

### 1. Heuristic Routing
LiteLLM routes by model name or requires you to specify which model to call. A3M's `model="auto"` mode analyzes the query content and picks the cheapest capable provider automatically. This is useful when you want cost efficiency without writing routing logic.

### 2. Parallel Ensemble Execution
Sometimes you want the best answer regardless of cost. A3M can call multiple providers in parallel, score each response, and return the best one — with full provenance of which provider won and why.

```typescript
import { executeEnsemble } from 'adaptive-memory-multi-model-router/ensemble';

const result = await executeEnsemble(
  "Explain how vector databases work",
  systemPrompt,
  context,
  { groq: callGroq, openai: callOpenAI, nvidia: callNvidia },
  { providers: ['groq', 'openai', 'nvidia'], timeoutMs: 30000 }
);
// result.winner     — which provider gave the best response
// result.scores     — per-provider quality scores
// result.allResults — all responses preserved
```

### What A3M doesn't do (LiteLLM does)
- Virtual keys, spend limits per team/user
- Admin dashboard, UI
- OAuth/SSO integration
- LangChain/LlamaIndex first-class integrations
- Enterprise SLA and support contracts

A3M is a routing engine. LiteLLM is an enterprise platform. Use the right tool for your stage.

### OpenAI-Compatible API
The API format is OpenAI-compatible — same `/v1/chat/completions` endpoints, same request/response shapes — so any OpenAI-compatible SDK or proxy tool works with A3M without code changes. This is useful for switching providers behind an existing integration or for tooling that only supports the OpenAI format.

---

## Architecture

```
Request → Guardrails → Cache → Router → Provider → Response
                    ↓
              Cost tracking
              Metrics
```

**Guardrails** — Runs before any provider call: prompt injection detection, PII detection, content filtering. Rejects or sanitizes dangerous input.

**Semantic Cache** — Optional. Uses embedding similarity to return cached responses for repeated queries. Cache hit = instant response, zero provider cost.

**Router** — Scores the query, selects tier, picks the cheapest healthy provider in that tier. Model quality scores update online via exponential moving average after each real call — no retraining.

**Ensemble** — Optional. Calls multiple providers in parallel, scores responses on specificity and structure, returns the winner.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/chat/completions` | OpenAI-compatible chat (streaming + non-streaming) |
| POST | `/v1/completions` | OpenAI completions |
| POST | `/v1/embeddings` | Text embeddings |
| POST | `/v1/route` | Get routing decision without calling an LLM |
| GET | `/v1/models` | Available models and pricing |
| GET | `/health` | Provider health, recent requests, cost totals |
| GET | `/metrics` | Prometheus-compatible metrics |

### CLI

```bash
npx a3m-router serve              # start proxy on port 8787
npx a3m-router route "query"      # see routing decision for a query
npx a3m-router health             # provider latency and availability
npx a3m-router benchmark         # run local accuracy test (n=200)
```

### Configuration

**Environment variables** — API keys for each provider:

```bash
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export GROQ_API_KEY=gsk_...
# No key needed for free tier providers
```

**Budget enforcement:**

```typescript
import { BudgetManager } from 'adaptive-memory-multi-model-router/billing';

const budgets = new BudgetManager({
  monthlyLimit: 500,
  alerts: [0.5, 0.8, 1.0],
});
```

**Provider retry with backoff:**

```typescript
import { RetryManager } from 'adaptive-memory-multi-model-router/retry';

const retry = new RetryManager({
  providers: {
    'openai': { timeout: 30000, maxRetries: 3, baseDelay: 1000 },
    'groq': { timeout: 15000, maxRetries: 2, baseDelay: 500 },
  },
});
```

**Circuit breaker:**

```typescript
import { CircuitBreaker } from 'adaptive-memory-multi-model-router/failover';

const cb = new CircuitBreaker({
  failureThreshold: 3,
  cooldownMs: 60000,
  fallbackChain: ['groq', 'deepseek', 'openai'],
});
```

---

## Provider Coverage

| Provider | Tiers | Notes |
|----------|-------|-------|
| OpenAI | premium, mid | gpt-4o, gpt-4o-mini |
| Anthropic | premium, mid | claude-3.5-sonnet, claude-3-haiku |
| Google | premium, mid | gemini-1.5-pro, gemini-1.5-flash |
| Groq | cheap | llama-3.3-70b, llama-3.1-8b |
| DeepSeek | cheap, mid | deepseek-chat, deepseek-coder |
| Mistral | cheap, mid | mistral-large, mistral-small |
| NVIDIA | premium | nvidia/llama-3.1-nemotron |
| OpenRouter | all | aggregated access |
| Ollama | all | self-hosted models |
| vLLM | all | self-hosted OpenAI-compatible servers |
| Azure OpenAI | premium, mid | enterprise |
| AWS Bedrock | premium, mid | enterprise |

47+ providers total. Availability is checked at runtime.

---

## Adding a New Endpoint

The server uses a route-based architecture. To add a new endpoint:

**1. Create the handler** `src/server/handlers/myHandler.ts`:

```typescript
import { RouteContext } from '../router';

export async function handleMyEndpoint(ctx: RouteContext): Promise<void> {
  ctx.json(200, { hello: 'world' });
}
```

**2. Register the route** in `proxyServer.ts`:

```typescript
import { handleMyEndpoint } from './handlers/myHandler';

// In createProxyServer():
registerRoute('GET', /^\/v1\/my-endpoint$/, handleMyEndpoint, 'GET /v1/my-endpoint');
```

Two lines total.

---

## Project Stats

- **Stars**: 10
- **npm downloads/month**: ~5,000
- **Providers**: 47+
- **License**: MIT

---

## License

MIT. See [LICENSE](LICENSE).
