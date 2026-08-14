# A3M Router Cost Calculator

**Live:** https://a3m.router/calculator

Drop-in interactive calculator. No build step. No npm dependencies for the calculator itself.

## What it does

- Input: monthly request volume + model mix
- Output: side-by-side cost comparison (baseline vs A3M routed)
- Generates shareable URL with encoded config (base64url)
- Exports comparison as CSV

## Quick Start

```bash
# Open directly
open apps/cost-calculator/index.html

# Or serve locally
npx serve apps/cost-calculator
```

## Embed in any site

```html
<iframe
  src="https://a3m.router/calculator"
  width="100%"
  height="700"
  frameborder="0"
  style="border-radius: 12px;"
></iframe>
```

## Architecture

```
calculator.js    — Pure JS, no dependencies. All pricing, routing, and encoding logic.
calculator.css   — Standalone styles. Dark theme, responsive.
index.html       — Self-contained. Vanilla JS. Loads calculator.js.
package.json    — vitest for unit testing the pure JS logic.
```

## Testing

```bash
cd apps/cost-calculator
npm install
npm test
```

## Models Supported

| Premium Model | Routed To | Savings |
|---------------|-----------|---------|
| GPT-4o | GPT-4o-mini | ~35% |
| Claude 3.5 Sonnet | Claude 3 Haiku | ~40% |
| Gemini 1.5 Pro | Gemini 1.5 Flash | ~45% |
| Groq Llama 3.3 70B | Groq Mixtral 8x7B | ~30% |

## Pricing Source

OpenRouter provider rates (per 1M tokens). Update `PRICING` constant in `calculator.js` to reflect latest rates.

## Next Steps

- [ ] Deploy to `a3m.router/calculator` (Vercel static)
- [ ] Add UTM tracking on share links
- [ ] Add "embed widget" script for dynamic resize
- [ ] Write HN + Reddit post with actual example calculations
- [ ] Add unit tests with vitest
