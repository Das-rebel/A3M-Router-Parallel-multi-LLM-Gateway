"use strict";
/**
 * TMLPD PI Extension - v1.1.0
 *
 * Parallel Multi-LLM Processing with Streaming, Caching, Cost Tracking, Reliability
 * + Reference Architecture to Full TMLPD (Episodic Memory, MCTS, HALO)
 *
 * @example
 * ```typescript
 * import { createTMLPD, HALOOrchestrator, EpisodicMemoryStore } from "tmlpd-pi";
 *
 * // Lightweight usage (core features)
 * const tmlpd = createTMLPD({ cache: { ttl_seconds: 3600 } });
 * const result = await tmlpd.executeParallel(prompt, ["gpt-4o", "claude"]);
 *
 * // Advanced: HALO orchestration with episodic memory
 * const halo = new HALOOrchestrator({ maxConcurrent: 3, enableMCTS: true });
 * const haloResult = await halo.execute("Build a REST API", async (subtask, agent) => {
 *   // Execute via agent
 * });
 *
 * // Query episodic memory
 * const similar = memory.getSimilarTasks("Python async API", 5);
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWarmedCache = exports.PrefixCache = exports.DEFAULT_PRESETS = exports.getPresetForQuery = exports.createPresetRouter = exports.recordFeedback = exports.mergeComplementary = exports.executeEnsemble = exports.RouteDecision = exports.ModelProfileType = exports.QueryFeatures = exports.MODEL_PROFILES = exports.updateModelProfile = exports.extractQueryFeatures = exports.recommendForTask = exports.routeBatch = exports.routeQuery = exports.executeBatch = exports.BatchProcessor = exports.createLMStudioProvider = exports.createVLLMProvider = exports.createOllamaProvider = exports.LocalProviderManager = exports.LocalProvider = exports.calculateCompressionRatio = exports.truncateToTokenBudget = exports.truncateMessages = exports.compressText = exports.isonDecode = exports.isonEncode = exports.MODEL_COSTS = exports.findCheapestModels = exports.listModelsByCost = exports.getModelCost = exports.estimateCostFromText = exports.estimateCost = exports.countTokens = exports.HALOOrchestrator = exports.MCTSWorkflowOptimizer = exports.EpisodicMemoryStore = exports.DEFAULT_RETRY_CONFIG = exports.isRetryableStatus = exports.calculateRetryDelay = exports.withRetry = exports.CircuitBreaker = exports.ProviderRegistry = exports.CostTracker = exports.ResponseCache = exports.TMLPDTools = exports.createTMLPD = void 0;
exports.TMLPD_PI_TOOLS = exports.SpeculativeResult = exports.SpeculativeConfig = exports.EagleSpeculative = exports.MedusaPredictor = exports.estimateSpeedupPotential = exports.speculativeBatch = exports.SpeculativeDecoder = exports.PrefixCacheStats = void 0;
const tmlpdTools_1 = require("./tools/tmlpdTools");
Object.defineProperty(exports, "createTMLPD", { enumerable: true, get: function () { return tmlpdTools_1.createTMLPD; } });
Object.defineProperty(exports, "TMLPDTools", { enumerable: true, get: function () { return tmlpdTools_1.TMLPDTools; } });
const responseCache_1 = require("./cache/responseCache");
Object.defineProperty(exports, "ResponseCache", { enumerable: true, get: function () { return responseCache_1.ResponseCache; } });
const costTracker_1 = require("./cost/costTracker");
Object.defineProperty(exports, "CostTracker", { enumerable: true, get: function () { return costTracker_1.CostTracker; } });
const registry_1 = require("./providers/registry");
Object.defineProperty(exports, "ProviderRegistry", { enumerable: true, get: function () { return registry_1.ProviderRegistry; } });
const reliability_1 = require("./utils/reliability");
Object.defineProperty(exports, "CircuitBreaker", { enumerable: true, get: function () { return reliability_1.CircuitBreaker; } });
Object.defineProperty(exports, "withRetry", { enumerable: true, get: function () { return reliability_1.withRetry; } });
Object.defineProperty(exports, "calculateRetryDelay", { enumerable: true, get: function () { return reliability_1.calculateRetryDelay; } });
Object.defineProperty(exports, "isRetryableStatus", { enumerable: true, get: function () { return reliability_1.isRetryableStatus; } });
Object.defineProperty(exports, "DEFAULT_RETRY_CONFIG", { enumerable: true, get: function () { return reliability_1.DEFAULT_RETRY_CONFIG; } });
const episodicMemory_1 = require("./memory/episodicMemory");
Object.defineProperty(exports, "EpisodicMemoryStore", { enumerable: true, get: function () { return episodicMemory_1.EpisodicMemoryStore; } });
const mctsWorkflow_1 = require("./orchestration/mctsWorkflow");
Object.defineProperty(exports, "MCTSWorkflowOptimizer", { enumerable: true, get: function () { return mctsWorkflow_1.MCTSWorkflowOptimizer; } });
const haloOrchestrator_1 = require("./orchestration/haloOrchestrator");
Object.defineProperty(exports, "HALOOrchestrator", { enumerable: true, get: function () { return haloOrchestrator_1.HALOOrchestrator; } });
const tokenUtils_1 = require("./utils/tokenUtils");
Object.defineProperty(exports, "countTokens", { enumerable: true, get: function () { return tokenUtils_1.countTokens; } });
Object.defineProperty(exports, "estimateCost", { enumerable: true, get: function () { return tokenUtils_1.estimateCost; } });
Object.defineProperty(exports, "estimateCostFromText", { enumerable: true, get: function () { return tokenUtils_1.estimateCostFromText; } });
Object.defineProperty(exports, "getModelCost", { enumerable: true, get: function () { return tokenUtils_1.getModelCost; } });
Object.defineProperty(exports, "listModelsByCost", { enumerable: true, get: function () { return tokenUtils_1.listModelsByCost; } });
Object.defineProperty(exports, "findCheapestModels", { enumerable: true, get: function () { return tokenUtils_1.findCheapestModels; } });
Object.defineProperty(exports, "MODEL_COSTS", { enumerable: true, get: function () { return tokenUtils_1.MODEL_COSTS; } });
const compression_1 = require("./utils/compression");
Object.defineProperty(exports, "isonEncode", { enumerable: true, get: function () { return compression_1.isonEncode; } });
Object.defineProperty(exports, "isonDecode", { enumerable: true, get: function () { return compression_1.isonDecode; } });
Object.defineProperty(exports, "compressText", { enumerable: true, get: function () { return compression_1.compressText; } });
Object.defineProperty(exports, "truncateMessages", { enumerable: true, get: function () { return compression_1.truncateMessages; } });
Object.defineProperty(exports, "truncateToTokenBudget", { enumerable: true, get: function () { return compression_1.truncateToTokenBudget; } });
Object.defineProperty(exports, "calculateCompressionRatio", { enumerable: true, get: function () { return compression_1.calculateCompressionRatio; } });
const localProvider_1 = require("./providers/localProvider");
Object.defineProperty(exports, "LocalProvider", { enumerable: true, get: function () { return localProvider_1.LocalProvider; } });
Object.defineProperty(exports, "LocalProviderManager", { enumerable: true, get: function () { return localProvider_1.LocalProviderManager; } });
Object.defineProperty(exports, "createOllamaProvider", { enumerable: true, get: function () { return localProvider_1.createOllamaProvider; } });
Object.defineProperty(exports, "createVLLMProvider", { enumerable: true, get: function () { return localProvider_1.createVLLMProvider; } });
Object.defineProperty(exports, "createLMStudioProvider", { enumerable: true, get: function () { return localProvider_1.createLMStudioProvider; } });
const batchProcessor_1 = require("./utils/batchProcessor");
Object.defineProperty(exports, "BatchProcessor", { enumerable: true, get: function () { return batchProcessor_1.BatchProcessor; } });
Object.defineProperty(exports, "executeBatch", { enumerable: true, get: function () { return batchProcessor_1.executeBatch; } });
const advancedRouter_1 = require("./routing/advancedRouter");
Object.defineProperty(exports, "routeQuery", { enumerable: true, get: function () { return advancedRouter_1.routeQuery; } });
Object.defineProperty(exports, "routeBatch", { enumerable: true, get: function () { return advancedRouter_1.routeBatch; } });
Object.defineProperty(exports, "recommendForTask", { enumerable: true, get: function () { return advancedRouter_1.recommendForTask; } });
Object.defineProperty(exports, "extractQueryFeatures", { enumerable: true, get: function () { return advancedRouter_1.extractQueryFeatures; } });
Object.defineProperty(exports, "updateModelProfile", { enumerable: true, get: function () { return advancedRouter_1.updateModelProfile; } });
Object.defineProperty(exports, "MODEL_PROFILES", { enumerable: true, get: function () { return advancedRouter_1.MODEL_PROFILES; } });
Object.defineProperty(exports, "QueryFeatures", { enumerable: true, get: function () { return advancedRouter_1.QueryFeatures; } });
Object.defineProperty(exports, "ModelProfileType", { enumerable: true, get: function () { return advancedRouter_1.ModelProfile; } });
Object.defineProperty(exports, "RouteDecision", { enumerable: true, get: function () { return advancedRouter_1.RouteDecision; } });
const prefixCache_1 = require("./cache/prefixCache");
Object.defineProperty(exports, "PrefixCache", { enumerable: true, get: function () { return prefixCache_1.PrefixCache; } });
Object.defineProperty(exports, "createWarmedCache", { enumerable: true, get: function () { return prefixCache_1.createWarmedCache; } });
Object.defineProperty(exports, "PrefixCacheStats", { enumerable: true, get: function () { return prefixCache_1.PrefixCacheStats; } });
const speculativeDecoding_1 = require("./utils/speculativeDecoding");
Object.defineProperty(exports, "SpeculativeDecoder", { enumerable: true, get: function () { return speculativeDecoding_1.SpeculativeDecoder; } });
Object.defineProperty(exports, "speculativeBatch", { enumerable: true, get: function () { return speculativeDecoding_1.speculativeBatch; } });
Object.defineProperty(exports, "estimateSpeedupPotential", { enumerable: true, get: function () { return speculativeDecoding_1.estimateSpeedupPotential; } });
Object.defineProperty(exports, "MedusaPredictor", { enumerable: true, get: function () { return speculativeDecoding_1.MedusaPredictor; } });
Object.defineProperty(exports, "EagleSpeculative", { enumerable: true, get: function () { return speculativeDecoding_1.EagleSpeculative; } });
Object.defineProperty(exports, "SpeculativeConfig", { enumerable: true, get: function () { return speculativeDecoding_1.SpeculativeConfig; } });
Object.defineProperty(exports, "SpeculativeResult", { enumerable: true, get: function () { return speculativeDecoding_1.SpeculativeResult; } });
const ensembleVoting_1 = require("./routing/ensembleVoting");
Object.defineProperty(exports, "executeEnsemble", { enumerable: true, get: function () { return ensembleVoting_1.executeEnsemble; } });
Object.defineProperty(exports, "mergeComplementary", { enumerable: true, get: function () { return ensembleVoting_1.mergeComplementary; } });
Object.defineProperty(exports, "recordFeedback", { enumerable: true, get: function () { return ensembleVoting_1.recordFeedback; } });
const queryTypePresets_1 = require("./routing/queryTypePresets");
Object.defineProperty(exports, "createPresetRouter", { enumerable: true, get: function () { return queryTypePresets_1.createPresetRouter; } });
Object.defineProperty(exports, "getPresetForQuery", { enumerable: true, get: function () { return queryTypePresets_1.getPresetForQuery; } });
Object.defineProperty(exports, "DEFAULT_PRESETS", { enumerable: true, get: function () { return queryTypePresets_1.DEFAULT_PRESETS; } });
// PI Tool definitions (for PI agent integration)
exports.TMLPD_PI_TOOLS = [
    {
        name: "tmlpd_execute",
        description: "Execute prompt across multiple LLM providers in parallel. Optimizes for cost-quality tradeoff with automatic model selection. Use when comparing multiple AI responses or needing faster results via parallel execution.",
        inputSchema: {
            type: "object",
            properties: {
                prompt: { type: "string", description: "The prompt to execute" },
                models: { type: "array", items: { type: "string" }, description: "Optional model list (auto-selects if omitted)" },
                streaming: { type: "object", properties: { enabled: { type: "boolean" }, chunk_size: { type: "number" } } }
            },
            required: ["prompt"]
        }
    },
    {
        name: "tmlpd_execute_single",
        description: "Execute with single model via smart routing. Analyzes prompt to select optimal agent based on task type (coding, explanation, analysis, etc.) with cost-quality optimization.",
        inputSchema: {
            type: "object",
            properties: {
                prompt: { type: "string", description: "The prompt to execute" },
                model: { type: "string", description: "Optional specific model" }
            },
            required: ["prompt"]
        }
    },
    {
        name: "tmlpd_cost_summary",
        description: "Get real-time cost tracking summary. Shows spending by provider, model, daily/monthly breakdowns, and remaining budget. Essential for cost monitoring in production.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "tmlpd_cache_stats",
        description: "Get response cache statistics. Shows hit rate, cache size, and effectiveness. Cache hits cost $0 and provide instant responses.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "tmlpd_provider_status",
        description: "Get status of all configured LLM providers. Shows readiness, cooldown status, failure counts. Use for debugging or selecting specific providers.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "tmlpd_invalidate_cache",
        description: "Invalidate cached responses. Use when prompt content has changed and fresh response needed, or to clear stale cache entries.",
        inputSchema: {
            type: "object",
            properties: { model: { type: "string", description: "Optional model to invalidate (all if omitted)" } }
        }
    },
    {
        name: "tmlpd_get_budget",
        description: "Get remaining budget for cost controls. Returns daily, monthly, and per-model limits. Use for budget enforcement and alerting.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "tmlpd_halo_execute",
        description: "Execute via HALO (Hierarchical Autonomous Logic-Oriented) orchestrator with 3-tier planning: decompose → assign → execute. Includes episodic memory for learning from past executions. For complex multi-step tasks.",
        inputSchema: {
            type: "object",
            properties: {
                task_description: { type: "string", description: "Task to execute" },
                max_concurrent: { type: "number", description: "Max parallel executions (default: 3)" },
                enable_mcts: { type: "boolean", description: "Enable MCTS optimization (slower but better)" }
            },
            required: ["task_description"]
        }
    },
    {
        name: "tmlpd_episodic_query",
        description: "Query episodic memory for similar past tasks. Useful for learning from past executions and improving future routing decisions.",
        inputSchema: {
            type: "object",
            properties: {
                task_description: { type: "string", description: "Task to find similar executions for" },
                limit: { type: "number", description: "Max results (default: 5)" }
            },
            required: ["task_description"]
        }
    },
    {
        name: "tmlpd_count_tokens",
        description: "Count tokens in text for cost estimation. Supports all major models (GPT-4, Claude, Gemini, Llama). Use for estimating costs before execution or calculating context window usage.",
        inputSchema: {
            type: "object",
            properties: {
                text: { type: "string", description: "Text to count tokens in" },
                model: { type: "string", description: "Model for tokenization (default: gpt-4o)" }
            },
            required: ["text"]
        }
    },
    {
        name: "tmlpd_compress_context",
        description: "Compress context/messages using ISON encoding for token reduction. Reduces context by ~20-40% while preserving meaning. Useful for fitting more content in context windows.",
        inputSchema: {
            type: "object",
            properties: {
                messages: { type: "array", description: "Messages to compress", items: { type: "object" } },
                strategy: { type: "string", enum: ["smart", "first", "last"], description: "Compression strategy (default: smart)" },
                max_tokens: { type: "number", description: "Target token budget" }
            },
            required: ["messages"]
        }
    },
    {
        name: "tmlpd_local_generate",
        description: "Generate using local LLM runtime (Ollama, vLLM, LM Studio). Zero cost, privacy-preserving. Use for development, testing, or when local GPU available. Falls back to cloud if local unavailable.",
        inputSchema: {
            type: "object",
            properties: {
                prompt: { type: "string", description: "Prompt for generation" },
                runtime: { type: "string", enum: ["ollama", "vllm", "lmstudio"], description: "Local runtime type" },
                model: { type: "string", description: "Model name (default: llama-3.3-70b)" }
            },
            required: ["prompt", "runtime"]
        }
    },
    {
        name: "tmlpd_batch_execute",
        description: "Execute batch of prompts with concurrency control. Supports priority queuing, progress callbacks, rate limiting. Use for processing multiple prompts efficiently.",
        inputSchema: {
            type: "object",
            properties: {
                prompts: { type: "array", items: { type: "string" }, description: "Prompts to execute" },
                concurrency: { type: "number", description: "Max parallel executions (default: 5)" },
                model: { type: "string", description: "Model to use (default: gpt-4o)" }
            },
            required: ["prompts"]
        }
    }
];
/**
 * Reference to Full TMLPD
 *
 * This package provides:
 * - Core: streaming, caching, cost tracking, reliability
 * - Reference: episodic memory, MCTS, HALO orchestrator
 *
 * For production with full features:
 * - Python TMLPD: https://github.com/Das-rebel/tmlpd-skill
 * - Full memory: 3-tier (episodic + semantic + working)
 * - Full MCTS: UCB1, deterministic rollouts, strategy caching
 * - Full HALO: NLP decomposition, capability matching, verification
 */
exports.default = {
    createTMLPD: tmlpdTools_1.createTMLPD,
    TMLPDTools: tmlpdTools_1.TMLPDTools,
    TMLPD_PI_TOOLS: exports.TMLPD_PI_TOOLS
};
//# sourceMappingURL=index.js.map