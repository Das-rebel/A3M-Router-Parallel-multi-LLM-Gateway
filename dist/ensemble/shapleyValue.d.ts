/**
 * Enhanced Shapley Value Calculator for Ensemble Credit Assignment
 *
 * Incorporates game theory concepts for efficient and fair credit distribution:
 *
 * 1. ETHNOCENTRISM (In-group Loyalty Adjustment):
 *    - Players (models) have historical loyalty biases toward certain partners
 *    - Models that collaborate successfully develop "trust bonds"
 *    - Loyalty increases marginal contribution of trusted partners
 *    - Math: L[i,j] = exponential moving avg of historical success(i with j)
 *
 * 2. HANDICAP PRINCIPLE (Zahavi, 1975 - Costly Signaling):
 *    - Honest signals require costly investment
 *    - Models providing correct answers despite cost signal reliability
 *    - Math: H[i] = cost_i * reliability_i (handicap bonus)
 *
 * 3. CORE SHAPLEY VALUE:
 *    - φ_i = Σ_{S⊆N\{i}} (|S|! * (n-|S|-1)! / n!) * (v(S∪{i}) - v(S))
 *
 * Combined: φ_i* = α*Shapley_i + β*Loyalty_i + γ*Handicap_i
 * Where α + β + γ = 1 (normalized weights)
 */
export interface ShapleyConfig {
    nPermutations?: number;
    useMonteCarlo?: boolean;
    alpha?: number;
    beta?: number;
    gamma?: number;
}
export interface ModelContribution {
    modelId: string;
    shapleyValue: number;
    loyaltyValue: number;
    handicapValue: number;
    combinedCredit: number;
    marginalContributions: number[];
    timesSelected: number;
    averageMarginal: number;
    reliabilityScore: number;
    costInvested: number;
    ethnocentrismBias: number;
}
type AccuracyFunction = (modelIds: string[]) => number;
export interface LoyaltyConfig {
    decayRate?: number;
    minInteractions?: number;
}
/**
 * Loyalty Matrix L[i][j] = loyalty of model i toward model j (0-1)
 * Models develop trust through successful collaborations
 */
export declare class LoyaltyMatrix {
    private matrix;
    private counts;
    private config;
    constructor(cfg?: LoyaltyConfig);
    /** Record successful collaboration between two models */
    recordSuccess(i: string, j: string, weight?: number): void;
    /** Get loyalty of model i toward model j */
    getLoyalty(i: string, j: string): number;
    /** Ethnocentrism = average loyalty toward all partners */
    ethnoCentrism(model: string, allModels: string[]): number;
}
export interface HandicapConfig {
    costSensitivity?: number;
    reliabilityWeight?: number;
    minCostThreshold?: number;
}
/**
 * Handicap Principle (Zahavi, 1975):
 * "A handicapping signal is honest because it is costly to produce"
 *
 * Models spending more tokens on answers despite being correct signal reliability.
 * H[i] = cost_i * reliability_i (higher = more reliable despite cost)
 */
export declare class HandicapCalculator {
    private costs;
    private correct;
    private totals;
    private config;
    constructor(cfg?: HandicapConfig);
    /** Record performance: cost spent and whether answer was correct */
    record(model: string, cost: number, isCorrect: boolean): void;
    /** Reliability = correct / total (prior probability of being right) */
    reliability(model: string): number;
    /** Average cost invested by model */
    avgCost(model: string): number;
    /**
     * Handicap bonus = honest signal of quality
     * H[i] = (cost_i - minCost) / maxCost * reliability_i
     * Higher cost investment + higher reliability = higher handicap
     */
    handicap(model: string, maxCost?: number): number;
}
/**
 * Combined enhanced Shapley value with ethnocentrism and handicap
 * φ_i* = α*φ_i(Shapley) + β*ε_i(Ethnocentrism) + γ*H_i(Handicap)
 */
export declare function calculateEnhancedShapley(modelIds: string[], accuracyFn: AccuracyFunction, loyalty: LoyaltyMatrix, handicap: HandicapCalculator, cfg?: ShapleyConfig): Map<string, ModelContribution>;
/** Create ensemble accuracy function for Shapley calculation */
export declare function createAccuracyFn(groundTruth: string, getAnswer: (modelId: string) => string): AccuracyFunction;
/** Apply Shapley credit to voting weights */
export declare function applyCredit(contributions: Map<string, ModelContribution>, baseWeights: Record<string, number>, alpha?: number): Record<string, number>;
export interface ShapleySummary {
    totalCredit: number;
    perModel: ModelContribution[];
    bestContributor: string;
    worstContributor: string;
}
export declare function summarize(contributions: Map<string, ModelContribution>): ShapleySummary;
declare const _default: {
    calculateEnhancedShapley: typeof calculateEnhancedShapley;
    LoyaltyMatrix: typeof LoyaltyMatrix;
    HandicapCalculator: typeof HandicapCalculator;
    createAccuracyFn: typeof createAccuracyFn;
    applyCredit: typeof applyCredit;
    summarize: typeof summarize;
};
export default _default;
