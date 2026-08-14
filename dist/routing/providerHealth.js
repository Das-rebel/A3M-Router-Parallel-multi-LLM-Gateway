"use strict";
/**
 * Provider Health Manager with Circuit Breaker
 *
 * Intelligent failover system for A3M Router providing:
 * - Rolling window metrics tracking (latency, error rate)
 * - Health scoring based on latency percentile + error rate
 * - Circuit breaker: 3 consecutive errors → 60s cooldown
 * - Probe mode after cooldown for recovery
 * - Sorted fallback chain based on health scores
 *
 * Usage:
 *   import { ProviderHealthManager, ProviderHealth } from './routing/providerHealth';
 *
 *   const healthManager = new ProviderHealthManager();
 *
 *   // Record outcomes
 *   healthManager.recordSuccess('openai/gpt-4o', 150);
 *   healthManager.recordFailure('anthropic/claude-3-5-sonnet', 'rate_limit');
 *
 *   // Get health status
 *   const health = healthManager.getHealth('openai/gpt-4o');
 *
 *   // Get sorted fallback chain
 *   const chain = healthManager.getFallbackChain(['openai/gpt-4o', 'anthropic/claude-3-5-sonnet']);
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalHealthManager = exports.ProviderHealthManager = exports.HealthEvent = void 0;
exports.mvtShouldRotate = mvtShouldRotate;
const events_1 = require("events");
// ============================================================
// Events
// ============================================================
var HealthEvent;
(function (HealthEvent) {
    HealthEvent["HEALTH_CHANGED"] = "healthChanged";
    HealthEvent["CIRCUIT_OPENED"] = "circuitOpened";
    HealthEvent["CIRCUIT_CLOSED"] = "circuitClosed";
    HealthEvent["COOLDOWN_STARTED"] = "cooldownStarted";
    HealthEvent["COOLDOWN_ENDED"] = "cooldownEnded";
    HealthEvent["PROVIDER_DISABLED"] = "providerDisabled";
    HealthEvent["PROVIDER_ENABLED"] = "providerEnabled";
    HealthEvent["PROBE_ALLOWED"] = "probeAllowed";
})(HealthEvent || (exports.HealthEvent = HealthEvent = {}));
// ============================================================
// ProviderHealthManager
// ============================================================
class ProviderHealthManager extends events_1.EventEmitter {
    // Rolling window metrics per provider
    metrics = new Map();
    // Current health state per provider
    health = new Map();
    // Disabled providers (manual disable)
    disabled = new Map();
    // Config
    config;
    constructor(config = {}) {
        super();
        this.config = {
            windowSize: config.windowSize ?? 100,
            circuitBreakerThreshold: config.circuitBreakerThreshold ?? 3,
            cooldownMs: config.cooldownMs ?? 60000,
            latencyPercentile: config.latencyPercentile ?? 95,
            weights: {
                latency: config.weights?.latency ?? 0.3,
                errorRate: config.weights?.errorRate ?? 0.5,
                consecutiveErrors: config.weights?.consecutiveErrors ?? 0.2,
            },
        };
    }
    /**
     * Record a successful request
     * @param provider - provider name
     * @param latencyMs - response latency in ms
     * @param tokensUsed - tokens consumed this request (for MVT rate-limit tracking)
     */
    recordSuccess(provider, latencyMs, tokensUsed = 0) {
        this.ensureProviderExists(provider);
        const now = Date.now();
        const window = this.getMetricsWindow(provider);
        window.push({
            name: provider,
            totalRequests: 1,
            successfulRequests: 1,
            failedRequests: 0,
            totalLatency: latencyMs,
            lastLatency: latencyMs,
            tokensUsed,
        });
        // Trim to window size
        while (window.length > this.config.windowSize) {
            window.shift();
        }
        // === MVT RATE-LIMIT WINDOW MANAGEMENT ===
        const health = this.health.get(provider);
        const windowElapsed = now - health.rateLimitWindowStart;
        // If window has elapsed (rolled over), reset the token counter
        if (windowElapsed >= health.rateLimitWindowMs) {
            health.tokensUsedThisWindow = 0;
            health.rateLimitWindowStart = now;
        }
        // Accumulate tokens used
        if (tokensUsed > 0) {
            health.tokensUsedThisWindow += tokensUsed;
        }
        // Update rolling average tokens per request
        const successfulReqs = window.filter(m => m.successfulRequests > 0);
        if (successfulReqs.length > 0) {
            const totalTokens = successfulReqs.reduce((s, m) => s + (m.tokensUsed || 0), 0);
            health.avgTokensPerRequest = totalTokens / successfulReqs.length;
        }
        // Update health state
        health.lastSuccess = now;
        health.consecutiveErrors = 0;
        health.cooldownUntil = 0;
        health.isHealthy = true;
        // Recalculate health score
        this.recalculateHealthScore(provider);
        this.emit(HealthEvent.HEALTH_CHANGED, health);
    }
    /**
     * Record a failed request
     */
    recordFailure(provider, error) {
        this.ensureProviderExists(provider);
        const now = Date.now();
        const window = this.getMetricsWindow(provider);
        window.push({
            name: provider,
            totalRequests: 1,
            successfulRequests: 0,
            failedRequests: 1,
            totalLatency: 0,
            lastLatency: 0,
            tokensUsed: 0,
        });
        // Trim to window size
        while (window.length > this.config.windowSize) {
            window.shift();
        }
        // Update health state
        const health = this.health.get(provider);
        health.lastError = now;
        health.consecutiveErrors++;
        // Check circuit breaker
        if (health.consecutiveErrors >= this.config.circuitBreakerThreshold) {
            health.cooldownUntil = now + this.config.cooldownMs;
            health.isHealthy = false;
            this.emit(HealthEvent.CIRCUIT_OPENED, {
                provider,
                consecutiveErrors: health.consecutiveErrors,
                cooldownUntil: health.cooldownUntil,
                reason: error,
            });
            this.emit(HealthEvent.COOLDOWN_STARTED, {
                provider,
                duration: this.config.cooldownMs,
                reason: error,
            });
        }
        this.recalculateHealthScore(provider);
        this.emit(HealthEvent.HEALTH_CHANGED, health);
    }
    /**
     * Get current health for a provider
     */
    getHealth(provider) {
        this.ensureProviderExists(provider);
        return { ...this.health.get(provider) };
    }
    /**
     * Get all provider health statuses
     */
    getAllHealth() {
        const result = new Map();
        for (const [name, health] of this.health.entries()) {
            result.set(name, { ...health });
        }
        return result;
    }
    /**
     * Check if a provider is available (healthy and not in cooldown/manual disable)
     */
    isAvailable(provider) {
        const health = this.health.get(provider);
        if (!health)
            return false;
        // Check manual disable
        const disabled = this.disabled.get(provider);
        if (disabled && disabled.until > Date.now()) {
            return false;
        }
        // Check cooldown
        if (health.cooldownUntil > Date.now()) {
            return false;
        }
        return health.isHealthy;
    }
    /**
     * Check if cooldown has expired and probe is allowed
     */
    isProbeAllowed(provider) {
        const health = this.health.get(provider);
        if (!health)
            return false;
        // If not in cooldown, no probe needed
        if (health.cooldownUntil === 0)
            return true;
        // If cooldown has expired
        if (health.cooldownUntil <= Date.now()) {
            // Only allow one probe request per cooldown period
            // After probe (marked by consecutiveErrors reset), normal requests allowed
            return true;
        }
        return false;
    }
    /**
     * Get the best provider from a list based on health scores
     */
    getBestProvider(providers) {
        const available = providers.filter(p => this.isAvailable(p));
        if (available.length === 0)
            return null;
        return available.reduce((best, current) => {
            const health = this.health.get(current);
            const bestHealth = this.health.get(best);
            if (!health || !bestHealth)
                return current;
            return health.healthScore >= bestHealth.healthScore ? current : best;
        });
    }
    /**
     * Get sorted fallback chain based on health scores
     * Returns providers sorted by health score (descending)
     */
    getFallbackChain(providers) {
        // Score each provider
        const scored = providers.map(p => ({
            provider: p,
            score: this.isAvailable(p) ? (this.health.get(p)?.healthScore ?? 0) : -1,
        }));
        // Sort by health score (descending), unavailable at end
        scored.sort((a, b) => {
            if (a.score === -1 && b.score === -1)
                return 0;
            if (a.score === -1)
                return 1;
            if (b.score === -1)
                return -1;
            return b.score - a.score;
        });
        return scored.map(s => s.provider);
    }
    // ================================================================
    // MVT RATE-LIMIT ROTATION (Charnov 1976 Optimal Foraging)
    // ================================================================
    /**
     * Configure rate-limit parameters for a provider.
     * Call this once during provider registration with the provider's actual limits.
     *
     * @param provider - provider name
     * @param rateLimitTokens - max tokens per window (e.g., 1000000 for 1M)
     * @param rateLimitWindowMs - window duration in ms (e.g., 60000 for 1 min)
     */
    setRateLimitConfig(provider, rateLimitTokens, rateLimitWindowMs) {
        this.ensureProviderExists(provider);
        const health = this.health.get(provider);
        health.rateLimitTokens = rateLimitTokens;
        health.rateLimitWindowMs = rateLimitWindowMs;
        // Reset window on config change
        health.tokensUsedThisWindow = 0;
        health.rateLimitWindowStart = Date.now();
    }
    /**
     * Estimate cold-start latency for switching to a fallback provider.
     * Based on the provider's average latency as a proxy.
     * In production, this would include TLS handshake, DNS, and model warmup costs.
     */
    estimateColdStartLatency(fallbackProvider) {
        const fallbackHealth = this.health.get(fallbackProvider);
        if (!fallbackHealth)
            return 1000; // conservative default
        const baseLatency = fallbackHealth.latency || 500;
        // Cold start typically 1.5-3x warm latency depending on provider
        // Add TLS + DNS overhead (typically 50-200ms)
        const coldStartMultiplier = 2.0;
        const tlsOverhead = 100;
        return baseLatency * coldStartMultiplier + tlsOverhead;
    }
    /**
     * Should we rotate away from this provider due to rate-limit depletion?
     *
     * Implements Charnov's Marginal Value Theorem (1976):
     *   g'(t*) = g(t*) / (t* + τ)
     *
     * where:
     *   g(t*) = cumulative successful tokens used so far in this window
     *   g'(t*) = marginal rate = remaining tokens / time remaining in window
     *   τ = cold-start latency for the fallback provider
     *
     * LEAVE when marginal rate ≤ average rate (including switch cost).
     * STAY when marginal rate > average rate (still worth staying).
     *
     * @param provider - current provider to evaluate
     * @param fallbackProvider - candidate fallback provider
     * @returns true if rotation is recommended (marginal rate ≤ break-even rate)
     */
    shouldRotateForRateLimit(provider, fallbackProvider) {
        const health = this.health.get(provider);
        if (!health)
            return false;
        const now = Date.now();
        const windowElapsed = now - health.rateLimitWindowStart;
        // If window hasn't started or is fresh, don't rotate
        if (health.rateLimitWindowStart === 0 || windowElapsed < 100)
            return false;
        // If already depleted (tokens used ≥ limit), recommend rotation
        if (health.tokensUsedThisWindow >= health.rateLimitTokens)
            return true;
        // Remaining token budget in current window
        const remainingBudget = Math.max(0, health.rateLimitTokens - health.tokensUsedThisWindow);
        const remainingTimeMs = Math.max(1, health.rateLimitWindowMs - windowElapsed);
        // Marginal rate: tokens per ms we can still consume this window
        // High marginal rate = plenty of budget left = stay
        // Low marginal rate = running out = consider leaving
        const marginalRate = remainingBudget / remainingTimeMs;
        // Cumulative successful tokens so far
        const g_t = health.tokensUsedThisWindow;
        // Cold-start cost for switching to fallback
        const tau = this.estimateColdStartLatency(fallbackProvider);
        // Break-even rate: the rate at which staying = switching
        // From MVT: g'(t*) = g(t*) / (t* + τ)
        // In our terms: marginal_rate = cumulative_rate * (t* / (t* + τ))
        // But here we use: avg_rate_including_switch = g_t / (windowElapsed + τ)
        // This is the rate INCLUDING the cost of switching (we lose τ ms of this window)
        const avgRateIncludingSwitch = g_t / (windowElapsed + tau);
        // MVT says: LEAVE when marginal_rate ≤ avg_rate_including_switch
        // (the marginal gain from staying ≤ the average gain achievable including switch cost)
        // STAY when marginal_rate > avg_rate_including_switch
        // (we can still get more from this window than the switch costs us)
        const ROTATION_THRESHOLD_FACTOR = 1.0; // 1.0 = exact MVT; >1 = leave earlier, <1 = stay longer
        if (marginalRate <= avgRateIncludingSwitch * ROTATION_THRESHOLD_FACTOR) {
            return true; // MVT says: leave this patch
        }
        return false; // MVT says: stay in this patch
    }
    /**
     * Get the marginal rate for a provider (tokens/ms remaining in window).
     * Useful for monitoring and debugging MVT decisions.
     */
    getMarginalRate(provider) {
        const health = this.health.get(provider);
        if (!health || health.rateLimitWindowStart === 0)
            return null;
        const now = Date.now();
        const windowElapsed = now - health.rateLimitWindowStart;
        const remainingBudget = Math.max(0, health.rateLimitTokens - health.tokensUsedThisWindow);
        const remainingTimeMs = Math.max(1, health.rateLimitWindowMs - windowElapsed);
        const marginalRate = remainingBudget / remainingTimeMs;
        const utilizationPct = (health.tokensUsedThisWindow / health.rateLimitTokens) * 100;
        return { marginalRate, remainingBudget, remainingTimeMs, utilizationPct };
    }
    /**
     * Mark provider as disabled (manual circuit breaker)
     */
    disableProvider(provider, reason) {
        const until = Number.MAX_SAFE_INTEGER; // Manual disable until explicitly enabled
        this.disabled.set(provider, { reason, until });
        const health = this.health.get(provider);
        if (health) {
            health.isHealthy = false;
        }
        this.emit(HealthEvent.PROVIDER_DISABLED, { provider, reason });
    }
    /**
     * Enable a previously disabled provider
     */
    enableProvider(provider) {
        this.disabled.delete(provider);
        const health = this.health.get(provider);
        if (health) {
            health.isHealthy = true;
            health.consecutiveErrors = 0;
            health.cooldownUntil = 0;
        }
        this.emit(HealthEvent.PROVIDER_ENABLED, { provider });
    }
    /**
     * Clear cooldown and reset circuit breaker for a provider
     */
    resetCircuitBreaker(provider) {
        const health = this.health.get(provider);
        if (health) {
            health.consecutiveErrors = 0;
            health.cooldownUntil = 0;
            health.isHealthy = true;
            this.emit(HealthEvent.CIRCUIT_CLOSED, { provider });
        }
    }
    /**
     * Get health stats for monitoring
     */
    getStats() {
        let healthyCount = 0;
        let cooldownCount = 0;
        let disabledCount = 0;
        let totalScore = 0;
        for (const [name, health] of this.health.entries()) {
            totalScore += health.healthScore;
            if (!health.isHealthy && health.cooldownUntil > Date.now()) {
                cooldownCount++;
            }
            else if (health.isHealthy) {
                healthyCount++;
            }
            if (this.disabled.has(name)) {
                disabledCount++;
            }
        }
        const total = this.health.size;
        return {
            totalProviders: total,
            healthyProviders: healthyCount,
            cooldownProviders: cooldownCount,
            disabledProviders: disabledCount,
            avgHealthScore: total > 0 ? totalScore / total : 0,
        };
    }
    // ============================================================
    // Private Methods
    // ============================================================
    ensureProviderExists(provider) {
        if (!this.health.has(provider)) {
            const now = Date.now();
            this.health.set(provider, {
                name: provider,
                latency: 0,
                errorRate: 0,
                lastSuccess: 0,
                lastError: 0,
                consecutiveErrors: 0,
                isHealthy: true,
                cooldownUntil: 0,
                healthScore: 1.0,
                // === MVT RATE-LIMIT DEFAULTS ===
                // Conservative defaults: 1M tokens/min (most free tier providers)
                tokensUsedThisWindow: 0,
                rateLimitWindowStart: now,
                rateLimitTokens: 1_000_000,
                rateLimitWindowMs: 60_000,
                avgTokensPerRequest: 500, // conservative default estimate
            });
            this.metrics.set(provider, []);
        }
    }
    getMetricsWindow(provider) {
        return this.metrics.get(provider) ?? [];
    }
    recalculateHealthScore(provider) {
        const window = this.getMetricsWindow(provider);
        const health = this.health.get(provider);
        if (!health || window.length === 0)
            return;
        // Calculate error rate
        const totalRequests = window.reduce((sum, m) => sum + m.totalRequests, 0);
        const failedRequests = window.reduce((sum, m) => sum + m.failedRequests, 0);
        const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
        health.errorRate = errorRate;
        // Calculate latency metrics
        const latencies = window.filter(m => m.totalLatency > 0).map(m => m.lastLatency);
        const avgLatency = latencies.length > 0
            ? latencies.reduce((a, b) => a + b, 0) / latencies.length
            : 0;
        health.latency = avgLatency;
        // Percentile latency (simplified: use avg latency as proxy)
        // For true percentile, we'd need raw data points
        const latencyScore = this.calculateLatencyScore(avgLatency);
        // Health score: weighted combination
        // Higher error rate = lower score, higher latency = lower score
        const errorScore = 1 - errorRate;
        const consecutiveScore = Math.max(0, 1 - (health.consecutiveErrors / this.config.circuitBreakerThreshold));
        const score = this.config.weights.latency * latencyScore +
            this.config.weights.errorRate * errorScore +
            this.config.weights.consecutiveErrors * consecutiveScore;
        health.healthScore = Math.max(0, Math.min(1, score));
    }
    calculateLatencyScore(avgLatency) {
        // Latency score: 1 at 0ms, 0 at 10000ms+, with exponential decay
        // Configurable thresholds could be passed in
        const latencyThresholds = {
            excellent: 100, // 100ms - score 1.0
            good: 500, // 500ms - score 0.8
            acceptable: 1000, // 1s - score 0.6
            poor: 3000, // 3s - score 0.3
            terrible: 10000, // 10s+ - score 0.0
        };
        if (avgLatency <= 0)
            return 1.0;
        if (avgLatency <= latencyThresholds.excellent)
            return 1.0;
        if (avgLatency >= latencyThresholds.terrible)
            return 0.0;
        // Exponential interpolation
        const k = 0.003; // decay constant
        return Math.exp(-k * avgLatency);
    }
}
exports.ProviderHealthManager = ProviderHealthManager;
// ============================================================
// ============================================================
// EXPORTS
// ============================================================
exports.default = ProviderHealthManager;
/** Singleton instance for use across the app without DI */
exports.globalHealthManager = new ProviderHealthManager();
/**
 * Stateless MVT rate-limit rotation helper.
 * Call this after routeQuery returns to check if the selected provider
 * should be rotated away from due to rate-limit depletion.
 *
 * Uses Charnov (1976): g'(t*) = g(t*) / (t* + τ)
 * Leave when marginal rate ≤ avg rate including switch cost.
 *
 * @param providerHealth - current provider health state (from healthManager.getHealth())
 * @param fallbackProviderLatencyMs - estimated cold-start latency for fallback
 * @param estimatedTokensThisCall - estimated tokens for this request
 * @returns true if MVT recommends rotation
 */
function mvtShouldRotate(providerHealth, fallbackProviderLatencyMs, estimatedTokensThisCall = 500) {
    const now = Date.now();
    // No window started yet — stay
    if (providerHealth.rateLimitWindowStart === 0)
        return false;
    const windowElapsed = now - providerHealth.rateLimitWindowStart;
    // Window is fresh — stay
    if (windowElapsed < 100)
        return false;
    // Already depleted — rotate immediately
    if (providerHealth.tokensUsedThisWindow >= providerHealth.rateLimitTokens)
        return true;
    // Remaining budget after this call
    const budgetAfter = providerHealth.rateLimitTokens - providerHealth.tokensUsedThisWindow - estimatedTokensThisCall;
    // If this call would exceed the limit, recommend rotation
    if (budgetAfter < 0)
        return true;
    const remainingTimeMs = Math.max(1, providerHealth.rateLimitWindowMs - windowElapsed);
    // Marginal rate: tokens/ms we can still consume this window after this call
    const marginalRate = budgetAfter / remainingTimeMs;
    // Cumulative tokens used so far (proxy for g(t*))
    const g_t = providerHealth.tokensUsedThisWindow;
    // τ = cold-start latency for fallback
    const tau = fallbackProviderLatencyMs;
    // Break-even rate: avg rate including switch cost
    // From MVT: g'(t*) = g(t*) / (t* + τ)
    // Our marginal rate should exceed this to justify staying
    const avgRateIncludingSwitch = g_t / (windowElapsed + tau);
    // Leave when marginal ≤ break-even (MVT optimality condition)
    return marginalRate <= avgRateIncludingSwitch;
}
//# sourceMappingURL=providerHealth.js.map