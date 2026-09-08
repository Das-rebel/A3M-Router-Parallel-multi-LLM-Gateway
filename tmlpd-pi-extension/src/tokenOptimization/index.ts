/**
 * Token Optimization Module - Phase 1 Implementation
 * 
 * 6 patterns from arXiv:2608.17188 - Token Optimization and Context Window Management
 * 
 * Patterns:
 * 1. SemanticCache - Embedding-based similarity caching
 * 2. ContextStratifier -分层 context levels
 * 3. TokenAwareFallback - Token-count based model routing
 * 4. SchemaContractor - Schema-referenced prompts
 * 5. FetchOnceProcessor - Fetch once, process locally
 * 6. InterAgentCompressor - Message compression
 */

export { SemanticCache, SemanticCacheConfig, SemanticCacheEntry } from "./semanticCache";
export { ContextStratifier, ContextLevel, ContextStratifierConfig, StratificationResult } from "./contextStratifier";
export { TokenAwareFallback, TokenAwareFallbackConfig, FallbackDecision, TokenThreshold } from "./tokenAwareFallback";
export { SchemaContractor, SchemaContractConfig, SchemaInfo } from "./schemaContract";
export { FetchOnceProcessor, FetchOnceConfig, FetchOnceResult } from "./fetchOnceLocal";
export { InterAgentCompressor, Message, CompressionConfig, CompressionResult } from "./interAgentCompression";

/**
 * Create a fully configured TokenOptimizer with all patterns
 */
import { SemanticCache } from "./semanticCache";
import { ContextStratifier } from "./contextStratifier";
import { TokenAwareFallback } from "./tokenAwareFallback";
import { SchemaContractor } from "./schemaContract";
import { FetchOnceProcessor } from "./fetchOnceLocal";
import { InterAgentCompressor } from "./interAgentCompression";

export interface TokenOptimizerConfig {
  semanticCache?: boolean;
  contextStratification?: boolean;
  tokenAwareFallback?: boolean;
  schemaContraction?: boolean;
  fetchOnce?: boolean;
  agentCompression?: boolean;
}

export class TokenOptimizer {
  semanticCache: SemanticCache;
  contextStratifier: ContextStratifier;
  tokenAwareFallback: TokenAwareFallback;
  schemaContractor: SchemaContractor;
  fetchOnceProcessor: FetchOnceProcessor;
  agentCompressor: InterAgentCompressor;
  
  private config: TokenOptimizerConfig;

  constructor(config: TokenOptimizerConfig = {}) {
    this.config = config;
    
    this.semanticCache = new SemanticCache({
      enabled: config.semanticCache ?? true,
    });
    
    this.contextStratifier = new ContextStratifier();
    
    this.tokenAwareFallback = new TokenAwareFallback();
    
    this.schemaContractor = new SchemaContractor();
    
    this.fetchOnceProcessor = new FetchOnceProcessor();
    
    this.agentCompressor = new InterAgentCompressor();
  }

  /**
   * Optimize a query before sending to LLM
   */
  async optimizeQuery(
    query: string,
    history?: Array<{ role: string; content: string }>
  ): Promise<{
    query: string;
    history: Array<{ role: string; content: string }>;
    contextLevel: string;
    recommendedModel: string;
    cacheHit: boolean;
    cachedResponse?: string;
  }> {
    // 1. Check semantic cache
    const cacheResult = await this.semanticCache.get(query);
    if (cacheResult) {
      return {
        query,
        history: [],
        contextLevel: "CACHED",
        recommendedModel: "cached",
        cacheHit: true,
        cachedResponse: cacheResult.response,
      };
    }

    // 2. Classify context level
    const stratification = this.contextStratifier.classify(query, history);
    
    // 3. Get token-aware model recommendation
    const totalTokens = this.tokenAwareFallback.estimateTotalTokens(query, history);
    const modelDecision = this.tokenAwareFallback.selectModel(totalTokens);
    
    // 4. Stratify history
    const stratifiedHistory = this.contextStratifier.stratifyHistory(
      history as Array<{ role: string; content: string }>,
      stratification.level
    );

    return {
      query,
      history: stratifiedHistory,
      contextLevel: stratification.level,
      recommendedModel: modelDecision.targetModel,
      cacheHit: false,
    };
  }

  /**
   * Record a query-response pair in cache
   */
  async recordResponse(
    query: string,
    response: string,
    options: {
      model?: string;
      tokens?: number;
      cost?: number;
    } = {}
  ): Promise<void> {
    await this.semanticCache.set(query, response, {
      model: options.model,
      tokensSaved: options.tokens,
      costSaved: options.cost,
    });
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    return {
      semanticCache: this.semanticCache.getStats(),
      tokenAwareFallback: {
        thresholds: this.tokenAwareFallback.getThresholds(),
      },
    };
  }
}

/**
 * Helper to estimate token savings across all patterns
 */
export function estimateTotalSavings(
  patterns: ("semantic" | "context" | "fallback" | "schema" | "fetchOnce" | "compression")[],
  queryTokens: number,
  responseTokens: number
): {
  tokensSaved: number;
  percentReduction: string;
  patterns: string[];
} {
  let totalTokens = queryTokens + responseTokens;
  let saved = 0;
  const appliedPatterns: string[] = [];

  if (patterns.includes("semantic")) {
    // ~20% cache hit rate after warmup
    saved += totalTokens * 0.2;
    appliedPatterns.push("Semantic Caching (-20%)");
  }

  if (patterns.includes("context")) {
    // ~30% reduction from context stratification
    saved += totalTokens * 0.3;
    appliedPatterns.push("Context Stratification (-30%)");
  }

  if (patterns.includes("fallback")) {
    // ~40% savings from cheap model routing
    saved += totalTokens * 0.4;
    appliedPatterns.push("Token-Aware Fallback (-40%)");
  }

  if (patterns.includes("compression")) {
    // ~15% from message compression
    saved += totalTokens * 0.15;
    appliedPatterns.push("Inter-Agent Compression (-15%)");
  }

  const percentReduction = totalTokens > 0 ? ((saved / totalTokens) * 100).toFixed(1) : "0%";

  return {
    tokensSaved: Math.round(saved),
    percentReduction: percentReduction + "%",
    patterns: appliedPatterns,
  };
}
