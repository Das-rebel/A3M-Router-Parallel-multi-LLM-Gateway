/**
 * A3M Router - Budget Enforcer
 *
 * Hard budget enforcement for API key spend management:
 * - Track spend per API key with monthly reset
 * - Check budget before each request
 * - Emit alerts at configurable thresholds (50%, 80%, 100%)
 * - Support hard cap (reject requests) or soft cap (warn only)
 * - In-memory storage (Redis backup can be added later)
 */
import { EventEmitter } from 'events';
export interface BudgetConfig {
    apiKey: string;
    monthlyLimit: number;
    alertThresholds?: number[];
    hardCap?: boolean;
}
export interface SpendRecord {
    apiKey: string;
    spent: number;
    budget: number;
    remaining: number;
    resetDate: Date;
    alertEmitted: Set<number>;
}
export interface BudgetCheckResult {
    allowed: boolean;
    reason?: string;
    remaining: number;
}
export declare class BudgetEnforcer extends EventEmitter {
    private budgets;
    private spend;
    private static readonly DEFAULT_THRESHOLDS;
    constructor();
    /**
     * Set budget for an API key
     */
    setBudget(apiKey: string, monthlyLimit: number, options?: {
        alertThresholds?: number[];
        hardCap?: boolean;
    }): void;
    /**
     * Get current budget config for an API key
     */
    getBudgetConfig(apiKey: string): BudgetConfig | undefined;
    /**
     * Remove budget config (stops tracking)
     */
    removeBudget(apiKey: string): void;
    /**
     * Check if a request is allowed within budget
     * @param apiKey - The API key making the request
     * @param additionalCost - The cost of the request in cents
     * @returns BudgetCheckResult with allowed status and remaining budget
     */
    checkBudget(apiKey: string, additionalCost: number): BudgetCheckResult;
    /**
     * Record spend for an API key
     * @param apiKey - The API key that incurred the cost
     * @param cost - The cost in cents
     */
    recordSpend(apiKey: string, cost: number): void;
    /**
     * Get current spend record for an API key
     */
    getSpend(apiKey: string): SpendRecord | undefined;
    /**
     * Get all spend records
     */
    getAllSpend(): SpendRecord[];
    /**
     * Reset budget for an API key (manual reset)
     */
    resetBudget(apiKey: string): void;
    /**
     * Reset all budgets
     */
    resetAll(): void;
    /**
     * Update monthly limit for an API key
     */
    updateLimit(apiKey: string, monthlyLimit: number): void;
    /**
     * Check if reset is needed and perform it
     */
    private checkAndReset;
    /**
     * Check if monthly reset is due
     */
    private isResetDue;
    /**
     * Get next monthly reset date
     */
    private getNextResetDate;
    /**
     * Get days until next reset
     */
    getDaysUntilReset(apiKey: string): number | undefined;
}
export declare function createBudgetEnforcer(): BudgetEnforcer;
export declare class BudgetExceededError extends Error {
    readonly apiKey: string;
    readonly spent: number;
    readonly budget: number;
    readonly remaining: number;
    constructor(apiKey: string, spent: number, budget: number);
}
//# sourceMappingURL=budgetEnforcer.d.ts.map