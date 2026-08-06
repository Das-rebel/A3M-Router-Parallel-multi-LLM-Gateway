# A3M Router

[![npm](https://img.shields.io/npm/v/adaptive-memory-multi-model-router?style=flat-square)](https://www.npmjs.com/package/adaptive-memory-multi-model-router)
[![npm](https://img.shields.io/npm/dm/adaptive-memory-multi-model-router?style=flat-square)](https://www.npmjs.com/package/adaptive-memory-multi-model-router)
[![TotalDownloads](https://img.shields.io/badge/downloads-33%2C194%20total-33K%20-yellow?style=flat-square)](https://www.npmjs.com/package/adaptive-memory-multi-model-router)
[![GitHub stars](https://img.shields.io/github/stars/Das-rebel/a3m-router?style=flat-square)](https://github.com/Das-rebel/a3m-router/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Das-rebel/a3m-router?style=flat-square)](https://github.com/Das-rebel/a3m-router/network)
[![CI](https://github.com/Das-rebel/a3m-router/actions/workflows/ci.yml/badge.svg)](https://github.com/Das-rebel/a3m-router/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Best in class open source LLM router across 47+ providers — 33K+ downloads with Evolution-inspired routing.**

A3M Router is a stateless proxy between your application and 47+ LLM providers. It inspects each request, estimates how complex it is, and routes it to the cheapest capable provider — without retraining a model or managing GPU infrastructure. Provider selection is guided by ecological theory: EXP3 prevents monoculture, Charnov MVT optimizes rate-limit rotation, and Optimal Defense Theory allocates shadow verification to high-stakes queries.

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

LiteLLM is the dominant open-source AI gateway (54K stars). It handles unified API access well. A3M Router adds three capabilities LiteLLM doesn't have built-in:

### 1. Heuristic Routing
LiteLLM routes by model name or requires you to specify which model to call. A3M's `model="auto"` mode analyzes the query content and picks the cheapest capable provider automatically. This is useful when you want cost efficiency without writing routing logic.

### 2. Biology-Inspired Provider Selection
A3M applies established ecological and evolutionary theory to routing decisions:

**EXP3 Diversity Weighting** — Negative frequency-dependent selection prevents any single provider from dominating traffic. Providers above their fair share (1/n of total) receive a penalty proportional to their deviation. This mirrors how ecological niches prevent competitive exclusion — no species dominates when resource competition is symmetric.

**Charnov MVT Rate-Limit Rotation** — When a provider's rate-limit window becomes depleted, A3M uses the Marginal Value Theorem (Charnov 1976) to decide the optimal time to switch. It leaves when the marginal remaining rate falls below the average rate including switch cost — the same logic that explains when animals should leave a depleting food patch.

**ODT Shadow Verification** — For high-stakes queries, A3M can probabilistically sample a shadow provider to verify the primary's answer. The sampling probability follows Optimal Defense Theory: tissue value (query stakes) and attack probability (risk profile) scale verification effort proportionally. This is how plants allocate defensive compounds — expensive defenses go to valuable tissues.

### 3. Parallel Ensemble Execution
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

**Router** — Scores the query, selects tier, picks the cheapest healthy provider in that tier. Model quality scores update online via exponential moving average after each real call — no retraining. Three biologically-inspired mechanisms run inside the router:
- **EXP3 diversity weighting** — negative frequency-dependent selection prevents any provider from dominating traffic (no competitive exclusion)
- **Charnov MVT rate-limit rotation** — optimal departure time from depleting rate-limit windows
- **ODT shadow sampler** — probabilistically verifies high-stakes queries proportional to query value (tissue value) and risk (attack probability)

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

| Metric | Value |
|--------|-------|
| **Total Downloads** | 33,194+ |
| **Monthly Downloads** | ~5,400 (Jul 2026) |
| **GitHub Stars** | 10 |
| **GitHub Forks** | 2 |
| **LLM Providers** | 47+ |
| **License** | MIT |

## Independent Benchmarks

RouterArena independent evaluation: 96.77% accuracy, $0.0768/1K cost, 1.0000 robustness (8,400 queries). See [`docs/BENCHMARK.md`](docs/BENCHMARK.md) for full reproducible benchmarks.

---

## License

MIT. See [LICENSE](LICENSE).
