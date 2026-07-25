# A3M Router — Product Hunt Listing

## Tagline
**The open-source LLM routing gateway — routes every query to the cheapest capable provider, automatically.**

---

## One-liner
Drop-in replacement for OpenAI API calls. Routes to cheapest capable provider across 47+ models. No ML training, no GPU, no config.

---

## Description

### The Problem
You're paying GPT-4o prices for queries a free model could answer. Or you're manually switching between providers and still burning budget. Managing which query goes where is a full-time job.

### The Solution
A3M Router sits between your app and LLM providers. Set `model="auto"`. For every request, it inspects the query, scores its complexity, and routes to the cheapest capable provider automatically.

```bash
npm install adaptive-memory-multi-model-router
npx a3m-router serve
```

```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:8787/v1", api_key="not-needed")
response = client.chat.completions.create(
    model="auto",  # ← router picks cheapest capable provider
    messages=[{"role": "user", "content": "Explain quantum computing"}]
)
```

Works with your existing OpenAI SDK calls. Just change the `base_url`.

---

## Features

### Heuristic Routing
No ML model, no training. Scores queries across 5 dimensions (domain keywords, task type, verb intensity, query structure, multi-step markers) and maps to tiers: free → cheap → mid → premium.

### Parallel Ensemble
When you want the best answer regardless of cost, call multiple providers simultaneously. A3M scores each response on specificity, structure, and relevance. Returns the winner with full provenance.

### Semantic Cache
Repeated queries return cached responses instantly. Embeddings-based similarity matching. 30%+ hit rate observed on real workloads.

### Production-Ready
- Circuit breaker (auto-skips degraded providers)
- Retry with exponential backoff
- Per-team budget enforcement
- Provider health scoring
- Prompt injection guardrails

### 47+ Providers
OpenAI, Anthropic, Google, Groq, DeepSeek, Mistral, NVIDIA, Ollama, vLLM, Azure, AWS Bedrock, and 38 more.

---

## Comparison

| | A3M Router | LiteLLM |
|--|-----------|---------|
| Automatic routing (`model="auto"`) | ✅ Built-in | ❌ Specify model manually |
| Parallel ensemble | ✅ Built-in | ❌ Not included |
| Heuristic (no training) | ✅ | ❌ (requires model config) |
| Providers | 47+ | 100+ |
| Self-hosted | ✅ | ✅ |

A3M is a routing engine. LiteLLM is an enterprise platform. Different tools for different stages.

---

## Links

- **GitHub:** https://github.com/Das-rebel/a3m-router
- **npm:** https://www.npmjs.com/package/adaptive-memory-multi-model-router
- **Docs:** https://das-rebel.github.io/a3m-router/

---

## Maker's Notes

Built this because I was tired of choosing between paying $0.03/query for GPT-4o on "what is 2+2?" or manually managing provider switching. Questions welcome.
