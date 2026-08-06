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

**Result:** Simple questions cost 300x less. Complex queries still go to premium models when needed.

---

## Why A3M Router?

| Problem | Solution |
|---------|----------|
| GPT-4o is $15/1M tokens | A3M routes simple queries to $0.001/1K providers |
| Managing 47+ API keys is messy | One endpoint, A3M handles the rest |
| Provider goes down mid-request | Automatic failover to next best option |
| Need the best answer, cost doesn't matter | Parallel ensemble calls multiple providers |

---

## Quick Start

```bash
# Install
npm install adaptive-memory-multi-model-router

# Start server
npx a3m-router serve
```

Then use it like any OpenAI-compatible API:

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8787/v1", api_key="not-needed")

# Simple query → routes to cheapest capable (Groq, Mistral, etc.)
response = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "What is Python?"}]
)
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
    ensemble_timeout_ms=10000,
)

# result.content     — winning response
# result.provider    — which provider won
# result.scores     — quality scores per provider
# result.all_results — all responses for comparison
```

**Real-world example:**
```python
# Call Groq (fast/cheap) + OpenAI (quality) + DeepSeek (cost-effective) in parallel
ensemble_result = router.route(
    messages=[{"role": "user", "content": prompt}],
    ensemble_config={
        "providers": ["groq", "openai", "deepseek"],
        "timeout_ms": 15000,
        "score_weights": {"relevance": 0.4, "conciseness": 0.3, "accuracy": 0.3}
    }
)

print(f"Best answer from: {ensemble_result.provider}")
print(f"Response: {ensemble_result.content}")
print(f"All scores: {ensemble_result.scores}")
```

---

## Multi-Agent Systems — CrewAI Example

Powerful for multi-agent systems where different agents need different model capabilities:

```python
from crewai import Agent, Task, Crew
from crewai.llms import A3MCompletion

# Research agent — needs factual accuracy
researcher = Agent(
    role="Research Analyst",
    goal="Find accurate information",
    backstory="Expert researcher",
    llm=A3MCompletion(model="auto", temperature=0.3),
)

# Writer agent — needs creativity
writer = Agent(
    role="Content Writer", 
    goal="Create engaging content",
    backstory="Creative writer",
    llm=A3MCompletion(model="auto", temperature=0.9),
)

# Critic agent — needs balance
critic = Agent(
    role="Quality Critic",
    goal="Ensure quality", 
    backstory="Detail editor",
    llm=A3MCompletion(model="auto", temperature=0.5),
)

# Tasks with expected outputs
research_task = Task(
    description="Research AI trends",
    expected_output="Detailed report with citations",
    agent=researcher,
)

crew = Crew(
    agents=[researcher, writer, critic],
    tasks=[research_task],
    process="hierarchical",
    manager_llm=A3MCompletion(model="auto"),
)

result = crew.kickoff()
```

---

## LangChain + LlamaIndex Adapters

Use A3M Router as a drop-in replacement:

```python
# LangChain
from a3m_adapter import A3MLangChainAdapter

llm = A3MLangChainAdapter(
    model="auto",
    temperature=0.7,
    parallel_ensemble=2
)

# Works with any LangChain chain
from langchain import chain
result = llm.invoke("What is retrieval-augmented generation?")

# LlamaIndex
from a3m_adapter import A3MLlamaIndexAdapter

llm = A3MLlamaIndexAdapter(model="auto")
response = llm.complete("Explain transformer architecture")
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

## Memory & Context

A3M Router includes **semantic memory** capabilities:

```python
# Enable conversation memory
router = A3MRouter(
    model="auto",
    memory={
        "type": "semantic",      # Embeddings-based
        "window": 10,              # Last 10 exchanges
        "similarity_threshold": 0.85,
    }
)

# First call — caches the context
result1 = router.route(
    messages=[{"role": "user", "content": "I'm building a Python web app"}]
)

# Second call — uses cached context automatically
result2 = router.route(
    messages=[{"role": "user", "content": "What framework should I use?"}]
)
# A3M knows "Python web app" from previous context
```

**Memory features:**
- **Semantic cache** — Instant responses for similar queries
- **Conversation context** — Maintains history across requests  
- **Cross-session memory** — Remembers important facts
- **Adaptive forgetting** — Auto-evicts stale information

---

## Provider Coverage

| Provider | Tiers | Notes |
|----------|-------|-------|
| OpenAI | Premium, Mid | GPT-4o, GPT-4o-mini |
| Anthropic | Premium, Mid | Claude-3.5-sonnet, Claude-3-haiku |
| Google | Premium, Mid | Gemini-1.5-pro, Gemini-1.5-flash |
| Groq | Cheap | Llama-3.3-70b (fastest) |
| DeepSeek | Cheap, Mid | DeepSeek-chat, DeepSeek-coder |
| Mistral | Cheap, Mid | Mistral-large, Mistral-small |
| NVIDIA | Premium | Nemotron |
| Ollama | All | Self-hosted models |
| vLLM | All | Self-hosted OpenAI-compatible |

**47+ providers total.** Availability checked at runtime.

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

- **Guardrails** — Prompt injection detection, PII filtering
- **Semantic Cache** — Instant hits for repeated queries (zero cost)
- **Router** — Scores query, selects tier, picks cheapest healthy provider
- **Ensemble** — Optional parallel calls for best-answer mode

---

## Installation

```bash
# npm
npm install adaptive-memory-multi-model-router

# Python
pip install adaptive-memory-multi-model-router

# Docker
docker run -p 8787:8787 ghcr.io/das-rebel/a3m-router
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
- **License:** MIT
- **Stars:** 10

---

## Need Help?

- 📖 [Documentation](docs/)
- 🐛 [Issues](https://github.com/Das-rebel/a3m-router/issues)
- 💬 [Discussions](https://github.com/Das-rebel/a3m-router/discussions)
