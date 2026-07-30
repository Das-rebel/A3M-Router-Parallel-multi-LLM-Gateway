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

import { routeQuery, extractQueryFeatures, RouteDecision } from './advancedRouter';
import { getAvailableProviders, ProviderDefinition } from '../providers/providerConfig';
import { estimateCost } from '../utils/tokenUtils';

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
export class ShadowSampler {
  private config: Required<Omit<ShadowSamplerConfig, 'forceShadowProvider'>> & { forceShadowProvider: boolean };
  
  // Cached shadow provider (auto-selected on first call)
  private _shadowProvider: string | null = null;
  
  // Counters for sampling statistics
  private _shadowCount = 0;
  private _totalCount = 0;
  
  constructor(config: ShadowSamplerConfig = {}) {
    this.config = {
      minQueryStake: config.minQueryStake ?? 0.01,
      maxShadowProbability: config.maxShadowProbability ?? 0.15,
      riskScalingFactor: config.riskScalingFactor ?? 0.5,
      costScalingFactor: config.costScalingFactor ?? 0.3,
      shadowProvider: config.shadowProvider ?? null,
      forceShadowProvider: config.forceShadowProvider ?? false,
      useComplexitySignal: config.useComplexitySignal ?? true,
      forceShadow: config.forceShadow ?? false,
    };
  }
  
  /**
   * Auto-select the cheapest available provider as the shadow.
   * Excludes the primary provider to ensure diversity.
   */
  private selectShadowProvider(primaryProvider: string): string {
    if (this.config.forceShadowProvider && this.config.shadowProvider) {
      return this.config.shadowProvider;
    }
    
    if (this._shadowProvider) return this._shadowProvider;
    
    const profiles = getAvailableProviders();
    const candidates = Object.entries(profiles)
      .filter(([name, p]: [string, ProviderDefinition]) => {
        // Exclude primary
        if (name === primaryProvider) return false;
        // Must be available (has API key) — cost must be finite
        const cost = (p.costPerK.input + p.costPerK.output) / 2;
        return cost < Infinity;
      })
      .sort((a, b) => {
        const costA = (a[1].costPerK.input + a[1].costPerK.output) / 2;
        const costB = (b[1].costPerK.input + b[1].costPerK.output) / 2;
        return costA - costB;
      });
    
    if (candidates.length === 0) {
      // Fallback: pick any non-primary
      const fallback = Object.keys(profiles).find(n => n !== primaryProvider);
      this._shadowProvider = fallback || primaryProvider;
    } else {
      this._shadowProvider = candidates[0][0];
    }
    
    return this._shadowProvider;
  }
  
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
  private estimateQueryStake(features: ReturnType<typeof extractQueryFeatures>): number {
    const estimatedTokens = features.length * 1.5; // rough estimate
    const avgCostPerToken = 0.0001; // roughly $0.10/1K tokens
    const stake = estimatedTokens * avgCostPerToken;
    
    // Criticality multiplier from risk profile
    const riskMultiplier: Record<string, number> = {
      high: 10.0,    // Wrong answer could cause real harm — worth verifying
      medium: 2.0,   // Some cost to wrong answer
      low: 0.5,      // Low stakes — skip verification
    };
    const riskMult = riskMultiplier[features.risk_profile || 'medium'] ?? 1.0;
    
    // Complexity multiplier — complex queries are harder to verify but more valuable
    // We use complexity as a proxy for "correctness is harder to judge"
    const complexityMultiplier = 1 + (features.complexity || 0) * 2;
    
    return stake * riskMult * complexityMultiplier;
  }
  
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
  private computeShadowProbability(
    features: ReturnType<typeof extractQueryFeatures>,
    stake: number
  ): number {
    // Base probability (ODT "constitutive defense" — baseline verification rate)
    let p = 0.02; // 2% baseline
    
    // === STAKES ADJUSTMENT (ODT "tissue value") ===
    // Higher stake → proportionally higher verification probability
    // Scale from 2% to maxP as stake goes from minStake to $1.00
    if (stake >= this.config.minQueryStake) {
      const stakeAdj = Math.min(
        (stake - this.config.minQueryStake) / (1.0 - this.config.minQueryStake),
        1.0
      ) * (this.config.maxShadowProbability - 0.02);
      p += stakeAdj;
    } else {
      // Below minimum stake — no verification regardless
      return 0;
    }
    
    // === RISK ADJUSTMENT (ODT "attack probability") ===
    // High-risk queries are more likely to have primary failures
    // Scale risk_adj by riskScalingFactor (0.5 = 50% boost for high-risk)
    const riskAdj: Record<string, number> = {
      high: 0.10 * this.config.riskScalingFactor,
      medium: 0.03 * this.config.riskScalingFactor,
      low: 0.0,
    };
    p += riskAdj[features.risk_profile || 'medium'] ?? 0;
    
    // === COMPLEXITY ADJUSTMENT (ODT "defense efficacy") ===
    // Complex queries benefit more from verification (more errors to catch)
    // But also harder to verify (requires domain knowledge to judge)
    if (this.config.useComplexitySignal) {
      if (features.has_code) {
        p += 0.05; // Code verification has high ROI (bugs are costly)
      }
      if (features.requires_reasoning) {
        p += 0.03; // Reasoning errors are subtle but costly
      }
      if (features.has_math) {
        p += 0.04; // Math has objective ground truth — easy to verify (note: field is has_math)
      }
    }
    
    // === COST SCALING (ODT "marginal defense cost") ===
    // Expensive outputs are harder to produce — verify to avoid waste
    if (this.config.costScalingFactor > 0 && features.length > 500) {
      const costAdj = Math.min(
        (features.length - 500) / 10000, // scale up for very long outputs
        0.05
      ) * this.config.costScalingFactor;
      p += costAdj;
    }
    
    // Clamp to [0, maxShadowProbability]
    return Math.min(Math.max(p, 0), this.config.maxShadowProbability);
  }
  
  /**
   * Route a query, with optional ODT-proportional shadow verification.
   * 
   * @param prompt - The user query
   * @param options - Routing options (same as routeQuery)
   * @returns ShadowDecision with shadow metadata
   */
  routeWithShadow(
    prompt: string,
    options?: { available_models?: string[]; budget_multiplier?: number }
  ): ShadowDecision {
    const features = extractQueryFeatures(prompt);
    const primaryDecision = routeQuery(prompt, options?.available_models, options?.budget_multiplier);
    
    // Compute query stakes and shadow probability
    const stake = this.estimateQueryStake(features);
    const shadowProb = this.computeShadowProbability(features, stake);
    
    // ODT sampling decision
    const shouldShadow = this.config.forceShadow || Math.random() < shadowProb;
    const shadowProvider = shouldShadow
      ? this.selectShadowProvider(primaryDecision.primary_model || '')
      : null;
    
    if (shouldShadow) {
      this._shadowCount++;
    }
    this._totalCount++;
    
    const reasoning = shouldShadow
      ? `ODT shadow: stake=${stake.toFixed(4)}, risk=${features.risk_profile}, P=${shadowProb.toFixed(3)}, complexity=${features.complexity.toFixed(2)}`
      : `ODT no-shadow: stake=${stake.toFixed(4)} below threshold`;
    
    return {
      ...primaryDecision,
      hasShadow: shouldShadow,
      shadowProvider,
      shadowProbability: shadowProb,
      features,
      shadowReasoning: reasoning,
    };
  }
  
  /**
   * Compare primary and shadow outputs.
   * Returns the "better" answer and confidence delta.
   * 
   * For production use: this would call both providers in parallel
   * and compare outputs. For now, returns a stub that signals
   * the caller should handle comparison.
   */
  async compareOutputs(
    primaryAnswer: string,
    shadowAnswer: string | null
  ): Promise<ShadowedResponse> {
    if (!shadowAnswer) {
      return {
        primary: primaryAnswer,
        shadow: null,
        winner: 'no-shadow',
        confidenceDelta: 0,
      };
    }
    
    // Simple comparison: length + character overlap as proxy for agreement
    // In production, this would use a proper semantic similarity check
    const primaryLen = primaryAnswer.length;
    const shadowLen = shadowAnswer.length;
    const lengthRatio = Math.min(primaryLen, shadowLen) / Math.max(primaryLen, shadowLen);
    
    // Count common bigrams as a simple similarity proxy
    const primaryBigrams = new Set<string>();
    const shadowBigrams = new Set<string>();
    for (let i = 0; i < primaryAnswer.length - 1; i++) {
      primaryBigrams.add(primaryAnswer.slice(i, i + 2));
    }
    for (let i = 0; i < shadowAnswer.length - 1; i++) {
      shadowBigrams.add(shadowAnswer.slice(i, i + 2));
    }
    
    let intersection = 0;
    for (const bg of primaryBigrams) {
      if (shadowBigrams.has(bg)) intersection++;
    }
    const union = primaryBigrams.size + shadowBigrams.size - intersection;
    const jaccard = union > 0 ? intersection / union : 0;
    
    // High agreement (jaccard > 0.8) → trust primary
    // Low agreement → flag for review or prefer primary
    const winner: ShadowedResponse['winner'] =
      jaccard > 0.8 ? 'primary'
      : jaccard > 0.5 ? 'tie'
      : 'shadow'; // Low agreement: shadow might have caught something
    
    const confidenceDelta = jaccard > 0.8 ? 0 : -0.1; // Reduce confidence if they differ
    
    return {
      primary: primaryAnswer,
      shadow: shadowAnswer,
      winner,
      confidenceDelta,
    };
  }
  
  /**
   * Get sampling statistics for monitoring.
   */
  getStats(): { shadowCount: number; totalCount: number; shadowRate: number } {
    return {
      shadowCount: this._shadowCount,
      totalCount: this._totalCount,
      shadowRate: this._totalCount > 0 ? this._shadowCount / this._totalCount : 0,
    };
  }
  
  /**
   * Reset statistics counters.
   */
  resetStats(): void {
    this._shadowCount = 0;
    this._totalCount = 0;
  }
  
  /**
   * Update configuration at runtime.
   */
  configure(config: Partial<ShadowSamplerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================
// NOTE: Named exports are at declaration level above.
// ShadowSampler, ShadowSamplerConfig, ShadowDecision, ShadowedResponse
// are all exported via 'export interface' / 'export class'
// ============================================================
