/**
 * Semantic Cache - Token Optimization Pattern #1
 * 
 * Cache semantically similar queries instead of exact-match caching.
 * Uses embedding similarity (cosine) to find cached responses.
 * 
 * Based on: arXiv:2608.17188 - Token Optimization and Context Window Management
 */

export interface SemanticCacheConfig {
  enabled: boolean;
  similarityThreshold: number;  // 0.85 default
  maxEntries: number;
  embeddingModel: string;  // e.g., "sentence-transformers/all-MiniLM-L6-v2"
  ttlSeconds: number;
  cacheDir?: string;
}

export interface SemanticCacheEntry {
  query: string;
  embedding: number[];
  response: string;
  model: string;
  tokensSaved: number;
  costSaved: number;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Compute cosine similarity between two embeddings
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Simple embedding generator using TF-IDF style vectors
 * For production, replace with actual sentence transformer embeddings
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateEmbedding(text: string, dimensions = 384): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding: number[] = new Array(dimensions).fill(0);
  
  // Simple hash-based embedding for demo
  // In production, use: sentence-transformers or OpenAI embeddings
  words.forEach((word, idx) => {
    const bucket = simpleHash(word) % dimensions;
    embedding[bucket] += 1 / (idx + 1);  // Position weighting
  });
  
  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return norm > 0 ? embedding.map(v => v / norm) : embedding;
}

export class SemanticCache {
  private cache: Map<string, SemanticCacheEntry> = new Map();
  private config: SemanticCacheConfig;
  private hits = 0;
  private misses = 0;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(config: Partial<SemanticCacheConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      similarityThreshold: config.similarityThreshold ?? 0.85,
      maxEntries: config.maxEntries ?? 1000,
      embeddingModel: config.embeddingModel ?? "local-tfidf",
      ttlSeconds: config.ttlSeconds ?? 3600,
      cacheDir: config.cacheDir,
    };
  }

  /**
   * Get embedding for text (with caching)
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cached = this.embeddingCache.get(text);
    if (cached) return cached;

    // Generate embedding
    const embedding = generateEmbedding(text);
    this.embeddingCache.set(text, embedding);
    
    // Limit cache size
    if (this.embeddingCache.size > this.config.maxEntries * 2) {
      const keys = Array.from(this.embeddingCache.keys());
      keys.slice(0, keys.length - this.config.maxEntries).forEach(k => {
        this.embeddingCache.delete(k);
      });
    }

    return embedding;
  }

  /**
   * Generate cache key from query
   */
  private generateKey(query: string): string {
    // Simple hash function instead of crypto
    const hash = simpleHash(query.toLowerCase().trim());
    return hash.toString(16).padStart(8, '0') + simpleHash(query).toString(16).padStart(8, '0');
  }

  /**
   * Find best matching cached entry using cosine similarity
   */
  async get(query: string): Promise<{ response: string; similarity: number; tokensSaved: number; costSaved: number } | null> {
    if (!this.config.enabled) return null;

    const queryEmbedding = await this.getEmbedding(query);
    let bestMatch: { key: string; similarity: number } | null = null;

    // Search for most similar cached entry
    for (const [key, entry] of this.cache.entries()) {
      // Check expiration
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        continue;
      }

      const similarity = cosineSimilarity(queryEmbedding, entry.embedding);
      if (similarity >= this.config.similarityThreshold) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { key, similarity };
        }
      }
    }

    if (!bestMatch) {
      this.misses++;
      return null;
    }

    const entry = this.cache.get(bestMatch.key)!;
    this.hits++;
    
    return {
      response: entry.response,
      similarity: bestMatch.similarity,
      tokensSaved: entry.tokensSaved,
      costSaved: entry.costSaved,
    };
  }

  /**
   * Store query-response pair in semantic cache
   */
  async set(
    query: string,
    response: string,
    options: {
      model?: string;
      tokensSaved?: number;
      costSaved?: number;
    } = {}
  ): Promise<void> {
    if (!this.config.enabled) return;

    const embedding = await this.getEmbedding(query);
    const now = Date.now();
    const key = this.generateKey(query);

    // Evict oldest if at capacity
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(key, {
      query,
      embedding,
      response,
      model: options.model ?? "unknown",
      tokensSaved: options.tokensSaved ?? 0,
      costSaved: options.costSaved ?? 0,
      cachedAt: now,
      expiresAt: now + this.config.ttlSeconds * 1000,
    });
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.cachedAt < oldestTime) {
        oldestTime = entry.cachedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; size: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.embeddingCache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

export default SemanticCache;
