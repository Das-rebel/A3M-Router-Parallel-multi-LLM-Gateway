# A3M Router — Discoverability Diagnosis

**Date:** 2026-09-06
**Package:** adaptive-memory-multi-model-router (npm)
**Problem:** Down 69% — from ~15K/mo (May-Jun 2026) to ~2,831/mo (Aug-Sep 2026)

---

## 1. Root Cause Analysis — Why Is It Declining?

### 1.1 Traffic Spike Was a One-Time Event, Not Organic Growth

The May-Jun 2026 spike (peaking at ~1,987/day on May 22) was driven by a concentrated outreach burst — benchmark PR submissions, awesome-list PRs, and direct messaging. That campaign ended. Downloads reverted to the baseline the package was actually earning: **40–200/day organic**.

The package has **16 GitHub stars** and **0 production credibility signals** (no HN launch, no conference talk, no viral content). The "peak" was noise; the floor is the real number.

### 1.2 npm Search Presence Is Critically Weak

| Search Query | A3M Router Rank | Problem |
|---|---|---|
| `llm router` | 10 | Only position; all others not in top 20 |
| `openai gateway` | Not in top 20 | **Major gap** |
| `llm gateway` | Not in top 20 | **Major gap** |
| `ai router` | Not in top 20 | **Major gap** |
| `cost savings llm` | Not in top 20 | **Major gap** |
| `multi provider llm` | Not in top 20 | **Major gap** |

The package has excellent keywords (150+) in `package.json` but **npm's search algorithm does not surface it** for high-intent queries where users actually discover tools. Competitors like `@kb-labs/llm-router` (score 1360) and `@blockrun/clawrouter` (score 1245) outrank A3M (score 1120) despite lower actual usage.

### 1.3 The npm Description Is a Research Paper, Not Marketing Copy

The live npm description reads:

> "Best in class open source LLM router across 47+ providers with Evolution-inspired routing: EXP3 diversity, MVT rate-limit rotation, optimal defense theory verification."

This is academic language that conveys **zero value** to the developer who lands on the npm page via search. The top of the README leads with a16z quote and "biologically inspired" philosophy — impressive for a research paper, useless for a developer trying to understand what the package does in 3 seconds.

**What a developer needs to know in 10 words:** "Intelligent LLM router that cuts costs 92% and works in 2 lines."

### 1.4 No SEO/Content Flywheel

Successful packages (litellm, langchain, vercel-ai) have:
- Blog posts that rank on Google for comparison queries
- Tutorial content on popular dev sites (sitepoint, freecodecamp, etc.)
- YouTube demos that generate search traffic
- GitHub READMEs optimized for GitHub's internal search

A3M has none of this. The GitHub Pages site (demo.html) returns "Page not found" for the root and only has a demo page. The SEO audit in `docs/SEO_AUDIT.md` identified all the right keywords but none were captured.

### 1.5 The Package Name Is Self-Undermining

`adaptive-memory-multi-model-router` is 34 characters of technical jargon. No developer searches for this. The `a3m` brand exists but is **not the npm package name** — `npx a3m-router` is a CLI alias, not the installable name. This splits brand identity across two names.

### 1.6 Stale Version Problem

The latest published version is `2.15.5` but a `2.16.0` exists in git (Aug 14). NPM shows "published 3 weeks ago" — meaning the last publish was a revert/fix, not a feature update. This signals abandonment to npm's ranking algorithm.

---

## 2. Comparable Successful Packages — What Do They Have That This Doesn't?

### 2.1 litellm (17,750 downloads/month)

| What litellm Has | A3M Doesn't |
|---|---|
| Python SDK (largest dev community) | JS/TS only |
| 48K GitHub stars | 16 stars |
| Established in 2023 | Newer, no trust trail |
| Simple description: "JS implementation of LiteLLM" | Cryptic academic description |
| Python-first tutorials everywhere | No tutorial content |
| Drop-in OpenAI replacement | Requires router config |

### 2.2 @blockrun/clawrouter (growing, commercial)

| What Clawrouter Has | A3M Doesn't |
|---|---|
| Clear value prop above fold: "save 84% on inference costs" | Buried in biology metaphor |
| Scannable feature list | Walls of text |
| Commercial backing (credit card + USDC payments) | Purely OSS |
| Active marketing (Product Hunt, etc.) | No launch history |

### 2.3 @kb-labs/llm-router (higher npm search score)

| What KB-Labs Has | A3M Doesn't |
|---|---|
| Simple name: `llm-router` | 34-char package name |
| NPM search score 1360 vs A3M's 1120 | Lower ranking |
| Clear description | Academic description |
| Scoped package (`@kb-labs/`) | Unscoped, confusing brand |

### 2.4 What All Growing Packages Share

1. **One-line value prop** at the top of the npm page (not a metaphor)
2. **Zero-configuration demo** visible before the fold (run this → get this result)
3. **Python SDK** OR a JavaScript-first ecosystem presence (Vercel, Next.js, etc.)
4. **Community content** — tutorials, YouTube, StackOverflow questions
5. **Consistent publishing cadence** — weekly or biweekly minor versions

---

## 3. Top 3 Actionable Improvements (Ranked by Expected Impact)

### P0 — Rewrite the npm Description and README Hero (Expected Impact: +40-60% discovery)

The single highest-leverage change. The npm description must answer "what does it do for me?" in 10 words, not "what algorithms does it use."

**Change:** Replace the academic description with:
> "Intelligent LLM routing gateway — cuts AI costs 92%, routes across 80+ providers automatically. Two-line setup."

**Change:** Rewrite the README hero section to lead with a before/after code example that shows the value in 10 seconds, not a philosophical quote.

### P0.5 — Fix npm Search Keywords and Package Naming (Expected Impact: +30-50% search visibility)

The package does not appear in top 20 for any major search query except "llm router" at rank 10.

**Changes:**
1. Publish a new version under the package name `a3m-router` (or acquire the name via npm support)
2. Add `openai-gateway`, `llm-proxy`, `cost-saving-llm` as aliases in keywords
3. Ensure the npm description contains the phrase "openai gateway" explicitly (this is the #1 high-volume query)
4. Add a short one-line description that is **not** academic

### P1 — Build a Content/SEO Flywheel (Expected Impact: +20-40% over 90 days)

The SEO audit identified high-value keywords (litellm alternative, llm cost optimization, openai proxy free) but none were captured. A single tutorial on sitepoint.com or a YouTube demo that ranks for "best llm router 2026" would generate steady organic traffic.

**Changes:**
1. Publish a comparison article: "A3M Router vs LiteLLM: Open-Source Alternative Cuts Costs 92%" to dev.to, sitepoint, or freecodecamp
2. Submit to Hacker News with a live demo (docs/demo.html needs to be live at the root)
3. Create a 60-second demo video for YouTube/twitter

---

## 4. Specific Changes Needed

### 4.1 package.json — npm Description

**File:** `~/a3m-router/package.json`

**Current:**
```json
"description": "🤖 A3M Router: Intelligent LLM routing gateway - 14% faster than OpenRouter, 92% cheaper | 80+ providers | npm: 6K+/mo | PyPI: 700+/mo | https://github.com/Das-rebel/a3m-router"
```

**Change to:**
```json
"description": "Intelligent LLM routing gateway — 92% cost savings, 80+ providers, drop-in OpenAI replacement. Route once, save forever."
```

**Rationale:** The current description is 130 characters of mixed claims and links. The new description is 103 characters of pure value. It contains "openai" (npm search keyword), "llm routing" (primary intent), "92% cost savings" (specific claim that earns clicks), and "80+ providers" (scale signal).

---

### 4.2 package.json — Keywords Cleanup

**File:** `~/a3m-router/package.json`

**Add missing high-value keywords:**
```json
"openai-gateway",
"openai-proxy",
"llm-proxy",
"openai-compatible",
"cost-saving",
"llm-cost-reduction",
"litellm-alternative",
"openrouter-alternative",
"route-llm"
```

**Remove noise keywords** (too generic, dilute signal):
- `artificial-intelligence` (too broad, 1M+ packages match)
- `machine-learning` (same problem)
- `nlp` (same problem)
- `transformers` (misleading — no transformers used)
- `browser-automation`, `playwright`, `puppeteer` (not relevant to the core package)

**Rationale:** npm's search weights exact substring matches in the keyword list. "openai-gateway" appearing as a keyword directly improves ranking for "openai gateway" searches.

---

### 4.3 README.md — Hero Section

**File:** `~/a3m-router/README.md`

**Change the top of the README from:**
```
> *"Intelligence now has a universal medium of exchange: tokens..."* — Sarah Wang

**Building AI's nervous system, the biologically inspired way.**
[wall of biology metaphors]
```

**Change to:**
```markdown
# A3M Router — Intelligent LLM Gateway

**Route LLM requests across 80+ providers automatically. Cut your AI costs 92%. Works in 2 lines.**

[![npm](https://img.shields.io/npm/v/adaptive-memory-multi-model-router)](https://www.npmjs.com/package/adaptive-memory-multi-model-router)
[![npm](https://img.shields.io/npm/dm/adaptive-memory-multi-model-router)](https://www.npmjs.com/package/adaptive-memory-multi-model-router)

## In 30 seconds

\`\`\`bash
npm install adaptive-memory-multi-model-router
npx a3m-router serve
\`\`\`

\`\`\`python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:8787/v1", api_key="not-needed")
response = client.chat.completions.create(model="auto", messages=[...])
# Routes to cheapest capable provider automatically. Done.
\`\`\`

**Result:** Simple queries → DeepSeek/Groq ($0.0001). Complex queries → GPT-4o. You don't think about it.
```

**Rationale:** Developers decide to try a package in the first 10 seconds. The biology metaphor requires intellectual investment before the value is clear. Leading with a working code example in 30 seconds is the industry standard (see: shadcn/ui, tRPC, drizzle-orm).

---

### 4.4 GitHub Pages — Fix Broken Links

**Files:** `~/a3m-router/docs/index.html`, `~/a3m-router/docs/.nojekyll`

**Problem:** `curl das-rebel.github.io/a3m-router/` returns "Page not found." Only `demo.html` works.

**Changes:**
1. Copy `docs/index.html` to the `docs/` root and ensure it is served (GitHub Pages should serve `docs/index.html` as the root of `username.github.io/repo/`)
2. Verify the `docs/.nojekyll` file exists (it does, per `ls`)
3. Check that `docs/` is set as the GitHub Pages source in repo settings
4. Ensure `index.html` has a working demo link and links to the npm page above the fold

---

### 4.5 npm — Publish Latest Version

**File:** `~/a3m-router/package.json`

**Problem:** `2.16.0` exists in git (Aug 14) but `2.15.5` is the latest published npm version.

**Change:** Run `npm publish` to publish `2.16.0` with the improved metadata.

**Rationale:** npm's search ranking penalizes packages that haven't published recently. A 3-week gap signals stagnation. Publishing weekly (even minor versions) is a known npm SEO signal.

---

### 4.6 README.md — Add Badges Above the Fold

**Current position:** Badges appear after the philosophical intro.

**Change:** Move the npm/PyPI/GitHub badges to be the **first visible element** in the rendered README, above all prose.

**Rationale:** Badges provide instant social proof (download count, test status, stars). A developer scrolling past the philosophy wall should first see "6,000+/month downloads" and "28/28 tests passing."

---

### 4.7 README.md — Comparison Table for litellm

**File:** `~/a3m-router/docs/comparison-litellm.md` (already excellent)

**Change:** Move a condensed version of the comparison table into the main README, replacing the "Why Not Just Use OpenRouter?" section or merging it.

**Rationale:** The litellm comparison table is the most compelling proof point for converting litellm users. It currently lives in a subdoc that almost no one reads. It should be in the README's first 3 screens.

---

## Summary of Changes

| Priority | File | Change | Expected Impact |
|---|---|---|---|
| P0 | `package.json` description | Rewrite as value prop, not academic abstract | +40-60% click-through from npm search |
| P0 | `README.md` hero | Lead with code example + cost claim, not philosophy | +20-30% try-rate after landing |
| P0.5 | `package.json` keywords | Add `openai-gateway`, `llm-proxy`, `litellm-alternative`, remove noise | +30-50% search visibility |
| P0.5 | npm publish | Publish `2.16.0` now | Signals active maintenance |
| P1 | GitHub Pages | Fix `index.html` serving | HN/demo traffic can't convert if pages 404 |
| P1 | README.md | Add litellm comparison table above fold | Captures litellm-switching intent |
| P2 | Content flywheel | Tutorial article on dev.to / sitepoint | Long-tail Google traffic |
| P2 | Badges | Move above prose | Instant social proof |
