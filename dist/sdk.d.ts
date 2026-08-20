/**
 * A3M Router TypeScript SDK
 *
 * Clean wrapper class providing a better DX than raw exports.
 *
 * Usage:
 *   import { A3MRouter } from 'adaptive-memory-multi-model-router/sdk';
 *
 *   const router = new A3MRouter();
 *
 *   // Route a query (no execution, just model selection)
 *   const decision = router.route("What is 2+2?");
 *   console.log(decision.model, decision.tier, decision.cost);
 *
 *   // Start the OpenAI-compatible proxy server
 *   const proxyURL = await router.serve(8787);
 *
 *   // Use with any OpenAI SDK
 *   import OpenAI from 'openai';
 *   const client = new OpenAI({ baseURL: router.proxyURL });
 *   const response = await client.chat.completions.create({
 *     model: 'auto',
 *     messages: [{ role: 'user', content: 'Hello' }]
 *   });
 */
export interface RoutingResult {
    /** Selected model identifier (e.g. "groq/llama-3.3-70b-versatile") */
    model: string;
    /** Cost tier classification */
    tier: 'free' | 'cheap' | 'mid' | 'premium';
    /** Estimated cost in USD */
    cost: number;
    /** Complexity score 0.0–1.0 */
    complexity: number;
    /** Human-readable reasoning for the selection */
    reasoning: string;
    /** Alternative models in priority order */
    fallbackModels: string[];
    /** Whether the selected model is free */
    isFree: boolean;
    /** Whether this is classified as an expert-level query */
    isExpert: boolean;
}
export interface QueryFeatures {
    complexity: number;
    length: number;
    has_code: boolean;
    has_math: boolean;
    is_multilingual: boolean;
    is_translation: boolean;
    is_creative: boolean;
    requires_reasoning: boolean;
    is_security: boolean;
    is_devops: boolean;
    is_data: boolean;
    detected_domain: string;
    domain_score: number;
}
export interface A3MRouterConfig {
    /** Default model to use when routing is ambiguous */
    defaultModel?: string;
    /** Maximum cost per query in USD (routes to cheaper models if exceeded) */
    maxCostPerQuery?: number;
    /** Prefer fast responses over higher quality */
    preferSpeedOverQuality?: boolean;
    /** Restrict routing to these provider IDs */
    providers?: string[];
}
export declare class A3MRouter {
    private config;
    private _proxyURL;
    constructor(config?: A3MRouterConfig);
    /**
     * Route a query — returns model selection without executing it.
     *
     * @param query - The user prompt to route
     * @returns Routing decision with model, tier, cost, complexity
     */
    route(query: string): RoutingResult;
    /**
     * Route multiple queries in batch.
     *
     * @param queries - Array of user prompts
     * @returns Array of routing decisions
     */
    routeBatch(queries: string[]): RoutingResult[];
    /**
     * Get model recommendation for a task description.
     *
     * @param task - Task description (e.g. "code generation", "summarization")
     * @returns Routing decision
     */
    recommend(task: string): RoutingResult;
    /**
     * Start the OpenAI-compatible proxy server.
     *
     * @param port - Port to listen on (default: 8787)
     * @returns The proxy base URL (e.g. "http://localhost:8787/v1")
     */
    serve(port?: number): Promise<string>;
    /**
     * Get the proxy URL. Available after serve() is called,
     * otherwise returns the default.
     */
    get proxyURL(): string;
    /**
     * Extract features from a query for debugging or analysis.
     *
     * @param query - The user prompt to analyze
     * @returns Detailed feature breakdown
     */
    analyze(query: string): {
        complexity: number;
        length: number;
        has_code: boolean;
        requires_reasoning: boolean;
        is_multilingual: boolean;
        is_translation: boolean;
        domain: string | null;
        intent: string;
        detected_language: string | null;
        wordCount: number;
    };
    /**
     * Classify a complexity score into a named tier.
     */
    private classifyTier;
}
/**
 * Convenience: create an A3MRouter instance.
 *
 * @param config - Optional configuration
 * @returns Configured A3MRouter instance
 */
export declare function createSDK(config?: A3MRouterConfig): A3MRouter;
//# sourceMappingURL=sdk.d.ts.map