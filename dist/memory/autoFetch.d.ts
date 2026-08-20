/**
 * Auto-Fetch Sync Loop
 *
 * Periodically syncs data from connected tools to provide
 * context-aware routing decisions.
 */
export interface SyncConfig {
    intervalMs: number;
    enabled: boolean;
    targets: string[];
}
export interface SyncResult {
    target: string;
    success: boolean;
    items: number;
    timestamp: number;
    error?: string;
}
export declare class AutoFetch {
    private intervalMs;
    private enabled;
    private targets;
    private lastSync;
    private timer;
    private syncHandlers;
    constructor(config?: Partial<SyncConfig>);
    private setupDefaultHandlers;
    start(): void;
    stop(): void;
    syncAll(): Promise<Map<string, SyncResult>>;
    getLastSync(target: string): SyncResult | undefined;
    addHandler(target: string, handler: () => Promise<SyncResult>): void;
    private syncGitHub;
    private syncNotion;
    private syncSlack;
    private syncGmail;
    private syncCalendar;
}
export default AutoFetch;
//# sourceMappingURL=autoFetch.d.ts.map