/**
 * TMLPD Episodic Memory Store
 *
 * Stores specific task executions with full context.
 * Reference implementation - for full features see TMLPD v2.x
 *
 * Full TMLPD includes:
 * - JSON-based episodic storage with keyword indexing
 * - Importance scoring and time-based decay
 * - Episodic retrieval by task similarity
 */
export interface EpisodicEntry {
    id: string;
    timestamp: number;
    task: {
        description: string;
        type: string;
        complexity: number;
    };
    result: {
        success: boolean;
        output: string;
        duration_ms: number;
    };
    agent: {
        id: string;
        model: string;
        provider: string;
    };
    metadata: Record<string, any>;
    importance: number;
}
export interface MemoryQuery {
    task_type?: string;
    keywords?: string[];
    limit?: number;
}
export declare class EpisodicMemoryStore {
    private entries;
    private maxEntries;
    private keywordIndex;
    private persistencePath;
    constructor(maxEntries?: number, persistencePath?: string);
    /**
     * Store an episodic memory
     */
    store(entry: Omit<EpisodicEntry, "id" | "timestamp">): string;
    /**
     * Query episodic memories
     */
    query(query: MemoryQuery): EpisodicEntry[];
    /**
     * Get similar tasks (for learning)
     */
    getSimilarTasks(taskDescription: string, limit?: number): EpisodicEntry[];
    /**
     * Get statistics
     */
    getStats(): {
        total_entries: number;
        indexed_keywords: number;
        success_rate: number;
        avg_duration_ms: number;
    };
    /**
     * Persist current memory to disk as JSON
     */
    saveToDisk(): boolean;
    /**
     * Load memory from disk JSON
     */
    loadFromDisk(): boolean;
    /**
     * Rebuild keyword index from loaded entries
     */
    private rebuildIndex;
    /**
     * Auto-persist after adding new entries (if path configured)
     */
    private autoPersist;
    /**
     * Clear all memories (also removes persisted file)
     */
    clear(): void;
}
/**
 * Reference to Full TMLPD Memory System
 *
 * For production use with full features:
 * - Install: npm install tmlpd-skill (Python)
 * - Or integrate with tmlpd-clean/src/memory/
 *
 * Full features include:
 * - Semantic memory with ChromaDB vector embeddings
 * - Time-based importance decay (A-Mem pattern)
 * - Cross-session learning
 * - Episodic + Semantic + Working 3-tier architecture
 */ 
//# sourceMappingURL=episodicMemory.d.ts.map