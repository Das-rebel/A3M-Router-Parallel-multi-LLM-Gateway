# A3M Router CLI Cheat Sheet

> 🤖 **The intelligent LLM gateway** — routes to the cheapest capable model automatically.
> 📊 **92% cost savings** | ⚡ **14% faster** | 🌐 **47+ providers** | 🏆 **RouterArena #1**

---

## 🚀 Quick Start

```bash
# Install
npm install -g adaptive-memory-multi-model-router

# One-command setup (auto-detects API keys)
a3m-router setup

# Route a query instantly
a3m-router route "Explain quantum entanglement"

# Start proxy server
a3m-router serve
```

---

## 📋 Command Reference

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `a3m-router route <query>` | Route to best provider | `a3m-router route "What is Rust?"` |
| `a3m-router serve` | Start OpenAI-compatible proxy | `a3m-router serve --port 3000` |
| `a3m-router compare <query>` | Compare all providers | `a3m-router compare "Write a poem"` |
| `a3m-router test` | Test all provider connections | `a3m-router test` |
| `a3m-router setup` | Interactive setup wizard | `a3m-router setup` |
| `a3m-router tui` | Terminal dashboard | `a3m-router tui` |

### Model & Provider Commands

| Command | Description |
|---------|-------------|
| `a3m-router models` | List all 1,000+ available models |
| `a3m-router providers` | List configured providers |
| `a3m-router status` | Router health & uptime |
| `a3m-router recommend <task>` | Get model recommendation |

### Cost & Performance

| Command | Description | Example |
|---------|-------------|---------|
| `a3m-router cost <text>` | Estimate cost in USD | `a3m-router cost "Write a novel"` |
| `a3m-router token <text>` | Count tokens | `a3m-router token "Hello world"` |
| `a3m-router benchmark` | Benchmark all providers | `a3m-router benchmark` |

### Memory & Context

| Command | Description |
|---------|-------------|
| `a3m-router memory add` | Add context to memory |
| `a3m-router memory search <q>` | Semantic search memory |
| `a3m-router memory stats` | Memory usage stats |

### Batch & Advanced

| Command | Description |
|---------|-------------|
| `a3m-router batch <q1> <q2>...` | Route multiple queries |
| `a3m-router config` | Show current config |
| `a3m-router config set <key> <value>` | Update config |
| `a3m-router logs` | View recent logs |
| `a3m-router logs --tail` | Stream live logs |

---

## 💡 Practical Examples

### 1. Instant Query Routing
```bash
# Auto-detects complexity, routes to cheapest capable
a3m-router route "What is 2+2?"

# Complex query routes to better model
a3m-router route "Write a REST API in Go with authentication"
```

### 2. Compare Providers Side-by-Side
```bash
# See responses from all providers at once
a3m-router compare "Explain Kubernetes in 3 sentences"

# Output shows winner, latency, cost per provider
```

### 3. Batch Processing
```bash
# Process 100 queries efficiently
a3m-router batch \
  "What is the capital of France?" \
  "Write a Python function to sort a list" \
  "Explain neural networks"

# Or pipe from file
cat queries.txt | a3m-router batch --stdin
```

### 4. Cost Estimation Before API Call
```bash
# Estimate before expensive operation
a3m-router cost "Write a 10,000 word report on AI ethics"
# Output: ~$0.34 via DeepSeek-V3 vs $2.80 via GPT-4o

# Choose wisely!
```

### 5. Self-Hosted Proxy
```bash
# Start server
a3m-router serve --port 8787 --host 0.0.0.0

# Use with any OpenAI-compatible client
curl http://localhost:8787/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "auto", "messages": [{"role": "user", "content": "Hi!"}]}'
```

---

## 🔌 Proxy Server Usage

### Python
```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-unused",  # Any value works
    base_url="http://localhost:8787/v1"
)

# A3M auto-routes to best provider
response = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Explain quantum computing"}]
)
print(response.choices[0].message.content)
```

### TypeScript
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'sk-unused',
    baseURL: 'http://localhost:8787/v1',
});

const response = await client.chat.completions.create({
    model: 'auto',
    messages: [{ role: 'user', content: 'Explain quantum computing' }],
});
console.log(response.choices[0].message.content);
```

### LangChain
```typescript
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
    model: 'auto',
    apiKey: 'sk-unused',
    configuration: {
        baseURL: 'http://localhost:8787/v1',
    },
});
```

---

## 🧠 Ensemble Mode (Hallucination Detection)

A3M's unique **ensemble voting** detects and filters hallucinations:

```bash
# Enable ensemble for high-stakes queries
a3m-router route "Medical diagnosis for symptoms X, Y, Z" --ensemble

# Or via config
a3m-router config set ensemble.enabled true
a3m-router config set ensemble.voters 3
```

```typescript
import { ensemble } from 'adaptive-memory-multi-model-router';

const result = await ensemble({
    query: "Medical diagnosis for symptoms X, Y, Z",
    providers: ['openai', 'anthropic', 'deepseek'],
    minAgreement: 2,  // Majority vote threshold
});

if (!result.agreement) {
    console.log('⚠️ Low consensus - verify output');
}
console.log(result.content);
```

---

## ⚙️ Configuration

### Interactive Setup
```bash
# Auto-detects API keys from environment
a3m-router setup

# Config stored at ~/.config/a3m-router/config.json
```

### Manual Config
```bash
# Set API keys
a3m-router config set providers.openai.key $OPENAI_API_KEY
a3m-router config set providers.deepseek.key $DEEPSEEK_API_KEY

# Set default strategy
a3m-router config set routing.defaultStrategy auto  # auto | cheapest | fastest | best

# Set monthly budget
a3m-router config set limits.monthlyBudget 100

# Enable ensemble voting
a3m-router config set ensemble.enabled true
```

### Config File Location
```
~/.config/a3m-router/config.json  # Primary
~/.a3m-router/config.json        # Alternative
```

---

## 🔑 Environment Variables

### Provider API Keys

| Variable | Provider | Models |
|----------|----------|--------|
| `OPENAI_API_KEY` | OpenAI | GPT-4o, o1, o3 |
| `ANTHROPIC_API_KEY` | Anthropic | Claude Sonnet 4, Opus |
| `DEEPSEEK_API_KEY` | DeepSeek | DeepSeek-V3, DeepSeek-R1 |
| `GROQ_API_KEY` | Groq | Llama, Mixtral (free tier) |
| `GOOGLE_API_KEY` | Google | Gemini 2.5 Flash/Pro |
| `XAI_API_KEY` | xAI | Grok-3, Grok-2 |
| `FIREWORKS_API_KEY` | Fireworks AI | Llama, Mixtral |
| `TOGETHER_API_KEY` | Together AI | Qwen, Llama |
| `MISTRAL_API_KEY` | Mistral | Codestral, Mistral Large |
| `PERPLEXITY_API_KEY` | Perplexity | Sonar (online) |

### Router Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `A3M_LOG_LEVEL` | `info` | debug, info, warn, error |
| `A3M_PROXY_PORT` | `8787` | Proxy server port |
| `A3M_BUDGET_MONTHLY` | unset | Monthly budget cap (USD) |
| `A3M_DEFAULT_STRATEGY` | `auto` | auto, cheapest, fastest, best |
| `A3M_CACHE_SIZE` | `1000` | Semantic cache entries |

---

## 🐳 Docker

### Quick Container
```bash
docker run -d \
  --name a3m-proxy \
  -p 8787:8787 \
  -e OPENAI_API_KEY=sk-... \
  -e DEEPSEEK_API_KEY=sk-... \
  -e GROQ_API_KEY=gsk_... \
  ghcr.io/das-rebel/a3m-router:latest
```

### Docker Compose
```yaml
services:
  a3m-router:
    image: ghcr.io/das-rebel/a3m-router:latest
    ports:
      - "8787:8787"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - A3M_LOG_LEVEL=info
    volumes:
      - a3m-data:/root/.config/a3m-router

volumes:
  a3m-data:
```

---

## 🖥️ Terminal UI (TUI)

```bash
# Launch dashboard
a3m-router tui

# Or use the separate binary
a3m-tui
```

### TUI Commands

| Command | Description |
|---------|-------------|
| `/route <query>` | Route a query |
| `/cost <text>` | Estimate cost |
| `/health` | Check all providers |
| `/models` | Browse all models |
| `/provider <name>` | Provider details |
| `/logs` | View logs |
| `/exit` | Exit TUI |

---

## 📊 Benchmark Comparison

| Metric | A3M Router | OpenRouter |
|--------|-------------|------------|
| **Cost Savings** | 92% | baseline |
| **Latency** | 14% faster | baseline |
| **Providers** | 47+ | 400+ |
| **Ensemble Voting** | ✅ | ❌ |
| **Self-Hostable** | ✅ | ❌ |
| **Open Source** | 100% | ❌ |

---

## 🆘 Troubleshooting

### "Connection refused" errors
```bash
# Check if server is running
a3m-router status

# Restart server
a3m-router serve
```

### "No providers configured"
```bash
# Run setup
a3m-router setup

# Or manually set keys
a3m-router config set providers.deepseek.key YOUR_KEY
```

### Slow routing
```bash
# Use fastest strategy
a3m-router config set routing.defaultStrategy fastest

# Or benchmark providers
a3m-router benchmark
```

### High costs
```bash
# Switch to cheapest
a3m-router config set routing.defaultStrategy cheapest

# Set budget cap
a3m-router config set limits.monthlyBudget 50
```

---

## 📚 Further Reading

| Document | Description |
|----------|-------------|
| [Quick Start Guide](./QUICK_START.md) | Get started in 5 minutes |
| [Configuration Guide](./CONFIGURATION.md) | Advanced configuration |
| [API Reference](./API.md) | SDK documentation |
| [Benchmark Results](./BENCHMARK.md) | Performance data |
| [GitHub Repo](https://github.com/Das-rebel/a3m-router) | Star, issues, PRs |
| [npm Package](https://www.npmjs.com/package/adaptive-memory-multi-model-router) | Downloads |

---

## ⚡ Quick Aliases

```bash
# Add to ~/.zshrc or ~/.bashrc
alias a3m='a3m-router'
alias a3m-route='a3m-router route'
alias a3m-compare='a3m-router compare'
alias a3m-serve='a3m-router serve'
alias a3m-health='a3m-router test'
alias a3m-cost='a3m-router cost'
alias a3m-providers='a3m-router providers'
alias a3m-tui='a3m-router tui'
```

```bash
# Reload shell
source ~/.zshrc
```
