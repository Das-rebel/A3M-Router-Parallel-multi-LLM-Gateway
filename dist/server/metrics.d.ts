/**
 * A3M Router - Prometheus Metrics
 *
 * Lightweight metrics collector for observability.
 * Exports Prometheus-compatible /metrics endpoint.
 *
 * Metrics:
 *   a3m_requests_total{endpoint, provider, status}    — Counter
 *   a3m_request_duration_ms{endpoint, provider}       — Histogram
 *   a3m_cost_usd_total{provider}                     — Counter
 *   a3m_tokens_total{provider, type}                  — Counter
 *   a3m_cache_hits_total{cache_type}                 — Counter
 *   a3m_fallback_triggered_total{provider}           — Counter
 *   a3m_provider_errors_total{provider, error_type}  — Counter
 *   a3m_routing_decisions_total{model}               — Counter
 *   a3m_active_requests                             — Gauge
 */
export interface Counter {
    value: number;
    labels: Record<string, string>;
}
export interface Histogram {
    values: number[];
    count: number;
    sum: number;
    buckets: {
        bound: number;
        count: number;
    }[];
}
export interface Gauge {
    value: number;
}
/**
 * Increment a counter by delta (default 1).
 */
export declare function incrementCounter(name: string, labels?: Record<string, string>, delta?: number): void;
/**
 * Record a histogram value (duration, size, etc.).
 */
export declare function recordHistogram(name: string, labels: Record<string, string>, value: number): void;
/**
 * Set a gauge value.
 */
export declare function setGauge(name: string, labels: Record<string, string>, value: number): void;
/**
 * Increment active requests gauge (call on start, decrement on end).
 */
export declare function recordActiveRequest(delta: 1 | -1): void;
/**
 * Get current active request count.
 */
export declare function getActiveRequests(): number;
/**
 * Generate Prometheus /metrics output.
 */
export declare function generatePrometheusMetrics(): string;
/**
 * Record a completed request with all metrics.
 */
export declare function recordRequest(params: {
    endpoint: string;
    provider: string;
    status: 'success' | 'error';
    durationMs: number;
    tokensIn?: number;
    tokensOut?: number;
    cost?: number;
    model?: string;
}): void;
/**
 * Record a provider error.
 */
export declare function recordProviderError(provider: string, errorType: string): void;
/**
 * Record a cache hit.
 */
export declare function recordCacheHit(cacheType: 'semantic' | 'exact' | 'none'): void;
/**
 * Record a fallback trigger.
 */
export declare function recordFallback(provider: string): void;
declare const _default: {
    incrementCounter: typeof incrementCounter;
    recordHistogram: typeof recordHistogram;
    setGauge: typeof setGauge;
    recordActiveRequest: typeof recordActiveRequest;
    getActiveRequests: typeof getActiveRequests;
    generatePrometheusMetrics: typeof generatePrometheusMetrics;
    recordRequest: typeof recordRequest;
    recordProviderError: typeof recordProviderError;
    recordCacheHit: typeof recordCacheHit;
    recordFallback: typeof recordFallback;
};
export default _default;
//# sourceMappingURL=metrics.d.ts.map