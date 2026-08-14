/**
 * Hybrid Memory — Merges MemoryTree (keyword) + ReasoningBank (semantic)
 *
 * Provides unified search across both memory systems with configurable
 * weighting. Falls back gracefully when ReasoningBank has no data or
 * no embedding keys configured.
 *
 * Merge formula: final_score = keyword_score * w1 + semantic_score * w2
 * where w1 + w2 = 1.0, configurable via config.
 */
import { ReasoningBankConfig } from './reasoningBank';
export interface HybridMemoryConfig {
    /** Weight for MemoryTree keyword score (0-1). ReasoningBank gets (1 - this). */
    keywordWeight: number;
    /** ReasoningBank config */
    reasoningBank: Partial<ReasoningBankConfig>;
}
export interface HybridResult {
    id: string;
    content: string;
    score: number;
    source: 'keyword' | 'semantic' | 'merged';
    metadata?: Record<string, unknown>;
}
export declare class HybridMemory {
    private memoryTree;
    private reasoningBank;
    private config;
    constructor(config?: Partial<HybridMemoryConfig>);
    /** Initialize both memory systems */
    init(): Promise<void>;
    /** Add data to MemoryTree (fast, always works) */
    add(data: string): Promise<void>;
    /** Induce a memory in ReasoningBank from a routing decision */
    learnFromDecision(params: {
        query: string;
        provider: string;
        cost: number;
        complexity: number;
        success: boolean;
        reasoning?: string;
    }): Promise<void>;
    /**
     * Unified search across both memory systems.
     * Returns merged, deduplicated results sorted by relevance.
     */
    search(query: string, topK?: number): Promise<HybridResult[]>;
    /** Get context string for router injection */
    getContext(query: string, maxTokens?: number): Promise<string>;
    /** Get combined stats */
    getStats(): {
        memoryTree: {
            totalChunks: number;
            maxDepth: number;
            rootChunks: number;
            treeSize: number;
        };
        reasoningBank: {
            totalMemories: number;
            successes: number;
            failures: number;
            withEmbeddings: number;
            providers: string[];
        };
        keywordWeight: number;
    };
    /** Save both systems */
    save(): Promise<void>;
    private normalizeScore;
}
export default HybridMemory;
