"use strict";
/**
 * A3M Router - Generic Adaptive Routing (RouteLLM Style)
 *
 * Routes queries to the best available LLM based on:
 * - Query features (code, math, creative, etc.)
 * - Provider availability (checks API keys)
 * - Cost optimization
 * - Quality vs speed tradeoff
 *
 * All provider references are dynamically loaded from providerConfig.
 * Users can add/remove providers via environment variables or config files.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_PROFILES = void 0;
exports.extractQueryFeatures = extractQueryFeatures;
exports.routeQuery = routeQuery;
exports.routeBatch = routeBatch;
exports.recommendForTask = recommendForTask;
exports.updateModelProfile = updateModelProfile;
exports.getProviderHealth = getProviderHealth;
const providerConfig_1 = require("../providers/providerConfig");
const tokenUtils_1 = require("../utils/tokenUtils");
const costUtils_1 = require("../utils/costUtils");
const sorting_1 = require("../utils/sorting");
// ============================================================
// TRAFFIC SHARES FOR ADAPTIVE DIVERSITY WEIGHT (EXP3-inspired)
// Based on negative frequency-dependent selection — as provider i's traffic
// share f_i grows above uniform (1/n), impose a diversity penalty.
// Formula: gamma = sqrt(n * log(n) / (T * G^2))  [Auer et al. 2002, EXP3]
// diversityPenalty_i = gamma * (f_i - 1/n)
// ============================================================
/** Number of times each provider has been selected (cumulative) */
const _selectionCount = {};
/** Total routing decisions since last reset */
let _totalDecisions = 0;
/** Reward range estimate for gamma computation (quality_score scale 0-1) */
const _REWARD_RANGE = 1.0;
/**
 * Compute the EXP3-inspired diversity penalty for a provider.
 * Based on: Auer et al. 2002 — "The Nonstochastic Multiarmed Bandit Problem"
 * and the insight that as provider share f_i grows above uniform (1/n),
 * imposing a penalty proportional to (f_i - 1/n) prevents monoculture
 * (competitive exclusion — negative frequency-dependent selection).
 *
 * @param providerName - provider key
 * @param nProviders - total number of available providers
 * @param recentDecayFactor - optional decay for non-stationary environments
 */
function computeDiversityPenalty(providerName, nProviders, recentDecayFactor = 0.0) {
    if (nProviders < 2)
        return 0;
    if (_totalDecisions < 2)
        return 0;
    const share = _selectionCount[providerName] || 0;
    const uniform = 1.0 / nProviders;
    // Deviation from uniform distribution (can be negative if under-used)
    const deviation = share - uniform;
    if (Math.abs(deviation) < 1e-6)
        return 0;
    // EXP3 learning rate: gamma = sqrt(n * log(n) / (T * G^2))
    // G = reward range (quality_score in [0,1] → G = 1)
    const T = Math.max(_totalDecisions, 10);
    const gamma = Math.sqrt((nProviders * Math.log(nProviders)) / (T * _REWARD_RANGE * _REWARD_RANGE));
    // Clamp gamma to prevent extreme penalties when T is very small
    const clampedGamma = Math.min(gamma, 0.5);
    // Optional: decay factor for non-stationary environments
    // (higher share = stronger penalty, but decays over time)
    // Currently disabled (recentDecayFactor=0) — re-enable if providers change frequently
    const effectiveGamma = clampedGamma * (1.0 - recentDecayFactor);
    // Penalty is proportional to how far above uniform the provider's share is
    // (negative deviation = under-used = reward, not penalty)
    if (deviation <= 0)
        return 0; // Reward already captured implicitly by below-uniform penalty
    return effectiveGamma * deviation;
}
/**
 * Record that a provider was selected (call after each routing decision).
 * Used to compute the diversity penalty on subsequent decisions.
 */
function recordSelection(providerName) {
    _selectionCount[providerName] = (_selectionCount[providerName] || 0) + 1;
    _totalDecisions += 1;
}
/**
 * Reset traffic tracking (call when provider pool changes or for eval resets).
 */
function resetDiversityState() {
    Object.keys(_selectionCount).forEach(k => delete _selectionCount[k]);
    _totalDecisions = 0;
}
let cachedProfiles = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
function buildModelProfiles() {
    const profiles = {};
    const available = (0, providerConfig_1.getAvailableProviders)();
    for (const [providerId, provider] of Object.entries(available)) {
        for (const model of provider.models) {
            const modelKey = model.includes('/') ? model : providerId + '/' + model;
            let costPerKInput = provider.costPerK ? provider.costPerK.input : 0;
            let costPerKOutput = provider.costPerK ? provider.costPerK.output : 0;
            // OpenRouter: per-model cost overrides for paid models
            if (provider.name === 'OpenRouter') {
                const orCosts = {
                    'openai/gpt-4o': [2.5, 10],
                    'anthropic/claude-3.5-sonnet': [3, 15],
                    'google/gemini-pro-1.5': [1.25, 5],
                    'meta-llama/llama-3.1-70b-instruct': [0.18, 0.18],
                    'mistralai/mistral-large': [2, 6],
                    // Newer free models (these override the default 0,0 for free tier)
                    'gemini-3.5-flash:free': [0, 0],
                    'gemini-3.6-flash:free': [0, 0],
                    'qwen3.7-flash:free': [0, 0],
                    'qwen3.7-max:free': [0, 0],
                    'deepseek-v4-flash-latest:free': [0, 0],
                };
                const orKey = model.includes('/') ? model : 'openrouter/' + model;
                // Try matching by full key or by model name
                for (const [pattern, cost] of Object.entries(orCosts)) {
                    if (orKey.includes(pattern) || model.includes(pattern.split('/')[1] || pattern)) {
                        costPerKInput = cost[0];
                        costPerKOutput = cost[1];
                        break;
                    }
                }
            }
            // Assign strengths based on model characteristics
            const strengths = [];
            if (provider.type === 'cli') {
                strengths.push('free', 'local');
            }
            if (costPerKInput < 0.3 && provider.name !== 'OpenRouter') {
                strengths.push('budget', 'fast');
            }
            else if (costPerKInput > 2) {
                strengths.push('premium', 'reasoning');
            }
            if (provider.name === 'Mistral' || provider.name === 'Groq' || provider.name === 'Cerebras') {
                strengths.push('fast', 'coding');
            }
            // OpenRouter premium free models get quality boosts
            if (provider.name === 'OpenRouter') {
                const modelLower = modelKey.toLowerCase();
                // Premium-tier free models (large, high-context) — these are equivalent to paid mid-tier
                if (modelLower.includes('kimi-k2') || modelLower.includes('qwen3-coder') ||
                    modelLower.includes('nemotron-3-ultra') || modelLower.includes('nemotron-3-super') ||
                    modelLower.includes('nemotron-3.5-lightning') || modelLower.includes('nemotron-3-nano-omni') ||
                    modelLower.includes('hermes-3') || modelLower.includes('gemma-4-31b') ||
                    modelLower.includes('laguna-s-2.1') ||
                    // Gemini 3.x free models — latest reasoning models
                    modelLower.includes('gemini-3.5-flash') || modelLower.includes('gemini-3.6-flash') ||
                    // Qwen 3.7 free models — latest with extended context
                    modelLower.includes('qwen3.7-flash') || modelLower.includes('qwen3.7-max') ||
                    // DeepSeek V4 free
                    modelLower.includes('deepseek-v4-flash')) {
                    strengths.push('reasoning', 'long-context', 'premium');
                }
                // Mid-tier free models (good quality, smaller) — equivalent to cheap tier
                else if (modelLower.includes('gpt-oss') || modelLower.includes('qwen3-next') ||
                    modelLower.includes('gemma-4-26b') || modelLower.includes('llama-3.3-70b') ||
                    modelLower.includes('nemotron-3-nano-30b') || modelLower.includes('nemotron-nano-9b')) {
                    strengths.push('fast', 'reasoning');
                }
                // Budget free models (small models)
                else {
                    strengths.push('fast');
                }
            }
            // NVIDIA NIM premium free models (high quality, long context)
            if (provider.name === 'NVIDIA NIM') {
                const modelLower = modelKey.toLowerCase();
                // Premium tier: nemotron-super, gemma-4-31b, llama-3.3-70b
                if (modelLower.includes('nemotron-3-super') || modelLower.includes('gemma-4-31b') ||
                    modelLower.includes('llama-3.3-70b') || modelLower.includes('mistral-large') ||
                    modelLower.includes('glm-5')) {
                    strengths.push('reasoning', 'long-context', 'premium');
                }
                // Mid tier: nemotron-mini, llama-3.1-8b, qwen
                else if (modelLower.includes('nemotron-mini') || modelLower.includes('llama-3.1') ||
                    modelLower.includes('qwen')) {
                    strengths.push('fast', 'reasoning');
                }
                // Budget tier
                else {
                    strengths.push('fast');
                }
            }
            // Minimax gets a quality boost (capable model, cheap pricing)
            if (provider.name === 'MiniMax') {
                strengths.push('fast', 'reasoning');
            }
            if (provider.name === 'CommandCode') {
                strengths.push('code-aware', 'context-rich');
            }
            if (provider.name === 'OpenCode') {
                strengths.push('free', 'multi-model');
            }
            if (provider.name === 'Google') {
                strengths.push('multilingual', 'long-context');
            }
            if (provider.name === 'OpenAI') {
                strengths.push('reasoning', 'coding', 'analysis');
            }
            if (provider.name === 'Anthropic') {
                strengths.push('reasoning', 'creative', 'analysis');
            }
            // Cloudflare Workers AI models (free but limited)
            if (provider.name === 'Cloudflare Workers AI') {
                strengths.push('free', 'fast');
            }
            // Detect multimodal support
            const supportsMultimodal = provider.supports_multimodal === true;
            // Add strategy to strengths for game-theoretic routing
            if (provider.strategy) {
                strengths.push(provider.strategy);
            }
            // === QUALITY SCORE ASSIGNMENT ===
            // Priority: premium/reasoning > fast+paid > fast/free > budget > default
            // Free models with premium/reasoning tags get same quality as paid models
            let quality_score;
            if (strengths.includes('premium') || strengths.includes('reasoning')) {
                // Premium models (including premium free models like nemotron-3-super:free)
                // get high quality score — same as paid premium models
                quality_score = 0.92;
            }
            else if (strengths.includes('fast') && costPerKInput > 0.3) {
                // Fast mid-tier models (Groq, Cerebras, etc.) get competitive quality
                quality_score = 0.89;
            }
            else if (strengths.includes('fast') && costPerKInput === 0) {
                // Fast free models (Cloudflare, local models) get moderate quality
                quality_score = 0.78;
            }
            else if (strengths.includes('budget')) {
                // Budget models (small, cheap)
                quality_score = 0.75;
            }
            else if (provider.name === 'OpenRouter' && costPerKInput === 0) {
                // OpenRouter free models that don't match premium patterns get boosted
                quality_score = 0.82;
            }
            else {
                quality_score = 0.80;
            }
            profiles[modelKey] = {
                name: modelKey,
                provider: providerId,
                providerName: provider.name,
                cost_per_1k_input: costPerKInput,
                cost_per_1k_output: costPerKOutput,
                latency_ms: provider.type === 'cli' ? 5000 : (provider.priority * 200 + 300),
                quality_score,
                strengths,
                context_window: provider.maxTokens || 8192,
                type: provider.type,
                priority: provider.priority,
                supports_multimodal: supportsMultimodal,
            };
        }
    }
    return profiles;
}
// Lazy cache with TTL - replaces refreshModelProfiles()
function getModelProfiles() {
    const now = Date.now();
    if (!cachedProfiles || (now - cacheTimestamp) > CACHE_TTL_MS) {
        cachedProfiles = buildModelProfiles();
        cacheTimestamp = now;
    }
    return cachedProfiles;
}
// Manual cache invalidation (call if provider config changes)
function invalidateProfileCache() {
    cachedProfiles = null;
    cacheTimestamp = 0;
}
exports.MODEL_PROFILES = {};
try {
    exports.MODEL_PROFILES = buildModelProfiles();
}
catch (e) {
    // Circular dependency at module load - will retry on first use
    exports.MODEL_PROFILES = {};
}
function extractQueryFeatures(prompt) {
    const lower = prompt.toLowerCase();
    const words = prompt.split(/\s+/);
    const wordCount = words.length;
    // === SIGNAL 1: Domain Detection ===
    const domainSignals = {
        legal: {
            keywords: ['legal', 'law', 'contract', 'liability', 'litigation', 'patent', 'copyright',
                'regulation', 'compliance', 'constitutional', 'statute', 'jurisdiction',
                'court', 'ruling', 'precedent', 'attorney', 'amicus', 'sec ', 'fda ',
                'gdpr', 'ccpa', 'cfpr', 'due diligence', 'merger', 'acquisition',
                '10-k', 'sec filing', 'forensic', 'embezzlement', 'infringement'],
            weight: 0.35
        },
        medical: {
            keywords: ['clinical', 'medical', 'pharmaceutical', 'oncology', 'drug', 'trial protocol',
                'diagnosis', 'treatment', 'epidemiolog', 'genome', 'cohort study',
                'biomarker', 'efficacy', 'pharmacoeconomic', 'biologic', 'vaccine',
                'sepsis', 'ehr ', 'surgical', 'patient safety', 'fda approval'],
            weight: 0.35
        },
        finance: {
            keywords: ['financial model', 'valuation', 'revenue', 'portfolio', 'derivative',
                'hedge fund', 'series a', 'series b', 'startup valuation', 'sensitivity analysis',
                'investment thesis', 'earnings', 'tax optimization', 'forensic accounting',
                'multinational', 'jurisdiction', 'risk assessment', 'monte carlo',
                'black-scholes', 'options pricing', 'credit risk'],
            weight: 0.30
        },
        security: {
            keywords: ['security audit', 'penetration', 'vulnerability', 'exploit', 'zero-trust',
                'threat model', 'incident response', 'malware', 'ransomware',
                'authentication flow', 'cryptograph', 'encryption', 'timing attack',
                'supply chain attack', 'owasp', 'compliance', 'risk assessment',
                'mfa', 'zero-day', 'firewall', 'intrusion'],
            weight: 0.30
        },
        architecture: {
            keywords: ['system design', 'microservice', 'distributed system', 'fault-tolerant',
                'event-sourced', 'cqrs', 'consensus algorithm', 'real-time pipeline',
                'high availability', 'multi-region', 'latency sla', 'kafka',
                'event-driven', 'data warehouse', 'etl', 'streaming', '1m events',
                'million events', 'scalab', 'infrastruct', 'deploy'],
            weight: 0.25
        },
        data_science: {
            keywords: ['machine learning', 'deep learning', 'neural network', 'transformer',
                'training data', 'model accuracy', 'hyperparameter', 'cross-validation',
                'feature engineering', 'data pipeline', 'pandas', 'numpy', 'scikit',
                'tensorflow', 'pytorch', 'regression', 'classification', 'clustering'],
            weight: 0.30
        },
        ml_research: {
            keywords: ['bert', 'gpt', 'super_glue', 'glue benchmark', 'benchmarks', 'performance comparison',
                'natural language processing', 'nlp', 'language model', 'transformer model',
                'fine.tuning', 'pre.training', 'few.shot', 'zero.shot', 'prompt engineering',
                'model comparison', 'accuracy', 'f1 score', 'bleu', 'rouge', 'perplexity'],
            weight: 0.40
        },
    };
    let detectedDomain = null;
    let maxDomainScore = 0;
    for (const [domain, signal] of Object.entries(domainSignals)) {
        let domainScore = 0;
        for (const kw of signal.keywords) {
            if (lower.includes(kw)) {
                domainScore += signal.weight;
            }
        }
        if (domainScore > maxDomainScore) {
            maxDomainScore = domainScore;
            detectedDomain = domain;
        }
    }
    // === SIGNAL 2: Code Detection ===
    const codeSignals = [
        'function ', 'def ', 'class ', 'import ', 'const ', 'let ', 'var ',
        '=>', '->', 'async ', 'await ', 'return ', 'if (', 'for (', 'while (',
        'public ', 'private ', 'protected ', 'static ', 'void ', 'int ', 'string ',
        '#include', 'std::', 'cout', 'cin', 'printf(', 'println!',
        'fn ', 'impl ', 'pub ', 'mut ', 'struct ', 'enum ',
        '```', 'python', 'javascript', 'typescript', 'java', 'cpp', 'ruby',
        'write a', 'create a', 'implement', 'algorithm'
    ];
    const hasCode = codeSignals.some(sig => lower.includes(sig));
    // === SIGNAL 3: Reasoning Detection ===
    // === SIGNAL 3: Reasoning Detection ===
    const reasoningSignals = [
        'why', 'how', 'explain', 'analyze', 'compare', 'contrast', 'evaluate',
        'think about', 'reason', 'logic', 'proof', 'derive', '证明', '分析',
        'reasoning', 'step by step', 'thinking', 'thought process'
    ];
    // Check if it's a simple factual "How" query (should NOT trigger reasoning boost)
    const simpleHowPatterns = [
        /^(what|how|who|which|when|where)\s+(is|are|was|were|do|does|did|can|has|have|named|called)/i,
        /^how\s+(many|much|long|tall|old|far)/i,
    ];
    const isSimpleHowQuery = simpleHowPatterns.some(p => p.test(prompt.trim()));
    const requiresReasoning = !isSimpleHowQuery && reasoningSignals.some(sig => lower.includes(sig));
    // === SIGNAL 4: Language Detection ===
    const languagePatterns = [
        [/[\u4e00-\u9fff]/, 'zh'],
        [/[\u0900-\u097f]/, 'hi'],
        [/[\u0600-\u06ff]/, 'ar'],
        [/[\u0400-\u04ff]/, 'ru'],
        [/[\u0900-\u097f]/, 'hi-latn'],
        [/বাংলা|করুন|হিন্দি|ভারত|ভারতীয়/, 'bn'],
    ];
    let detectedLanguage = null;
    for (const [pattern, lang] of languagePatterns) {
        if (pattern.test(prompt)) {
            detectedLanguage = lang;
            break;
        }
    }
    // Translation detection
    const translationSignals = ['translate', 'translation', 'into english', 'to english',
        'traducir', 'traduction', 'traduzione', 'übersetzen'];
    const isTranslation = translationSignals.some(sig => lower.includes(sig)) ||
        /to (english|french|german|spanish|chinese|japanese|korean)/i.test(prompt);
    const isMultilingual = detectedLanguage !== null || isTranslation;
    // === SIGNAL 5: Intent Classification ===
    let intent = 'general';
    // Math takes priority over code for math-heavy queries
    if (lower.includes('calculate') || lower.includes('compute') || lower.includes('integral') ||
        lower.includes('derivative') || lower.includes('equation') || lower.includes('formula')) {
        intent = 'math';
    }
    else if (hasCode) {
        intent = 'code';
    }
    else if (isTranslation) {
        intent = 'translation';
    }
    else if (lower.includes('write') || lower.includes('create') || lower.includes('generate')) {
        intent = 'creative';
    }
    else if (lower.includes('explain') || lower.includes('what is') || lower.includes('how does')) {
        intent = 'explanation';
    }
    // === COMPLEXITY SCORING ===
    // Base complexity from length
    let complexity = Math.min(wordCount / 100, 1.0);
    // === RESEARCH-BACKED COMPLEXITY SIGNALS (from accuracy gap analysis) ===
    // SIGNAL: Jargon Density (+15%) - professional terminology ratio
    const professionalTerms = [
        'liability', 'contract', 'clause', 'statute', 'jurisdiction', 'litigation', 'plaintiff', 'defendant', 'testimony', 'deposition', 'injunction', 'precedent',
        'oncology', 'diagnosis', 'prognosis', 'pathology', 'pharmacology', 'etiology', 'symptomology', 'clinical',
        'portfolio', 'equity', 'derivative', 'arbitrage', 'liquidity', 'amortization', 'collateral', 'fiduciary',
        'architecture', 'protocol', 'schema', 'interface', 'abstraction', 'implementation', 'optimization', 'scalability',
        'hypothesis', 'methodology', 'correlation', 'regression', 'variance', 'covariance', 'multivariate',
        'quantitative', 'qualitative', 'peer-reviewed', 'meta-analysis', 'systematic review', 'empirical',
    ];
    const jargonCount = professionalTerms.filter(t => lower.includes(t)).length;
    const jargonScore = (jargonCount / Math.max(wordCount, 1)) * 0.35;
    complexity += jargonScore;
    // SIGNAL: Task Formality (+10%) - formal professional task markers
    const formalTasks = ['protocol', 'audit', 'brief', 'filing', 'submission', 'application', 'complaint', 'petition', 'motion', 'agreement', 'negotiation', 'mediation', 'arbitration', 'compliance', 'regulatory', 'certification', 'accreditation', 'assessment', 'evaluation', 'appraisal', 'due diligence', 'impact assessment', 'risk assessment', 'investigation', 'inquiry', 'examination'];
    const formalityMatches = formalTasks.filter(t => lower.includes(t)).length;
    if (formalityMatches > 0)
        complexity += 0.10 + (formalityMatches * 0.03);
    // SIGNAL: Depth Markers (+8%) - comprehensive response requested
    const depthTerms = ['comprehensive', 'detailed', 'thorough', 'in-depth', 'exhaustive', 'systematic', 'methodical', 'rigorous', 'extensive', 'elaborate', 'nuanced', 'multi-faceted', 'holistic', 'deep dive', 'full analysis', 'expert level', 'professional grade', 'end-to-end', 'literature review', 'research report', 'whitepaper', 'technical specification'];
    const depthMatches = depthTerms.filter(t => lower.includes(t)).length;
    if (depthMatches > 0)
        complexity += 0.08 + (depthMatches * 0.03);
    // SIGNAL: Stakes Language (+5%) - high-stakes domain language
    const highStakes = ['safety-critical', 'liability', 'regulatory', 'compliance', 'legal', 'patent', 'copyright', 'litigation', 'lawsuit', 'penalty', 'fraud', 'malpractice', 'negligence', 'confidential', 'proprietary', 'trade secret', 'intellectual property', 'patient safety', 'clinical trial', 'financial risk', 'market risk', 'operational risk'];
    const stakesMatches = highStakes.filter(s => lower.includes(s)).length;
    if (stakesMatches > 0)
        complexity += 0.08 + (stakesMatches * 0.02);
    // SIGNAL: Multi-Step Structure (+5%) - sequential reasoning patterns
    const multiStepPatterns = [/first\s+.+\s+then\s+.+\s+finally/i, /step\s+\d+\s*[,.:]\s*step\s+\d+/i, /phase\s*\d+\s*[-–]\s*phase\s*\d+/i, /stage\s*\d+\s*[-–]\s*stage\s*\d+/i, /before\s+.+\s+after\s+.+/i];
    const multiStepMatches = multiStepPatterns.filter(p => p.test(prompt)).length;
    if (multiStepMatches > 0)
        complexity += 0.07 + (multiStepMatches * 0.02);
    // === MID-TIER SPECIFIC SIGNALS ===
    const midTierJargon = [
        'auth system', 'multi-tenant', 'ci/cd', 'pipeline', 'fraud detection', 'privacy-preserving',
        'netflix-scale', 'sensor fusion', 'autonomous', 'distributed', 'consensus',
        'load balancing', 'rate limiting', 'caching', 'sharding', 'replication',
        'authentication', 'authorization', 'encryption', 'compression', 'serialization',
        // Additional mid-tier technical terms
        'rest api', 'restful', 'graphql', 'grpc', 'websocket', 'webhook',
        'jwt', 'oauth', 'saml', 'ldap', 'token', 'session',
        'microservice', 'monolith', 'container', 'orchestration',
        'database', 'nosql', 'sql', 'cache', 'queue', 'buffer',
        'deployment', 'devops', 'ci cd', 'monitoring', 'logging',
        // Real-time and notification systems
        'real-time', 'notification', 'streaming', 'event-driven', 'async',
        // System design keywords
        'url shortening', 'shorten', 'bit.ly', 'tinyurl',
    ];
    const midJargonMatches = midTierJargon.filter(t => lower.includes(t)).length;
    if (midJargonMatches > 0)
        complexity += 0.12 + (midJargonMatches * 0.04);
    // Analysis/Design task boost (expanded patterns for mid-tier)
    const analysisDesignPatterns = [
        /analyze\s+.*\s+(impact|implications|consequences|effects)/i,
        /compare\s+.*\s+and\s+.*\s+(vs|with|against)/i,
        // Design patterns - allow flexible matching
        /design\s+(a|an|the)?\s*.{0,35}?(system|architecture|api|service|layer|component|notification|authentication|limiting|caching|shortening)/i,
        /schema\s+for/i,
        /pipeline\s+for/i,
        /how\s+would\s+(you\s+)?(design|implement|build|architect)/i,
        /how\s+do\s+you\s+design/i,
        /implement\s+(a|an|the)?\s*.{0,25}?(caching|rate\s+limiting|auth|notification|search)/i,
        /explain\s+(the\s+)?(cap\s+theorem|difference|relationship|correlation)/i,
        /how\s+(does|would)\s+.+\s+(affect|work|impact)/i,
        // Explain how patterns
        /explain\s+how\s+(oauth|jwt|rest|graphql|websocket|authentication|authorization)/i,
    ];
    const analysisMatches = analysisDesignPatterns.filter(p => p.test(prompt)).length;
    if (analysisMatches > 0)
        complexity += 0.25 + (analysisMatches * 0.05);
    // Complex system analysis patterns
    const complexSystemPatterns = [
        /explain\s+(the\s+)?(difference|relationship|correlation)/i,
        /how\s+does\s+.*\s+affect\s+.*\s+in\s+.*/i,
    ];
    const complexMatches = complexSystemPatterns.filter(p => p.test(prompt)).length;
    if (complexMatches > 0)
        complexity += 0.08;
    // === ORIGINAL SIGNALS (enhanced) ===
    // Domain加成 (increased from 0.2 to 0.35)
    if (detectedDomain)
        complexity += 0.35;
    // Code加成
    if (hasCode)
        complexity += 0.15;
    // Reasoning加成 (increased from 0.15 to 0.20)
    if (requiresReasoning)
        complexity += 0.20;
    // Multilingual加成
    if (isMultilingual)
        complexity += 0.1;
    // Detect new feature flags
    const isSecurity = /penetration testing|security audit|vulnerability|exploit|malware|ransomware|zero.trust|owasp|sql injection|xss|cross.site|csrf|brute.force|authentication bypass|cwe.\d+|authentication|authorization|oauth|saml|jwt|secure.*protocol|cryptograph|ssl|tls|https.*cert|security.*system/i.test(lower);
    const isCreative = /write a story|write a poem|creative|imagination|artistic/i.test(lower) || isTranslation;
    const isDevops = /docker|kubernetes|terraform|ansible|ci.cd|pipeline|sql|nosql|database|sqlserver|mysql|postgres|deploy|container|orchestrat/i.test(lower);
    const isMultimodal = /image|video|audio|generate.*picture|generate.*image|transcribe|voice/i.test(lower);
    // === ARCHITECTURAL COMPLEXITY SIGNALS ===
    // Boost complexity for system design / architecture queries
    // These indicate the query needs a capable model
    const archPatterns = [
        /architect\s+(a\s+)?(distributed|real-time|high-availability|fault-tolerant|scalable|multi-region|global)/i,
        /design\s+(a\s+)?(distributed|real-time|high-availability|fault-tolerant|scalable|multi-region|global)\s+(system|architecture|platform|infrastructure)/i,
        /design\s+a\s+system\s+that\s+handles/i,
        /data\s+warehouse\s+architecture/i,
        /security\s+architecture\s+for/i,
        /multi-cloud\s+hybrid/i,
        /disaster\s+recovery\s+strategy/i,
        /zero-downtime\s+deployment/i,
        /petabyte-scale/i,
        /billion\s+events?/i,
        /million\s+transactions?/i,
        /sensor\s+fusion/i,
        /autonomous\s+vehicle/i,
        /fraud\s+detection\s+system/i,
        /privacy-preserving\s+analytics/i,
        /real-time\s+(anomaly|fraud|video)\s+detection/i,
    ];
    const archMatches = archPatterns.filter(p => p.test(prompt)).length;
    if (archMatches > 0)
        complexity += 0.25 + (archMatches * 0.08);
    // Cap at 1.0
    complexity = Math.min(complexity, 1.0);
    // === SIGNAL: Risk Profile (Game-Theoretic) ===
    // High risk: Security, DevOps, high complexity, OR Creative with moderate complexity
    // Medium risk: Code, Reasoning, Multilingual, Multimodal, Domain-specific, Creative with low complexity
    // Low risk: Simple factual queries with low complexity
    let risk_profile = 'low';
    // HIGH RISK conditions (any one is enough)
    if (isSecurity || isDevops || complexity > 0.75) {
        risk_profile = 'high';
    }
    // Creative content at moderate-high complexity is high risk
    else if (isCreative && complexity > 0.4) {
        risk_profile = 'high';
    }
    // MEDIUM RISK conditions
    else if (hasCode || requiresReasoning || isMultilingual || isMultimodal || detectedDomain !== null) {
        risk_profile = 'medium';
    }
    // Everything else is low risk
    else {
        risk_profile = 'low';
    }
    return {
        length: prompt.length,
        wordCount,
        complexity,
        has_code: hasCode,
        has_math: intent === 'math', // Math detection
        requires_reasoning: requiresReasoning,
        is_multilingual: isMultilingual,
        is_translation: isTranslation,
        is_security: isSecurity,
        is_creative: isCreative,
        is_devops: isDevops,
        is_multimodal: isMultimodal,
        domain: detectedDomain,
        intent,
        detected_language: detectedLanguage,
        risk_profile,
    };
}
function scoreModelFit(model, features) {
    let score = model.quality_score * 0.6;
    // === ADAPTIVE TIER DETECTION ===
    // Uses cost percentiles computed from actually available providers.
    // If user has only free models → everything is "free" tier.
    // If user has free + groq + openai → quartiles split them naturally.
    const modelCost = (model.cost_per_1k_input + model.cost_per_1k_output) / 2;
    let tierFromModel;
    // Premium free models (with 'premium' or 'reasoning' tag) are treated as 'mid' tier
    // They should be selected for quality, not penalized for being "free"
    const isPremiumFree = model.strengths.includes('free') &&
        (model.strengths.includes('premium') || model.strengths.includes('reasoning'));
    if (isPremiumFree) {
        tierFromModel = 'mid'; // Treat premium free models as mid-tier for scoring
    }
    else if (model.strengths.includes('free') || modelCost === 0) {
        tierFromModel = 'free';
    }
    else if (modelCost <= _costPercentiles.p25) {
        tierFromModel = 'cheap';
    }
    else if (modelCost <= _costPercentiles.p75) {
        tierFromModel = 'mid';
    }
    else {
        tierFromModel = 'premium';
    }
    // === ADAPTIVE TIER SCORING ===
    // Boost/penalty scales with how well the model's tier matches the query complexity
    // Simple queries (0-0.3): strongly prefer free/cheap
    // Medium queries (0.3-0.5): prefer cheap/mid
    // Complex queries (0.5-0.65): prefer mid
    // Very complex (0.65+): prefer premium/mid
    if (features.complexity < 0.3) {
        if (tierFromModel === 'free')
            score += 0.20;
        else if (tierFromModel === 'cheap')
            score += 0.10;
        else if (tierFromModel === 'mid')
            score -= 0.05;
        else if (tierFromModel === 'premium')
            score -= 0.15;
    }
    else if (features.complexity < 0.5) {
        if (tierFromModel === 'cheap')
            score += 0.20;
        else if (tierFromModel === 'free')
            score += 0.10;
        else if (tierFromModel === 'mid')
            score += 0.05;
        else if (tierFromModel === 'premium')
            score -= 0.05;
    }
    else if (features.complexity <= 0.65) {
        if (tierFromModel === 'mid')
            score += 0.30;
        else if (tierFromModel === 'cheap')
            score += 0.10;
        else if (tierFromModel === 'premium')
            score += 0.10;
        else if (tierFromModel === 'free')
            score -= 0.20;
    }
    else {
        if (tierFromModel === 'premium')
            score += 0.35;
        else if (tierFromModel === 'mid')
            score += 0.15;
        else if (tierFromModel === 'cheap')
            score -= 0.15;
        else if (tierFromModel === 'free')
            score -= 0.30;
    }
    // Domain match (reduced for budget models)
    // Premium models get +0.2 for domain match
    // Budget/free models get only +0.05 (they lack capability for complex domains)
    if (features.domain) {
        const domainBonus = {
            code: ['code-aware', 'coding', 'fast'],
            medical: ['reasoning', 'analysis'],
            legal: ['reasoning', 'analysis', 'context-rich'],
            finance: ['analysis', 'reasoning'],
            security: ['reasoning', 'analysis'],
            architecture: ['context-rich', 'long-context'],
            data_science: ['coding', 'fast', 'reasoning'],
        };
        const bonuses = domainBonus[features.domain] || [];
        if (bonuses.some(b => model.strengths.includes(b))) {
            // Separate budget from premium free models
            const isBudget = model.strengths.includes('budget');
            const isPremiumFree = model.strengths.includes('free') &&
                (model.strengths.includes('premium') || model.strengths.includes('reasoning'));
            const isBudgetFree = model.strengths.includes('free') && !isPremiumFree;
            if (isBudget) {
                score += 0.05; // Budget models get minimal domain boost
            }
            else if (isPremiumFree) {
                score += 0.15; // Premium free models get significant boost (quality match)
            }
            else if (isBudgetFree) {
                score += 0.05; // Budget free models get minimal boost
            }
            else {
                score += 0.25; // Paid premium models get full boost
            }
        }
    }
    // For complex queries (complexity > 0.5), budget/free models get penalty
    if (features.complexity > 0.5) {
        if (model.strengths.includes('budget') || model.strengths.includes('free')) {
            score *= 0.7; // 30% penalty for budget models on complex queries
        }
    }
    // Code bonus
    if (features.has_code && model.strengths.includes('coding')) {
        score += 0.15;
    }
    // Multilingual bonus
    if (features.is_multilingual && model.strengths.includes('multilingual')) {
        score += 0.15;
    }
    // Multimodal bonus - if query needs multimodal, prefer models that support it
    if (features.is_multimodal && model.supports_multimodal) {
        score += 0.25; // Strong bonus for multimodal-capable models
    }
    else if (features.is_multimodal && !model.supports_multimodal) {
        score *= 0.5; // Heavy penalty for non-multimodal models on multimodal queries
    }
    // === GAME-THEORETIC: Risk-Profile to Strategy Matching ===
    // High risk queries → conservative (minimax) strategy
    // Medium risk queries → balanced (Nash equilibrium) strategy
    // Low risk queries → aggressive (maximin regret) strategy
    const providerStrategies = model.strengths || [];
    if (features.risk_profile === 'high' && providerStrategies.includes('conservative')) {
        score += 0.30; // Strong bonus for conservative providers on high-risk queries
    }
    else if (features.risk_profile === 'high' && providerStrategies.includes('aggressive')) {
        score *= 0.5; // Heavy penalty for aggressive providers on high-risk queries
    }
    else if (features.risk_profile === 'low' && providerStrategies.includes('aggressive')) {
        score += 0.15; // Bonus for aggressive providers on low-risk queries
    }
    else if (features.risk_profile === 'low' && providerStrategies.includes('conservative')) {
        score *= 0.8; // Mild penalty for conservative providers on low-risk (cost waste)
    }
    // Free tier preference for simple queries — ONLY for truly budget free models
    // Premium free models (nemotron-super, gemma-4-31b, etc.) should be selected on quality,
    // not because they're free, so they don't get this bonus
    if (features.complexity < 0.5 && model.strengths.includes('free')) {
        const isBudgetFree = !model.strengths.includes('premium') && !model.strengths.includes('reasoning');
        if (isBudgetFree) {
            score += 0.05; // Small bonus only — prevent budget free models from hitting cap
        }
        // Premium free models: NO bonus — they're selected on quality merits
    }
    // Fast provider for simple queries
    if (features.complexity < 0.4 && model.strengths.includes('fast')) {
        score += 0.15;
    }
    // Premium for complex queries
    if (features.complexity > 0.6 && model.strengths.includes('premium')) {
        score += 0.15;
    }
    return Math.min(score, 1.0);
}
function costEfficiency(model, features) {
    // Use log-scale cost score for better mid-range differentiation
    // Lower cost → higher score (thanks to logScaleCostScore inverse mapping)
    const avg_cost = (model.cost_per_1k_input + model.cost_per_1k_output) / 2;
    const cost_score = (0, costUtils_1.logScaleCostScore)(avg_cost);
    // Simple queries weigh cost more heavily (0.6)
    // Mid queries weigh cost moderately (0.3) since quality matters more for system design
    // Complex queries weigh cost less (0.15) since quality matters more
    const weight = features.complexity < 0.5 ? 0.6 : features.complexity < 0.65 ? 0.3 : 0.15;
    return cost_score * weight;
}
// Cost percentile cache for adaptive tier detection (updated on each routeQuery call)
let _costPercentiles = { p25: 0, p50: 0.5, p75: 1.0 };
// ============================================================
// ADAPTIVE SCORING CORE
// ============================================================
function routeQuery(prompt, available_models, budget_multiplier = 1.0) {
    // Use cached profiles instead of rebuilding every time (5-10ms savings)
    const profiles = getModelProfiles();
    // === ADAPTIVE: Compute cost percentiles from available providers ===
    // This makes tier detection dynamic based on what the user has configured
    const allCosts = Object.values(profiles).map(p => (p.cost_per_1k_input + p.cost_per_1k_output) / 2).sort((a, b) => a - b);
    _costPercentiles = {
        p25: allCosts[Math.floor(allCosts.length * 0.25)] || 0,
        p50: allCosts[Math.floor(allCosts.length * 0.50)] || 0.5,
        p75: allCosts[Math.floor(allCosts.length * 0.75)] || 1.0,
    };
    const features = extractQueryFeatures(prompt);
    const candidate_names = available_models || Object.keys(profiles);
    // Filter to available models
    const candidates = candidate_names
        .filter(name => profiles[name])
        .map(name => {
        const profile = profiles[name];
        const quality = scoreModelFit(profile, features);
        const cost = costEfficiency(profile, features);
        return {
            name,
            profile,
            quality_score: quality,
            cost_score: cost,
            total_score: quality + cost
        };
    });
    if (candidates.length === 0) {
        return {
            primary_model: null,
            fallback_models: [],
            confidence: 0,
            reasoning: "No providers available - configure API keys in ~/.config/a3m-router/providers.json",
            estimated_cost: 0,
            estimated_latency_ms: 0,
        };
    }
    // === ADAPTIVE SCORING: Dynamic tier boundaries based on available providers ===
    // Instead of fixed complexity thresholds, we analyze the actual provider landscape
    // and adjust scoring to make the best use of what's available.
    // Gather provider statistics for adaptive scoring
    const allProfiles = Object.values(profiles);
    const freeModels = allProfiles.filter(p => (p.cost_per_1k_input + p.cost_per_1k_output) === 0);
    const paidModels = allProfiles.filter(p => (p.cost_per_1k_input + p.cost_per_1k_output) > 0);
    const maxQuality = Math.max(...allProfiles.map(p => p.quality_score), 0.95);
    const minQuality = Math.min(...allProfiles.map(p => p.quality_score), 0.72);
    const qualityRange = maxQuality - minQuality;
    // Calculate the "value gap" — how much better paid models are than free ones
    const avgFreeQuality = freeModels.length > 0
        ? freeModels.reduce((s, p) => s + p.quality_score, 0) / freeModels.length
        : 0.72;
    const avgPaidQuality = paidModels.length > 0
        ? paidModels.reduce((s, p) => s + p.quality_score, 0) / paidModels.length
        : 0.85;
    const qualityGap = avgPaidQuality - avgFreeQuality;
    // Adaptive complexity bias:
    // - If quality gap is large (paid models are much better), weight quality more
    // - If quality gap is small (free models are good enough), weight cost more
    // - Scale by complexity: complex queries need quality, simple queries need cost savings
    const baseComplexityBias = features.complexity < 0.3 ? 0.3
        : features.complexity <= 0.5 ? 0.5
            : features.complexity <= 0.65 ? 0.7
                : 0.85;
    // Adjust bias based on quality gap: bigger gap → more weight on quality
    const gapAdjustment = Math.min(qualityGap * 0.5, 0.15); // max 0.15 adjustment
    const complexity_bias = Math.min(baseComplexityBias + gapAdjustment, 0.9);
    const cost_bias = 1 - complexity_bias;
    // Adaptive quality floor: scale with complexity and available quality
    // For complex queries, require at least avgPaidQuality if paid models exist
    const adaptiveQualityFloor = features.complexity > 0.5
        ? Math.max(avgPaidQuality - 0.1, 0.75)
        : 0;
    const scoreFn = (c) => c.quality_score * complexity_bias + c.cost_score * (1 - complexity_bias);
    let topCandidates = (0, sorting_1.quickselectTopK)(candidates, 4, scoreFn);
    // === DIVERSITY PENALTY (EXP3-inspired, negative frequency-dependence) ===
    // As provider share f_i grows above uniform (1/n), impose a diversity penalty.
    // This prevents provider monoculture (competitive exclusion) — the core insight
    // from the Paradox of the Plankton / negative frequency-dependent selection.
    // Penalty is applied only to the quality dimension (complexity_bias-weighted),
    // since cost already naturally distributes across providers.
    // See: Auer et al. 2002, "The Nonstochastic Multiarmed Bandit Problem"
    const nProviders = candidates.length;
    for (const c of candidates) {
        const divPenalty = computeDiversityPenalty(c.name, nProviders);
        // Diversity penalty applies to quality dimension only (cost already disperses traffic)
        c.total_score -= divPenalty * complexity_bias;
    }
    // Re-rank after diversity adjustment
    candidates.sort((a, b) => b.total_score - a.total_score);
    topCandidates = candidates.slice(0, 4);
    // Adaptive quality floor: for complex queries, prefer models above the floor
    if (adaptiveQualityFloor > 0) {
        const qualified = topCandidates.filter(c => c.quality_score >= adaptiveQualityFloor);
        if (qualified.length > 0) {
            topCandidates = qualified;
        }
        // If no model meets the floor, keep original topCandidates (graceful degradation)
    }
    const primary = topCandidates[0];
    const secondary = topCandidates.slice(1, 3);
    // Record selection for diversity tracking (after final decision, before return)
    recordSelection(primary.name);
    // Calculate confidence based on score gap
    let confidence = 0.5;
    if (candidates.length > 1) {
        const gap = primary.total_score - candidates[1].total_score;
        confidence = Math.min(0.95, 0.5 + gap * 2);
    }
    // Build reasoning
    const reasons = [];
    if (features.has_code)
        reasons.push("code detected");
    if (features.requires_reasoning)
        reasons.push("reasoning needed");
    if (features.complexity > 0.6)
        reasons.push("high complexity");
    if (features.is_multilingual)
        reasons.push("multilingual");
    if (features.is_translation)
        reasons.push("translation");
    if (primary.profile.strengths.includes("free"))
        reasons.push("free tier");
    const estimated_tokens = features.length * 1.5;
    const estimated_cost = (0, tokenUtils_1.estimateCost)(features.length, estimated_tokens, primary.name);
    return {
        primary_model: primary.name,
        fallback_models: secondary.map(c => c.name),
        confidence,
        reasoning: `Selected ${primary.profile.providerName || primary.profile.provider}/${primary.name} for ${reasons.join(", ") || "general query"}`,
        estimated_cost: estimated_cost * budget_multiplier,
        estimated_latency_ms: primary.profile.latency_ms,
        features,
        provider_type: primary.profile.type,
    };
}
// ============================================================
// BATCH ROUTING
// ============================================================
function routeBatch(prompts, options = {}) {
    const decisions = prompts.map(p => routeQuery(p));
    if (options.same_model && decisions.length > 0) {
        const primary_model = decisions[0].primary_model;
        decisions.forEach(d => {
            d.primary_model = primary_model;
            d.fallback_models = decisions[0].fallback_models;
        });
    }
    if (options.max_cost_per_prompt !== undefined) {
        const profiles = getModelProfiles();
        decisions.forEach(d => {
            if (d.estimated_cost > options.max_cost_per_prompt) {
                const cheap = Object.entries(profiles)
                    .find(([name, p]) => p.cost_per_1k_input < 0.5);
                if (cheap) {
                    d.primary_model = cheap[0];
                    d.reasoning = `Budget-limited routing to ${cheap[1].providerName || cheap[1].provider}`;
                }
            }
        });
    }
    return decisions;
}
// ============================================================
// TASK RECOMMENDATIONS
// ============================================================
function recommendForTask(task) {
    const features = extractQueryFeatures(task);
    const decision = routeQuery(task);
    return {
        primary: decision.primary_model,
        fallbacks: decision.fallback_models,
        reason: decision.reasoning,
        features,
    };
}
// ============================================================
// ONLINE LEARNING - Update model profiles from feedback
// ============================================================
function updateModelProfile(model_name, actual_latency_ms, actual_cost, quality_rating) {
    const profiles = getModelProfiles();
    const profile = profiles[model_name];
    if (!profile)
        return;
    const alpha = 0.2; // Learning rate
    profile.latency_ms = profile.latency_ms * (1 - alpha) + actual_latency_ms * alpha;
    profile.quality_score = profile.quality_score * (1 - alpha) + quality_rating * alpha;
}
// ============================================================
// PROVIDER HEALTH CHECK
// ============================================================
async function getProviderHealth() {
    const { checkAllProviders } = require("../providers/providerConfig");
    return checkAllProviders();
}
// ============================================================
// Default export
// ============================================================
module.exports = {
    extractQueryFeatures,
    routeQuery,
    routeBatch,
    recommendForTask,
    updateModelProfile,
    getProviderHealth,
    MODEL_PROFILES: exports.MODEL_PROFILES,
    invalidateProfileCache,
};
module.exports.default = module.exports;
//# sourceMappingURL=advancedRouter.js.map