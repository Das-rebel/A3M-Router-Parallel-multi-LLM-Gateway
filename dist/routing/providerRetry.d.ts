/**
 * A3M Router - Per-Provider Retry Logic
 *
 * Implements exponential backoff with jitter for transient errors,
 * rate limit (429) handling with Retry-After header support,
 * and context window validation before sending requests.
 */
export interface RetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    retryableErrors?: string[];
}
export interface ProviderRetryConfig {
    [providerName: string]: {
        timeout: number;
        retry: RetryConfig;
        rateLimitRetries?: number;
    };
}
export interface RetryStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalRetries: number;
    rateLimitRetries: number;
    averageLatencyMs: number;
}
export interface ContextWindowValidation {
    valid: boolean;
    reason?: string;
    suggestedProvider?: string;
}
declare const DEFAULT_RETRY_CONFIG: RetryConfig;
export declare const DEFAULT_PROVIDER_CONFIG: ProviderRetryConfig;
declare const PROVIDER_CONTEXT_LIMITS: Record<string, number>;
export declare class ProviderRetryHandler {
    private configs;
    private stats;
    private customProviders;
    constructor(customConfigs?: ProviderRetryConfig);
    private initStats;
    /**
     * Configure or update a provider's retry settings
     */
    configureProvider(provider: string, config: Partial<{
        timeout: number;
        retry: Partial<RetryConfig>;
        rateLimitRetries: number;
    }>): void;
    /**
     * Get current config for a provider
     */
    getConfig(provider: string): {
        timeout: number;
        retry: RetryConfig;
        rateLimitRetries: number;
    };
    /**
     * Execute a function with retry logic
     */
    executeWithRetry<T>(provider: string, fn: () => Promise<T>, options?: {
        timeout?: number;
        onRetry?: (attempt: number, error: any, delayMs: number) => void;
    }): Promise<T>;
    /**
     * Execute with custom timeout wrapper
     */
    private executeWithTimeout;
    /**
     * Check if an error should trigger a retry
     */
    isRetryableError(error: any): boolean;
    /**
     * Detect hard non-retryable account/policy states.
     * These should fail fast instead of wasting retries.
     */
    private isPermanentProviderStateError;
    /**
     * Check if error is a rate limit (429)
     */
    isRateLimitError(error: any): boolean;
    /**
     * Calculate backoff delay with exponential increase and jitter
     */
    calculateBackoffDelay(attempt: number, config: RetryConfig, error?: any): number;
    /**
     * Validate context window size before sending request
     */
    validateContextWindow(provider: string, prompt: string, expectedTokens?: number): ContextWindowValidation;
    /**
     * Get retry statistics for a provider
     */
    getStats(provider: string): RetryStats;
    /**
     * Get all provider stats
     */
    getAllStats(): Record<string, RetryStats>;
    /**
     * Reset stats for a provider
     */
    resetStats(provider?: string): void;
    private createTimeoutError;
    private sleep;
    private recordSuccess;
    private recordFailure;
    private recordRetry;
}
/**
 * Create a retry handler with optional custom configs
 */
export declare function createRetryHandler(customConfigs?: ProviderRetryConfig): ProviderRetryHandler;
export declare function getDefaultRetryHandler(): ProviderRetryHandler;
export { DEFAULT_RETRY_CONFIG, PROVIDER_CONTEXT_LIMITS, };
