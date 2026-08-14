# Built a Vercel AI SDK provider that cuts LLM costs by 60%+ — automatically routes to cheapest capable model

Hey r/MachineLearning — wanted to share a side project that's been saving me serious money.

## The Problem

Every AI feature I built defaulted to GPT-4o because "it's the best." My monthly bill hit $800 for a side project. The breakdown was brutal:

- "Summarize this article" → GPT-4o @ $0.03/query
- "What is React?" → Claude Opus @ $0.015/query
- "Write a Python script" → GPT-4o @ $0.05/query

These should cost $0.0002. Not $0.03.

## The Solution

Built `a3m-vercel-ai` — a drop-in Vercel AI SDK provider that routes to the cheapest capable model automatically.

```typescript
import { createA3MProvider } from 'a3m-vercel-ai';
import { generateText } from 'ai';

const a3m = createA3mProvider({ parallelEnsemble: true });

// 'auto' routes to cheapest capable — no model selection needed
const result = await generateText({
  model: a3m('auto'),
  prompt: 'Explain quantum computing'
});
```

## How Routing Works

The router analyzes each request and classifies it:

| Query Type | Example | Routed To | Cost |
|-----------|---------|-----------|------:|
| Simple Q&A | "What is 2+2?" | Groq | $0 |
| Code gen | "Write a sorting function" | DeepSeek Coder | $0.001 |
| Complex analysis | "Analyze this legal contract" | Claude 3.5 | $0.01 |
| Creative | "Write a poem" | GPT-4o | $0.03 |

## Real Numbers

After 3 months on my production app:

| Month | Setup | Cost | Savings |
|-------|-------|-----:|--------:|
| January | GPT-4o only | $847 | — |
| February | Mixed manual | $612 | 28% |
| March | a3m-vercel-ai | $298 | **65%** |

Same quality outputs. No prompt rewrites.

## The Technical Details

- **5-signal classifier**: Domain, task type, query structure, verb intensity, specificity
- **0.3ms routing latency**: No GPU, no ML model, just keyword analysis
- **Parallel ensemble**: Runs 3 providers, confidence-weighted voting
- **Circuit breakers**: Auto-skips degraded providers

## Caveats

- Your prompts must be somewhat consistent for the classifier to learn
- First-time routing is heuristic; it improves with usage patterns
- Complex multi-step agents may not benefit as much

## Try It

```bash
npm install a3m-vercel-ai ai
```

GitHub: [https://github.com/Das-rebel/a3m-router](https://github.com/Das-rebel/a3m-router)

Questions welcome — happy to share what I learned about routing algorithms.
