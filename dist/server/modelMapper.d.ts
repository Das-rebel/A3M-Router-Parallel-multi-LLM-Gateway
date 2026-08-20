/**
 * A3M Router - Model Mapper
 *
 * Maps OpenAI-compatible model names to our provider/model pairs.
 * Supports:
 *   - "auto" → intelligent routing via advancedRouter
 *   - "gpt-4" → best available premium provider
 *   - "gpt-3.5-turbo" → best available fast provider
 *   - "groq/llama-3.3-70b" → specific provider/model
 *   - "claude-3.5-sonnet" → Anthropic provider
 *   - "gemini-2.0-flash" → Google provider
 */
export interface ModelMapping {
    providerId: string;
    model: string;
    baseUrl: string;
    apiKey: string | null;
    costPerK: {
        input: number;
        output: number;
    };
    type: string;
}
/**
 * Resolve an OpenAI-compatible model name to a concrete provider/model pair.
 *
 * Resolution order:
 *  1. "auto" → route through advancedRouter
 *  2. "provider/model" format → direct lookup
 *  3. OpenAI alias → preference list lookup
 *  4. Bare model name → search across all providers
 *  5. Fallback → first available provider's first model
 */
export declare function resolveModel(modelName: string, prompt?: string): ModelMapping | null;
/**
 * List all available models in OpenAI-compatible format.
 */
export declare function listAvailableModels(): Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
}>;
//# sourceMappingURL=modelMapper.d.ts.map