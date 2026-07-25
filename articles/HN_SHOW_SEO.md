# Hacker News "Show HN" Post

**Title:** "A universal LLM router that picks the cheapest capable provider per query"

**Body:**

---

I'd like to show A3M Router — an open-source gateway that sits between your app and 47+ LLM providers.

**The pitch:** You point your existing OpenAI SDK at the proxy instead of `api.openai.com`. Set `model="auto"`. For every request, the router inspects the query, scores its complexity, and picks the cheapest provider that can handle it. No config, no training, no GPU.

**How it works:**

Queries get scored across 5 dimensions (domain keywords, task type, query structure, verb intensity, multi-step markers). The score maps to a tier: free → cheap → mid → premium. Within the tier, cheapest healthy provider wins.

**What makes it different from LiteLLM:**

LiteLLM is the standard here — it's solid and has 54K stars. Two things A3M adds that LiteLLM doesn't have built-in:

1. **Heuristic `model="auto"` routing** — the router picks the cheapest capable provider automatically based on query content, not model name
2. **Parallel ensemble** — call Groq + OpenAI + NVIDIA simultaneously, score each response, return the best one

**Setup:**

```bash
npm install adaptive-memory-multi-model-router
npx a3m-router serve
```

```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:8787/v1", api_key="not-needed")
response = client.chat.completions.create(
    model="auto",  # ← heuristic routing triggers here
    messages=[{"role": "user", "content": "Explain quantum computing"}]
)
```

**Other features:** semantic cache, circuit breaker, per-team budget enforcement, retry with backoff, provider health scoring.

**Repo:** https://github.com/Das-rebel/a3m-router
**npm:** https://www.npmjs.com/package/adaptive-memory-multi-model-router

Looking for feedback on whether the routing approach is useful for real workloads. Also — would love to hear if there are specific benchmarks or comparisons you'd want to see.

---

**Tags:** [llm](https://news.ycombinator.com/from?site=llm) [router](https://news.ycombinator.com/from?site=router) [openai](https://news.ycombinator.com/from?site=openai)
