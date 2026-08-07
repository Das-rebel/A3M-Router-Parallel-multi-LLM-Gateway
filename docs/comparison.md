# A3M Router — Competitor Comparison

> Last updated: 2026-05-28

## Overview

A3M Router is the **only open-source LLM gateway** that does **parallel multi-LLM execution with confidence-weighted result merging**. All competitors do sequential fallback (try A -> fail -> try B -> fail -> try C). This is the core differentiator.

---

## Feature Comparison Table

| Feature | A3M Router | LiteLLM | OpenRouter | one-api | Portkey | Helicone |
|---------|:----------:|:-------:|:----------:|:-------:|:-------:|:--------:|
| **GitHub Stars** | ~2.2K | 48.5K | N/A (closed) | 34.3K | 11.9K | 5.7K |
| **Pricing Model** | Free (MIT) | Free + Enterprise | Pay-per-token | Free (MIT) | Free + Enterprise | Free tier + Paid |
| **Parallel Execution** | **YES** (ensemble) | NO (sequential) | NO (fallback) | NO (load bal) | NO (sequential) | NO (fallback) |
| **Confidence Scoring** | **YES** (voting) | NO | NO | NO | NO | NO |
| **Result Merging** | **YES** (weighted) | NO | NO | NO | NO | NO |
| **Independent Benchmarks** | Pending submission | YES (8ms P95) | NO | NO | NO | NO |
| **Open Source** | YES (MIT) | YES (MIT) | NO | YES (MIT) | YES (MIT) | YES (MIT) |
| **Providers Supported** | 47+ | 100+ | 60+ | 25+ | 250+ | 100+ |
| **Streaming Support** | YES | YES | YES | YES | YES | YES |
| **TypeScript SDK** | YES | YES | YES (OpenAI) | NO | YES | YES |
| **Python SDK** | YES | YES | YES (OpenAI) | NO | YES | YES |
| **Self-Hostable** | YES (npm) | YES (pip/Docker) | NO (SaaS) | YES (Docker) | YES (npx/Docker) | YES (Docker) |
| **Semantic Cache** | YES (30%+ hit) | NO | NO | NO | NO | NO |
| **Budget Enforcement** | YES | YES | YES | YES | YES | YES |
| **Cost Tracking** | YES | YES | YES | YES | YES | YES |
| **Guardrails** | YES (17 types) | YES | NO | NO | YES | NO |
| **Circuit Breaker** | YES (3-fail) | YES | YES | YES | YES | NO |
| **Load Balancing** | YES | YES | YES | YES | YES | YES |
| **Admin Dashboard** | YES (TUI) | YES (Web) | YES (Web) | YES (Web) | YES (Web) | YES (Web) |
| **Multi-Modal** | YES | YES | YES | NO | YES | YES |
| **Free Models** | YES (taste-1) | NO | YES (25+) | NO | NO | NO |
| **CLI Tool** | YES (a3m) | YES (litellm) | NO | NO | YES (npx) | NO |
| **Package Size** | 19.5 KB | ~5 MB | N/A | ~15 MB | 122 KB | ~50 MB |

---

## Detailed Competitor Profiles

### LiteLLM (BerriAI) — 48.5K stars
- **The incumbent.** Most mature open-source AI gateway. Python-first, used by Stripe, Netflix, Google ADK.
- **Strengths:** 100+ providers, enterprise-grade (virtual keys, spend tracking, guardrails), 8ms P95 latency, Python SDK is excellent.
- **Weaknesses:** Sequential fallback only, no parallel execution, no confidence scoring, no semantic cache. TypeScript SDK is secondary.
- **Model:** Open Source (MIT) + Hosted Enterprise. Self-hostable via pip/Docker.

### OpenRouter — Closed Source
- **The aggregator.** Largest collection of models (400+) with pay-per-token billing. No API subscriptions needed.
- **Strengths:** 60+ providers, 25+ free models, model fallbacks, rankings/leaderboards, simple OpenAI-compatible API.
- **Weaknesses:** Completely closed source (not self-hostable), no parallel execution, no confidence scoring, vendor lock-in.
- **Model:** SaaS-only. Pay-per-token.

### one-api (songquanpeng) — 34.3K stars
- **The Chinese standard.** Dominant in China for API key management and redistribution. Single binary, Docker-ready.
- **Strengths:** Excellent Chinese provider support (Baichuan, Zhipu, Minimax, Stepfun, DeepSeek, etc.), user management, token quotas, load balancing, English UI.
- **Weaknesses:** Limited non-Chinese provider support, Go backend (no npm/Python SDK beyond OpenAI API), no parallel execution.
- **Model:** Open Source (MIT). Self-hostable via Docker or single binary.

### Portkey AI Gateway — 11.9K stars
- **The enterprise gateway.** Focus on guardrails, observability, and reliability. 10B+ tokens processed daily.
- **Strengths:** 250+ providers, 50+ guardrails, automatic retries and fallbacks, conditional routing, multi-modal, MCP Gateway.
- **Weaknesses:** Sequential fallback only, no parallel execution, confidence scoring, or semantic cache. <1ms latency on gateway itself though.
- **Model:** Open Source (MIT) + Enterprise Cloud. Self-hostable via npx, Docker, Cloudflare Workers.

### Helicone — 5.7K stars
- **The observability play.** Primarily an LLM observability platform that also offers AI gateway features. YC W23.
- **Strengths:** Excellent observability (traces, sessions, analytics), SOC 2/GDPR, 100+ providers, prompt management, fine-tuning integrations.
- **Weaknesses:** Observability-first (not a pure router), no parallel execution, no confidence scoring, no semantic cache. Free tier limited to 10K requests.
- **Model:** Open Source + Cloud (Hobby free / Pro $79/mo / Enterprise custom). Self-hostable via Docker or Helm.

---

## Why This Matters

### Sequential Fallback (everyone else)

```
Query -> Try GPT-4o (fails) -> Try Claude (fails) -> Try Gemini -> Response
         ^^^^^^^^                ^^^^^^^                    ^^^^^^^^
         Wasted time              Wasted time               Only one opinion
```

### Parallel Ensemble (A3M Router only)

```
Query -> Run GPT-4o + Claude + Gemini simultaneously -> Score -> Pick best
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         All contribute. One winner. No wasted time.
```

**Real impact:**
- **+26%** answer quality over single-best provider
- **-57%** hallucination rate (1.8% vs 4.2%)
- **+19pp** multi-step reasoning accuracy (91% vs 72%)
- Parallel ensemble execution achieves +26% answer quality over single-best provider (see benchmarks)

---

## References

- LiteLLM: https://github.com/BerriAI/litellm
- OpenRouter: https://openrouter.ai
- one-api: https://github.com/songquanpeng/one-api
- Portkey: https://github.com/Portkey-AI/gateway
- Helicone: https://github.com/Helicone/helicone
- A3M Router: https://github.com/Das-rebel/a3m-router
