"use strict";
/**
 * A3M Router Setup Wizard
 * Interactive configuration wizard
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const CONFIG_DIR = path.join(process.env.HOME || '/tmp', '.config', 'a3m-router');
const CONFIG_FILE = path.join(CONFIG_DIR, 'providers.json');
// API key environment variable mappings
const API_KEY_ENV_MAP = {
    'GROQ_API_KEY': 'groq',
    'OPENAI_API_KEY': 'openai',
    'ANTHROPIC_API_KEY': 'anthropic',
    'DEEPSEEK_API_KEY': 'deepseek',
    'MISTRAL_API_KEY': 'mistral',
    'GOOGLE_API_KEY': 'google',
    'CEREBRAS_API_KEY': 'cerebras',
    'TOGETHER_API_KEY': 'together',
    'AI21_API_KEY': 'ai21',
    'COHERE_API_KEY': 'cohere',
    'MINIMAX_API_KEY': 'minimax',
    'KIMI_API_KEY': 'kimi',
    'MOONSHOT_API_KEY': 'moonshot',
    'QWEN_API_KEY': 'qwen',
    'ZHIPU_API_KEY': 'zhipu',
    'YI_API_KEY': 'yi',
    'BAICHUAN_API_KEY': 'baichuan',
};
// Provider metadata
const PROVIDER_INFO = {
    groq: { name: 'Groq', models: 'llama-3.3-70b-versatile', tier: 'free', strength: 'Fast, free tier' },
    openai: { name: 'OpenAI', models: 'gpt-4o-mini', tier: 'paid', strength: 'GPT-4, most capable' },
    anthropic: { name: 'Anthropic', models: 'claude-3.5-haiku', tier: 'paid', strength: 'Claude, best reasoning' },
    deepseek: { name: 'DeepSeek', models: 'deepseek-chat-v3', tier: 'cheap', strength: 'Cheap, good code' },
    mistral: { name: 'Mistral', models: 'mistral-small-latest', tier: 'cheap', strength: 'European, balanced' },
    google: { name: 'Google AI', models: 'gemini-1.5-flash', tier: 'free', strength: 'Gemini, multimodal' },
    cerebras: { name: 'Cerebras', models: 'llama-3.3-70b', tier: 'free', strength: 'Fastest inference' },
    together: { name: 'Together AI', models: 'Llama-3.3-70B-Instruct', tier: 'cheap', strength: 'Managed, reliable' },
    ai21: { name: 'AI21', models: 'jamba-1.5-medium', tier: 'paid', strength: 'Jamba, long context' },
    cohere: { name: 'Cohere', models: 'command-r7b', tier: 'cheap', strength: 'Command series, fast' },
    minimax: { name: 'MiniMax', models: 'abab6.5s-chat', tier: 'cheap', strength: 'Chinese, cheap' },
    kimi: { name: 'Kimi/Moonshot', models: 'moonshot-v1-8k', tier: 'cheap', strength: 'Chinese, 128k context' },
    moonshot: { name: 'Moonshot', models: 'moonshot-v1-8k', tier: 'cheap', strength: 'Chinese, good' },
    qwen: { name: 'Qwen', models: 'qwen-turbo', tier: 'cheap', strength: 'Alibaba, multilingual' },
    zhipu: { name: 'Zhipu GLM', models: 'glm-4', tier: 'cheap', strength: 'Chinese, smart' },
    yi: { name: 'Yi', models: 'yi-large', tier: 'cheap', strength: 'Chinese, good reasoning' },
    baichuan: { name: 'Baichuan', models: 'baichuan-4', tier: 'cheap', strength: 'Chinese, balanced' },
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
async function detectApiKeys() {
    const detected = [];
    for (const [envVar, providerId] of Object.entries(API_KEY_ENV_MAP)) {
        if (process.env[envVar]) {
            detected.push({ envVar, providerId, info: PROVIDER_INFO[providerId] });
        }
    }
    return detected;
}
async function runWizard() {
    console.log('\n🔧 A3M Router Setup Wizard');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const rl = createInterface();
    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    // Check for existing config
    let existingConfig = {};
    ;
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            existingConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            console.log('✓ Found existing config at', CONFIG_FILE);
            const providerKeys = Object.keys(existingConfig.providers || {});
            console.log('  Providers:', providerKeys.length > 0 ? providerKeys.join(', ') : '(none)');
            console.log('');
        }
        catch (e) {
            console.log('⚠ Could not read existing config, starting fresh\n');
        }
    }
    // Auto-detect API keys
    console.log('Checking configuration...');
    const detected = await detectApiKeys();
    if (detected.length > 0) {
        console.log('✓ Found', detected.length, 'configured provider(s):');
        detected.forEach(({ envVar, providerId, info }) => {
            console.log('  ✓', info?.name || providerId);
        });
        console.log('');
    }
    // Provider selection
    const allProviders = Object.keys(PROVIDER_INFO);
    const selected = new Set();
    // Pre-select providers with detected keys
    detected.forEach(({ providerId }) => selected.add(providerId));
    console.log('📡 Select providers to configure (comma-separated numbers, or "all"):');
    console.log('');
    const numbered = allProviders.map((id, i) => ({ id, i }));
    numbered.forEach(({ id, i }) => {
        const info = PROVIDER_INFO[id];
        const selected_mark = selected.has(id) ? '[x]' : '[ ]';
        const tier_mark = info?.tier === 'free' ? '(FREE)' : info?.tier === 'cheap' ? '(cheap)' : '(paid)';
        console.log(`  ${String(i + 1).padStart(2)}. ${selected_mark} ${id.padEnd(12)} ${tier_mark} - ${info?.strength || ''}`);
    });
    console.log('');
    const answer = await question(rl, '  Enter numbers or "all" [all with keys detected]: ');
    if (answer.toLowerCase().trim() === 'all') {
        allProviders.forEach(id => selected.add(id));
    }
    else if (answer.trim()) {
        const nums = answer.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        nums.forEach(n => {
            const idx = n - 1;
            if (idx >= 0 && idx < allProviders.length) {
                selected.add(allProviders[idx]);
            }
        });
    }
    console.log('\n✓ Selected providers:', Array.from(selected).join(', '));
    // Build config
    const config = {
        version: '1.0',
        providers: {}
    };
    selected.forEach(providerId => {
        const info = PROVIDER_INFO[providerId];
        const envKey = Object.entries(API_KEY_ENV_MAP).find(([k, v]) => v === providerId)?.[0];
        config.providers[providerId] = {
            name: info?.name || providerId,
            apiKey: envKey ? process.env[envKey] : '',
            models: [info?.models || 'default'],
            type: 'api',
            enabled: true
        };
    });
    // Save config
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('\n✓ Config saved to', CONFIG_FILE);
    // Test connections
    console.log('\n🧪 Testing connections...');
    console.log('  (Skipped in wizard mode - run "npx a3m-router test" to verify)\n');
    // Ready message
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ A3M Router is ready!');
    console.log('');
    console.log('  Next steps:');
    console.log('  1. npx a3m-router serve     # Start proxy server');
    console.log('  2. npx a3m-router test       # Test provider connections');
    console.log('  3. npx a3m-router route "hi" # Try routing a query');
    console.log('');
    console.log('  Docs: https://github.com/Das-rebel/a3m-router');
    console.log('');
    rl.close();
}
module.exports = { runWizard };
//# sourceMappingURL=setupWizard.js.map