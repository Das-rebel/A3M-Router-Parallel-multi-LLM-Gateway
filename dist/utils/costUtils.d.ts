/**
 * Log-scale cost utilities for A3M Router
 *
 * Provides better differentiation across cost ranges:
 * - Free models get score 1.0
 * - $0.05/1K vs $0.10/1K get meaningfully different scores
 * - $0.10/1K vs $10/1K get much larger differentiation than linear scaling
 */
/**
 * Log-scale cost score (0-1, lower cost = higher score)
 * Uses log scale to better differentiate mid-range costs
 *
 * @param costPer1K - Cost per 1K tokens (input or output)
 * @param minCost - Minimum cost boundary (default: $0.01)
 * @param maxCost - Maximum cost boundary (default: $10)
 * @returns Score from 0 to 1 (higher = cheaper)
 */
export declare function logScaleCostScore(costPer1K: number, minCost?: number, maxCost?: number): number;
/**
 * Combined cost score (input + output weighted)
 *
 * @param inputCostPer1K - Input cost per 1K tokens
 * @param outputCostPer1K - Output cost per 1K tokens
 * @param outputWeight - Weight for output cost (default: 0.5)
 * @returns Combined log-scale cost score
 */
export declare function combinedCostScore(inputCostPer1K: number, outputCostPer1K: number, outputWeight?: number): number;
/**
 * Cost margin loss for training
 * Encourages routing to significantly cheaper models
 *
 * @param selectedCost - Cost of selected model
 * @param alternativeCost - Cost of alternative model
 * @param margin - Minimum margin threshold (default: 0.1 = 10%)
 * @returns Loss value (0 if no significant saving available)
 */
export declare function costMarginLoss(selectedCost: number, alternativeCost: number, margin?: number): number;
/**
 * Quality-adjusted cost score
 * Normalizes cost score by model quality to prioritize
 * cost-efficient models that are also high quality
 *
 * @param costScore - Raw log-scale cost score (0-1)
 * @param qualityScore - Model quality score (0-1)
 * @returns Quality-adjusted cost score
 */
export declare function qualityAdjustedCostScore(costScore: number, qualityScore: number): number;
/**
 * Budget-aware cost penalty
 * Applies stronger penalty for expensive models when budget is tight
 *
 * @param costPer1K - Cost per 1K tokens
 * @param budgetMultiplier - Budget pressure (0.5 = tight, 1.0 = normal, 2.0 = generous)
 * @returns Adjusted cost score
 */
export declare function budgetAwareCostScore(costPer1K: number, budgetMultiplier?: number): number;
export declare function runValidationTests(): void;
//# sourceMappingURL=costUtils.d.ts.map