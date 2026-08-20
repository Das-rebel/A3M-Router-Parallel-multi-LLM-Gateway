/**
 * A3M Router - Generic Provider Configuration System
 *
 * Users can configure their available LLM providers via:
 * 1. Environment variables (*_API_KEY patterns)
 * 2. Config file at ~/.config/a3m-router/providers.json
 * 3. Runtime registration via registerProvider()
 *
 * 70+ providers across free, cheap, mid-tier, premium, and enterprise tiers.
 * Coverage: Cloudflare Workers AI, HuggingFace Inference, Modal, Lepton, NVIDIA NIM,
 * Baseten, RunPod, Predibase, Featherless, Abacus, Hyperbolic, Stability AI,
 * SiliconFlow, Yandex, Tencent, VolcEngine, Baidu, Kuaishou, 360 AI, Naver, Kakao,
 * AWS Bedrock/SageMaker, Azure, and more.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// TYPES
// ============================================================

export type ProviderTier = 'free' | 'cheap' | 'mid' | 'premium' | 'enterprise';
export type ProviderFormat = 'openai' | 'anthropic' | 'google' | 'cohere' | 'aws-bedrock' | 'google-vertex';
export type ProviderType = 'api' | 'cli' | 'local';
export type ProviderStrategy = 'aggressive' | 'balanced' | 'conservative';

export interface ProviderCost {
  input: number;  // per 1M tokens
  output: number; // per 1M tokens
}

export interface ProviderDefinition {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyEnv: string;
  models: string[];
  costPerK: ProviderCost;
  tier: ProviderTier;
  format: ProviderFormat;
  type: ProviderType;
  priority: number;
  maxTokens: number;
  cliCommand?: string;
  apiKey?: string | null;
  supports_multimodal?: boolean;  // Supports image, video, audio processing
  strategy?: ProviderStrategy;  // Game-theoretic strategy type
}

// ============================================================
// DEFAULT PROVIDER DEFINITIONS
// ============================================================

export const DEFAULT_PROVIDERS: Record<string, ProviderDefinition> = {
  // ========================================================================
  // TIER: FREE / LOCAL
  // ========================================================================
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    baseUrl: 'http://127.0.0.1:11434/v1/chat/completions',
    apiKeyEnv: '',
    models: ['llama3', 'mistral', 'qwen2', 'codellama', 'phi3', 'gemma2'],
    costPerK: { input: 0, output: 0 },
    tier: 'free',
    format: 'openai',
    type: 'local',
    priority: 1,
    maxTokens: 8192,
    strategy: 'aggressive',  // Free, fast, but higher variance
  },

  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio',
    baseUrl: 'http://127.0.0.1:1234/v1/chat/completions',
    apiKeyEnv: '',
    models: [],
    costPerK: { input: 0, output: 0 },
    tier: 'free',
    format: 'openai',
    type: 'local',
    priority: 2,
    maxTokens: 8192,
  },

  vllm: {
    id: 'vllm',
    name: 'vLLM',
    baseUrl: 'http://127.0.0.1:8000/v1/chat/completions',
    apiKeyEnv: '',
    models: [],
    costPerK: { input: 0, output: 0 },
    tier: 'free',
    format: 'openai',
    type: 'local',
    priority: 3,
    maxTokens: 8192,
  },

  google: {
    id: 'google',
    name: 'Google AI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKeyEnv: 'GOOGLE_API_KEY',
    models: [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemma-3-27b-it',
    ],
    costPerK: { input: 0, output: 0 }, // Free tier available
    tier: 'free',
    format: 'google',
    type: 'api',
    priority: 4,
    maxTokens: 8192,
    supports_multimodal: true,  // Gemini supports vision, video, audio
    strategy: 'balanced',  // Good quality, reasonable cost, multimodal
  },

  // ========================================================================
  // TIER: CHEAP / FAST (inference-optimized)
  // ========================================================================
  groq: {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    apiKeyEnv: 'GROQ_API_KEY',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3-32b',
      'meta-llama/llama-4-scout-17b-16e-instruct',
    ],
    costPerK: { input: 0.59, output: 0.79 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 5,
    maxTokens: 8192,
  },

  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1/chat/completions',
    apiKeyEnv: 'CEREBRAS_API_KEY',
    models: [
      'llama3.1-8b',
      'llama-3.3-70b',
      'qwen-3-235b-a22b-instruct-2507',
      'gpt-oss-120b',
      'zai-glm-4.7',
    ],
    costPerK: { input: 0.6, output: 0.6 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 6,
    maxTokens: 8192,
  },

  deepinfra: {
    id: 'deepinfra',
    name: 'DeepInfra',
    baseUrl: 'https://api.deepinfra.com/v1/openai/chat/completions',
    apiKeyEnv: 'DEEPINFRA_API_KEY',
    models: [
      'meta-llama/Meta-Llama-3.1-8B-Instruct',
      'meta-llama/Meta-Llama-3.1-70B-Instruct',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen2.5-72B-Instruct',
      'google/gemma-2-27b-it',
    ],
    costPerK: { input: 0.05, output: 0.05 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 7,
    maxTokens: 8192,
  },

  together: {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1/chat/completions',
    apiKeyEnv: 'TOGETHER_API_KEY',
    models: [
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen2.5-72B-Instruct-Turbo',
      'google/gemma-2-27b-it',
    ],
    costPerK: { input: 0.18, output: 0.18 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 8,
    maxTokens: 8192,
  },

  fireworks: {
    id: 'fireworks',
    name: 'Fireworks AI',
    baseUrl: 'https://api.fireworks.ai/inference/v1/chat/completions',
    apiKeyEnv: 'FIREWORKS_API_KEY',
    models: [
      'accounts/fireworks/models/llama-v3p1-8b-instruct',
      'accounts/fireworks/models/llama-v3p1-70b-instruct',
      'accounts/fireworks/models/mixtral-8x7b-instruct',
      'accounts/fireworks/models/qwen2p5-72b-instruct',
    ],
    costPerK: { input: 0.2, output: 0.2 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 9,
    maxTokens: 8192,
  },

  novita: {
    id: 'novita',
    name: 'Novita AI',
    baseUrl: 'https://api.novita.ai/v3/openai/chat/completions',
    apiKeyEnv: 'NOVITA_API_KEY',
    models: [
      'meta-llama/llama-3.1-8b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      'Qwen/Qwen2.5-72B-Instruct',
    ],
    costPerK: { input: 0.06, output: 0.06 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 10,
    maxTokens: 8192,
  },

  sambanova: {
    id: 'sambanova',
    name: 'SambaNova',
    baseUrl: 'https://api.sambanova.ai/v1/chat/completions',
    apiKeyEnv: 'SAMBANOVA_API_KEY',
    models: [
      'Meta-Llama-3.1-8B-Instruct',
      'Meta-Llama-3.1-70B-Instruct',
    ],
    costPerK: { input: 0.1, output: 0.1 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 11,
    maxTokens: 8192,
  },

  anyscale: {
    id: 'anyscale',
    name: 'Anyscale',
    baseUrl: 'https://api.endpoints.anyscale.com/v1/chat/completions',
    apiKeyEnv: 'ANYSCALE_API_KEY',
    models: [
      'meta-llama/Meta-Llama-3.1-8B-Instruct',
      'meta-llama/Meta-Llama-3.1-70B-Instruct',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
    ],
    costPerK: { input: 0.15, output: 0.15 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 12,
    maxTokens: 8192,
  },

  replicate: {
    id: 'replicate',
    name: 'Replicate',
    baseUrl: 'https://api.replicate.com/v1/chat/completions',
    apiKeyEnv: 'REPLICATE_API_KEY',
    models: [
      'meta/llama-2-70b-chat',
      'mistralai/mixtral-8x7b-instruct-v0.1',
    ],
    costPerK: { input: 0.2, output: 0.2 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 13,
    maxTokens: 8192,
  },

  // ========================================================================
  // TIER: MID (good quality/price ratio)
  // ========================================================================
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    models: ['deepseek-v4-flash', 'deepseek-v4-pro'],
    costPerK: { input: 0.14, output: 0.28 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 14,
    maxTokens: 8192,
  },

  mistral: {
    id: 'mistral',
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1/chat/completions',
    apiKeyEnv: 'MISTRAL_API_KEY',
    models: [
      'mistral-small-latest',
      'mistral-medium-latest',
      'mistral-large-latest',
      'mistral-small-2506',
      'devstral-small-2507',
      'ministral-3b-latest',
      'ministral-8b-latest',
      'codestral-latest',
      'open-mistral-nemo',
    ],
    costPerK: { input: 0.2, output: 0.6 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 15,
    maxTokens: 8192,
  },

  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    baseUrl: 'https://api.perplexity.ai/chat/completions',
    apiKeyEnv: 'PERPLEXITY_API_KEY',
    models: [
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'sonar-pro',
    ],
    costPerK: { input: 1.0, output: 1.0 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 16,
    maxTokens: 8192,
  },

  cohere: {
    id: 'cohere',
    name: 'Cohere',
    baseUrl: 'https://api.cohere.ai/v1/chat/completions',
    apiKeyEnv: 'COHERE_API_KEY',
    models: ['command-r-plus', 'command-r', 'command-a-03-2025'],
    costPerK: { input: 2.5, output: 10 },
    tier: 'mid',
    format: 'cohere',
    type: 'api',
    priority: 17,
    maxTokens: 8192,
  },

  ai21: {
    id: 'ai21',
    name: 'AI21 Labs',
    baseUrl: 'https://api.ai21.com/studio/v1/chat/completions',
    apiKeyEnv: 'AI21_API_KEY',
    models: ['jamba-1.5-mini', 'jamba-1.5-large'],
    costPerK: { input: 0.2, output: 0.4 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 18,
    maxTokens: 8192,
  },

  // ========================================================================
  // TIER: PREMIUM (high-quality frontier models)
  // ========================================================================
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    apiKeyEnv: 'OPENAI_API_KEY',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'o1-preview',
      'o1-mini',
    ],
    costPerK: { input: 2.5, output: 10 },
    tier: 'premium',
    format: 'openai',
    type: 'api',
    priority: 19,
    maxTokens: 8192,
    strategy: 'conservative',  // High cost, lowest variance
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    models: [
      'claude-sonnet-4-20250514',
      'claude-3.5-sonnet',
      'claude-3-opus',
      'claude-3-haiku',
    ],
    costPerK: { input: 3, output: 15 },
    tier: 'premium',
    format: 'anthropic',
    type: 'api',
    priority: 20,
    maxTokens: 8192,
    strategy: 'conservative',  // Highest cost, minimal errors
  },

  xai: {
    id: 'xai',
    name: 'xAI',
    baseUrl: 'https://api.x.ai/v1/chat/completions',
    apiKeyEnv: 'XAI_API_KEY',
    models: ['grok-3', 'grok-3-mini', 'grok-2', 'grok-2-mini'],
    costPerK: { input: 3.0, output: 15.0 },
    tier: 'premium',
    format: 'openai',
    type: 'api',
    priority: 21,
    maxTokens: 8192,
  },

  // ========================================================================
  // TIER: ENTERPRISE (cloud-managed models)
  // ========================================================================
  azure_openai: {
    id: 'azure_openai',
    name: 'Azure OpenAI',
    baseUrl: 'https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions',
    apiKeyEnv: 'AZURE_OPENAI_API_KEY',
    models: ['gpt-4', 'gpt-35-turbo', 'gpt-4o'],
    costPerK: { input: 3.0, output: 12.0 },
    tier: 'enterprise',
    format: 'openai',
    type: 'api',
    priority: 22,
    maxTokens: 8192,
  },

  bedrock: {
    id: 'bedrock',
    name: 'AWS Bedrock',
    baseUrl: '',
    apiKeyEnv: 'AWS_ACCESS_KEY_ID',
    models: [
      'anthropic.claude-3-sonnet',
      'anthropic.claude-3-haiku',
      'meta.llama3-1-8b',
      'meta.llama3-1-70b',
      'mistral.mixtral-8x7b',
    ],
    costPerK: { input: 3.0, output: 15.0 },
    tier: 'enterprise',
    format: 'aws-bedrock',
    type: 'api',
    priority: 23,
    maxTokens: 8192,
  },

  vertex: {
    id: 'vertex',
    name: 'Google Vertex AI',
    baseUrl: '',
    apiKeyEnv: 'GOOGLE_APPLICATION_CREDENTIALS',
    models: [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'claude-3-sonnet',
      'claude-3-haiku',
    ],
    costPerK: { input: 1.25, output: 5.0 },
    tier: 'enterprise',
    format: 'google-vertex',
    type: 'api',
    priority: 24,
    maxTokens: 8192,
  },

  // ========================================================================
  // ASIAN PROVIDERS
  // ========================================================================
  zhipu: {
    id: 'zhipu',
    name: 'Zhipu AI (GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    apiKeyEnv: 'ZHIPU_API_KEY',
    models: ['glm-4-flash', 'glm-4-plus', 'glm-4-air', 'glm-4-long'],
    costPerK: { input: 0.1, output: 0.1 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 25,
    maxTokens: 8192,
  },

  moonshot: {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    apiKeyEnv: 'MOONSHOT_API_KEY',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    costPerK: { input: 0.14, output: 0.14 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 26,
    maxTokens: 8192,
  },

  qwen: {
    id: 'qwen',
    name: 'Alibaba Qwen (DashScope)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKeyEnv: 'DASHSCOPE_API_KEY',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-long'],
    costPerK: { input: 0.4, output: 1.2 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 27,
    maxTokens: 8192,
  },

  yi: {
    id: 'yi',
    name: 'Yi (01.AI)',
    baseUrl: 'https://api.lingyiwanwu.com/v1/chat/completions',
    apiKeyEnv: 'YI_API_KEY',
    models: ['yi-lightning', 'yi-large', 'yi-medium', 'yi-spark'],
    costPerK: { input: 0.2, output: 0.2 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 28,
    maxTokens: 8192,
  },

  baichuan: {
    id: 'baichuan',
    name: 'Baichuan',
    baseUrl: 'https://api.baichuan-ai.com/v1/chat/completions',
    apiKeyEnv: 'BAICHUAN_API_KEY',
    models: ['Baichuan4', 'Baichuan3-Turbo', 'Baichuan3-Turbo-128k'],
    costPerK: { input: 0.2, output: 0.2 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 29,
    maxTokens: 8192,
  },

  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    apiKeyEnv: 'MINIMAX_API_KEY',
    models: ['MiniMax-Text-01', 'abab6.5s-chat'],
    costPerK: { input: 0.1, output: 0.1 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 30,
    maxTokens: 8192,
  },

  stepfun: {
    id: 'stepfun',
    name: 'StepFun',
    baseUrl: 'https://api.stepfun.com/v1/chat/completions',
    apiKeyEnv: 'STEPFUN_API_KEY',
    models: ['step-1-8k', 'step-1-32k', 'step-2-16k'],
    costPerK: { input: 0.2, output: 0.2 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 31,
    maxTokens: 8192,
  },

  // ========================================================================
  // EUROPEAN PROVIDERS
  // ========================================================================
  alephalpha: {
    id: 'alephalpha',
    name: 'Aleph Alpha',
    baseUrl: 'https://api.aleph-alpha.com/v1/chat/completions',
    apiKeyEnv: 'ALEPH_ALPHA_API_KEY',
    models: ['luminous-base', 'luminous-extended', 'luminous-supreme'],
    costPerK: { input: 2.0, output: 2.0 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 32,
    maxTokens: 8192,
  },

  deepset: {
    id: 'deepset',
    name: 'Deepset',
    baseUrl: 'https://api.deepset.ai/v1/chat/completions',
    apiKeyEnv: 'DEEPSET_API_KEY',
    models: ['gpt-4', 'claude-3-sonnet'],
    costPerK: { input: 3.0, output: 12.0 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 33,
    maxTokens: 8192,
  },

  // ========================================================================
  // OPEN ROUTER / AGGREGATORS
  // ========================================================================
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    models: [
      // ✅ VERIFIED WORKING FREE MODELS (tested 2026-08-16 + recheck)
      // Premium-tier free models (high context, powerful)
      'nvidia/nemotron-3.5-lightning:free',     // 1M context, reasoning
      'nvidia/nemotron-3-ultra-550b-a55b:free',  // 1M context, premium quality
      'nvidia/nemotron-3-super-120b-a12b:free',  // 262K context
      'google/gemma-4-31b-it:free',            // 262K context, multilingual
      'google/gemma-4-26b-a4b-it:free',        // 262K context
      // Reasoning-capable models
      'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',  // 256K, reasoning
      // Mid-tier free models
      'nvidia/nemotron-3-nano-30b-a3b:free',  // 256K context
      'nvidia/nemotron-nano-9b-v2:free',      // 128K context
      'nvidia/nemotron-nano-12b-v2-vl:free',  // 128K context, multimodal
      // Auto-route free model
      'openrouter/free',                       // Auto-selects best available free model
      // ❌ REMOVED (unavailable): kimi-k2.6, qwen3-coder, qwen3-next, hermes-3-405b, gpt-oss-120b, llama-3.3-70b, laguna-s-2.1
      // FREE Gemini 3.x (newer, better than 2.x)
      'google/gemini-3.5-flash:free',        // 131K context, reasoning, free
      'google/gemini-3.6-flash:free',        // 131K context, reasoning, free
      // FREE Qwen 3.7 (latest Qwen with extended context)
      'qwen/qwen3.7-flash:free',             // 131K context, reasoning, free
      'qwen/qwen3.7-max:free',               // 131K context, reasoning, free
      // FREE DeepSeek V4 Flash
      'deepseek/deepseek-v4-flash-latest:free', // 131K context, reasoning, free
      // Paid models (passthrough pricing)
      'openai/gpt-4o',
      'anthropic/claude-3.5-sonnet',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-70b-instruct',
      'mistralai/mistral-large',
    ],
    costPerK: { input: 0, output: 0 }, // Free tier models cost 0; paid use passthrough
    tier: 'mid',  // Changed from 'cheap' — premium free models are mid-tier quality
    format: 'openai',
    type: 'api',
    priority: 34,
    maxTokens: 1048576,  // Support 1M context for nemotron-3.5-lightning
    strategy: 'balanced',
  },

  // ========================================================================
  // CLI PROVIDERS (local tools)
  // ========================================================================
  opencode: {
    id: 'opencode',
    name: 'OpenCode',
    baseUrl: '',
    apiKeyEnv: '',
    cliCommand: 'opencode',
    models: [],
    costPerK: { input: 0, output: 0 },
    tier: 'free',
    format: 'openai',
    type: 'cli',
    priority: 35,
    maxTokens: 8192,
  },

  commandcode: {
    id: 'commandcode',
    name: 'CommandCode',
    baseUrl: 'https://api.commandcode.ai/v1/chat/completions',
    apiKeyEnv: 'COMMANDCODE_API_KEY',
    models: ['taste-1'],
    costPerK: { input: 0, output: 0 },
    tier: 'free',
    format: 'openai',
    type: 'cli',
    cliCommand: 'commandcode',
    priority: 36,
    maxTokens: 8192,
  },

  // ========================================================================
  // NVIDIA NIM (free tier via NVIDIA API key)
  // ========================================================================
  nvidia: {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    apiKeyEnv: 'NVIDIA_API_KEY',
    models: [
      'meta/llama-3.1-8b-instruct',
      'meta/llama-3.3-70b-instruct',
      'meta/llama-4-maverick-17b-128e-instruct',
      'nvidia/nemotron-mini-4b-instruct',
      'nvidia/nemotron-3-super-120b-a12b',
      'google/gemma-4-31b-it',
      'qwen/qwen3.5-397b-a17b',
      'minimaxai/minimax-m2.7',
      'mistralai/mistral-large-3-675b-instruct-2512',
      'z-ai/glm-5.1',
    ],
    costPerK: { input: 0, output: 0 },  // Free tier available
    tier: 'free',
    format: 'openai',
    type: 'api',
    priority: 4,
    maxTokens: 131072,  // Support long context for premium models
    strategy: 'balanced',
  },

  // ========================================================================
  // CLOUDFLARE WORKERS AI (global edge network, free tier)
  // ========================================================================
  cloudflare: {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    baseUrl: 'https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/run',
    apiKeyEnv: 'CLOUDFLARE_API_TOKEN',
    models: [
      '@cf/meta/llama-3.1-8b-instruct',
      '@cf/meta/llama-3.3-70b-instruct',
      '@cf/meta/llama-3.1-70b-instruct',
      '@cf/qwen/qwen2.5-72b-instruct',
      '@cf/qwen/qwen2.5-32b-instruct',
      '@cf/mistral/mistral-7b-instruct-v0.2',
      '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
      '@cf/thebloke/llama-2-13b-chat-awq',
      '@cf/google/gemma-2-27b-it',
      '@cf/fb/detr-image-model',
    ],
    costPerK: { input: 0, output: 0 }, // Free tier available
    tier: 'free',
    format: 'openai',
    type: 'api',
    priority: 4,
    maxTokens: 8192,
    strategy: 'balanced',
  },

  // ========================================================================
  // HUGGINGFACE INFERENCE API (largest model hub)
  // ========================================================================
  huggingface: {
    id: 'huggingface',
    name: 'HuggingFace Inference',
    baseUrl: 'https://api-inference.huggingface.co/v1/chat/completions',
    apiKeyEnv: 'HF_TOKEN',
    models: [
      'meta-llama/Llama-3.1-8B-Instruct',
      'meta-llama/Llama-3.3-70B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.2',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen2.5-72B-Instruct',
      'Qwen/Qwen2.5-32B-Instruct',
      'Qwen/Qwen2.5-14B-Instruct',
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
      'google/gemma-2-27b-it',
      'google/gemma-2-9b-it',
      'anthropic/claude-3.5-sonnet',
      'meta-llama/Llama-4-Maverick-17B-128E-Instruct',
      'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
    ],
    costPerK: { input: 0.06, output: 0.06 }, // Free tier available
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 8,
    maxTokens: 32768,
    strategy: 'balanced',
  },

  // ========================================================================
  // MODAL (serverless GPU compute)
  // ========================================================================
  modal: {
    id: 'modal',
    name: 'Modal',
    baseUrl: 'https://api.modal.com/v1/chat/completions',
    apiKeyEnv: 'MODAL_API_TOKEN',
    models: [
      'meta-llama/Llama-3.1-8B-Instruct',
      'meta-llama/Llama-3.3-70B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.2',
      'Qwen/Qwen2.5-72B-Instruct',
    ],
    costPerK: { input: 0, output: 0 }, // Pay-per-second GPU compute
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 9,
    maxTokens: 16384,
    strategy: 'aggressive',
  },

  // ========================================================================
  // LEPTON AI (serverless, competitive pricing)
  // ========================================================================
  lepton: {
    id: 'lepton',
    name: 'Lepton AI',
    baseUrl: 'https://api.lepton.ai/v1/chat/completions',
    apiKeyEnv: 'LEPTON_API_TOKEN',
    models: [
      'llama-3.1-8b',
      'llama-3.1-70b',
      'mixtral-8x7b',
      'qwen2.5-72b',
      'qwen2.5-32b',
      'gemma-2-27b',
    ],
    costPerK: { input: 0.08, output: 0.08 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 9,
    maxTokens: 16384,
    strategy: 'balanced',
  },

  // ========================================================================
  // BASETEN (model deployment platform)
  // ========================================================================
  baseten: {
    id: 'baseten',
    name: 'Baseten',
    baseUrl: 'https://api.baseten.co/v1/chat/completions',
    apiKeyEnv: 'BASETEN_API_KEY',
    models: [
      'llama-3.1-8b-instruct',
      'llama-3.1-70b-instruct',
      'mixtral-8x7b-instruct',
      'wizardlm-2-8x22b',
    ],
    costPerK: { input: 0.5, output: 0.5 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 18,
    maxTokens: 8192,
  },

  // ========================================================================
  // RUNPOD (serverless inference)
  // ========================================================================
  runpod: {
    id: 'runpod',
    name: 'RunPod Serverless',
    baseUrl: 'https://api.runpod.ai/v2/{endpoint_id}/openai/v1/chat/completions',
    apiKeyEnv: 'RUNPOD_API_KEY',
    models: [
      'meta-llama/Llama-3.1-8B-Instruct',
      'meta-llama/Llama-3.3-70B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.2',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen2.5-72B-Instruct',
    ],
    costPerK: { input: 0.2, output: 0.2 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 10,
    maxTokens: 16384,
  },

  // ========================================================================
  // PREDIBASE (managed fine-tuning + inference)
  // ========================================================================
  predibase: {
    id: 'predibase',
    name: 'Predibase',
    baseUrl: 'https://serving.predibase.com/{workspace}/v2/predict',
    apiKeyEnv: 'PREDIBASE_API_KEY',
    models: [
      'llama-3.1-8b-instruct',
      'llama-3.1-70b-instruct',
      'mistral-7b-instruct',
      'mixtral-8x7b-instruct',
      'llama-2-70b-chat',
    ],
    costPerK: { input: 0.4, output: 0.4 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 19,
    maxTokens: 8192,
  },

  // ========================================================================
  // FEATHERLESS AI (inference optimization platform)
  // ========================================================================
  featherless: {
    id: 'featherless',
    name: 'Featherless AI',
    baseUrl: 'https://api.featherless.ai/v1/chat/completions',
    apiKeyEnv: 'FEATHERLESS_API_KEY',
    models: [
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.1-70b-instruct',
      'mistralai/mistral-large-3-675b-instruct',
    ],
    costPerK: { input: 1.0, output: 2.0 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 18,
    maxTokens: 8192,
  },

  // ========================================================================
  // ABACUS AI (end-to-end ML platform)
  // ========================================================================
  abacus: {
    id: 'abacus',
    name: 'Abacus AI',
    baseUrl: 'https://api.abacus.ai/v1/chat/completions',
    apiKeyEnv: 'ABACUS_API_KEY',
    models: [
      'Llama-3.1-8B-Instruct',
      'Llama-3.1-70B-Instruct',
      'Mistral-7B-Instruct',
      'Mixtral-8x7B-Instruct',
      'Qwen2.5-72B-Instruct',
      'GPT-4o-mini',
      'Claude-3.5-Sonnet',
    ],
    costPerK: { input: 0.15, output: 0.15 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 11,
    maxTokens: 8192,
  },

  // ========================================================================
  // STABILITY AI (image + language models)
  // ========================================================================
  stability: {
    id: 'stability',
    name: 'Stability AI',
    baseUrl: 'https://api.stability.ai/v1/chat/completions',
    apiKeyEnv: 'STABILITY_API_KEY',
    models: [
      'stable-diffusion-xl-base-1.0',
      'stable-diffusion-3-medium',
      'stable-diffusion-core',
    ],
    costPerK: { input: 0.5, output: 0.5 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 20,
    maxTokens: 8192,
    supports_multimodal: true,
  },

  // ========================================================================
  // HYPERBOLIC LABS (compute marketplace)
  // ========================================================================
  hyperbolic: {
    id: 'hyperbolic',
    name: 'Hyperbolic',
    baseUrl: 'https://api.hyperbolic.xyz/v1/chat/completions',
    apiKeyEnv: 'HYPERBOLIC_API_KEY',
    models: [
      'meta-llama/Llama-3.1-8B-Instruct',
      'meta-llama/Llama-3.1-70B-Instruct',
      'meta-llama/Llama-3.1-405B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.2',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen2.5-72B-Instruct',
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1',
    ],
    costPerK: { input: 0.08, output: 0.08 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 9,
    maxTokens: 32768,
    strategy: 'aggressive',
  },

  // ========================================================================
  // TEXTSYNTH (inference API)
  // ========================================================================
  textsynth: {
    id: 'textsynth',
    name: 'TextSynth',
    baseUrl: 'https://api.textsynth.com/v1/chat/completions',
    apiKeyEnv: 'TEXTSYNTH_API_KEY',
    models: [
      'llama-3.1-8b-instruct',
      'llama-3.1-70b-instruct',
      'mixtral-8x7b',
      'gemma-2-27b',
    ],
    costPerK: { input: 0.1, output: 0.1 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 11,
    maxTokens: 8192,
  },

  // ========================================================================
  // INSTILL AI (v3 API, open source)
  // ========================================================================
  instill: {
    id: 'instill',
    name: 'Instill AI',
    baseUrl: 'https://api.instill.ai/v1alpha/v1/chat/completions',
    apiKeyEnv: 'INSTILL_API_KEY',
    models: [
      'meta-llama/llama-3.1-8b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      'mistralai/mistral-7b-instruct-v0.2',
      'qwen/qwen2.5-72b-instruct',
    ],
    costPerK: { input: 0.2, output: 0.2 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 20,
    maxTokens: 8192,
  },

  // ========================================================================
  // SILICONFLOW (China-based inference platform)
  // ========================================================================
  siliconflow: {
    id: 'siliconflow',
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    apiKeyEnv: 'SILICONFLOW_API_KEY',
    models: [
      'Qwen/Qwen2.5-72B-Instruct',
      'Qwen/Qwen2.5-32B-Instruct',
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
      'meta-llama/Llama-3.1-70B-Instruct',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
    ],
    costPerK: { input: 0.04, output: 0.04 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 9,
    maxTokens: 16384,
    strategy: 'aggressive',
  },

  // ========================================================================
  // HYPERSTACK (GPU compute marketplace)
  // ========================================================================
  hyperstack: {
    id: 'hyperstack',
    name: 'Hyperstack',
    baseUrl: 'https://api.hyperstack.cloud/v1/chat/completions',
    apiKeyEnv: 'HYPERSTACK_API_KEY',
    models: [
      'meta-llama/Llama-3.1-8B-Instruct',
      'meta-llama/Llama-3.1-70B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.2',
      'Qwen/Qwen2.5-72B-Instruct',
    ],
    costPerK: { input: 0.1, output: 0.1 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 11,
    maxTokens: 16384,
  },

  // ========================================================================
  // LIVEPEOPLE (real-time conversational AI)
  // ========================================================================
  livepeople: {
    id: 'livepeople',
    name: 'LivePeople',
    baseUrl: 'https://api.livepeople.ai/v1/chat/completions',
    apiKeyEnv: 'LIVEPEOPLE_API_KEY',
    models: [
      'livepeople-gpt-4o-mini',
      'livepeople-gpt-4o',
      'livepeople-claude-3-opus',
    ],
    costPerK: { input: 1.0, output: 2.0 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 22,
    maxTokens: 8192,
  },

  // ========================================================================
  // YANDEX CLOUD (Yandex GPT)
  // ========================================================================
  yandex: {
    id: 'yandex',
    name: 'Yandex Cloud',
    baseUrl: 'https://llm.api.cloud.yandex.net/foundationModels/v1/conversation',
    apiKeyEnv: 'YANDEX_API_KEY',
    models: [
      'gpt-4o-mini',
      'yandexgpt-4',
      'yandexgpt-3',
      'yandexgpt-light',
    ],
    costPerK: { input: 0.3, output: 0.3 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 21,
    maxTokens: 8192,
  },

  // ========================================================================
  // TENCent Hunyuan (Tencent Cloud)
  // ========================================================================
  tencent: {
    id: 'tencent',
    name: 'Tencent Hunyuan',
    baseUrl: 'https://api.tc.semnov.com/v1/chat/completions',
    apiKeyEnv: 'TENCENT_SECRET_ID',
    models: [
      'hunyuan-pro',
      'hunyuan-standard',
      'hunyuan-lite',
    ],
    costPerK: { input: 0.06, output: 0.06 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 12,
    maxTokens: 8192,
    strategy: 'balanced',
  },

  // ========================================================================
  // VOLCENGINE (ByteDance AI platform)
  // ========================================================================
  volcengine: {
    id: 'volcengine',
    name: 'VolcEngine (Doubao)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKeyEnv: 'VOLCENGINE_API_KEY',
    models: [
      'doubao-pro-32k',
      'doubao-pro-128k',
      'doubao-lite-32k',
      'doubao-edge-4k',
    ],
    costPerK: { input: 0.1, output: 0.1 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 13,
    maxTokens: 128000,
    strategy: 'balanced',
  },

  // ========================================================================
  // BAIDU QIANFAN (Baidu Cloud)
  // ========================================================================
  baidu: {
    id: 'baidu',
    name: 'Baidu Qianfan',
    baseUrl: 'https://qianfan.baidubce.com/v2/chat/completions',
    apiKeyEnv: 'BAIDU_QIANFAN_API_KEY',
    models: [
      'ernie-4.0-8k-latest',
      'ernie-4.0-128k',
      'ernie-3.5-8k-pro',
      'ernie-speed-128k',
      'ernie-speed-pro-128k',
      'ernie-lite-8k',
    ],
    costPerK: { input: 0.3, output: 0.6 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 20,
    maxTokens: 128000,
  },

  // ========================================================================
  // KUAISHOU (Kling AI video + text)
  // ========================================================================
  kuaishou: {
    id: 'kuaishou',
    name: 'Kuaishou (Kling)',
    baseUrl: 'https://api.kuaishou.com/v2/chat/completions',
    apiKeyEnv: 'KUAISHOU_API_KEY',
    models: [
      'kling-2.0-pro',
      'kling-2.0-standard',
      'kling-1.6-lite',
    ],
    costPerK: { input: 0.1, output: 0.1 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 13,
    maxTokens: 8192,
    supports_multimodal: true,
  },

  // ========================================================================
  // 360 AI (360 Cloud Brain)
  // ========================================================================
  ai360: {
    id: 'ai360',
    name: '360 AI',
    baseUrl: 'https://ai.360.cn/v1/chat/completions',
    apiKeyEnv: 'AI360_API_KEY',
    models: [
      '360gpt-pro',
      '360gpt-s2-ultra',
      '360gpt-t2-pro',
    ],
    costPerK: { input: 0.1, output: 0.1 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 14,
    maxTokens: 8192,
  },

  // ========================================================================
  // NAVER CLOUD (Clova)
  // ========================================================================
  naver: {
    id: 'naver',
    name: 'Naver Clova',
    baseUrl: 'https://clovastudio.ncloud.com/v1/api/chat-completions',
    apiKeyEnv: 'NAVER_CLIENT_ID',
    models: [
      'clova-x',
      'hyperspace-1.5',
      'clova-cx',
    ],
    costPerK: { input: 0.5, output: 1.0 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 21,
    maxTokens: 8192,
    strategy: 'conservative',
  },

  // ========================================================================
  // KAKAO BRAIN (KoChat)
  // ========================================================================
  kakao: {
    id: 'kakao',
    name: 'Kakao Brain',
    baseUrl: 'https://api.kakaobrain.com/v1/chat/completions',
    apiKeyEnv: 'KAKAO_API_KEY',
    models: [
      'kochat-2-pro',
      'kochat-2-ultra',
      'kochat-1.8b',
      'kochat-6b',
    ],
    costPerK: { input: 0.2, output: 0.2 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 22,
    maxTokens: 8192,
  },

  // ========================================================================
  // SAGEMAKER (AWS SageMaker Endpoints)
  // ========================================================================
  sagemaker: {
    id: 'sagemaker',
    name: 'AWS SageMaker',
    baseUrl: 'https://runtime.sagemaker.{region}.amazonaws.com/endpoint/{endpoint_name}/invocations',
    apiKeyEnv: 'AWS_ACCESS_KEY_ID',
    models: [], // User configures their own endpoints
    costPerK: { input: 0, output: 0 }, // User-defined pricing
    tier: 'enterprise',
    format: 'openai',
    type: 'api',
    priority: 30,
    maxTokens: 8192,
  },

  // ========================================================================
  // SCALE AI (Scale Nucleus + API)
  // ========================================================================
  scale: {
    id: 'scale',
    name: 'Scale AI',
    baseUrl: 'https://api.scale.com/v1/chat/completions',
    apiKeyEnv: 'SCALE_API_KEY',
    models: [
      'scale-gpt-4o',
      'scale-claude-3-opus',
    ],
    costPerK: { input: 2.0, output: 10.0 },
    tier: 'premium',
    format: 'openai',
    type: 'api',
    priority: 25,
    maxTokens: 8192,
  },

  // ========================================================================
  // TITANIUM NETWORK (AI Gateway)
  // ========================================================================
  titanium: {
    id: 'titanium',
    name: 'Titanium Network',
    baseUrl: 'https://api.titaniumapi.dev/v1/chat/completions',
    apiKeyEnv: 'TITANIUM_API_KEY',
    models: [
      'gpt-4o-mini',
      'gpt-4o',
      'claude-3-haiku',
      'claude-3-sonnet',
    ],
    costPerK: { input: 0.3, output: 0.3 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 16,
    maxTokens: 8192,
  },

  // ========================================================================
  // ANTHROPIC via AWS (Bedrock Claude on AWS)
  // ========================================================================
  bedrock_anthropic: {
    id: 'bedrock_anthropic',
    name: 'AWS Bedrock (Anthropic)',
    baseUrl: 'https://bedrock-runtime.{region}.amazonaws.com/model/anthropic.claude-3-5-sonnet-20241022/invoke',
    apiKeyEnv: 'AWS_ACCESS_KEY_ID',
    models: [
      'anthropic.claude-3-5-sonnet-20241022',
      'anthropic.claude-3-opus-20240307',
      'anthropic.claude-3-sonnet-20240229',
      'anthropic.claude-3-haiku-20240307',
    ],
    costPerK: { input: 3.0, output: 15.0 },
    tier: 'enterprise',
    format: 'openai',
    type: 'api',
    priority: 23,
    maxTokens: 8192,
    strategy: 'conservative',
  },

  // ========================================================================
  // OPENAI via Azure (already have azure_openai, this is direct Azure OpenAI)
  // ========================================================================
  azure_openai_direct: {
    id: 'azure_openai_direct',
    name: 'Azure OpenAI (Direct)',
    baseUrl: 'https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions',
    apiKeyEnv: 'AZURE_OPENAI_API_KEY',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-35-turbo',
    ],
    costPerK: { input: 2.5, output: 10.0 },
    tier: 'enterprise',
    format: 'openai',
    type: 'api',
    priority: 22,
    maxTokens: 128000,
    strategy: 'conservative',
  },

  // ========================================================================
  // AIZEL CLOUD (Russian AI platform)
  // ========================================================================
  aizel: {
    id: 'aizel',
    name: 'Aizel Cloud',
    baseUrl: 'https://api.aizel.ai/v1/chat/completions',
    apiKeyEnv: 'AIZEL_API_KEY',
    models: [
      'aizel-8b',
      'aizel-72b',
      'aizel-claude',
    ],
    costPerK: { input: 0.15, output: 0.15 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 15,
    maxTokens: 8192,
  },

  // ========================================================================
  // SKYFIRE (AI API aggregator)
  // ========================================================================
  skyfire: {
    id: 'skyfire',
    name: 'SkyFire',
    baseUrl: 'https://api.skyfireai.com/v1/chat/completions',
    apiKeyEnv: 'SKYFIRE_API_KEY',
    models: [
      'skyfire-gpt-4o-mini',
      'skyfire-claude-3-sonnet',
      'skyfire-gemini-pro',
      'skyfire-llama-3.1-70b',
    ],
    costPerK: { input: 0.5, output: 0.5 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 18,
    maxTokens: 8192,
  },

  // ========================================================================
  // POE (Quora's AI platform with 1000s of models)
  // ========================================================================
  poe: {
    id: 'poe',
    name: 'Poe API',
    baseUrl: 'https://api.poe.com/v1/chat/completions',
    apiKeyEnv: 'POE_API_KEY',
    models: [
      'GPT-4o',
      'Claude-3.5-Sonnet',
      'Claude-3-Opus',
      'Claude-3-Haiku',
      'Gemini-1.5-Pro',
      'Gemini-1.5-Flash',
      'Llama-3.1-405B',
      'Llama-3.1-70B',
      'Llama-3.1-8B',
      'Mixtral-8x22B',
      'Qwen-2.5-72B',
    ],
    costPerK: { input: 0.5, output: 0.5 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 17,
    maxTokens: 8192,
    strategy: 'balanced',
  },

  // ========================================================================
  // PHIND (AI search for developers)
  // ========================================================================
  phind: {
    id: 'phind',
    name: 'Phind',
    baseUrl: 'https://api.phind.com/agent/v1/chat/completions',
    apiKeyEnv: 'PHIND_API_KEY',
    models: [
      'phind-codestral-2501',
      'phind-nemo-2407',
      'claude-3.5-sonnet',
      'gpt-4o',
    ],
    costPerK: { input: 0.2, output: 0.2 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 12,
    maxTokens: 8192,
  },

  // ========================================================================
  // BANANA (serverless model inference)
  // ========================================================================
  banana: {
    id: 'banana',
    name: 'Banana',
    baseUrl: 'https://api.banana.dev/v1/chat/completions',
    apiKeyEnv: 'BANANA_API_KEY',
    models: [
      'llama-3.1-8b-instruct',
      'llama-3.1-70b-instruct',
      'mistral-7b-instruct',
      'mixtral-8x7b',
      'qwen2.5-72b',
    ],
    costPerK: { input: 0.2, output: 0.2 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 12,
    maxTokens: 8192,
  },

  // ========================================================================
  // FOREFRONT AI (enterprise AI platform)
  // ========================================================================
  forefront: {
    id: 'forefront',
    name: 'Forefront AI',
    baseUrl: 'https://api.forefront.ai/v1/chat/completions',
    apiKeyEnv: 'FOREAHEAD_API_KEY',
    models: [
      'gpt-4o-mini',
      'gpt-4o',
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku',
      'gemini-pro-1.5',
    ],
    costPerK: { input: 0.5, output: 1.0 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 18,
    maxTokens: 8192,
  },

  // ========================================================================
  // JASPER (AI copywriting)
  // ========================================================================
  jasper: {
    id: 'jasper',
    name: 'Jasper',
    baseUrl: 'https://api.jasper.ai/v1/chat/completions',
    apiKeyEnv: 'JASPER_API_KEY',
    models: [
      'jasper-gpt-4o',
      'jasper-claude-3-opus',
      'jasper-gemini-pro',
    ],
    costPerK: { input: 1.0, output: 2.0 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 24,
    maxTokens: 8192,
  },

  // ========================================================================
  // WRITESONIC (AI content generation)
  // ========================================================================
  writesonic: {
    id: 'writesonic',
    name: 'Writesonic',
    baseUrl: 'https://api.writesonic.com/v1/chat/completions',
    apiKeyEnv: 'WRITESONIC_API_KEY',
    models: [
      'claude-3-opus',
      'claude-3-sonnet',
      'gpt-4o',
      'gpt-4o-mini',
    ],
    costPerK: { input: 0.5, output: 1.0 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 23,
    maxTokens: 8192,
  },

  // ========================================================================
  // YOU.COM (AI-powered search)
  // ========================================================================
  you: {
    id: 'you',
    name: 'You.com',
    baseUrl: 'https://api.you.com/v1/chat/completions',
    apiKeyEnv: 'YOU_API_KEY',
    models: [
      'gpt-4o-mini',
      'claude-3-sonnet',
      'claude-3-haiku',
      'llama-3.1-70b',
    ],
    costPerK: { input: 0.3, output: 0.3 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 19,
    maxTokens: 8192,
  },

  // ========================================================================
  // KOMO AI (AI search engine)
  // ========================================================================
  komo: {
    id: 'komo',
    name: 'Komo AI',
    baseUrl: 'https://api.komo.ai/v1/chat/completions',
    apiKeyEnv: 'KOMO_API_KEY',
    models: [
      'komo-gpt-4o-mini',
      'komo-claude-3-haiku',
      'komo-llama-3.1-70b',
    ],
    costPerK: { input: 0.2, output: 0.2 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 14,
    maxTokens: 8192,
  },

  // ========================================================================
  // SHINE (AI platform - Chinese market)
  // ========================================================================
  shine: {
    id: 'shine',
    name: 'Shine AI',
    baseUrl: 'https://api.shineai.com/v1/chat/completions',
    apiKeyEnv: 'SHINE_API_KEY',
    models: [
      'shine-gpt-4o-mini',
      'shine-claude-3-haiku',
      'shine-qwen2.5-72b',
    ],
    costPerK: { input: 0.08, output: 0.08 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 14,
    maxTokens: 8192,
  },

  // ========================================================================
  // ZHIPU (already exists - adding GLM-4 variant for distinction)
  // Note: Already defined as 'zhipu' above. This section reserved.
  // ========================================================================

  // ========================================================================
  // AIDELabs (AI research platform)
  // ========================================================================
  aide: {
    id: 'aide',
    name: 'AIDE Labs',
    baseUrl: 'https://api.aidelabs.ai/v1/chat/completions',
    apiKeyEnv: 'AIDE_API_KEY',
    models: [
      'aide-gpt-4o-mini',
      'aide-claude-3-sonnet',
      'aide-llama-3.1-70b',
      'aide-qwen-72b',
    ],
    costPerK: { input: 0.1, output: 0.1 },
    tier: 'cheap',
    format: 'openai',
    type: 'api',
    priority: 14,
    maxTokens: 16384,
    strategy: 'balanced',
  },

  // ========================================================================
  // WRITER (enterprise AI writing platform)
  // ========================================================================
  writer: {
    id: 'writer',
    name: 'Writer API',
    baseUrl: 'https://api.writer.com/v1/chat/completions',
    apiKeyEnv: 'WRITER_API_KEY',
    models: [
      'palmyra-x',
      'palmyra-instruct',
      'palmyra-lora',
    ],
    costPerK: { input: 0.5, output: 1.0 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 24,
    maxTokens: 8192,
  },

  // ========================================================================
  // DBRX (Databricks DBRX model)
  // ========================================================================
  databricks: {
    id: 'databricks',
    name: 'Databricks',
    baseUrl: 'https://{workspace}.cloud.databricks.com/serving-endpoints/{endpoint}/invocations',
    apiKeyEnv: 'DATABRICKS_API_KEY',
    models: [
      'databricks-dbrx-instruct',
      'meta-llama-3-70b-instruct',
    ],
    costPerK: { input: 0.5, output: 0.5 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 25,
    maxTokens: 16384,
  },

  // ========================================================================
  // MISTRAL via LA PLATEFORME (French AI platform)
  // ========================================================================
  laplateforme: {
    id: 'laplateforme',
    name: 'La Plateforme',
    baseUrl: 'https://api.laplateforme.io/v1/chat/completions',
    apiKeyEnv: 'LAPLATEFORME_API_KEY',
    models: [
      'mistral-7b-instruct-v0.2',
      'mixtral-8x7b-instruct-v0.1',
      'mistral-large-2409',
      'pixtral-12b-2409',
    ],
    costPerK: { input: 0.24, output: 0.24 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 18,
    maxTokens: 32768,
  },

  // ========================================================================
  // UPSTAGE AI (Korean AI platform)
  // ========================================================================
  upstage: {
    id: 'upstage',
    name: 'Upstage',
    baseUrl: 'https://api.upstage.ai/v1/chat/completions',
    apiKeyEnv: 'UPSTAGE_API_KEY',
    models: [
      'solar-pro',
      'solar-mini',
      'solar-document-parse',
    ],
    costPerK: { input: 0.3, output: 0.6 },
    tier: 'mid',
    format: 'openai',
    type: 'api',
    priority: 22,
    maxTokens: 8192,
    strategy: 'conservative',
  },

  // ========================================================================
  // CLOUDFLARE WAITUNTIL (edge caching for semantic cache)
  // ========================================================================
  cloudflare_workers: {
    id: 'cloudflare_workers',
    name: 'Cloudflare Workers (Cache)',
    baseUrl: 'https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/script',
    apiKeyEnv: 'CLOUDFLARE_API_TOKEN',
    models: [],
    costPerK: { input: 0, output: 0 },
    tier: 'free',
    format: 'openai',
    type: 'api',
    priority: 50,
    maxTokens: 0,
  },
};

// ============================================================
// RUNTIME STATE
// ============================================================

let _registeredProviders: Record<string, ProviderDefinition> = { ...DEFAULT_PROVIDERS };
let _configLoaded = false;

// ============================================================
// CONFIGURATION LOADING
// ============================================================

export function loadConfig(configPath?: string): Record<string, ProviderDefinition> {
  const paths: string[] = [];

  if (configPath && fs.existsSync(configPath)) {
    paths.push(configPath);
  }

  const userConfig = path.join(
    process.env.HOME || process.env.USERPROFILE || '.',
    '.config', 'a3m-router', 'providers.json'
  );
  if (fs.existsSync(userConfig)) {
    paths.push(userConfig);
  }

  const projectConfig = path.join(process.cwd(), 'a3m-providers.json');
  if (fs.existsSync(projectConfig)) {
    paths.push(projectConfig);
  }

  for (const p of paths) {
    try {
      const raw = fs.readFileSync(p, 'utf-8');
      const config = JSON.parse(raw);
      if (config.providers) {
        for (const [id, provider] of Object.entries(config.providers)) {
          const prov = provider as Partial<ProviderDefinition>;
          if (_registeredProviders[id]) {
            _registeredProviders[id] = { ..._registeredProviders[id], ...prov };
          } else {
            _registeredProviders[id] = {
              id,
              type: 'api',
              priority: 50,
              maxTokens: 8192,
              costPerK: { input: 0, output: 0 },
              tier: 'mid',
              format: 'openai',
              models: [],
              name: id,
              baseUrl: '',
              apiKeyEnv: '',
              ...prov,
            } as ProviderDefinition;
          }
        }
      }
      _configLoaded = true;
      break;
    } catch {
      // Skip invalid config files
    }
  }

  // Load API keys from environment
  for (const provider of Object.values(_registeredProviders)) {
    if (provider.apiKeyEnv) {
      provider.apiKey = process.env[provider.apiKeyEnv] || null;
    }
  }

  return _registeredProviders;
}

export function getAvailableProviders(): Record<string, ProviderDefinition> {
  if (!_configLoaded) {
    loadConfig();
  }

  const available: Record<string, ProviderDefinition> = {};

  for (const [id, provider] of Object.entries(_registeredProviders)) {
    if (provider.type === 'api') {
      if (provider.apiKey) {
        available[id] = provider;
      }
    } else {
      available[id] = provider;
    }
  }

  return Object.entries(available)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .reduce((acc: Record<string, ProviderDefinition>, [k, v]) => { acc[k] = v; return acc; }, {});
}

// ============================================================
// RUNTIME REGISTRATION
// ============================================================

export function registerProvider(id: string, config: Partial<ProviderDefinition>): ProviderDefinition {
  _registeredProviders[id] = {
    id,
    name: config.name || id,
    baseUrl: config.baseUrl || '',
    apiKeyEnv: config.apiKeyEnv || '',
    type: 'api',
    priority: 50,
    maxTokens: 8192,
    costPerK: { input: 0, output: 0 },
    tier: 'mid',
    format: 'openai',
    models: [],
    ...config,
  } as ProviderDefinition;
  return _registeredProviders[id];
}

export function deregisterProvider(id: string): void {
  delete _registeredProviders[id];
}

export function updateProvider(id: string, updates: Partial<ProviderDefinition>): ProviderDefinition | null {
  if (_registeredProviders[id]) {
    _registeredProviders[id] = { ..._registeredProviders[id], ...updates };
    return _registeredProviders[id];
  }
  return null;
}

// ============================================================
// HEALTH CHECK
// ============================================================

export async function healthCheck(providerId: string): Promise<{
  healthy: boolean;
  error?: string;
  latency?: number;
  model?: string;
  type?: string;
}> {
  const provider = _registeredProviders[providerId];
  if (!provider) {
    return { healthy: false, error: 'Provider not found: ' + providerId };
  }

  if (provider.type === 'cli') {
    const { execSync } = require('child_process');
    try {
      // Sanitize command to prevent shell injection
      const cmd = (provider.cliCommand || provider.id).replace(/[^a-zA-Z0-9-]/g, '');
      if (!cmd) {
        return { healthy: false, error: 'Invalid CLI command for ' + provider.name };
      }
      execSync(`which ${cmd}`, { stdio: 'pipe' });
      return { healthy: true, latency: 0, type: 'cli' };
    } catch {
      return { healthy: false, error: 'Command not found: ' + (provider.cliCommand || provider.id) };
    }
  }

  if (provider.type === 'api') {
    if (!provider.apiKey) {
      return { healthy: false, error: 'No API key for ' + provider.name };
    }

    const startTime = Date.now();
    try {
      const model = provider.models[0];
      const resp = await fetch(provider.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + provider.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5,
        }),
      });

      const latency = Date.now() - startTime;
      const data = await resp.json() as any;

      if (data.error) {
        return { healthy: false, error: data.error.message, latency };
      }

      return { healthy: true, latency, model: data.model || model };
    } catch (e: any) {
      return { healthy: false, error: e.message, latency: Date.now() - startTime };
    }
  }

  return { healthy: false, error: 'Unknown provider type: ' + provider.type };
}

export async function checkAllProviders(): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  const available = getAvailableProviders();

  for (const id of Object.keys(available)) {
    results[id] = await healthCheck(id);
  }

  return results;
}

export function findCheapestAvailableProvider(model?: string): ProviderDefinition | null {
  const available = getAvailableProviders();
  const sorted = Object.values(available).sort(
    (a, b) => (a.costPerK.input + a.costPerK.output) - (b.costPerK.input + b.costPerK.output)
  );
  if (model) {
    return sorted.find(p => p.models.includes(model)) || null;
  }
  return sorted[0] || null;
}

export function findFastestAvailableProvider(): ProviderDefinition | null {
  const available = getAvailableProviders();
  const cheapTier = Object.values(available).filter(p => p.tier === 'cheap');
  return cheapTier[0] || Object.values(available)[0] || null;
}

// ============================================================
// SAVE CONFIG
// ============================================================

export function saveConfig(configPath?: string): string {
  const target = configPath || path.join(
    process.env.HOME || '.',
    '.config', 'a3m-router', 'providers.json'
  );

  const dir = path.dirname(target);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const safeConfig: Record<string, any> = {};
  for (const [id, provider] of Object.entries(_registeredProviders)) {
    safeConfig[id] = { ...provider };
    delete safeConfig[id].apiKey;
  }

  fs.writeFileSync(target, JSON.stringify({ providers: safeConfig }, null, 2));
  return target;
}
