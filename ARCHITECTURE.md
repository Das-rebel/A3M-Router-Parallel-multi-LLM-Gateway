# Architecture

## A3M Router — Adaptive Memory Multi-Model Router

A multi-provider LLM routing and orchestration engine. Routes prompts across 47+ providers, executes them in parallel with ensemble voting, and adapts model selection based on learned quality profiles, cost constraints, and task complexity.

## High-Level Overview

The system has three layers:

```
User / API / CLI / TUI
        |
  [Proxy Server / LangChain Adapter]
        |
   [Routing Engine]  ←── [Memory System]  ←── [Semantic Cache]
        |
   [Provider Layer]  ←── [Retry Handler]  ←── [Guardrails]
        |
   [47+ LLM APIs]
```

- **TypeScript Core** — routing, provider config, cost tracking, observability, cache, guardrails, proxy server, TUI
- **Python Layer** — Universal Model Router (learned routing), HALO orchestration (hierarchical planning), MCTS workflow search
- **Integrations** — LangChain adapter, MCP server, OpenAI-compatible proxy, CLI/TUI

## Directory Structure

```
src/
  index.ts                 # Main entry point — exports all public APIs, createA3MRouter()
  sdk.ts                   # A3MRouter SDK class — route(), routeBatch(), recommend(), serve(), analyze()
  routing/
    providerRetry.ts       # Per-provider retry with exponential backoff + jitter, context window validation
    providerHealth.ts      # Provider health monitoring
    universal_router.py    # UniversalModelRouter — learned routing with online adaptation (Python)
  providers/
    providerConfig.ts      # 47+ provider definitions, config loading, health checks, runtime registration
    registry.py            # Python provider registry with health monitoring
    base.py                # Python base provider classes
    anthropic.py           # Anthropic provider implementation (Python)
    cerebras.py            # Cerebras provider implementation (Python)
  memory/
    memoryTree.ts          # MemoryTree — hierarchical chunk storage with search
    autoFetch.ts           # Automatic memory fetching
    obsidianVault.ts       # Obsidian vault integration
    agentic_memory.py      # Agentic memory (Python)
    semantic_memory.py     # Semantic memory (Python)
    simple_memory.py       # Simple memory (Python)
    working_memory.py      # Working memory (Python)
  cost/
    costTracker.ts         # Per-request cost tracking
    budgetEnforcer.ts      # Budget limits, spend records, alerts
  analytics/
    costAnalytics.ts       # Advanced cost analytics, savings reports, projections
  cache/
    semanticCache.ts       # Embedding-based semantic cache with cosine similarity
    research/              # Cache research files
  security/
    guardrails.ts          # Prompt injection, PII detection, content filtering, output validation
  observability/
    index.ts               # Observable exports
    types.ts               # Span, Metric, RouteTrace types
    tracer.ts              # Distributed tracing
    metrics.ts             # Metrics collector
    middleware.ts          # Express-style observability middleware
  server/
    proxyServer.ts         # OpenAI-compatible HTTP proxy — POST /v1/chat/completions, GET /v1/models
    modelMapper.ts         # Model name resolution
    dashboard.ts           # Server dashboard
  integrations/
    langchainAdapter.ts    # Drop-in ChatOpenAI replacement for LangChain
    oauth.ts               # OAuth integration
  cli/
    setupWizard.ts         # Interactive setup wizard
  tui/
    index.ts               # TUI launch wrapper
    dashboard.ts           # Blessed-based terminal dashboard
  orchestration/           # (Python) HALO hierarchical orchestration
    halo_orchestrator.py   # HALO orchestrator — 3-tier planning
    task_planner.py        # Task decomposition into subtasks
    role_assigner.py       # Agent role assignment
    execution_engine.py    # Parallel execution with verification
    mcts_workflow.py       # MCTS-based workflow search
  workflows/               # (Python) Workflow executors
    router.py              # Workflow router
    orchestrator.py        # Workflow orchestrator
    chaining_executor.py   # Sequential chain execution
    parallelization_executor.py  # Parallel task execution
    difficulty_integration.py    # Difficulty-aware routing
  agents/
    skill_enhanced_agent.py  # Skill-enhanced agent (Python)
  state/
    simple_checkpoint.py     # State checkpointing (Python)
  types/
    langchain.d.ts        # LangChain type declarations
  utils/                   # (referenced from index.ts exports)
    tokenUtils.ts          # Token counting and estimation

python/
  a3m/                    # Python SDK for A3M Router
  tmlpd.py                # TMLPD Python client
  examples.py             # Usage examples
  integrations.py         # Python integration helpers

mcp-server/               # MCP (Model Context Protocol) server for AI agent integration
integrations/             # Additional integration entry points
eval/                     # Evaluation framework and benchmarks
test/ tests/              # Test suites (TypeScript + Python)
docs/                     # GitHub Pages documentation site
demo/                     # Demo scripts and recordings
```

## Key Components

### 1. Ensemble Voting (P0)

The unique differentiator. Routes the same query to multiple providers in parallel, then merges responses using confidence-weighted voting. No other LLM router does this — everyone does sequential fallback (try A, then B, then C).

The ensemble flow:
1. Query enters the routing engine
2. Classifier extracts features (complexity, domain, length, code/math presence)
3. Top-N candidate models selected by tier, cost, and quality profile
4. Query dispatched to all N providers in parallel
5. Responses collected and merged with confidence weighting
6. Best merged result returned with fallback alternatives

### 2. Query Classification

The routing engine (`sdk.ts` → `extractQueryFeatures`) classifies queries on 10+ signals:

| Signal | Description |
|--------|-------------|
| complexity | 0.0–1.0, based on keyword density and reasoning indicators |
| has_code | Code block or programming keyword presence |
| has_math | Mathematical expression detection |
| is_multilingual | Non-English character ratio |
| is_translation | Translation verb detection |
| is_creative | Creative writing indicators |
| requires_reasoning | Step-by-step reasoning triggers |
| domain | Detected domain (legal, medical, security, finance, devops, data) |

Classification routes to the `free` / `cheap` / `mid` / `premium` cost tier, targeting 67% exact tier match (MMR-Bench) with 96% within 1 tier.

### 3. Memory System

The `MemoryTree` (`memory/memoryTree.ts`) canonicalizes data into ≤3k-token chunks, scores each by relevance, and builds hierarchical summary trees. Supports:
- **Search**: keyword matching with score ranking
- **Context retrieval**: top-scored chunks for routing enrichment
- **Obsidian export**: markdown serialization
- **Stats**: tree depth, chunk count, memory utilization

Python memory variants (`agentic_memory.py`, `semantic_memory.py`, `working_memory.py`) provide agent-specific memory stores for the orchestration layer.

### 4. Provider Routing

The provider system (`providers/providerConfig.ts`) defines 47+ providers across five tiers:

| Tier | Providers | Purpose |
|------|-----------|---------|
| free | Ollama, LM Studio, vLLM, Google (free tier), NVIDIA NIM | Local / zero-cost |
| cheap | Groq, Cerebras, DeepInfra, Together, Fireworks, Novita, SambaNova, Anyscale, Replicate | Inference-optimized |
| mid | DeepSeek, Mistral, Perplexity, Cohere, AI21, Qwen (DashScope), StepFun | Good quality/price |
| premium | OpenAI, Anthropic, xAI (Grok) | Frontier models |
| enterprise | Azure OpenAI, AWS Bedrock, Google Vertex | Cloud-managed |

Each provider has:
- `baseUrl`, `apiKeyEnv` (env var name), `models` list
- `costPerK` (input/output), `tier`, `format` (openai/anthropic/google/cohere/aws-bedrock/google-vertex)
- `type` (api/cli/local), `priority` (selection order), `maxTokens`

Configuration sources (in priority order):
1. Environment variables (`*_API_KEY`)
2. `~/.config/a3m-router/providers.json`
3. Runtime registration via `registerProvider()`

### 5. Security (Guardrails Engine)

The `GuardrailEngine` (`security/guardrails.ts`) provides configurable input/output checks:
- **Prompt injection**: score-based detection (0–100)
- **PII detection and redaction**: emails, phones, SSNs, credit cards, IPs
- **Content filtering**: configurable blocklist, regex patterns
- **Language detection**: for intelligent routing decisions
- **Output validation**: quality checks, hallucination detection
- **Custom guardrails**: user-defined check functions

### 6. Observability

Three subsystems:
- **Tracer**: distributed tracing with span creation, completion, and route trace construction
- **MetricsCollector**: runtime metrics — request counts, latencies, error rates, cache hit rates
- **Middlewares**: Express-style `observabilityMiddleware`, `observabilityPlugin`, `budgetAlertMiddleware`

### 7. Semantic Cache

Embedding-based cache (`cache/semanticCache.ts`) stores query-response pairs. On lookup, computes cosine similarity against stored embeddings. Supports configurable threshold (default 0.92), TTL, LRU eviction (1000 entries), and multiple embedders (nomic via Ollama, OpenAI, or local).

### 8. Cost Tracking

Tiered cost management:
- **CostTracker**: per-request recording with provider, model, tokens, latency
- **CostAnalytics**: savings reports, monthly projections, provider breakdowns, CSV/JSON export
- **BudgetEnforcer**: hard budget caps with pre-request checks and alerts

### 9. Proxy Server

OpenAI-compatible HTTP proxy (`server/proxyServer.ts`) using only Node.js built-in `http` module. Endpoints:
- `POST /v1/chat/completions` — OpenAI-compatible chat
- `POST /v1/completions` — Text completions
- `GET /v1/models` — Available models
- `GET /health` — Provider health status

Any OpenAI SDK can point to this proxy to get A3M routing automatically.

### 10. HALO Orchestration (Python)

Hierarchical Autonomous Logic-Oriented Orchestration based on arXiv:2505.13516. Three tiers:

1. **TaskPlanner**: decomposes complex tasks into subtasks with dependency resolution
2. **RoleAssigner**: assigns specialized agents (roles) to each subtask
3. **ExecutionEngine**: executes subtasks in parallel with verification and adaptive refinement

Optionally uses **MCTS** (Monte Carlo Tree Search) to explore different execution strategies and learn optimal workflows per task type.

### 11. MCP Server

Model Context Protocol server for AI agent integration. Allows AI agents (Claude, etc.) to use the A3M Router as a tool for parallel multi-LLM execution.

### 12. LangChain Integration

`A3MChatModel` (`integrations/langchainAdapter.ts`) is a drop-in replacement for `ChatOpenAI`. Routes all LLM calls through A3M for cost optimization and intelligent provider selection. Supports streaming, tool calling, and batch processing.

## Data Flow

```
1. User sends query (via SDK, proxy, CLI, TUI, or LangChain)
2. GuardrailsEngine checks input (injection, PII, content, length)
3. SemanticCache looks up embedding match (skip if cache hit)
4. RoutingEngine classifies query (complexity, domain, features)
5. Router selects optimal provider(s) using:
   - Learned quality profiles (UniversalModelRouter)
   - Cost constraints (BudgetEnforcer)
   - Retry configuration (ProviderRetryHandler)
6. (Optional) Multiple providers called in parallel for ensemble voting
7. ProviderRetryHandler executes with exponential backoff + jitter
8. GuardrailsEngine validates output
9. Response returned + recorded in:
   - CostTracker (per-request cost)
   - CostAnalytics (aggregate stats)
   - Observability (tracing + metrics)
   - SemanticCache (store for future hits)
   - MemoryTree (context enrichment)
```

## Design Decisions and Trade-offs

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **TypeScript primary** | npm ecosystem reach, serverless compatibility, Vercel/Netlify/Cloudflare Workers | Python users need separate SDK |
| **Node.js built-in http** for proxy | Zero dependencies, 19.5 KB total bundle | Less feature-rich than Express |
| **Embedding-based cache** | Semantic similarity beats exact-match for LLM queries | Requires Ollama or OpenAI embedder |
| **Per-provider retry config** | Chinese providers need longer timeouts + more retries (network latency, rate limits) | More config surface |
| **In-memory storage** | Zero infra, instant setup, 19.5 KB | No persistence across restarts (memory tree serializable to markdown) |
| **Online learning (Python router)** | Adapts to unseen models and changing quality | Requires feedback loop, cold start with heuristics |
| **MCTS for workflow search** | Finds optimal strategies for complex tasks | 3-10x slower than greedy for simple tasks |
| **47+ baked-in providers** | Zero-config multi-provider out of box | Maintenance burden as APIs change |

## Extension Points

### Adding a New Provider

```typescript
import { registerProvider, ProviderDefinition } from 'adaptive-memory-multi-model-router';

registerProvider('my-provider', {
  name: 'My Provider',
  baseUrl: 'https://api.myprovider.com/v1/chat/completions',
  apiKeyEnv: 'MY_PROVIDER_API_KEY',
  models: ['model-name'],
  costPerK: { input: 1.0, output: 2.0 },
  tier: 'mid',       // free | cheap | mid | premium | enterprise
  format: 'openai',  // openai | anthropic | google | cohere | aws-bedrock | google-vertex
  type: 'api',       // api | cli | local
  priority: 15,
  maxTokens: 8192,
});
```

Or via config file at `~/.config/a3m-router/providers.json`:
```json
{
  "providers": {
    "my-provider": {
      "name": "My Provider",
      "baseUrl": "https://api.myprovider.com/v1/chat/completions",
      "apiKeyEnv": "MY_PROVIDER_API_KEY",
      "models": ["model-name"],
      "tier": "mid"
    }
  }
}
```

### Adding a Custom Retry Strategy

```typescript
import { createRetryHandler } from 'adaptive-memory-multi-model-router';

const handler = createRetryHandler({
  'my-slow-provider': {
    timeout: 60000,
    retry: { maxRetries: 5, initialDelayMs: 5000 },
  },
});
```

### Adding Custom Guardrails

```typescript
import { GuardrailEngine } from 'adaptive-memory-multi-model-router';

const guardrails = new GuardrailEngine({
  userGuardrails: [
    (content) => ({
      passed: !content.includes('blocked-term'),
      blocked: content.includes('blocked-term'),
      reason: content.includes('blocked-term') ? 'Blocked term detected' : undefined,
    }),
  ],
});
```

### Adding Ensemble Voting Strategies

The ensemble system is extensible by adding new voting strategies to the parallel execution pipeline. Current strategy: confidence-weighted average across multiple provider responses.

### Custom Routing Strategies

The `UniversalModelRouter` (Python) learns routing profiles from execution data. To implement a custom strategy:
1. Subclass or wrap `routeQuery` in TypeScript
2. Or extend `UniversalModelRouter._calculate_combined_score` in Python
3. Register custom feature extractors via `extractQueryFeatures`

### MCP Server Extensions

The MCP server at `mcp-server/` exposes routing as tools. Add tools by extending the MCP tool definitions.
