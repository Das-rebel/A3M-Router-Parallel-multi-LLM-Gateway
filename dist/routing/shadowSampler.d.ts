/**
 * ShadowSampler — Value-Proportional Shadow Verification
 *
 * Implements Optimal Defense Theory (Rhoades 1979; McKey 1974; Zangerl & Bazzaz 1992)
 * from plant ecological economics:
 *
 *   "A plant allocates defensive compounds (defense cost) in proportion to
 *    tissue value, attack probability, and the marginal cost of defense."
 *
 * Mapped to A3M routing:
 *   - Tissue value     → query stakes / expected cost of wrong answer
 *   - Attack probability → probability that the primary provider fails/misbehaves
 *   - Defense cost    → cost of the shadow verification call
 *   - Marginal return → expected reduction in error rate from verification
 *
 * Instead of binary always-on (wasteful) or always-off (risky), ODT says:
 *   Sample shadow verification PROPORTIONALLY to expected value of verification.
 *
 * The sampling probability is:
 *   P(shadow) = f(expected_error_cost_reduction, query_risk)
 *
 * This is NOT the Zahavi "shared expert" (which always runs on 100% of queries).
 * ODT shadow runs probabilistically — only on queries where the expected
 * verification benefit exceeds the verification cost.
 *
 * Usage:
 *   const sampler = new ShadowSampler();
 *   const decision = await sampler.routeWithShadow(query, { strategy: 'auto' });
 *   // decision.hasShadow === true iff we sampled a shadow provider
 *   // decision.primaryResult and decision.shadowResult are compared automatically
 */
import { extractQueryFeatures, RouteDecision } from './advancedRouter';
export interface ShadowSamplerConfig {
    /**
     * Minimum query stakes (estimated cost of wrong answer) to consider shadow.
     * Below this, P(shadow) = 0 regardless of other factors.
     * In dollars — what a wrong answer costs you.
     * Default: $0.01 (1 cent — roughly equivalent to a simple API call cost)
     */
    minQueryStake?: number;
    /**
     * Maximum probability of shadow verification.
     * Set to 1.0 for always-on (Zahavi-style, expensive).
     * Default: 0.15 (15% — ODT-proportional sampling)
     */
    maxShadowProbability?: number;
    /**
     * Risk threshold (from QueryFeatures.risk_profile) above which
     * shadow probability scales up linearly.
     * 0.0 = no risk scaling (all queries get same P(shadow))
     * 0.5 = medium risk scales P(shadow) by 50%
     * 1.0 = high risk scales P(shadow) by 100%
     */
    riskScalingFactor?: number;
    /**
     * Cost scaling factor — if query is expensive (large output),
     * shadow is more worthwhile (higher P(shadow)).
     * 0.0 = no cost scaling.
     * Default: 0.3 (expensive queries get moderate boost in P(shadow))
     */
    costScalingFactor?: number;
    /**
     * Provider to use as shadow (cheapest reliable provider).
     * If not specified, auto-selected from available providers.
     */
    shadowProvider?: string;
    /**
     * Always use this shadow provider (overrides auto-selection).
     */
    forceShadowProvider?: boolean;
    /**
     * If true, use complexity as a signal for verification value.
     * Complex queries (code, math, reasoning) benefit more from verification.
     * Default: true
     */
    useComplexitySignal?: boolean;
    /**
     * Debug mode: always shadow regardless of sampling.
     * Default: false
     */
    forceShadow?: boolean;
}
export interface ShadowDecision extends RouteDecision {
    /** Whether a shadow provider was sampled for this query */
    hasShadow: boolean;
    /** The sampled shadow provider (null if no shadow) */
    shadowProvider: string | null;
    /** Shadow sampling probability that was used */
    shadowProbability: number;
    /** The query features that triggered shadow decision */
    features: ReturnType<typeof extractQueryFeatures>;
    /** ODT rationale for the shadow decision */
    shadowReasoning: string;
}
export interface ShadowedResponse {
    primary: string;
    shadow: string | null;
    winner: 'primary' | 'shadow' | 'tie' | 'no-shadow';
    confidenceDelta: number;
}
/**
 * Optimal Defense Theory Shadow Sampler
 *
 * Allocates shadow verification proportionally to query value and risk.
 *
 * The ODT sampling probability:
 *   P_shadow = min(maxP, baseP + risk_adj + cost_adj + complexity_adj)
 *
 * where:
 *   baseP     = baseline verification rate (ODT " constitutive defense")
 *   risk_adj  = risk_profile scaling (ODT "induced defense")
 *   cost_adj  = output cost scaling (value of correct answer)
 *   complexity_adj = query complexity signal
 */
export declare class ShadowSampler {
    private config;
    private _shadowProvider;
    private _shadowCount;
    private _totalCount;
    constructor(config?: ShadowSamplerConfig);
    /**
     * Auto-select the cheapest available provider as the shadow.
     * Excludes the primary provider to ensure diversity.
     */
    private selectShadowProvider;
    /**
     * Estimate the query "stakes" — the expected cost of a wrong answer.
     *
     * ODT maps this to "tissue value": how much is this asset worth protecting?
     * In routing terms: if this query fails, how much does it cost?
     *
     * We approximate this as:
     *   stake ≈ estimated_output_tokens × cost_per_token × criticality_multiplier
     *
     * where criticality is derived from query complexity and risk_profile.
     */
    private estimateQueryStake;
    /**
     * Compute the ODT sampling probability for this query.
     *
     * ODT principle: defense (shadow) allocation ∝ expected benefit of defense.
     * Expected benefit = P(failure) × cost_of_failure
     *
     * So P(shadow) scales with:
     *   1. Query stake (expected cost of wrong answer)
     *   2. Risk profile (probability of primary failure)
     *   3. Output cost (verification ROI — cheaper outputs need less verification)
     *   4. Complexity (complex queries benefit more from verification)
     */
    private computeShadowProbability;
    /**
     * Route a query, with optional ODT-proportional shadow verification.
     *
     * @param prompt - The user query
     * @param options - Routing options (same as routeQuery)
     * @returns ShadowDecision with shadow metadata
     */
    routeWithShadow(prompt: string, options?: {
        available_models?: string[];
        budget_multiplier?: number;
    }): ShadowDecision;
    /**
     * Compare primary and shadow outputs.
     * Returns the "better" answer and confidence delta.
     *
     * For production use: this would call both providers in parallel
     * and compare outputs. For now, returns a stub that signals
     * the caller should handle comparison.
     */
    compareOutputs(primaryAnswer: string, shadowAnswer: string | null): Promise<ShadowedResponse>;
    /**
     * Get sampling statistics for monitoring.
     */
    getStats(): {
        shadowCount: number;
        totalCount: number;
        shadowRate: number;
    };
    /**
     * Reset statistics counters.
     */
    resetStats(): void;
    /**
     * Update configuration at runtime.
     */
    configure(config: Partial<ShadowSamplerConfig>): void;
}
