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
interface ModelProfile {
    supports_multimodal: boolean;
    name: string;
    provider: string;
    providerName: string;
    cost_per_1k_input: number;
    cost_per_1k_output: number;
    latency_ms: number;
    quality_score: number;
    strengths: string[];
    context_window: number;
    type: string;
    priority: number;
}
export declare let MODEL_PROFILES: Record<string, ModelProfile>;
export interface QueryFeatures {
    length: number;
    wordCount: number;
    complexity: number;
    has_code: boolean;
    has_math: boolean;
    requires_reasoning: boolean;
    is_multilingual: boolean;
    is_translation: boolean;
    is_security: boolean;
    is_creative: boolean;
    is_devops: boolean;
    is_multimodal: boolean;
    domain: string | null;
    intent: string;
    detected_language: string | null;
    risk_profile: 'low' | 'medium' | 'high';
}
export declare function extractQueryFeatures(prompt: string): QueryFeatures;
export interface RouteDecision {
    primary_model: string | null;
    fallback_models: string[];
    confidence: number;
    reasoning: string;
    estimated_cost: number;
    estimated_latency_ms: number;
    features?: QueryFeatures;
    provider_type?: string;
}
export declare function routeQuery(prompt: string, available_models?: string[], budget_multiplier?: number): RouteDecision;
export declare function routeBatch(prompts: string[], options?: {
    same_model?: boolean;
    max_cost_per_prompt?: number;
}): RouteDecision[];
export declare function recommendForTask(task: string): {
    primary: string;
    fallbacks: string[];
    reason: string;
    features: QueryFeatures;
};
export declare function updateModelProfile(model_name: string, actual_latency_ms: number, actual_cost: number, quality_rating: number): void;
export declare function getProviderHealth(): Promise<any>;
export {};
