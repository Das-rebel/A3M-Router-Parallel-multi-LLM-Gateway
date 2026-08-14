import { createA3MRouter } from './index';
import { ShapleySummary } from './ensemble/shapleyValue';
import { dialogOptimizer } from './ensemble/multiRoundDialog';
interface RouteDecision {
    primary_model: string;
    tier: 'free' | 'cheap' | 'mid' | 'premium';
    estimated_cost: number;
    complexity: number;
    reasoning: string;
}
export type RouterDecision = RouteDecision;
export declare const A3MRouter: any;
export { createA3MRouter };
export type EnsembleStrategy = 'majority' | 'weighted' | 'conservative' | 'shapley';
export interface EnsembleResponse {
    finalAnswer: string;
    confidence: number;
    isUncertain: boolean;
    winner: string;
    allResults: Record<string, {
        answer: string;
        score: number;
    }>;
    reasoning: string;
    shapleySummary?: ShapleySummary;
    dialogState?: ReturnType<typeof dialogOptimizer.getSummary>;
}
export declare class EnsembleOrchestrator {
    private router;
    private loyaltyMatrix;
    private handicapCalc;
    constructor(router: InstanceType<typeof A3MRouter>);
    /**
     * Execute ensemble with enhanced Shapley value credit assignment
     * Incorporates ethnocentrism (loyalty) and handicap (costly signaling)
     */
    executeEnsemble(query: string, providers: string[], strategy?: EnsembleStrategy, weights?: Record<string, number>, dialogId?: string): Promise<EnsembleResponse>;
    /** Get best model for current dialog topic */
    getBestModelForTopic(dialogId: string, availableModels: string[]): string | null;
    /** Build optimized context for multi-turn conversation */
    buildOptimizedContext(dialogId: string, newQuery: string): string;
    /** Clear dialog state */
    clearDialog(dialogId: string): void;
}
export { LoyaltyMatrix, HandicapCalculator, calculateEnhancedShapley } from './ensemble/shapleyValue';
export { dialogOptimizer, MultiRoundDialogOptimizer } from './ensemble/multiRoundDialog';
