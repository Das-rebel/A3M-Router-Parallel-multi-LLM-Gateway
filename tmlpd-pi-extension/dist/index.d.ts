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
import { createTMLPD, TMLPDTools, TMLPDConfig, ExecuteResult, ParallelResult, StreamingConfig } from "./tools/tmlpdTools";
import { ResponseCache, CacheConfig, CacheEntry } from "./cache/responseCache";
import { CostTracker, BudgetConfig, CostAlert, CostSummary, CostSnapshot } from "./cost/costTracker";
import { ProviderRegistry, ProviderConfig, ProviderRegistryConfig } from "./providers/registry";
import { CircuitBreaker, withRetry, RetryConfig, CircuitState, calculateRetryDelay, isRetryableStatus, DEFAULT_RETRY_CONFIG } from "./utils/reliability";
import { EpisodicMemoryStore, EpisodicEntry, MemoryQuery } from "./memory/episodicMemory";
import { MCTSWorkflowOptimizer, WorkflowState, WorkflowAction, MCTSConfig } from "./orchestration/mctsWorkflow";
import { HALOOrchestrator, SubTask, AgentAssignment, ExecutionResult, HALOConfig } from "./orchestration/haloOrchestrator";
import { countTokens, estimateCost, estimateCostFromText, getModelCost, listModelsByCost, findCheapestModels, MODEL_COSTS, TokenCost } from "./utils/tokenUtils";
import { isonEncode, isonDecode, compressText, truncateMessages, truncateToTokenBudget, calculateCompressionRatio, Message, CompressionStrategy } from "./utils/compression";
import { LocalProvider, LocalProviderManager, createOllamaProvider, createVLLMProvider, createLMStudioProvider, LocalRuntime, LocalProviderConfig, LocalModelInfo, LocalGenerationResult, LocalParallelResult } from "./providers/localProvider";
import { BatchProcessor, executeBatch, BatchItem, BatchResult, BatchOptions, BatchProgress, ProgressCallback } from "./utils/batchProcessor";
import { routeQuery, routeBatch, recommendForTask, extractQueryFeatures, updateModelProfile, MODEL_PROFILES, QueryFeatures, ModelProfile, RouteDecision } from "./routing/advancedRouter";
import { PrefixCache, createWarmedCache, PrefixCacheStats } from "./cache/prefixCache";
import { SpeculativeDecoder, speculativeBatch, estimateSpeedupPotential, MedusaPredictor, EagleSpeculative, SpeculativeConfig, SpeculativeResult } from "./utils/speculativeDecoding";
import { executeEnsemble, mergeComplementary, recordFeedback, EnsembleResult, EnsembleConfig } from "./routing/ensembleVoting";
import { createPresetRouter, getPresetForQuery, DEFAULT_PRESETS, QueryPreset, PresetRouter } from "./routing/queryTypePresets";
export { createTMLPD, TMLPDTools, TMLPDConfig, ExecuteResult, ParallelResult, StreamingConfig };
export { ResponseCache, CacheConfig, CacheEntry };
export { CostTracker, BudgetConfig, CostAlert, CostSummary, CostSnapshot };
export { ProviderRegistry, ProviderConfig, ProviderRegistryConfig };
export { CircuitBreaker, withRetry, RetryConfig, CircuitState, calculateRetryDelay, isRetryableStatus, DEFAULT_RETRY_CONFIG };
export { EpisodicMemoryStore, EpisodicEntry, MemoryQuery };
export { MCTSWorkflowOptimizer, WorkflowState, WorkflowAction, MCTSConfig };
export { HALOOrchestrator, SubTask, AgentAssignment, ExecutionResult, HALOConfig };
export { countTokens, estimateCost, estimateCostFromText, getModelCost, listModelsByCost, findCheapestModels, MODEL_COSTS, TokenCost };
export { isonEncode, isonDecode, compressText, truncateMessages, truncateToTokenBudget, calculateCompressionRatio, Message, CompressionStrategy };
export { LocalProvider, LocalProviderManager, createOllamaProvider, createVLLMProvider, createLMStudioProvider, LocalRuntime, LocalProviderConfig, LocalModelInfo, LocalGenerationResult, LocalParallelResult };
export { BatchProcessor, executeBatch, BatchItem, BatchResult, BatchOptions, BatchProgress, ProgressCallback };
export { routeQuery, routeBatch, recommendForTask, extractQueryFeatures, updateModelProfile, MODEL_PROFILES, QueryFeatures, ModelProfile as ModelProfileType, RouteDecision };
export { executeEnsemble, mergeComplementary, recordFeedback, EnsembleResult, EnsembleConfig };
export { createPresetRouter, getPresetForQuery, DEFAULT_PRESETS, QueryPreset, PresetRouter };
export { PrefixCache, createWarmedCache, PrefixCacheStats };
export { SpeculativeDecoder, speculativeBatch, estimateSpeedupPotential, MedusaPredictor, EagleSpeculative, SpeculativeConfig, SpeculativeResult };
export declare const TMLPD_PI_TOOLS: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            prompt: {
                type: string;
                description: string;
            };
            models: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            streaming: {
                type: string;
                properties: {
                    enabled: {
                        type: string;
                    };
                    chunk_size: {
                        type: string;
                    };
                };
            };
            max_concurrent?: undefined;
            enable_mcts?: undefined;
            task_description?: undefined;
            limit?: undefined;
            text?: undefined;
            messages?: undefined;
            strategy?: undefined;
            max_tokens?: undefined;
            runtime?: undefined;
            prompts?: undefined;
            concurrency?: undefined;
            model?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            models?: undefined;
            streaming?: undefined;
            prompt: {
                type: string;
                description: string;
            };
            model: {
                type: string;
                description: string;
            };
            max_concurrent?: undefined;
            enable_mcts?: undefined;
            task_description?: undefined;
            limit?: undefined;
            text?: undefined;
            messages?: undefined;
            strategy?: undefined;
            max_tokens?: undefined;
            runtime?: undefined;
            prompts?: undefined;
            concurrency?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            models?: undefined;
            streaming?: undefined;
            max_concurrent?: undefined;
            enable_mcts?: undefined;
            task_description?: undefined;
            limit?: undefined;
            text?: undefined;
            messages?: undefined;
            strategy?: undefined;
            max_tokens?: undefined;
            prompt?: undefined;
            runtime?: undefined;
            prompts?: undefined;
            concurrency?: undefined;
            model?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            models?: undefined;
            streaming?: undefined;
            model: {
                type: string;
                description: string;
            };
            max_concurrent?: undefined;
            enable_mcts?: undefined;
            task_description?: undefined;
            limit?: undefined;
            text?: undefined;
            messages?: undefined;
            strategy?: undefined;
            max_tokens?: undefined;
            prompt?: undefined;
            runtime?: undefined;
            prompts?: undefined;
            concurrency?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            models?: undefined;
            streaming?: undefined;
            task_description: {
                type: string;
                description: string;
            };
            max_concurrent: {
                type: string;
                description: string;
            };
            enable_mcts: {
                type: string;
                description: string;
            };
            limit?: undefined;
            text?: undefined;
            messages?: undefined;
            strategy?: undefined;
            max_tokens?: undefined;
            prompt?: undefined;
            runtime?: undefined;
            prompts?: undefined;
            concurrency?: undefined;
            model?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            models?: undefined;
            streaming?: undefined;
            max_concurrent?: undefined;
            enable_mcts?: undefined;
            task_description: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            text?: undefined;
            messages?: undefined;
            strategy?: undefined;
            max_tokens?: undefined;
            prompt?: undefined;
            runtime?: undefined;
            prompts?: undefined;
            concurrency?: undefined;
            model?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            models?: undefined;
            streaming?: undefined;
            max_concurrent?: undefined;
            enable_mcts?: undefined;
            task_description?: undefined;
            limit?: undefined;
            text: {
                type: string;
                description: string;
            };
            model: {
                type: string;
                description: string;
            };
            messages?: undefined;
            strategy?: undefined;
            max_tokens?: undefined;
            prompt?: undefined;
            runtime?: undefined;
            prompts?: undefined;
            concurrency?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            models?: undefined;
            streaming?: undefined;
            max_concurrent?: undefined;
            enable_mcts?: undefined;
            task_description?: undefined;
            limit?: undefined;
            text?: undefined;
            messages: {
                type: string;
                description: string;
                items: {
                    type: string;
                };
            };
            strategy: {
                type: string;
                enum: string[];
                description: string;
            };
            max_tokens: {
                type: string;
                description: string;
            };
            prompt?: undefined;
            runtime?: undefined;
            prompts?: undefined;
            concurrency?: undefined;
            model?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            models?: undefined;
            streaming?: undefined;
            max_concurrent?: undefined;
            enable_mcts?: undefined;
            task_description?: undefined;
            limit?: undefined;
            text?: undefined;
            messages?: undefined;
            strategy?: undefined;
            max_tokens?: undefined;
            prompt: {
                type: string;
                description: string;
            };
            runtime: {
                type: string;
                enum: string[];
                description: string;
            };
            model: {
                type: string;
                description: string;
            };
            prompts?: undefined;
            concurrency?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            models?: undefined;
            streaming?: undefined;
            max_concurrent?: undefined;
            enable_mcts?: undefined;
            task_description?: undefined;
            limit?: undefined;
            text?: undefined;
            messages?: undefined;
            strategy?: undefined;
            max_tokens?: undefined;
            prompt?: undefined;
            runtime?: undefined;
            prompts: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            concurrency: {
                type: string;
                description: string;
            };
            model: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
})[];
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
declare const _default: {
    createTMLPD: typeof createTMLPD;
    TMLPDTools: typeof TMLPDTools;
    TMLPD_PI_TOOLS: ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                prompt: {
                    type: string;
                    description: string;
                };
                models: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                streaming: {
                    type: string;
                    properties: {
                        enabled: {
                            type: string;
                        };
                        chunk_size: {
                            type: string;
                        };
                    };
                };
                max_concurrent?: undefined;
                enable_mcts?: undefined;
                task_description?: undefined;
                limit?: undefined;
                text?: undefined;
                messages?: undefined;
                strategy?: undefined;
                max_tokens?: undefined;
                runtime?: undefined;
                prompts?: undefined;
                concurrency?: undefined;
                model?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                models?: undefined;
                streaming?: undefined;
                prompt: {
                    type: string;
                    description: string;
                };
                model: {
                    type: string;
                    description: string;
                };
                max_concurrent?: undefined;
                enable_mcts?: undefined;
                task_description?: undefined;
                limit?: undefined;
                text?: undefined;
                messages?: undefined;
                strategy?: undefined;
                max_tokens?: undefined;
                runtime?: undefined;
                prompts?: undefined;
                concurrency?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                models?: undefined;
                streaming?: undefined;
                max_concurrent?: undefined;
                enable_mcts?: undefined;
                task_description?: undefined;
                limit?: undefined;
                text?: undefined;
                messages?: undefined;
                strategy?: undefined;
                max_tokens?: undefined;
                prompt?: undefined;
                runtime?: undefined;
                prompts?: undefined;
                concurrency?: undefined;
                model?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                models?: undefined;
                streaming?: undefined;
                model: {
                    type: string;
                    description: string;
                };
                max_concurrent?: undefined;
                enable_mcts?: undefined;
                task_description?: undefined;
                limit?: undefined;
                text?: undefined;
                messages?: undefined;
                strategy?: undefined;
                max_tokens?: undefined;
                prompt?: undefined;
                runtime?: undefined;
                prompts?: undefined;
                concurrency?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                models?: undefined;
                streaming?: undefined;
                task_description: {
                    type: string;
                    description: string;
                };
                max_concurrent: {
                    type: string;
                    description: string;
                };
                enable_mcts: {
                    type: string;
                    description: string;
                };
                limit?: undefined;
                text?: undefined;
                messages?: undefined;
                strategy?: undefined;
                max_tokens?: undefined;
                prompt?: undefined;
                runtime?: undefined;
                prompts?: undefined;
                concurrency?: undefined;
                model?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                models?: undefined;
                streaming?: undefined;
                max_concurrent?: undefined;
                enable_mcts?: undefined;
                task_description: {
                    type: string;
                    description: string;
                };
                limit: {
                    type: string;
                    description: string;
                };
                text?: undefined;
                messages?: undefined;
                strategy?: undefined;
                max_tokens?: undefined;
                prompt?: undefined;
                runtime?: undefined;
                prompts?: undefined;
                concurrency?: undefined;
                model?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                models?: undefined;
                streaming?: undefined;
                max_concurrent?: undefined;
                enable_mcts?: undefined;
                task_description?: undefined;
                limit?: undefined;
                text: {
                    type: string;
                    description: string;
                };
                model: {
                    type: string;
                    description: string;
                };
                messages?: undefined;
                strategy?: undefined;
                max_tokens?: undefined;
                prompt?: undefined;
                runtime?: undefined;
                prompts?: undefined;
                concurrency?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                models?: undefined;
                streaming?: undefined;
                max_concurrent?: undefined;
                enable_mcts?: undefined;
                task_description?: undefined;
                limit?: undefined;
                text?: undefined;
                messages: {
                    type: string;
                    description: string;
                    items: {
                        type: string;
                    };
                };
                strategy: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                max_tokens: {
                    type: string;
                    description: string;
                };
                prompt?: undefined;
                runtime?: undefined;
                prompts?: undefined;
                concurrency?: undefined;
                model?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                models?: undefined;
                streaming?: undefined;
                max_concurrent?: undefined;
                enable_mcts?: undefined;
                task_description?: undefined;
                limit?: undefined;
                text?: undefined;
                messages?: undefined;
                strategy?: undefined;
                max_tokens?: undefined;
                prompt: {
                    type: string;
                    description: string;
                };
                runtime: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                model: {
                    type: string;
                    description: string;
                };
                prompts?: undefined;
                concurrency?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                models?: undefined;
                streaming?: undefined;
                max_concurrent?: undefined;
                enable_mcts?: undefined;
                task_description?: undefined;
                limit?: undefined;
                text?: undefined;
                messages?: undefined;
                strategy?: undefined;
                max_tokens?: undefined;
                prompt?: undefined;
                runtime?: undefined;
                prompts: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                concurrency: {
                    type: string;
                    description: string;
                };
                model: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    })[];
};
export default _default;
//# sourceMappingURL=index.d.ts.map