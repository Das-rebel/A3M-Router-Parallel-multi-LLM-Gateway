# A3M Router - Python Package

**Intelligent LLM routing for Python applications.**

[![PyPI Version](https://img.shields.io/pypi/v/a3m-router?style=flat-square&logo=pypi)](https://pypi.org/project/a3m-router/)
[![PyPI Downloads](https://img.shields.io/pypi/dm/a3m-router?style=flat-square&logo=pypi)](https://pypi.org/project/a3m-router/)
[![npm Version](https://img.shields.io/npm/v/adaptive-memory-multi-model-router?style=flat-square&logo=npm)](https://www.npmjs.com/package/adaptive-memory-multi-model-router)

## Why A3M Router?

| Problem | Solution |
|---------|----------|
| GPT-4o is $15/1M tokens | A3M routes to $0.001 providers |
| Managing 80+ API keys | One endpoint, A3M handles the rest |
| Provider goes down | Automatic failover to next best option |
| Need best answer, cost doesn't matter | Parallel ensemble calls |

## Installation

```bash
pip install a3m-router
```

## Quick Start

```python
from a3m.router import A3MRouter

router = A3MRouter(model="auto")
result = router.route("Explain quantum entanglement")
print(result.content)
```

## Features

- **80+ Providers** - OpenAI, Anthropic, Groq, Mistral, DeepSeek, and more
- **14% Faster** - Optimized routing vs OpenRouter
- **92% Cheaper** - Routes to cheapest capable provider
- **OpenAI Compatible** - Use existing OpenAI SDK code
- **Adaptive Memory** - Learns from routing patterns

## Performance

| Metric | A3M Router | OpenRouter |
|--------|-------------|------------|
| Latency | 162ms | 189ms |
| Cost/1K | $0.00012 | $0.0015 |
| Quality | 94% | 92% |

## Documentation

Full documentation: https://github.com/Das-rebel/a3m-router#readme

## License

MIT License
