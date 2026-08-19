# A3M Router

Adaptive Memory Multi-Model Router for AI agents.

## Overview

A3M Router intelligently routes LLM queries across 80+ providers, optimizing for cost, latency, and quality. Supports OpenAI, Anthropic, Groq, Mistral, Cerebras, Together AI, and many more.

## Features

- **Provider Routing**: Automatic provider selection based on task type (code, math, translation)
- **Cost Optimization**: Balance between price and performance
- **Latency Awareness**: Fastest provider selection
- **Provider Health**: Automatic failure detection and retry
- **Provider Registry**: Central registry for all providers
- **Configuration Wizard**: Interactive setup via `npx a3m-router wizard`

## Installation

```bash
npm install a3m-router
```

or

```bash
pip install a3m_router
```

## Quick Start

```javascript
import { router } from 'a3m-router';

const result = await router.route('Translate "Hello" to French');
console.log(result);
```

## Configuration

Run the interactive setup wizard:

```bash
npx a3m-router wizard
```

Or configure via environment variables:

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="..."
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm test` | Run the test suite (28 tests) |
| `npm run lint` | Lint source files |
| `npm run start` | Start the development server |

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/foo`)
3. Commit your changes (`git commit -am 'Add foo feature'`)
4. Push to the branch (`git push origin feature/foo`)
5. Open a Pull Request

## Acknowledgments

- Built with ❤️ by Das-rebel
- Powered by [Node.js](https://nodejs.org/) and [TypeScript](https://www.typescriptlang.org/)
