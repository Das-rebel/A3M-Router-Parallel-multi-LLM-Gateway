# Reddit Post — r/opensource / r/aitools / r/MachineLearning

**Title:** "Built an open-source LLM router — 2 lines of code to route across 47+ providers automatically"

**Subtitle:** "No ML training, no GPU, no config. Just drop it in front of your existing OpenAI SDK calls."

---

Hey everyone,

I've been working on a universal LLM router. The problem I was trying to solve: every LLM provider has different pricing, latency, and capability tiers. I was manually switching between them and still burning money on premium models for simple queries.

**What it does:**

```
npm install adaptive-memory-multi-model-router
npx a3m-router serve
```

Then point your OpenAI SDK at `http://localhost:8787/v1` instead of `api.openai.com`. Set `model="auto"` and the router analyzes each query and picks the cheapest capable provider automatically.

**How routing works (no ML, no training):**

The router scores each query across 5 dimensions:
- Domain keywords (legal, medical, code, finance)
- Task type (code generation, translation, analysis)
- Query structure (length, clause count)
- Verb intensity ("design" → complex, "what" → simple)
- Multi-step markers ("first...then", "step 1/2/3")

Maps to tiers: free → cheap → mid → premium. Within each tier, picks the cheapest healthy provider.

**What's included:**

- Heuristic routing (`model="auto"`)
- Parallel ensemble (call 3 providers at once, pick the best response)
- Semantic cache (embeddings-based, 30%+ hit rate on repeated queries)
- Provider health monitoring + retry with backoff
- Circuit breaker + budget enforcement

**47 providers:** OpenAI, Anthropic, Google, Groq, DeepSeek, Mistral, NVIDIA, Ollama, vLLM, and 38 more.

**Repo:** https://github.com/Das-rebel/a3m-router
**npm:** https://www.npmjs.com/package/adaptive-memory-multi-model-router

Happy to answer questions about how it works or why I built yet another router.

---

**Suggested flairs:** `showoff` | `tools` | `opensource`
