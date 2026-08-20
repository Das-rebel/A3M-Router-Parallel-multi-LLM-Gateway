/**
 * ReasoningBank — Experience-Based Memory Layer
 *
 * Complements MemoryTree with semantic retrieval and experience-based learning.
 * Learns from both successful and failed routing decisions.
 *
 * Based on: "ReasoningBank: Scaling Agent Self-Evolving with Reasoning Memory"
 * (Google Research, ICLR 2026) — github.com/google-research/reasoning-bank
 *
 * Architecture:
 *   MemoryTree (keyword, fast, free) ←→ ReasoningBank (semantic, quality-scored)
 *   Merge: keyword_score * 0.3 + semantic_score * 0.7
 *
 * Storage: JSONL files (no external vector DB required)
 * Embedding: Optional — falls back to keyword search when no embedding key configured
 */
export interface ReasoningMemory {
    id: string;
    taskId: string;
    query: string;
    title: string;
    description: string;
    content: string;
    status: 'success' | 'failure';
    provider: string;
    cost: number;
    complexity: number;
    timestamp: number;
    embedding?: number[];
}
export interface ReasoningBankConfig {
    /** Directory to store reasoning bank files */
    dataDir: string;
    /** Max memories to retrieve per query */
    maxResults: number;
    /** Minimum similarity threshold (0-1) */
    minSimilarity: number;
    /** Embedding provider: 'gemini' | 'openai' | 'none' (keyword fallback) */
    embeddingProvider: 'gemini' | 'openai' | 'none';
    /** API key for embedding provider */
    embeddingApiKey?: string;
    /** Embedding model ID */
    embeddingModel?: string;
}
export declare class ReasoningBank {
    private config;
    private memories;
    private embeddings;
    private loaded;
    constructor(config?: Partial<ReasoningBankConfig>);
    /** Load memories from disk */
    load(): Promise<void>;
    /** Save memories to disk */
    save(): Promise<void>;
    /**
     * Extract a memory from a routing decision.
     * Called after a query is routed and the outcome is known.
     */
    induceMemory(params: {
        query: string;
        provider: string;
        cost: number;
        complexity: number;
        success: boolean;
        reasoning?: string;
    }): Promise<ReasoningMemory>;
    /**
     * Select relevant memories for a query.
     * Uses embedding similarity if available, falls back to keyword search.
     */
    selectMemories(query: string): Promise<ReasoningMemory[]>;
    private embed;
    private embedGemini;
    private embedOpenAI;
    private cosineSimilarity;
    private tokenize;
    /** Get bank statistics */
    getStats(): {
        totalMemories: number;
        successes: number;
        failures: number;
        withEmbeddings: number;
        providers: string[];
    };
    /** Clear all memories */
    clear(): Promise<void>;
}
export default ReasoningBank;
//# sourceMappingURL=reasoningBank.d.ts.map