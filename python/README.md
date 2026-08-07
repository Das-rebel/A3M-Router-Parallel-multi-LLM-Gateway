# A3M Router Python SDK

Intelligent LLM routing for Python — routes to cheapest capable model across 47+ providers.

## Installation

```bash
pip install a3m-router
```

## Usage

```python
from a3m import A3MRouter

router = A3MRouter()  # localhost:8787
response = await router.chat("What is 2+2?")
```

## Framework Adapters

| Adapter | Import | Use Case |
|---------|--------|----------|
| **LangChain** | `from a3m import LangChainAdapter` | Chain-based AI workflows |
| **LlamaIndex** | `from a3m import LlamaIndexAdapter` | RAG and document QA |
| **Qdrant** | `from a3m import QdrantAdapter` | Vector search + RAG |
| **Weaviate** | `from a3m import WeaviateAdapter` | Vector search + RAG |

Install adapters:
```bash
pip install a3m-router[langchain]   # LangChain
pip install a3m-router[llamaindex] # LlamaIndex
pip install a3m-router[qdrant]      # Qdrant
pip install a3m-router[weaviate]    # Weaviate
pip install a3m-router[all]         # All adapters
```

## API Reference

| Method | Description |
|--------|-------------|
| `chat(message)` | Send chat message with auto-routing |
| `route(query)` | Get routing decision (no execution) |
| `stream_chat(message)` | Stream response tokens |
| `models()` | List available models |
| `health()` | Provider health status |

## Links

- [GitHub](https://github.com/Das-rebel/a3m-router)
- [npm Package](https://www.npmjs.com/package/adaptive-memory-multi-model-router)

## License

MIT
