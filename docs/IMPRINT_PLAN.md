# Imprint — Self-Learning Task Handler for A3M Router
### *Every request leaves an imprint. Eventually, the imprints become instinct.*

**Package:** `imprint-router` (npm ✅ PyPI ✅) · **Product name:** Imprint · **Repo (planned):** `Das-rebel/imprint`
**Status:** Plan v2 — rebuilt by agent council (Claude-MiniMax + Gemini-2.5 + research agents ×10)

---

## Executive Summary (council-rebuilt)

Imprint is a complementary service that watches A3M Router traffic, detects repeatable task
patterns ("signatures"), and progressively optimizes them — **v1 by evolving context/skill-prompts,
v2 by distilling weights into self-managed local adapters.** Its key differentiator is an adaptive
learning policy driven by router economics data (cost-per-signature, cache affinity) that no
competitor has. Promotion ladder (`shadow → canary → preferred → pinned`) with drift-triggered
auto-demote ensures quality never silently regresses. The result: your AI bill decays over time.

---

## The Strategic Pivot (from council review)

**v1 evolves CONTEXT, not weights.**

| | Weight-distillation (old plan) | Context-evolution (new v1) |
|---|---|---|
| Mechanism | QLoRA per signature | Optimized skill-prompts + few-shot packs per signature |
| Ship time | ~10 weeks to first value | **~3 weeks** |
| Risk | Silent quality regression, GPU needed | Prompt-only failure modes, CPU-only |
| Evidence | ACE framework: context often beats weights for narrow adaptation | SkillOpt (16K⭐) validates demand |
| v2 role | — | Weights kick in when prompts plateau (Phase 3+) |

This directly addresses the council's #1 strategic flaw: weight-distillation-first was premature.
Microsoft SkillOpt proves trace→skill works; nobody pairs it with router economics. That's our wedge.

---

## Architecture

```
A3M Router ──telemetry──▶ Collector ──▶ Signature Miner ──▶ Skill Evolver (v1)
   ▲                                          │                    │
   │                                          ▼                    ▼
   └────────── OpenAI-compatible ◀──── Promotion Ladder ◀──── Eval Gate
                endpoint: imprint-local      (shadow→canary→preferred→pinned)
                                                     │
                                     Phase 3+: Distiller (QLoRA via LoRAX)
```

- **Serving backend (v2): LoRAX** (Apache-2, 3.8K⭐) — purpose-built multi-adapter serving on one 24GB GPU.
- **Escalation-on-uncertainty:** low-confidence responses return `X-Imprint-Escalate: true`; A3M routes live.
- **Loose coupling:** Imprint subscribes to A3M logs; appears back as provider `imprint-local` (cost≈0).

## The Killer Differentiator (open gap confirmed by research)

**Economics-driven learning policy:** signatures are prioritized for optimization by
`monthly_savings = volume × (routed_cost − optimized_cost_estimate)` weighted by cache affinity.
No competitor (SkillOpt, DSPy, OpenPipe, LoRAX) sees cost data — they optimize blindly.
Imprint optimizes what's *worth* optimizing, and shows users a live "bill decay curve."

## Guardrails

- **Training refusal threshold:** <100 occurrences/week/signature → refuse to learn (maintenance > savings).
- **Behavioral cloning objectives only** (accepted outputs); never train on unverified responses.
- **Replay buffers + model merging** (v2) to prevent catastrophic forgetting across retrain cycles.
- **Drift monitor:** embedding-distance + outcome-quality checks; auto-demote on drift.

## Phased Roadmap

| Phase | Duration | Deliverable | Exit criteria |
|-------|----------|-------------|---------------|
| **0: Validate** | 1 week | 24–48h traffic capture → top signature → manually optimize its prompt → measure Δcost | ≥30% cost cut on one real signature |
| **1: Skill Evolver (v1)** | 3 wks | Automated prompt-skill evolution per signature + eval gate | 5 signatures auto-optimized, zero regressions |
| **2: Promotion ladder** | 4 wks | shadow→canary→preferred state machine + drift demote | 3+ signatures live-preferred, 30 days no-touch |
| **3: Distiller (v2)** | 6 wks | QLoRA via LoRAX for signatures where prompts plateaued | distilled adapter beats best prompt-skill |
| **4: Productize** | — | `pip install imprint-router`, bill-decay dashboard, benchmark post | Public launch |

## Naming Decision (council split, resolved)

| Option | Verdict |
|--------|---------|
| ~~imprint~~ / ~~imprint-ai~~ | ❌ TAKEN on npm |
| **imprint-router** ✅ | Available npm+PyPI; consistent with `a3m-router`; keeps your chosen brand |
| knack-ai | Available; council minority pick; weaker tie to A3M story |

**Decision: Product = "Imprint" · Package = `imprint-router`**

## Next Step When Building
Create `Das-rebel/imprint` repo with this PLAN.md + Phase 0 skeleton (collector notebook over real A3M logs).
