# A3M Router AgentKit Adapter

AgentKit adapter that routes LLM calls through A3M Router for intelligent, cost-optimized model selection.

## Installation

```bash
npm install @a3m/agentkit-adapter
```

## Usage

```typescript
import { createAgentKitAdapter } from '@a3m/agentkit-adapter';
import { createAgent, run } from '@stablelib/agentkit';

// Create A3M-powered adapter
const a3mAdapter = createAgentKitAdapter({
  baseUrl: 'http://localhost:8787',
  model: 'auto',
  temperature: 0.7,
  maxTokens: 4096,
});

// Create agent with A3M routing
const agent = createAgent({
  name: 'a3m-assistant',
  description: 'AI assistant powered by A3M Router',
  llm: a3mAdapter,
  tools: [
    // your tools
  ],
});

// Run the agent
const result = await run(agent, {
  input: 'Hello, what is 2+2?',
});
```

## API

### `createAgentKitAdapter(config)`

Creates an A3M Router adapter for AgentKit.

**Config options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `'http://localhost:8787'` | A3M Router server URL |
| `model` | `string` | `'auto'` | Model to use (`'auto'` for intelligent routing) |
| `temperature` | `number` | `0.7` | Sampling temperature |
| `maxTokens` | `number` | `4096` | Max tokens to generate |
| `parallelEnsemble` | `number` | `1` | Number of providers for ensemble |
| `apiKey` | `string` | — | Optional API key |
| `systemPrompt` | `string` | — | Optional system prompt |
| `tools` | `AgentTool[]` | `[]` | Available tools |

**Returns:** `A3MAgentKitAdapter` instance

### Adapter Methods

#### `chat(messages, tools?)`

Send a chat completion request.

```typescript
const response = await a3mAdapter.chat([
  { role: 'user', content: 'What is AI?' },
]);
```

#### `stream(messages)`

Stream a chat completion response.

```typescript
for await (const chunk of a3mAdapter.stream(messages)) {
  process.stdout.write(chunk.content);
}
```

#### `getTools()`

Get configured tools for function calling.

```typescript
const tools = a3mAdapter.getTools();
```

## How It Works

1. Incoming requests are forwarded to A3M Router at `baseUrl`
2. A3M Router analyzes query complexity and routes to cheapest capable provider
3. Response is returned with routing metadata
4. Falls back gracefully if A3M Router is unavailable

## Example with Tools

```typescript
import { createAgentKitAdapter } from '@a3m/agentkit-adapter';

const calculatorTool = {
  name: 'calculator',
  description: 'Evaluate a mathematical expression',
  parameters: {
    expression: { type: 'string', description: 'The math expression to evaluate' },
  },
};

const adapter = createAgentKitAdapter({
  baseUrl: 'http://localhost:8787',
  model: 'auto',
  tools: [calculatorTool],
});

const response = await adapter.chat(
  [{ role: 'user', content: 'What is 2+2?' }],
  [calculatorTool]
);
```

## License

MIT
