/**
 * A3M Router - Semantic Cache (Embedding-based)
 *
 * Stores previous query->response pairs and returns cached responses
 * for semantically similar queries using cosine similarity on embeddings.
 *
 * Supports embedders: nomic (via Ollama), openai, or local Ollama.
 * Uses nomic-embed-text by default via local Ollama.
 */
export type EmbedderType = 'nomic' | 'openai' | 'local';
export interface SemanticCacheConfig {
    similarityThreshold: number;
    ttlSeconds: number;
    maxEntries?: number;
    embedder?: EmbedderType;
    embedderUrl?: string;
    embedderApiKey?: string;
}
export interface CacheEntry {
    key: string;
    embedding: number[];
    response: string;
    provider: string;
    model: string;
    cost: number;
    createdAt: number;
    ttl: number;
    hitCount: number;
    lastAccessedAt: number;
}
export interface SemanticCacheGetResult {
    hit: boolean;
    response?: string;
    provider?: string;
    model?: string;
    cost?: number;
    similarity?: number;
}
export interface SemanticCacheStats {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
}
export declare class SemanticCache {
    private entries;
    private accessOrder;
    private embedder;
    private similarityThreshold;
    private ttlMs;
    private maxEntries;
    private hits;
    private misses;
    constructor(config: SemanticCacheConfig);
    /**
     * Get cached response for a semantically similar query.
     * Returns the best match above the similarity threshold, or { hit: false }.
     */
    get(query: string): Promise<SemanticCacheGetResult>;
    /**
     * Store a query->response pair in the cache.
     */
    set(query: string, response: string, metadata: {
        provider: string;
        model: string;
        cost: number;
        ttl?: number;
    }): Promise<void>;
    /**
     * Delete a specific query from the cache.
     */
    delete(query: string): Promise<void>;
    /**
     * Clear all cache entries.
     */
    clear(): void;
    /**
     * Get cache statistics.
     */
    getStats(): SemanticCacheStats;
    /**
     * Update access order for LRU tracking.
     */
    private updateAccessOrder;
    /**
     * Purge expired entries.
     */
    private evictExpired;
    /**
     * Evict the least recently used entry.
     */
    private evictLRU;
}
export default SemanticCache;
