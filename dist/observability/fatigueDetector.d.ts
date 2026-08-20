export interface FatigueReport {
    provider: string;
    queriesCount: number;
    errorRate: number;
    healthy: boolean;
    recommendedAction: string;
}
export interface FatigueResults {
    reports: FatigueReport[];
    summary: string;
    anyActionNeeded: boolean;
}
export declare function checkProviderFatigue(): FatigueResults;
export declare function formatFatigueReport(): string;
//# sourceMappingURL=fatigueDetector.d.ts.map