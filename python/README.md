# A3M Router Python SDK

**Intelligent LLM routing — auto-selects the cheapest capable model from 47+ providers.**

Routes queries to the best model for your needs — whether it's Groq for simple Q&A ($0.001/1K) or GPT-4o for complex reasoning ($0.15/1K).

## Installation

```bash
pip install a3m-router
```

## Quick Start

```python
from a3m import A3MRouter

router = A3MRouter(base_url="http://localhost:8787")

# Auto-routes to optimal provider
response = await router.chat("What is 2+2?")
# → Routes to Groq, costs ~$0.000001

# See routing decision before executing
decision = await router.route("Explain quantum computing")
print(f"Model: {decision.model}")
print(f"Tier: {decision.tier}")
print(f"Cost: ${decision.cost:.6f}")

# Stream responses
async for token in router.stream_chat("Tell me a story"):
    print(token, end="", flush=True)
```

## Key Features

- **Auto-routing**: Picks the right model based on query complexity, budget, and requirements
- **Cost savings**: 70-95% cheaper than always using premium models
- **47+ providers**: Groq, DeepSeek, GPT-4o, Claude, Mistral, and more
- **Framework adapters**: Drop-in for LangChain, LlamaIndex, Qdrant, Weaviate
- **Health monitoring**: Check provider status and availability
- **Cost analytics**: Track spending and savings

## Framework Adapters

| Adapter | Use Case | Install |
|---------|----------|---------|
| **LangChain** | Chain-based AI workflows | `pip install a3m-router[langchain]` |
| **LlamaIndex** | RAG and document QA | `pip install a3m-router[llamaindex]` |
| **Qdrant** | Vector search + RAG | `pip install a3m-router[qdrant]` |
| **Weaviate** | Vector search + RAG | `pip install a3m-router[weaviate]` |

All adapters:
```bash
pip install a3m-router[all]
```

## Routing Tiers

| Tier | Providers | Cost | When Used |
|------|-----------|------|-----------|
| **free** | Ollama, vLLM | $0 | Local inference |
| **cheap** | Groq, DeepSeek | ~$0.001/1K | Simple Q&A, short code |
| **mid** | GPT-4o-mini, Claude-haiku | ~$0.01/1K | Standard tasks |
| **premium** | GPT-4o, Claude-sonnet | ~$0.15/1K | Complex reasoning |

## API Reference

### A3MRouter

```python
router = A3MRouter(
    base_url="http://localhost:8787",  # A3M Router server URL
    timeout=30.0,                       # Request timeout
)
```

| Method | Description |
|--------|-------------|
| `chat(message)` | Send chat message with auto-routing |
| `route(query)` | Get routing decision (no execution) |
| `route_batch(queries)` | Route multiple queries |
| `stream_chat(message)` | Stream response tokens |
| `models()` | List all available models |
| `health()` | Provider health status |
| `cost_report()` | Cost analytics |

### LangChain Example

```python
from a3m import LangChainAdapter
from langchain.schema import HumanMessage

llm = LangChainAdapter(base_url="http://localhost:8787")
response = llm([HumanMessage(content="What is RAG?")])
```

### LlamaIndex Example

```python
from a3m import LlamaIndexAdapter

llm = LlamaIndexAdapter()
response = llm.complete("Explain transformers")
```

## Server Setup

Start the A3M Router server:

```bash
# Via npm
npx a3m-router serve

# Via Docker
docker-compose up -d
```

Server runs on `http://localhost:8787` by default.

## Links

- **GitHub**: https://github.com/Das-rebel/a3m-router
- **npm Package**: https://www.npmjs.com/package/adaptive-memory-multi-model-router
- **Documentation**: https://das-rebel.github.io/a3m-router

## License

MIT
