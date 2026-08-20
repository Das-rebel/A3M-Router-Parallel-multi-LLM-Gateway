/**
 * A3M Router - Cost Analytics
 *
 * Advanced cost tracking and analytics:
 * - Record every request with full metadata
 * - Real-time savings vs single premium provider
 * - Monthly/yearly projections
 * - Breakdown by provider and query type
 * - Export to JSON or CSV
 * - In-memory storage with auto-rotation
 */
export interface CostRecord {
    timestamp: Date;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    latency: number;
    queryType: 'simple' | 'code' | 'summary' | 'complex';
    cached: boolean;
}
export interface CostSummary {
    totalCost: number;
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    avgLatency: number;
    cacheHitRate: number;
    period: {
        start: Date;
        end: Date;
    };
}
export interface ProviderStats {
    totalCost: number;
    totalRequests: number;
    avgLatency: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    models: Record<string, {
        cost: number;
        requests: number;
    }>;
}
export interface QueryTypeStats {
    totalCost: number;
    totalRequests: number;
    avgLatency: number;
    cachedCount: number;
    cacheHitRate: number;
}
export interface SavingsReport {
    totalSaved: number;
    percentageSaved: number;
    byQueryType: Record<string, {
        saved: number;
        percentage: number;
    }>;
    projectedMonthlySavings: number;
    projectedYearlySavings: number;
}
export declare class CostAnalytics {
    private records;
    private maxRecords;
    constructor(maxRecords?: number);
    record(data: Omit<CostRecord, 'timestamp'>): void;
    getSummary(period?: 'hour' | 'day' | 'week' | 'month'): CostSummary;
    getByProvider(): Record<string, ProviderStats>;
    getByQueryType(): Record<string, QueryTypeStats>;
    getSavings(baselineProvider?: string): SavingsReport;
    export(format?: 'json' | 'csv'): string;
    reset(): void;
    private filterByPeriod;
    private getDaysCovered;
}
export declare function createCostAnalytics(maxRecords?: number): CostAnalytics;
//# sourceMappingURL=costAnalytics.d.ts.map