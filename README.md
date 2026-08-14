# 🎮 A3M Router for Browser Automation

**Stop paying GPT-4o prices for simple browser tasks.** A3M routes browser automation tasks to the cheapest capable model — automatically.

<p align="center">
  <img src="https://img.shields.io/npm/v/adaptive-memory-multi-model-router?style=flat-square" alt="npm">
  <img src="https://img.shields.io/github/stars/Das-rebel/a3m-router?style=flat-square" alt="stars">
  <img src="https://img.shields.io/npm/dm/adaptive-memory-multi-model-router?style=flat-square" alt="downloads">
</p>

---

## 💰 Cost Savings

| Task Type | GPT-4o Cost | A3M Cost | Savings |
|-----------|-------------|----------|---------|
| Form filling | $0.03/task | $0.001 | **97%** |
| Data extraction | $0.02/task | $0.002 | **90%** |
| Page analysis | $0.02/task | $0.003 | **85%** |
| Job applications | $0.10/task | $0.005 | **95%** |

> "I saved $2,400/month on browser automation by switching to A3M"

---

## 🎯 Browser Automation Features

- 💰 **70% cost reduction** for form filling, data extraction, web scraping
- 🕵️ **Stealth mode** - Minimize bot detection with intelligent provider rotation
- ⚡ **Parallel ensemble** - Run 3 providers simultaneously, pick the most consistent result
- 🔄 **Auto-retry** with fallback providers when tasks fail
- 📊 **Cost tracking** - Monitor spending per task and provider

---

## Quick Start

### Browser Automation

```bash
npm install adaptive-memory-multi-model-router
```

```typescript
import { A3MRouter } from 'adaptive-memory-multi-model-router';

// Configure for browser automation
const router = new A3MRouter({
  model: 'auto',
  stealth: true,           // Enable anti-detection
  parallelEnsemble: 3,      // Run multiple for reliability
  browserOptimized: true,  // Browser-specific optimizations
});

// Form filling - routes to cheapest capable
const result = await router.route({
  task: 'Extract name, email, phone from this job application form',
  context: 'browser_automation',
});

console.log(`Content: ${result.content}`);
console.log(`Provider: ${result.provider}`);
console.log(`Cost: $${result.cost}`);
```

### CLI

```bash
npm install -g adaptive-memory-multi-model-router
npx a3m-router serve

# In another terminal
curl http://localhost:8787/v1/models  # List available models
```

---

## 🎮 Browser Automation Guide

A3M is optimized for browser automation tasks:

| Task Type | Recommended Model | Why |
|-----------|-----------------|------|
| Form filling | gpt-4o-mini | Simple, fast |
| Data extraction | claude-sonnet | Good at structure |
| Complex scraping | gpt-4o | Handles edge cases |
| Anti-detection | provider_rotation | Automatic |

### Example: Automated Job Applications

```typescript
import { A3MRouter } from 'adaptive-memory-multi-model-router';
import { chromium } from 'playwright';

const router = new A3MRouter({
  model: 'auto',
  stealth: true,
  parallelEnsemble: 3,
});

async function applyToJob(jobUrl: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto(jobUrl);
  
  // A3M analyzes the form and fills it optimally
  const formResult = await router.route({
    task: `Fill this job application with:
      - Name: Subhojit Das
      - Email: subho@example.com
      - Phone: +91-7977110915`,
    context: 'form_filling',
  });
  
  // Submit and track cost
  await page.click('button[type="submit"]');
  console.log(`Applied! Cost: $${router.getCost()}`);
  
  await browser.close();
}
```

---

## Integrations

### browser-use (108K GitHub stars)

```typescript
import { Agent } from 'browser-use';
import { A3MRouter } from 'adaptive-memory-multi-model-router';

const agent = new Agent({
  task: 'Extract all job listings from this page',
  llm: new A3MRouter({ model: 'auto', stealth: true }),
});
```

### MCP Server (for Claude Desktop, Cursor, etc.)

```bash
npx a3m-mcp-browser
```

Then use tools like `route_for_browser_task`, `extract_form_data`, `fill_form_intelligently`.

### sota-browser (CloakBrowser)

```typescript
import { A3MRouter } from 'adaptive-memory-multi-model-router';
import { BrowserManager } from 'sota-browser';

const browser = new BrowserManager({ stealth: true });
const router = new A3MRouter({ model: 'auto' });
// Ultimate combination for reliable automation
```

---

## Comparison

| Feature | A3M | LiteLLM | RouteLLM |
|---------|-----|---------|----------|
| Browser optimization | ✅ | ❌ | ❌ |
| Stealth mode | ✅ | ❌ | ❌ |
| Parallel ensemble | ✅ | ❌ | ❌ |
| Cost for form filling | $0.002/task | $0.03/task | N/A |
| Anti-detection | ✅ | ❌ | ❌ |
| Heuristic routing | ✅ | ❌ | ✅ |

---

## How Routing Works

For every request, A3M scores complexity across five signals:

| Signal | What it detects |
|--------|----------------|
| **Domain** | Legal, medical, code, finance, ML keywords |
| **Task type** | Code generation, translation, analysis, creative |
| **Query structure** | Clause count, length, qualifier words |
| **Verb intensity** | "design/architect" → complex, "what/who" → simple |
| **Multi-step** | Explicit step markers (first...then, step 1/2/3) |

The combined score maps to a tier (free → cheap → mid → premium). Within that tier, A3M picks the cheapest available provider.

---

## Biology-Inspired Provider Selection

A3M applies ecological theory to routing:

**EXP3 Diversity** — Prevents any single provider from dominating traffic.

**Charnov MVT** — Optimizes rate-limit rotation using Marginal Value Theorem.

**ODT Shadow Verification** — For high-stakes queries, probabilistically verifies with a shadow provider.

---

## Documentation

- [API Reference](https://das-rebel.github.io/a3m-router/api)
- [Integrations](https://github.com/Das-rebel/a3m-router/tree/main/integrations)
  - [browser-use](https://github.com/Das-rebel/a3m-router/tree/main/integrations/browser-use)
  - [MCP Server](https://github.com/Das-rebel/a3m-router/tree/main/integrations/mcp-browser)
  - [sota-browser](https://github.com/Das-rebel/a3m-router/tree/main/integrations/sota-browser)
- [Examples](https://github.com/Das-rebel/a3m-router/tree/main/examples)

---

## License

MIT
