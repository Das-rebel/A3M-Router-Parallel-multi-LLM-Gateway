/**
 * Obsidian Vault Integration
 *
 * Stores routing decisions and context as markdown files
 * compatible with Obsidian note-taking app.
 */
export interface VaultConfig {
    path: string;
    autoSave: boolean;
    maxFileAge: number;
}
export interface RoutingDecision {
    id: string;
    timestamp: number;
    prompt: string;
    context: any;
    selectedProvider: string;
    selectedModel: string;
    reasoning: string;
    cost: number;
    latency: number;
}
export declare class ObsidianVault {
    private config;
    private decisions;
    constructor(config?: Partial<VaultConfig>);
    private ensureDirectory;
    /**
     * Save a routing decision
     */
    saveDecision(decision: RoutingDecision): Promise<string>;
    /**
     * Format decision as markdown
     */
    private formatDecisionAsMarkdown;
    /**
     * Escape markdown special characters
     */
    private escapeMarkdown;
    /**
     * Update the vault index
     */
    private updateIndex;
    /**
     * Get recent decisions
     */
    getRecentDecisions(count?: number): RoutingDecision[];
    /**
     * Search decisions
     */
    searchDecisions(query: string): RoutingDecision[];
    /**
     * Export all decisions
     */
    exportAll(filepath: string): Promise<void>;
    /**
     * Get vault statistics
     */
    getStats(): {
        totalDecisions: number;
        vaultPath: string;
        fileCount: number;
        totalSize: number;
    };
    private getDirectorySize;
    /**
     * Clean old files
     */
    cleanOldFiles(): Promise<number>;
}
export default ObsidianVault;
