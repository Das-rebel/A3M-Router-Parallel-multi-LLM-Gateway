# A3M Router Python SDK

**Intelligent LLM routing for Python — routes to cheapest capable model across 47+ providers.**

Python client + framework adapters for [A3M Router](https://github.com/Das-rebel/a3m-router).

```bash
pip install a3m-router
```

---

## TL;DR

```python
from a3m import A3MRouter

router = A3MRouter()  # localhost:8787

# Auto-routes simple queries to cheap providers (Groq, DeepSeek, etc.)
# Complex queries to premium providers (GPT-4o, Claude, etc.)
response = await router.chat("What is 2+2?")
# → Routed to Groq, costs ~$0.000001
```

---

## Quick Start

```bash
pip install a3m-router
```

```python
import asyncio
from a3m import A3MRouter

async def main():
    async with A3MRouter() as router:
        # Simple chat
        response = await router.chat("What is 2+2?")
        print(response["choices"][0]["message"]["content"])
        
        # Get routing decision
        decision = await router.route("Write a Python decorator")
        print(f"Routed to: {decision.model} ({decision.tier} tier, ${decision.cost:.6f})")
        
        # Stream
        async for token in router.stream_chat("Tell me a story"):
            print(token, end="", flush=True)
        
        # Health check
        health = await router.health()
        print(f"Providers: {len(health.get('providers', {}))}")
        
        # Cost analytics
        report = await router.cost_report()
        print(f"Savings: {report.savings_percentage:.1f}%")

asyncio.run(main())
```

---

## Framework Adapters

| Adapter | Import | Use Case |
|---------|--------|----------|
| **LangChain** | `from a3m import LangChainAdapter` | Chain-based AI workflows |
| **LlamaIndex** | `from a3m import LlamaIndexAdapter` | RAG and document QA |
| **Qdrant** | `from a3m import QdrantAdapter` | Vector search + RAG |
| **Weaviate** | `from a3m import WeaviateAdapter` | Vector search + RAG |

Install adapters:
```bash
pip install a3m-router[langchain]     # LangChain
pip install a3m-router[llamaindex]   # LlamaIndex
pip install a3m-router[qdrant]        # Qdrant
pip install a3m-router[weaviate]      # Weaviate
pip install a3m-router[all]           # All adapters
```

---

## LangChain

```python
from a3m import A3MRouter, LangChainAdapter
from langchain.schema import HumanMessage

# Use as LangChain LLM
llm = LangChainAdapter(base_url="http://localhost:8787")
response = llm([HumanMessage(content="What is RAG?")])
```

---

## LlamaIndex

```python
from a3m import LlamaIndexAdapter

llm = LlamaIndexAdapter()
response = llm.complete("Explain transformers")
```

---

## Qdrant RAG

```python
from a3m import Q3MRouter, QdrantAdapter

client = QdrantAdapter(
    a3m_base_url="http://localhost:8787",
    collection_name="docs",
    host="localhost",
    port=6333,
)

results = client.rag_search(
    query="What is machine learning?",
    collection_name="docs",
    limit=5,
)
print(results["answer"])
```

---

## Weaviate RAG

```python
from a3m import WeaviateAdapter

client = WeaviateAdapter(
    a3m_base_url="http://localhost:8787",
    weaviate_url="http://localhost:8080",
)

results = client.rag_search(
    query="What is AI?",
    class_name="Article",
    properties=["title", "content"],
)
print(results["answer"])
```

---

## API Reference

### A3MRouter (async)

```python
router = A3MRouter(
    base_url="http://localhost:8787",
    timeout=30.0,
)
```

| Method | Description |
|--------|-------------|
| `chat(message)` | Send chat message with auto-routing |
| `route(query)` | Get routing decision (no execution) |
| `route_batch(queries)` | Route multiple queries |
| `stream_chat(message)` | Stream response tokens |
| `models()` | List available models |
| `health()` | Provider health status |
| `cost_report()` | Cost analytics |

### RoutingDecision

```python
decision = await router.route("Write Python code")
# decision.model → "groq/llama-3.3-70b"
# decision.tier → "cheap"
# decision.cost → 0.000001
# decision.is_free → False
# decision.is_expert → False
# decision.reasoning → "Simple query, routed to budget tier"
```

---

## Routing Tiers

| Tier | Providers | Cost | When |
|------|-----------|------|-------|
| **free** | Ollama, vLLM | $0 | Local models |
| **cheap** | Groq, DeepSeek, Mistral | ~$0.001/1K | Simple Q&A, short code |
| **mid** | GPT-4o-mini, Claude-haiku | ~$0.01/1K | Standard tasks |
| **premium** | GPT-4o, Claude-sonnet | ~$0.15/1K | Complex reasoning |

---

## Server Setup

```bash
# via npx
npx a3m-router serve

# via Docker
docker-compose up -d
```

---

## Links

- [A3M Router GitHub](https://github.com/Das-rebel/a3m-router)
- [npm Package](https://www.npmjs.com/package/adaptive-memory-multi-model-router)
- [Documentation](https://das-rebel.github.io/a3m-router)

---

## License

MIT
