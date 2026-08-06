# A3M Router

**Intelligent LLM routing across 47+ providers — saves 70-95% on AI costs.**

A3M Router automatically picks the cheapest capable model for each request. No code changes needed. Just swap your API endpoint.

---

## TL;DR — What Is This?

**Before:**
```python
# Pay GPT-4o prices for EVERY query
client = OpenAI(api_key="sk-...")
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "What is 2+2?"}]
)  # Costs: $0.03
```

**After:**
```python
# A3M Router picks the right model automatically
client = OpenAI(base_url="http://localhost:8787/v1", api_key="not-needed")
response = client.chat.completions.create(
    model="auto",  # ← Just change this
    messages=[{"role": "user", "content": "What is 2+2?"}]
)  # Routes to Groq/Mistral — costs: $0.0001
```

---

## Why A3M Router?

| Problem | Solution |
|---------|----------|
| GPT-4o is $15/1M tokens | A3M routes simple queries to $0.001/1K providers |
| Managing 47+ API keys is messy | One endpoint, A3M handles the rest |
| Provider goes down mid-request | Automatic failover to next best option |
| Need the best answer, cost doesn't matter | Parallel ensemble calls multiple providers |

---

## Framework Adapters

A3M Router has drop-in adapters for **8 major frameworks**:

| Framework | Adapter | Example |
|-----------|---------|---------|
| **LangChain** | `A3MLangChainAdapter` | `pip install adapters/langchain` |
| **LlamaIndex** | `A3MLlamaIndexAdapter` | `pip install adapters/llamaindex` |
| **AutoGen** | `A3MAutoGenAdapter` | Multi-agent conversations |
| **Vercel AI SDK** | `A3MVercelAdapter` | Next.js apps |
| **Haystack** | `A3MHaystackAdapter` | RAG pipelines |
| **Pinecone** | `A3MPineconeAdapter` | Vector search + RAG |
| **LangGraph** | `A3MLangGraphAdapter` | Stateful agents |
| **CrewAI** | `A3MCompletion` | Multi-agent systems |

---

## Quick Start

```bash
# Install
npm install adaptive-memory-multi-model-router

# Start server
npx a3m-router serve
```

---

## Installation

### Python Adapters
```bash
pip install adapters/
```

### Docker
```bash
docker-compose up -d
```

### npm
```bash
npm install adaptive-memory-multi-model-router
```

---

## Framework Examples

### LangChain
```python
from a3m_adapter import A3MLangChainAdapter

llm = A3MLangChainAdapter(model="auto", temperature=0.7)
result = llm.invoke("What is retrieval-augmented generation?")
```

### LlamaIndex
```python
from a3m_adapter import A3MLlamaIndexAdapter

llm = A3MLlamaIndexAdapter(model="auto")
response = llm.complete("Explain transformer architecture")
```

### AutoGen (Microsoft)
```python
from a3m_adapter import A3MAutoGenAdapter

llm = A3MAutoGenAdapter(model="auto", parallel_ensemble=2)

config = llm.create_agent_config()
assistant = ConversableAgent(name="assistant", llm_config=config)
```

### Vercel AI SDK
```python
from a3m_adapter import A3MVercelAdapter, createA3MProvider

result = await generateText({
    model: createA3MProvider({"model": "auto", "parallel_ensemble": 2}),
    prompt: "What is 2+2?",
})
```

### Haystack (RAG)
```python
from a3m_adapter import A3MHaystackAdapter

adapter = A3MHaystackAdapter(model="auto")
result = adapter.predict(query="What is AI?", documents=retrieved_docs)
```

### Pinecone (Vector Search)
```python
from a3m_adapter import A3MPineconeAdapter

adapter = A3MPineconeAdapter(model="auto")
embedding = adapter.embed_query("What is quantum computing?")

results = index.query(vector=embedding, top_k=5)
```

### LangGraph (Stateful Agents)
```python
from a3m_adapter import A3MLangGraphAdapter

adapter = A3MLangGraphAdapter(model="auto", parallel_ensemble=2)
agent = create_react_agent(adapter, tools=[...])

result = agent.invoke({"messages": [{"role": "user", "content": "Hello"}]})
```

### CrewAI (Multi-Agent)
```python
from crewai.llms import A3MCompletion

researcher = Agent(
    role="Researcher",
    goal="Find accurate information",
    llm=A3MCompletion(model="auto"),
)

crew = Crew(agents=[researcher], tasks=[task])
result = crew.kickoff()
```

---

## Parallel Ensemble — Best Answer, Any Provider

Need the best answer regardless of cost? Call multiple providers in parallel:

```python
from a3m.router import A3MRouter

router = A3MRouter(
    model="auto",
    parallel_ensemble=3,  # ← Call 3 providers simultaneously
)

result = router.route(
    messages=[{"role": "user", "content": "Explain quantum entanglement"}],
    ensemble_config={
        "providers": ["groq", "openai", "deepseek"],
        "timeout_ms": 15000,
        "score_weights": {"relevance": 0.4, "conciseness": 0.3, "accuracy": 0.3}
    }
)

print(f"Best answer from: {result.provider}")
print(f"Response: {result.content}")
print(f"All scores: {result.scores}")
```

---

## Memory & Context

A3M Router includes **semantic memory** capabilities:

```python
router = A3MRouter(
    model="auto",
    memory={
        "type": "semantic",
        "window": 10,
        "similarity_threshold": 0.85,
    }
)

# First call — caches context
result1 = router.route(
    messages=[{"role": "user", "content": "I'm building a Python web app"}]
)

# Second call — uses cached context
result2 = router.route(
    messages=[{"role": "user", "content": "What framework should I use?"}]
)
# A3M knows "Python web app" from context
```

---

## How Routing Works

For every request, A3M analyzes:

| Signal | Detects |
|--------|---------|
| **Domain** | Legal, medical, code, finance, ML keywords |
| **Task type** | Code, translation, analysis, creative |
| **Complexity** | Clause count, multi-step markers |
| **Verb intensity** | "design/architect" → complex, "what/who" → simple |

Then maps to a tier:

| Tier | Providers | Use When |
|------|-----------|----------|
| **Free** | Ollama, Llama.cpp | Experimentation |
| **Cheap** | Groq, DeepSeek, Mistral | Simple Q&A, short code |
| **Mid** | GPT-4o-mini, Claude-haiku | Standard tasks |
| **Premium** | GPT-4o, Claude-sonnet, Gemini | Complex reasoning |

---

## Cost Comparison

| Query Type | GPT-4o Cost | A3M Router Cost | Savings |
|------------|-------------|-----------------|---------|
| "What is 2+2?" | $0.03 | $0.0001 (Groq) | **99.7%** |
| "Write a Python function" | $0.05 | $0.002 (DeepSeek) | **96%** |
| "Design a database schema" | $0.15 | $0.008 (Mixed) | **95%** |
| "Complex multi-step reasoning" | $0.15 | $0.15 (GPT-4o) | **0%** (correctly routed) |

---

## Provider Coverage

| Provider | Tiers | Example Models |
|----------|-------|---------------|
| OpenAI | Premium, Mid | GPT-4o, GPT-4o-mini |
| Anthropic | Premium, Mid | Claude-3.5-sonnet, Claude-3-haiku |
| Google | Premium, Mid | Gemini-1.5-pro, Gemini-1.5-flash |
| Groq | Cheap | Llama-3.3-70b (fastest) |
| DeepSeek | Cheap, Mid | DeepSeek-chat, DeepSeek-coder |
| Mistral | Cheap, Mid | Mistral-large, Mistral-small |
| NVIDIA | Premium | Nemotron |
| Ollama | All | Local models |
| vLLM | All | Self-hosted |

**47+ providers total.**

---

## CLI Commands

```bash
npx a3m-router serve              # Start server (port 8787)
npx a3m-router route "query"    # See routing decision
npx a3m-router health           # Provider status
npx a3m-router benchmark        # Local accuracy test
```

---

## Architecture

```
Request → Guardrails → Semantic Cache → Router → Provider → Response
                          ↓
                    Memory Layer
                    (optional)
```

---

## Demo

```bash
# Start server
npx a3m-router serve

# Run demo
python demo.py
```

---

## Independent Benchmark

**RouterArena Evaluation:**
- **Accuracy:** 96.77%
- **Cost:** $0.0768/1K tokens
- **Robustness:** 1.0000
- **Queries tested:** 8,400

---

## Project Stats

- **npm downloads:** ~5,400/month
- **Providers:** 47+
- **Framework adapters:** 8
- **License:** MIT

---

## Need Help?

- 📖 [Documentation](docs/)
- 🐛 [Issues](https://github.com/Das-rebel/a3m-router/issues)
- 💬 [Discussions](https://github.com/Das-rebel/a3m-router/discussions)
