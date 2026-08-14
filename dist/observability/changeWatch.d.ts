export interface ChangeEntry {
    id: string;
    timestamp: string;
    summary: string;
    reviewAfter: string;
    reviewWindow: string;
    reviewed: boolean;
}
export interface ImpactReview {
    change: ChangeEntry;
    status: 'pending' | 'ready' | 'overdue';
}
export declare function logChange(summary: string, reviewWindowDays?: number): string;
export declare function getPendingReviews(): ImpactReview[];
export declare function formatPendingReviews(): string;
