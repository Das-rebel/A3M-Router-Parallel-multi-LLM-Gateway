/**
 * Token counting utilities for provider cost estimation
 */
export interface TokenCost {
    input_per_1k: number;
    output_per_1k: number;
}
export declare const MODEL_COSTS: Record<string, TokenCost>;
/**
 * Count tokens in text (approximate for English).
 * Based on ~1.3 tokens per word for typical English text.
 */
export declare function countTokens(text: string, model?: string): number;
/**
 * Alias for countTokens for backward compatibility.
 */
export declare function estimateTokens(text: string): number;
/**
 * Estimate cost for a prompt/completion pair.
 */
export declare function estimateCost(prompt_tokens: number, completion_tokens: number, model: string): number;
/**
 * Estimate cost from raw text (approximates both prompt and completion).
 */
export declare function estimateCostFromText(prompt: string, completion: string, model: string): number;
/**
 * Get cost info for a model.
 */
export declare function getModelCost(model: string): TokenCost;
/**
 * List all supported models with their costs.
 */
export declare function listModelsByCost(): Array<{
    model: string;
    input: number;
    output: number;
}>;
/**
 * Find cheapest models for a given task.
 */
export declare function findCheapestModels(task: "fast" | "quality" | "balanced" | "coding", count?: number): string[];
declare const _default: {
    countTokens: typeof countTokens;
    estimateTokens: typeof estimateTokens;
    estimateCost: typeof estimateCost;
    estimateCostFromText: typeof estimateCostFromText;
    getModelCost: typeof getModelCost;
    listModelsByCost: typeof listModelsByCost;
    findCheapestModels: typeof findCheapestModels;
    MODEL_COSTS: Record<string, TokenCost>;
};
export default _default;
