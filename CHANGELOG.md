# Changelog

## [Unreleased]

### Added
- Docker + docker-compose deployment
- MCP server for AI agent integration
- LangChain LLM integration with A3M Router
- Gradio demo on HuggingFace Space
- GitHub Pages documentation site
- CI/CD badges and community health files
- Posting directory with 30+ platforms for A3M discovery

### Changed
- Cleanup removed 4 unused deps, fixed 0 vulns, deduplicated

## [2.16.0] — 2026-08-12

### Added
- **80+ providers** (up from 36): Cloudflare Workers AI, HuggingFace Inference, Modal, Lepton AI, NVIDIA NIM, Baseten, RunPod, Predibase, Featherless AI, Abacus AI, Hyperbolic, Stability AI, SiliconFlow, Yandex GPT, Tencent Hunyuan, VolcEngine (Doubao), Baidu Qianfan, Kuaishou, 360 AI, Naver Clova, Kakao Brain, Upstage, SkyFire, LIVEPEOPLE, Scale AI, Titanium Network, Aizel Cloud, Poe, Phind, Banana, Forefront AI, You.com, Komo, Shine AI, AIDE Labs, Writer API, Databricks, La Plateforme, and more

### Changed
- Provider expansion: 36 → 80+ providers across free, cheap, mid, premium, and enterprise tiers — 2026-05-28

### Added
- MCP server for AI agent integration
- LangChain provider integration (A3MChatModel)
- Interactive web demo with Gradio
- Docker + docker-compose deployment (Dockerfile, docker-compose.yml)
- HuggingFace Space demo with Gradio app for parallel LLM routing
- GitHub Pages documentation site
- CI/CD with GitHub Actions, badges, community health files
- Posting directory with vault-sourced Reddit list and 50+ targets

### Changed
- Removed 291 tracked node_modules files
- Updated README with TUI usage instructions

### Fixed
- GitHub topics, star CTA, keywords, CHANGELOG, CONTRIBUTING

### Removed
- Full-desktop screenshot
- Tracked secrets, added .gitignore and .env.example

## [2.13.x] — 2026-05-20

### Added
- TUI v2 — Tokyo Night theme, sparklines, tabs, pulse animation, F-keys, mouse support
- TUI conversational mode — PI-style chat with /route, /cost, /health commands
- Inline REPL TUI — chalk + boxen, PI /search style
- Ensemble voting (P0): parallel multi-LLM execution with confidence-weighted merging
- Query presets (P1): per-bucket provider + temperature configuration
- Persistent agent memory (P3): cross-session .memory.json
- Independent benchmark validation using llm-gateway-bench
- MMLU cross-reference with third-party benchmark validation
- Fresh benchmark run (2026-05-26)
- Professional benchmark chart — clean white style
- PI-style conversational TUI — /slash commands, Tokyo Night theme
- Sakura light pink theme — blush white bg, hot pink accents

### Changed
- Repositioned as fastest-growing npm LLM router
- Moved benchmark to top of README, updated keywords for GEO
- Rewrote all posts to focus on 3 customer pain points
- Rewrote content in vault-informed human voice using real tweet language patterns
- Positioned as central-brain orchestration layer

### Fixed
- Blessed overlay box rendering — proper sizing, bottom border, cursor positioning
- Clean rendering, no ANSI corruption in overlay boxes
- Internal project references removed, rewritten for general audience

## [2.13.0] — 2026-05-20

### Added
- TUI dashboard — blessed terminal UI with provider health, cost gauge, live logs
- Ensemble voting (P0): parallel multi-LLM execution with weighted result merging
- Query presets (P1): configurable per-query-type provider + temperature
- Persistent agent memory (P3): .memory.json for cross-session context

### Changed
- Complete README rewrite positioning A3M as central-brain orchestration layer
- Bumped to 2.13.0 for central-brain positioning + ensemble features
- Bumped to 2.13.2 with clean description
- Bumped to 2.13.4 with updated keywords and description
- Bumped to 2.13.5 with updated repo URL

## [2.12.x] — 2026-05-18

### Added
- Real demo — shell script + HTML video
- Terminal demo files for A3M Router
- Auto-playing demo without button dependency
- Redesigned demo based on README content
- Demo HTML for GitHub Pages
- Single-command TUI with demo mode
- Zero-config TUI with free-tier defaults

### Changed
- Reduced keywords by 20%, added differentiators
- Updated with 6.1k monthly downloads badge
- Removed 32 low-value keywords for better SEO

### Fixed
- CI build step
- Excluded embedded repos

## [2.11.x] — 2026-05-15

### Added
- GitHub Pages deployment workflow
- Root index.html redirect to charts gallery
- Animated charts moved to docs/assets/
- Hyperframes-style animated cost comparison and social banner
- Lottie animations with interactive preview (later removed)
- High-quality SVG visuals (v1, v2, v3 charts)
- Hyperframes-style animated chart
- Improved SVG charts v2 with animations and premium effects
- GitHub Pages index with 10x improved design

### Fixed
- CDN fallback chain: raw to jsDelivr to local assets
- Preview page loading from GitHub raw CDN
- Removed broken assets from docs/index.html

### Removed
- Lottie files and preview page
- Cleaned docs/index.html

## [2.10.x] — 2026-05-12

### Added
- Interactive setup wizard
- Minimal launch artifacts
- 75 feature keywords for recent builds
- Visual diagrams — terminal demo, routing flow, feature grid
- GitHub Actions CI with pytest async support
- Eval gates and shadow eval in CI pipeline
- Eval framework with routing, fault injection, shadow eval
- Engineering spec, claims, and reproducibility docs

### Changed
- Simplified tagline: "One prompt in. The right model out."
- Updated provider count to 47+
- Updated GitHub About description with fuller description

### Fixed
- Python tests that require local tmlpd-skill dependency (now skipped in CI)
- TypeScript warning fix and dist rebuild
- Duplicate sections in README

## [2.9.x] — 2026-05-10

### Added
- GEO optimization — hyperlinks, Chinese description, provider URLs
- Research-backed architecture section with 8 key papers
- 588 keywords + keyword-rich README content
- Pain point features to README
- Per-provider retry logic (P1)
- Observability layer (P2)
- Star CTA, community badges, OSS section
- Provider sections removed — users choose their own

### Changed
- Clarified 61.6% benchmark baseline — savings vs all-premium routing
- Consolidated benchmark results section
- Improved routing signals section with detailed signal breakdown

## [2.8.x] — 2026-05-08

### Added
- Redesigned README — clean, code-first, best practices
- Restored 428 keywords from v2.2.5 spike era + 25 unique additions
- Professional SVG assets with creative improvements
- Visual overview section with 7 SVG charts

### Changed
- Improved all SVG assets with cleaner professional design
- README redesigned with best practices from vLLM, Gradio, OpenHuman

### Reverted
- Restored README from before SVG charts (v2.2.6 era)

## [2.7.x] — 2026-05-05

### Added
- Research references and SEO/GEO enhancements
- Competitor links table and routing keywords
- Comprehensive ASCII graphics and visual diagrams
- PNG charts and visual diagrams
- Enhanced charts (v3) — comprehensive visual overview

### Fixed
- Clean README — restore from clean state, fix comparison table

## [2.6.x] — 2026-05-03

### Added
- Chinese LLM providers section (8 Chinese provider topics)
- Chinese (README_zh.md) and Japanese (README_ja.md) translations
- Language links at top of README (Chinese, Japanese, English)
- Provider benchmarks table with cost/quality ratios, latency, confusion matrix
- Real API benchmark results — Groq and Cerebras latency data
- MMLU/quality benchmarks — real API calls

### Fixed
- Internal anchor links (leading hyphen removed)
- Remaining anchor links
- Stray placeholder text in benchmark section

### Removed
- Generative Engine Optimization section
- False RouteLLM comparisons — honest heuristic routing claims only

## [2.5.x] — 2026-04-30

### Added
- MCTS workflow optimization section — UCB1, agent assignment, comparison
- Architecture diagram, MCTS mention, Generative Engine section, ASCII charts
- Expanded all features — no more click-to-expand sections
- Force cache invalidation

### Changed
- Updated README with download stats badge
- Refreshed package.json description
- Updated GitHub About description

## [2.4.x] — 2026-04-28

### Added
- HN submission v3, founder comment, and launch checklist
- 6 fresh platform content pieces (Reddit ML/webdev/LocalLLaMA/SideProject/node, Dev.to, HN)
- Updated README with 99.5% benchmark
- SECURITY.md, CONTRIBUTING.md, FUNDING.yml

### Changed
- README reimagined from top GitHub patterns + GEO optimized
- Added 3-pillar differentiation table (Adaptive Memory + Multi-Signal Routing + Built-in Protections)

## [2.3.x] — 2026-04-25

### Added
- 50x creative improvement — professional SVG assets
- Visual overview section with 7 SVG charts

### Fixed
- Visual overview section placement
- Clean assets restoration after SVG experimentation

## [2.2.x] — 2026-04-20

### Added
- TypeScript SDK class (A3MRouter with route(), routeBatch(), recommend(), serve(), analyze())
- Python SDK (python/a3m/)
- REST API docs
- 5-method Quick Start section
- SEO overhaul — 65 keywords, description optimized for npm search
- GEO overhaul — llms-full.txt, OpenAPI spec, ChatGPT plugin manifest, JSON-LD, sitemap, robots.txt
- OpenHuman adaptations — ALL 5 adaptations integrated
- 14 providers + 10 integrations
- 116 integrations milestone

### Changed
- Removed all self-deprecating language, reframed 0-star narrative as npm SEO win
- Renamed tmlpd-pi to adaptive-memory-multi-model-router (A3M Router)
- Flattened structure for maximum virality
- Updated package.json name

### Fixed
- Nanoid dependency for v1.4.1
- Module export issues (v1.7.0-v1.8.1)
- Providers subpath exports and memory API
- Memory search min word length 3 to 2

## [2.2.0] — 2026-04-10

### Added
- Classifier v3 — 99.5% +-1 tier accuracy, 64.5% exact, domain detection (legal/medical/security/finance)
- Premium recall improved from 7.5% to 45%
- Routing benchmark (82.5% +-1 tier accuracy), real competitor comparison table
- Star-on-GitHub prompt to CLI (shows once per user, fixes #2)
- Social preview and OG banner images for sharing
- GitHub Pages from /docs with landing page + assets
- Terminal demo SVG and animated growth chart
- Cost comparison with real pricing data and scale projections
- SEO optimized — meta tags, structured data, llms.txt, keyword research
- HN submission text with pre-written responses
- Growth narrative content (245% in 3 days)

### Changed
- Benchmark corrected: baseline bug fix (0.3 to 0.2), scores: 46.5% exact, 78.5% +-1, 81% savings
- Qualified RouteLLM comparison, curated SEO keywords
- Rewrote all content: 30x efficiency story, benchmark-first, Chinese forum style

## [2.0.0] — 2026-04-05

### Added
- Proxy server — OpenAI-compatible HTTP proxy
- LangChain integration (ChatOpenAI replacement)
- Guardrails engine — prompt injection, PII, content filtering
- Semantic cache — embedding-based with cosine similarity
- Cost analytics and budget enforcement
- Observability — tracing, metrics, middleware
- 39+ providers
- Benchmark script and demo recording script
- README rewrite with growth narrative

### Changed
- Major version bump from 1.x to 2.0.0
- npm description updated with growth narrative

## [1.9.x] — 2026-04-01

### Added
- NPM stats validation and security features
- GEO optimization
- Best-in-class GitHub assets and community files
- Popularity boosters: GitHub Pages, Playgrounds, Content
- GLM-4 and MiniMax focused pain-driven content
- HN research and content structure guide
- Crisis-driven narrative for HN
- Chinese-style content strategy
- Platform-specific articles for cross-posting
- 2 additional Dev.to articles

### Changed
- Marketing suite with full production readiness
- Content focus rewritten to A3M Router (the product)

### Fixed
- All 133 tests passing

## [1.8.x] — 2026-03-28

### Added
- Module fix releases (v1.7.0 through v1.8.1)
- Memory search min word length 3 to 2

### Fixed
- Module issues resolved (all exports)
- Providers subpath exports properly fixed
- Added createA3MRouter + all A3M exports to dist/index.js

## [1.6.x] — 2026-03-25

### Added
- 116 integrations milestone
- Architectural optimizations
- Complete documentation overhaul
- Release tags

### Fixed
- Restored 139 keywords

## [1.5.x] — 2026-03-22

### Added
- Architectural optimizations for performance

## [1.4.x] — 2026-03-20

### Added
- ALL 5 OpenHuman adaptations
- Updated package.json with full exports for v1.4.0
- Nanoid dependency for v1.4.1

## [1.3.x] — 2026-03-18

### Added
- 14 providers + 10 integrations

## [1.2.x] — 2026-03-15

### Added
- Flatten structure for maximum virality
- Updated package.json name

### Changed
- Renamed tmlpd-pi to adaptive-memory-multi-model-router (A3M Router)
- Cleaned up README

## [1.1.x] — 2026-03-12

### Added
- tmlpd-pi extension v1.1.3 through v1.2.2

## [1.0.0] — 2026-03-10

### Added
- Initial release: TMLPD v2.2 with HALO Orchestration, Universal Router, MCTS
- Clean up and initial README
- v3.0 revolutionary capabilities documentation
- 94.7% test pass rate with comprehensive test fixes
