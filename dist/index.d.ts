export { routeQuery, routeBatch, recommendForTask, extractQueryFeatures, MODEL_PROFILES, updateModelProfile, getProviderHealth, } from './routing/advancedRouter';
export { ProviderRetryHandler, createRetryHandler, getDefaultRetryHandler, DEFAULT_RETRY_CONFIG, DEFAULT_PROVIDER_CONFIG, PROVIDER_CONTEXT_LIMITS, } from './routing/providerRetry';
export type { RetryConfig, ProviderRetryConfig, RetryStats, ContextWindowValidation, } from './routing/providerRetry';
export { DEFAULT_PROVIDERS, getAvailableProviders, registerProvider, deregisterProvider, updateProvider, healthCheck, checkAllProviders, findCheapestAvailableProvider, findFastestAvailableProvider, loadConfig, saveConfig, } from './providers/providerConfig';
export type { ProviderTier, ProviderFormat, ProviderType, ProviderCost, ProviderDefinition, } from './providers/providerConfig';
export { CostTracker } from './cost/costTracker';
export { BudgetEnforcer, BudgetExceededError, createBudgetEnforcer } from './cost/budgetEnforcer';
export type { BudgetConfig, SpendRecord, BudgetCheckResult } from './cost/budgetEnforcer';
export { MemoryTree } from './memory/memoryTree';
export { ReasoningBank } from './memory/reasoningBank';
export type { ReasoningMemory, ReasoningBankConfig } from './memory/reasoningBank';
export { HybridMemory } from './memory/hybridMemory';
export type { HybridMemoryConfig, HybridResult } from './memory/hybridMemory';
export type { MemoryChunk, TreeNode } from './memory/memoryTree';
export { countTokens, estimateTokens } from './utils/tokenUtils';
export { SemanticCache } from './cache/semanticCache';
export { GuardrailEngine } from './security/guardrails';
export { CostAnalytics } from './analytics/costAnalytics';
export { createProxyServer } from './server/proxyServer';
export { Tracer, getTracer, createTracer, MetricsCollector, getMetrics, createMetricsCollector, observabilityMiddleware, observabilityPlugin, budgetAlertMiddleware, } from './observability';
export type { Span, Metric, RouteTrace, ObservabilityEvent } from './observability';
export { EnsembleOrchestrator, EnsembleStrategy, EnsembleResponse } from './ensemble';
export { LoyaltyMatrix, HandicapCalculator, calculateEnhancedShapley, createAccuracyFn, applyCredit, summarize, type ShapleyConfig, type ShapleySummary, } from './ensemble/shapleyValue';
export { MultiRoundDialogOptimizer, dialogOptimizer, type DialogTurn, type DialogState, } from './ensemble/multiRoundDialog';
export { executeScienceQuery, routeScienceQuery, isScienceQuery, detectScienceDomain, scienceTools, RESEARCH_TEMPLATES, type ScienceQuery, type ScienceResult, } from './integrations/scienceAdapter';
import { routeQuery, routeBatch, recommendForTask } from './routing/advancedRouter';
import { getAvailableProviders, healthCheck } from './providers/providerConfig';
import { CostTracker } from './cost/costTracker';
import { MemoryTree } from './memory/memoryTree';
import { EnsembleOrchestrator } from './ensemble';
export interface A3MRouterOptions {
    defaultProvider?: string;
    enableCache?: boolean;
    enableGuardrails?: boolean;
    costLimit?: number;
}
export declare function createA3MRouter(options?: A3MRouterOptions): {
    route: typeof routeQuery;
    routeBatch: typeof routeBatch;
    recommendForTask: typeof recommendForTask;
    getAvailableProviders: typeof getAvailableProviders;
    healthCheck: typeof healthCheck;
    costTracker: CostTracker;
    memoryTree: MemoryTree;
    ensemble: EnsembleOrchestrator;
    options: A3MRouterOptions;
};
export default createA3MRouter;
//# sourceMappingURL=index.d.ts.map