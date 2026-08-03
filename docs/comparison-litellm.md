# Why A3M Router instead of litellm?

litellm (48K★) is the most popular LLM gateway. Here's why A3M exists alongside it.

## Quick Comparison

| Feature | litellm | A3M Router |
|---------|---------|------------|
| **Approach** | Sequential fallback | Parallel ensemble |
| **Model selection** | Try one, fail, try next | Run all, pick best by confidence |
| **Cost model** | Pay for every attempt | Pay for best response only |
| **Latency** | N × round-trip (sequential) | 1 × round-trip (parallel) |
| **Memory** | None | Episodic memory across sessions |
| **Size** | ~1.5GB (PyTorch) | 19.5KB (zero ML) |
| **Startup** | ~3s | <100ms |
| **GPU required** | Yes (for some models) | No |
| **Routing accuracy** | Claims "100%" (no data) | 67% exact tier match (MMR-Bench) |
| **Cost savings** | Not published | 63% vs all-premium (MMR-Bench) |
| **Cache** | None | Semantic (embedding-based) |

## The Core Difference

**litellm:** You send a request. It tries provider A. If A fails or times out, it tries provider B. If B fails, it tries C. You pay for every attempt.

```python
# litellm: sequential fallback
response = litellm.completion(model="gpt-4o", messages=[...])  # $0.03, might fail
# if fails → fallback to claude-3.5-sonnet  # $0.003, might fail
# if fails → fallback to groq/llama           # $0.00006, works!
# Total cost: $0.03 + $0.003 = $0.033 for 1 successful response
# Total latency: timeout_A + timeout_B + response_C
```

**A3M:** You send a request. It calls all providers at once. Each response gets a confidence score. The highest-confidence response wins, regardless of cost.

```javascript
// A3M: parallel ensemble
const result = await router.route("Explain quantum computing")
// All 3 providers called simultaneously:
//   gpt-4o       → confidence: 0.82, cost: $0.03
//   claude-3.5   → confidence: 0.85, cost: $0.003  ← WINNER
//   groq/llama   → confidence: 0.79, cost: $0.00006
// Total cost: $0.003 (cheapest capable model wins)
// Total latency: max(response_A, response_B, response_C) = 1 round-trip
```

## When to Use litellm

- You need Python SDK (A3M is JavaScript/TypeScript only)
- You want provider-specific features (vision, function calling, structured outputs)
- You're already using it in production and it works fine
- You need 100+ provider packages installed

## When to Use A3M

- You want the **cheapest** routing (parallel execution means you only pay for the best result)
- You want **highest accuracy** (confidence-weighted ensemble beats sequential fallback)
- You want **memory** across sessions (only router with episodic memory)
- You want **sub-100ms startup** (litellm takes ~3s)
- You want **zero ML dependencies** (no GPU, no PyTorch, 19.5KB)
- You want **semantic caching** (avoid repeated API calls for similar queries)
- You're building in Node.js/TypeScript

## When to Use Both

You can use litellm as a provider inside A3M:

```javascript
const router = createRouter({
  providers: {
    litellm: { apiKey: process.env.LITELLM_API_KEY }
  }
})
```

This gives you litellm's 100+ providers AND A3M's parallel scoring.

---

[GitHub](https://github.com/Das-rebel/a3m-router) · [npm](https://www.npmjs.com/package/adaptive-memory-multi-model-router)
