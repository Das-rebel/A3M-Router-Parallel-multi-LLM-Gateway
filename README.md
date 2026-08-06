# A3M Router Kong Plugin

A Kong API Gateway plugin that intercepts LLM API calls and routes them intelligently through the [A3M Router](https://github.com/Das-rebel/adaptive-memory-multi-model-router) for optimal model selection, cost optimization, and fallback handling.

## Features

- **Intelligent Routing**: Routes LLM requests through A3M Router for optimal model selection
- **Automatic Fallback**: Falls back to original provider on A3M failure
- **Streaming Support**: Full support for Server-Sent Events (SSE) streaming responses
- **Multi-Model Ensemble**: Optional parallel ensemble routing for improved responses
- **Debug Headers**: Optional headers showing routing decisions and latency
- **Configurable**: Fully configurable via Kong's declarative configuration

## Architecture

```
Client Request
      │
      ▼
┌─────────────┐
│ Kong Gateway│
│  + A3M      │ ────────► A3M Router (localhost:8787)
│  Plugin     │           │
└─────────────┘           │ Routes to optimal
      │                  │ model (OpenAI, Anthropic,
      │                  │  Groq, etc.)
      │                  │
      │   On failure ◄───┘
      ▼
┌─────────────┐
│ Fallback to │
│ original    │
│ provider    │
└─────────────┘
```

## Installation

### Prerequisites

- Kong Gateway 3.0+ (DB-less or DB mode)
- A3M Router running (default: http://localhost:8787)

### Method 1: Local Development Installation

```bash
# Clone the plugin
git clone https://github.com/Das-rebel/a3m-kong-plugin.git
cd a3m-kong-plugin

# Copy plugin to Kong's plugin directory
cp -r kong-plugin/a3m_router /usr/local/kong/plugin/

# Or set custom plugin path in kong.conf
# plugins = a3m_router,bundled
```

### Method 2: luarocks Installation

```bash
# Create rockspec
# Then install
luarocks make a3m_router-1.0.0.rockspec
```

### Method 3: Docker Installation

```bash
# Build and run with Docker Compose
cd a3m-kong-plugin
docker-compose up -d

# Verify Kong is running
curl http://localhost:8001

# Verify plugin is loaded
curl http://localhost:8001/plugins
```

## Configuration

### Plugin Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `a3m_base_url` | string | `http://localhost:8787` | Base URL of A3M Router |
| `default_model` | string | `openai/gpt-4o-mini` | Fallback model |
| `parallel_ensemble` | boolean | `false` | Enable parallel ensemble routing |
| `a3m_timeout_ms` | number | `30000` | Timeout for A3M requests (ms) |
| `pass_headers` | boolean | `true` | Pass through auth headers |
| `debug_headers` | boolean | `false` | Add debug headers |
| `max_retries` | number | `1` | Max retries on A3M failure |
| `exclude_routes` | array | `[]` | Routes to exclude |
| `log_level` | string | `info` | Log level |

### Declarative Configuration (kong.yml)

```yaml
_format_version: "3.0"

plugins:
  - name: a3m_router
    config:
      a3m_base_url: http://a3m-router:8787
      default_model: openai/gpt-4o-mini
      parallel_ensemble: false
      a3m_timeout_ms: 30000
      pass_headers: true
      debug_headers: true
      max_retries: 1
      log_level: info
    route: all
```

### Admin API Configuration

```bash
# Enable plugin globally
curl -X POST http://localhost:8001/plugins \
  -d name=a3m_router \
  -d config.a3m_base_url=http://localhost:8787 \
  -d config.default_model=openai/gpt-4o-mini \
  -d config.debug_headers=true

# Enable on specific service
curl -X POST http://localhost:8001/services/my-llm-service/plugins \
  -d name=a3m_router \
  -d config.a3m_base_url=http://localhost:8787

# Enable on specific route
curl -X POST http://localhost:8001/routes/my-route/plugins \
  -d name=a3m_router \
  -d config.a3m_base_url=http://localhost:8787
```

## Usage

### Intercepted Endpoints

The plugin automatically intercepts these OpenAI-compatible endpoints:

- `POST /v1/chat/completions`
- `POST /v1/completions`
- `POST /v1/embeddings`
- `POST /v1/images/generations`
- `POST /v1/audio/transcriptions`

### Making Requests

```bash
# Direct request through Kong (with A3M routing)
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# Response will include A3M headers
# x-a3m-routed: true
# x-a3m-routed-model: anthropic/claude-3-sonnet
# x-a3m-latency-ms: 234.56
```

### Response Headers

| Header | Description |
|--------|-------------|
| `x-a3m-routed` | Whether routed through A3M |
| `x-a3m-routed-model` | The model A3M selected |
| `x-a3m-latency-ms` | Routing latency in ms |
| `x-a3m-fallback` | Set if fallback triggered |
| `x-a3m-debug` | Debug information (if enabled) |

### Streaming Requests

```bash
curl -N -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Count to 10"}],
    "stream": true
  }'
```

### Testing Fallback

```bash
# Stop A3M Router to test fallback
docker-compose stop a3m-router

# Make a request - should fallback to original provider
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Test"}]}'

# Response will have x-a3m-fallback: true header
```

## Development

### Project Structure

```
a3m-kong-plugin/
├── kong-plugin/
│   ├── manifest                          # Rock manifest
│   └── a3m_router/
│       ├── handler.lua                   # Main plugin handler
│       ├── schema.lua                    # Configuration schema
│       ├── migrations.lua                # Database migrations
│       └── stats.lua                     # Statistics collector
├── Dockerfile                            # Kong + plugin image
├── docker-compose.yml                    # Full stack setup
├── kong.yml                              # Declarative config
├── mock-openai.json                      # Mock provider for testing
├── test_requests.sh                      # Test script
└── README.md
```

### Running Tests

```bash
# Start the full stack
docker-compose up -d

# Wait for services to be healthy
sleep 10

# Run test requests
./test_requests.sh

# Check logs
docker-compose logs -f kong

# Stop
docker-compose down
```

### Manual Testing

```bash
# Test LLM routing
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hi"}]}'

# Test non-LLM request (should pass through)
curl http://localhost:8000/non-llm-endpoint

# Check plugin status
curl http://localhost:8001/plugins | jq '.data[] | select(.name=="a3m_router")'
```

## Integration with A3M Router

The plugin expects A3M Router to be running at the configured `a3m_base_url`. A3M Router handles:

- Model selection based on query complexity, cost, and availability
- Parallel ensemble routing (when enabled)
- Fallback to alternative models on failure
- Response aggregation for ensemble mode

### A3M Router Configuration

```yaml
# A3M Router config (typically in a3m-router config.yaml)
server:
  host: 0.0.0.0
  port: 8787

routing:
  default_provider: openai
  default_model: gpt-4o-mini
  enable_streaming: true
  timeout_ms: 30000

providers:
  openai:
    api_key: ${OPENAI_API_KEY}
  anthropic:
    api_key: ${ANTHROPIC_API_KEY}
  groq:
    api_key: ${GROQ_API_KEY}
```

## Monitoring

### Check Routing Statistics

```bash
# Kong Admin API - view plugin config
curl http://localhost:8001/plugins | jq '.data[] | select(.name=="a3m_router")'

# Kong logs
docker-compose logs -f kong 2>&1 | grep "A3M Router"
```

### Metrics to Monitor

- `x-a3m-routed` - Routing success rate
- `x-a3m-latency-ms` - Routing latency
- `x-a3m-fallback` - Fallback frequency
- `x-a3m-routed-model` - Model distribution

## Troubleshooting

### Plugin Not Loading

```bash
# Check Kong error logs
docker-compose logs kong | grep error

# Verify plugin files exist
docker exec a3m-kong ls -la /usr/local/kong/plugin/a3m_router/

# Check plugin is in allowed list
curl http://localhost:8001/kong
```

### A3M Router Connection Issues

```bash
# Verify A3M Router is healthy
curl http://localhost:8787/health

# Check connectivity from Kong
docker exec a3m-kong curl -I http://a3m-router:8787/health
```

### Debug Mode

Enable debug headers and logging:

```yaml
plugins:
  - name: a3m_router
    config:
      debug_headers: true
      log_level: debug
```

## License

MIT

## Links

- [A3M Router](https://github.com/Das-rebel/adaptive-memory-multi-model-router)
- [Kong Plugin Development](https://docs.konghq.com/gateway/latest/plugin-development/)
- [Kong Plugin SDK](https://docs.konghq.com/gateway/latest/pdk/)
