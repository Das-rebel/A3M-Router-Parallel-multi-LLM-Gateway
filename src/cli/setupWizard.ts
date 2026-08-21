/**
 * A3M Router Setup Wizard
 * Interactive configuration wizard with smart defaults
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONFIG_DIR = path.join(process.env.HOME || '/tmp', '.config', 'a3m-router');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const PROVIDERS_FILE = path.join(CONFIG_DIR, 'providers.json');

// API key environment variable mappings
const API_KEY_ENV_MAP = {
  // Free tier (recommended first)
  'GROQ_API_KEY': { id: 'groq', tier: 'free' },
  'OPENAI_API_KEY': { id: 'openai', tier: 'paid' },
  'ANTHROPIC_API_KEY': { id: 'anthropic', tier: 'paid' },
  'DEEPSEEK_API_KEY': { id: 'deepseek', tier: 'cheap' },
  'MISTRAL_API_KEY': { id: 'mistral', tier: 'cheap' },
  'GOOGLE_API_KEY': { id: 'google', tier: 'free' },
  'XAI_API_KEY': { id: 'xai', tier: 'paid' },
  'FIREWORKS_API_KEY': { id: 'fireworks', tier: 'cheap' },
  'TOGETHER_API_KEY': { id: 'together', tier: 'cheap' },
  'CEREBRAS_API_KEY': { id: 'cerebras', tier: 'free' },
  'AI21_API_KEY': { id: 'ai21', tier: 'paid' },
  'COHERE_API_KEY': { id: 'cohere', tier: 'cheap' },
  'PERPLEXITY_API_KEY': { id: 'perplexity', tier: 'paid' },
  // Chinese providers
  'MINIMAX_API_KEY': { id: 'minimax', tier: 'cheap' },
  'KIMI_API_KEY': { id: 'kimi', tier: 'cheap' },
  'MOONSHOT_API_KEY': { id: 'moonshot', tier: 'cheap' },
  'QWEN_API_KEY': { id: 'qwen', tier: 'cheap' },
  'ZHIPU_API_KEY': { id: 'zhipu', tier: 'cheap' },
  'YI_API_KEY': { id: 'yi', tier: 'cheap' },
  'BAICHUAN_API_KEY': { id: 'baichuan', tier: 'cheap' },
  'STEPFUN_API_KEY': { id: 'stepfun', tier: 'cheap' },
  // Other providers
  'REPLICATE_API_KEY': { id: 'replicate', tier: 'cheap' },
  'HUGGINGFACE_API_KEY': { id: 'huggingface', tier: 'cheap' },
  'NVIDIA_API_KEY': { id: 'nvidia', tier: 'paid' },
  'OPENROUTER_API_KEY': { id: 'openrouter', tier: 'mixed' },
  'AZURE_OPENAI_API_KEY': { id: 'azure', tier: 'paid' },
  'DEEPINFRA_API_KEY': { id: 'deepinfra', tier: 'cheap' },
  'SAMBANOVA_API_KEY': { id: 'sambanova', tier: 'cheap' },
  'ANYSCALE_API_KEY': { id: 'anyscale', tier: 'cheap' },
  'VOYAGE_API_KEY': { id: 'voyage', tier: 'cheap' },
  'JINA_API_KEY': { id: 'jina', tier: 'cheap' },
  'NOVITA_API_KEY': { id: 'novita', tier: 'cheap' },
  'OCTOAI_API_KEY': { id: 'octoai', tier: 'cheap' },
  'LAMINAR_API_KEY': { id: 'laminar', tier: 'cheap' },
  'WRITER_API_KEY': { id: 'writer', tier: 'paid' },
};

// Provider metadata with useful defaults
const PROVIDER_INFO = {
  // FREE TIER (no cost, start here!)
  groq: { 
    name: 'Groq', 
    defaultModel: 'llama-3.3-70b-versatile', 
    tier: 'free', 
    strength: '⚡ Fastest inference, generous free tier',
    specialties: ['code', 'general', 'fast responses'],
    note: 'Best for production free tier'
  },
  cerebras: { 
    name: 'Cerebras', 
    defaultModel: 'llama-3.3-70b', 
    tier: 'free', 
    strength: '🚀 Fastest GPU in world',
    specialties: ['code', 'fast inference'],
    note: 'Unique hardware, excellent speed'
  },
  google: { 
    name: 'Google AI', 
    defaultModel: 'gemini-1.5-flash', 
    tier: 'free', 
    strength: '🖼️ Multimodal, 1M context',
    specialties: ['multimodal', 'long context', 'vision'],
    note: 'Best free multimodal option'
  },
  
  // CHEAP TIER (best cost/speed ratio)
  deepseek: { 
    name: 'DeepSeek', 
    defaultModel: 'deepseek-chat-v3', 
    tier: 'cheap', 
    strength: '💰 Best value, excellent code',
    specialties: ['code', 'reasoning', 'math', 'value'],
    note: 'Our top recommendation for cost/quality'
  },
  groq_alt: { 
    name: 'Groq (Alt)', 
    defaultModel: 'mixtral-8x7b-32768', 
    tier: 'cheap', 
    strength: '💰 Fast + cheap',
    specialties: ['code', 'fast', 'long context'],
    note: 'Good alternative to paid tiers'
  },
  together: { 
    name: 'Together AI', 
    defaultModel: 'Llama-3.3-70B-Instruct', 
    tier: 'cheap', 
    strength: '🏆 Managed, reliable',
    specialties: ['general', 'code', 'reasoning'],
    note: 'Great for production workloads'
  },
  fireworks: { 
    name: 'Fireworks AI', 
    defaultModel: 'mixtral-8x22b-instruct', 
    tier: 'cheap', 
    strength: '🔥 Fast inference engine',
    specialties: ['code', 'fast', 'function calling'],
    note: 'Excellent for agentic workflows'
  },
  mistral: { 
    name: 'Mistral AI', 
    defaultModel: 'mistral-small-latest', 
    tier: 'cheap', 
    strength: '🇪🇺 European, balanced',
    specialties: ['general', 'code', 'European data'],
    note: 'Great for EU compliance'
  },
  cohere: { 
    name: 'Cohere', 
    defaultModel: 'command-r7b', 
    tier: 'cheap', 
    strength: '📊 Great embeddings',
    specialties: ['code', 'embeddings', 'rerank'],
    note: 'Best for RAG workloads'
  },
  qwen: { 
    name: 'Qwen (Alibaba)', 
    defaultModel: 'qwen-turbo', 
    tier: 'cheap', 
    strength: '🇨🇳 Best Chinese model',
    specialties: ['chinese', 'multilingual', 'code'],
    note: 'Top Chinese language support'
  },
  zhipu: { 
    name: 'Zhipu GLM', 
    defaultModel: 'glm-4', 
    tier: 'cheap', 
    strength: '🇨🇳 Smart Chinese reasoning',
    specialties: ['chinese', 'reasoning', 'code'],
    note: 'Excellent for Chinese language tasks'
  },
  kimi: { 
    name: 'Kimi/Moonshot', 
    defaultModel: 'moonshot-v1-8k', 
    tier: 'cheap', 
    strength: '🇨🇳 128k context window',
    specialties: ['long context', 'chinese', 'analysis'],
    note: 'Best for very long documents'
  },
  yi: { 
    name: 'Yi (01.AI)', 
    defaultModel: 'yi-large', 
    tier: 'cheap', 
    strength: '🇨🇳 Strong reasoning',
    specialties: ['reasoning', 'chinese', 'english'],
    note: 'Good bilingual support'
  },
  minimax: { 
    name: 'MiniMax', 
    defaultModel: 'abab6.5s-chat', 
    tier: 'cheap', 
    strength: '🇨🇳 Fast Chinese responses',
    specialties: ['chinese', 'fast', 'chat'],
    note: 'Great for Chinese chatbots'
  },
  stepfun: { 
    name: 'StepFun', 
    defaultModel: 'step-1v-8k', 
    tier: 'cheap', 
    strength: '🇨🇳 Vision + text',
    specialties: ['vision', 'multimodal', 'chinese'],
    note: 'Good for image understanding'
  },
  
  // PAID TIER (best quality)
  openai: { 
    name: 'OpenAI', 
    defaultModel: 'gpt-4o-mini', 
    tier: 'paid', 
    strength: '🧠 Best overall quality',
    specialties: ['reasoning', 'code', 'general', 'function calling'],
    note: 'Premium quality, higher cost'
  },
  anthropic: { 
    name: 'Anthropic', 
    defaultModel: 'claude-3.5-haiku', 
    tier: 'paid', 
    strength: '🛡️ Best reasoning, safest',
    specialties: ['reasoning', 'analysis', 'safety'],
    note: 'Excellent for sensitive tasks'
  },
  xai: { 
    name: 'xAI (Grok)', 
    defaultModel: 'grok-3', 
    tier: 'paid', 
    strength: '🤖 Real-time data access',
    specialties: ['real-time', 'web search', 'reasoning'],
    note: 'Accesses real-time information'
  },
  perplexity: { 
    name: 'Perplexity', 
    defaultModel: 'sonar', 
    tier: 'paid', 
    strength: '🌐 Online search + reasoning',
    specialties: ['search', 'factual', 'research'],
    note: 'Best for research with web access'
  },
};

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function question(rl, text) {
  return new Promise((resolve) => {
    rl.question(text, (answer) => resolve(answer));
  });
}

/**
 * Detect API keys from environment variables
 */
async function detectApiKeys() {
  const detected = [];
  
  for (const [envVar, config] of Object.entries(API_KEY_ENV_MAP)) {
    if (process.env[envVar]) {
      const info = PROVIDER_INFO[config.id];
      detected.push({ 
        envVar, 
        providerId: config.id, 
        tier: config.tier,
        info 
      });
    }
  }
  
  return detected;
}

/**
 * Load existing configuration
 */
function loadExistingConfig() {
  const config = { providers: {} };
  
  // Try new config location
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      console.log('  ✓ Found existing config');
      return data;
    } catch (e) {
      // Fall through
    }
  }
  
  // Try legacy providers.json location
  if (fs.existsSync(PROVIDERS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROVIDERS_FILE, 'utf8'));
      console.log('  ✓ Found legacy config (will migrate)');
      return data;
    } catch (e) {
      // Fall through
    }
  }
  
  return config;
}

/**
 * Auto-detect best starter config based on available keys
 */
function suggestStarterConfig(detected) {
  const suggestions = [];
  
  // Priority: Free tier first, then cheap, then paid
  const tierOrder = { free: 1, cheap: 2, paid: 3 };
  
  detected
    .sort((a, b) => (tierOrder[a.tier] || 4) - (tierOrder[b.tier] || 4))
    .forEach(({ providerId, info, tier }) => {
      suggestions.push({ providerId, info, tier });
    });
  
  return suggestions;
}

/**
 * Print provider list with status
 */
function printProviderList(selected, detected) {
  const allProviders = Object.keys(PROVIDER_INFO);
  
  console.log('\n  Available providers:\n');
  console.log('  ##  Provider              Tier     Strength');
  console.log('  ──────────────────────────────────────────────────────');
  
  allProviders.forEach((id, i) => {
    const info = PROVIDER_INFO[id];
    const hasKey = detected.some(d => d.providerId === id);
    const isSelected = selected.has(id);
    
    let mark = '  ';
    if (hasKey) mark = '🔑';
    else if (isSelected) mark = '✓ ';
    
    const tierIcon = info.tier === 'free' ? '🆓 ' : 
                    info.tier === 'cheap' ? '💰 ' : '💎 ';
    
    const tierStr = info.tier.padEnd(6);
    const name = info.name.padEnd(20);
    
    console.log(`  ${String(i + 1).padStart(2)}. ${mark} ${name} ${tierIcon}${tierStr} ${info.strength}`);
  });
  
  console.log('  ──────────────────────────────────────────────────────');
  console.log('  🔑 = API key detected in environment');
}

/**
 * Print usage tips
 */
function printTips(detected) {
  console.log('\n  💡 Pro tips:');
  console.log('');
  
  if (detected.length === 0) {
    console.log('  • Get free API keys at: https://console.groq.com (Groq is free!)');
    console.log('  • DeepSeek offers best cost/quality: https://platform.deepseek.com');
    console.log('  • A3M works with ANY provider - even 1 key is enough');
  } else {
    // Analyze detected providers
    const tiers = new Set(detected.map(d => d.tier));
    
    if (!tiers.has('free') && !tiers.has('cheap')) {
      console.log('  • Consider adding Groq (free tier) for cost savings');
    }
    if (!detected.some(d => d.providerId === 'deepseek')) {
      console.log('  • DeepSeek V3 is excellent and cheap - highly recommended');
    }
    if (detected.length < 3) {
      console.log('  • Adding 3+ providers enables ensemble voting for hallucination detection');
    }
  }
  
  console.log('  • Run "a3m-router test" after setup to verify connections');
  console.log('  • Ensemble mode (3+ providers) catches hallucinations automatically');
}

/**
 * Build configuration object
 */
function buildConfig(selected, detected) {
  const config = {
    version: '2.0',
    providers: {}
  };
  
  selected.forEach(providerId => {
    const info = PROVIDER_INFO[providerId];
    const envEntry = Object.entries(API_KEY_ENV_MAP).find(([, v]) => v.id === providerId);
    const envVar = envEntry ? envEntry[0] : null;
    
    config.providers[providerId] = {
      name: info?.name || providerId,
      apiKey: envVar ? process.env[envVar] : '',
      defaultModel: info?.defaultModel || 'auto',
      models: [info?.defaultModel || 'auto'],
      type: 'api',
      enabled: true,
      tier: info?.tier || 'cheap'
    };
  });
  
  return config;
}

/**
 * Main wizard execution
 */
async function runWizard() {
  console.log('\n  ╔═══════════════════════════════════════════════════════════╗');
  console.log('  ║                                                           ║');
  console.log('  ║     🤖 A3M Router Setup Wizard                            ║');
  console.log('  ║     The intelligent LLM gateway                          ║');
  console.log('  ║                                                           ║');
  console.log('  ╚═══════════════════════════════════════════════════════════╝\n');
  
  const rl = createInterface();
  
  // Ensure config directory exists
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    console.log('  ✓ Created config directory:', CONFIG_DIR);
  }
  
  // Load existing config
  const existingConfig = loadExistingConfig();
  const existingProviders = Object.keys(existingConfig.providers || {});
  if (existingProviders.length > 0) {
    console.log('  ✓ Found', existingProviders.length, 'configured provider(s)');
  }
  
  // Detect API keys
  console.log('\n  🔍 Scanning for API keys...\n');
  const detected = await detectApiKeys();
  
  if (detected.length > 0) {
    console.log('  ✓ Found', detected.length, 'API key(s) in environment:\n');
    detected.forEach(({ envVar, info, tier }) => {
      const tierMark = tier === 'free' ? '🆓' : tier === 'cheap' ? '💰' : '💎';
      console.log(`    ${tierMark} ${info?.name || envVar} (${tier} tier)`);
    });
  } else {
    console.log('  ⚠️  No API keys detected in environment');
    console.log('    You can still configure providers manually or add keys later\n');
  }
  
  // Starter suggestions
  const suggestions = suggestStarterConfig(detected);
  const selected = new Set();
  
  // Auto-select detected providers
  suggestions.forEach(({ providerId }) => selected.add(providerId));
  
  // Print provider list
  printProviderList(selected, detected);
  
  // Selection prompt
  console.log('\n  📡 Provider Selection:');
  console.log('  • Enter numbers separated by commas (e.g., 1,3,5)');
  console.log('  • Enter "all" to select all providers');
  console.log('  • Enter "free" for free tier only');
  console.log('  • Enter "min" for minimum viable (1 free + 1 cheap)');
  console.log('  • Press Enter to use detected providers (recommended)\n');
  
  const answer = await question(rl, '  Select providers [Enter for detected]: ');
  const trimmed = answer.toLowerCase().trim();
  
  if (trimmed === 'all') {
    Object.keys(PROVIDER_INFO).forEach(id => selected.add(id));
  } else if (trimmed === 'free') {
    Object.entries(PROVIDER_INFO)
      .filter(([, info]) => info.tier === 'free')
      .forEach(([id]) => selected.add(id));
  } else if (trimmed === 'min') {
    // One free + one cheap
    const free = Object.entries(PROVIDER_INFO).find(([, info]) => info.tier === 'free');
    const cheap = Object.entries(PROVIDER_INFO).find(([, info]) => info.tier === 'cheap');
    if (free) selected.add(free[0]);
    if (cheap) selected.add(cheap[0]);
  } else if (trimmed) {
    const nums = answer.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    selected.clear();
    nums.forEach(n => {
      const idx = n - 1;
      const providers = Object.keys(PROVIDER_INFO);
      if (idx >= 0 && idx < providers.length) {
        selected.add(providers[idx]);
      }
    });
  }
  
  // Summary
  console.log('\n  ✓ Selected providers:');
  const selectedList = Array.from(selected).map(id => ({
    id,
    info: PROVIDER_INFO[id]
  })).sort((a, b) => {
    const order = { free: 1, cheap: 2, paid: 3 };
    return (order[a.info?.tier] || 4) - (order[b.info?.tier] || 4);
  });
  
  selectedList.forEach(({ id, info }) => {
    const tierMark = info.tier === 'free' ? '🆓' : info.tier === 'cheap' ? '💰' : '💎';
    console.log(`    ${tierMark} ${info?.name} (${info?.tier} tier) - ${info?.defaultModel}`);
  });
  
  // Build and save config
  const config = buildConfig(selected, detected);
  
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log('\n  ✓ Config saved to:', CONFIG_FILE);
  
  // Migration notice
  if (existingProviders.length > 0 && existingProviders.length !== selected.size) {
    console.log('  ℹ️  Note: Legacy config preserved at:', PROVIDERS_FILE);
  }
  
  // Tips
  printTips(detected);
  
  // Next steps
  console.log('\n  ╔═══════════════════════════════════════════════════════════╗');
  console.log('  ║  ✅ A3M Router is ready!                                ║');
  console.log('  ╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log('  📖 Next steps:\n');
  console.log('  1. Test connections:     a3m-router test');
  console.log('  2. Start proxy:         a3m-router serve');
  console.log('  3. Try routing:          a3m-router route "Hello world"');
  console.log('  4. Open dashboard:      a3m-router tui');
  console.log('\n  📚 Docs: https://github.com/Das-rebel/a3m-router');
  console.log('  📋 Cheat sheet: https://github.com/Das-rebel/a3m-router/blob/main/docs/cli-cheatsheet.md\n');
  
  rl.close();
  
  return config;
}

module.exports = { runWizard };
