/**
 * Token-Aware Fallback Chain - Token Optimization Pattern #3
 * 
 * Route to smaller models when high-token content is detected.
 * Reduces cost by using cheap models for simple/high-volume queries.
 * 
 * Based on: arXiv:2608.17188 - Token Optimization and Context Window Management
 */

export interface TokenThreshold {
  maxTokens: number;
  models: string[];  // Available models at this tier
}

export interface TokenAwareFallbackConfig {
  thresholds: TokenThreshold[];
  defaultModel?: string;
  enableDynamicThreshold?: boolean;
}

export interface FallbackDecision {
  targetModel: string;
  tier: "cheap" | "medium" | "expensive";
  estimatedTokens: number;
  reasoning: string;
}

/**
 * Model cost tiers (approximate, per 1M tokens)
 */
const MODEL_COSTS: Record<string, number> = {
  // Cheap tier (< $0.50/1M)
  "gpt-4o-mini": 0.15,
  "claude-haiku": 0.25,
  "gemini-flash": 0.075,
  "gpt-3.5-turbo": 0.50,
  
  // Medium tier ($0.50 - $3.00/1M)
  "gpt-4o": 2.50,
  "claude-sonnet": 3.00,
  "gemini-pro": 1.25,
  
  // Expensive tier (> $3.00/1M)
  "gpt-4-turbo": 10.00,
  "claude-opus": 15.00,
  "gpt-4": 30.00,
};

export class TokenAwareFallback {
  private config: TokenAwareFallbackConfig;

  constructor(config: Partial<TokenAwareFallbackConfig> = {}) {
    this.config = {
      thresholds: config.thresholds ?? [
        { maxTokens: 500, models: ["gpt-4o-mini", "claude-haiku", "gemini-flash"] },
        { maxTokens: 2000, models: ["gpt-4o", "claude-sonnet", "gemini-pro"] },
        { maxTokens: Infinity, models: ["gpt-4o", "claude-opus", "gpt-4-turbo"] },
      ],
      defaultModel: config.defaultModel ?? "gpt-4o",
      enableDynamicThreshold: config.enableDynamicThreshold ?? false,
    };
  }

  /**
   * Estimate token count from text (rough approximation)
   */
  estimateTokens(text: string): number {
    // ~4 characters per token for English
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate tokens including history
   */
  estimateTotalTokens(
    query: string,
    history?: Array<{ content: string }>
  ): number {
    let total = this.estimateTokens(query);
    
    if (history) {
      total += history.reduce((sum, msg) => sum + this.estimateTokens(msg.content), 0);
    }
    
    return total;
  }

  /**
   * Select appropriate model based on token count
   */
  selectModel(estimatedTokens: number): FallbackDecision {
    for (const threshold of this.config.thresholds) {
      if (estimatedTokens <= threshold.maxTokens) {
        const model = threshold.models[0];  // Select first available in tier
        const tier = this.getModelTier(model);
        
        return {
          targetModel: model,
          tier,
          estimatedTokens,
          reasoning: `Selected ${tier} model ${model} for ${estimatedTokens} tokens`,
        };
      }
    }

    // Fallback to default
    return {
      targetModel: this.config.defaultModel!,
      tier: "medium",
      estimatedTokens,
      reasoning: `Defaulting to ${this.config.defaultModel} for ${estimatedTokens} tokens`,
    };
  }

  /**
   * Get cost tier for a model
   */
  private getModelTier(model: string): "cheap" | "medium" | "expensive" {
    const cost = MODEL_COSTS[model.toLowerCase()] ?? 1.0;
    if (cost < 0.5) return "cheap";
    if (cost < 3.0) return "medium";
    return "expensive";
  }

  /**
   * Create fallback chain for a query
   */
  createFallbackChain(
    query: string,
    history?: Array<{ content: string }>
  ): string[] {
    const estimatedTokens = this.estimateTotalTokens(query, history);
    const chain: string[] = [];

    // Find appropriate tier and all models in that tier
    for (const threshold of this.config.thresholds) {
      if (estimatedTokens <= threshold.maxTokens) {
        chain.push(...threshold.models);
        break;
      }
    }

    // If still empty, add all models
    if (chain.length === 0) {
      for (const threshold of this.config.thresholds) {
        chain.push(...threshold.models);
      }
    }

    return chain;
  }

  /**
   * Estimate cost savings vs always using expensive model
   */
  estimateSavings(
    query: string,
    history?: Array<{ content: string }>
  ): { savingsPercent: number; cheapModel: string; expensiveModel: string } {
    const estimatedTokens = this.estimateTotalTokens(query, history);
    const decision = this.selectModel(estimatedTokens);
    
    const cheapCost = this.getModelCost(decision.targetModel) * estimatedTokens / 1_000_000;
    const expensiveCost = this.getModelCost("gpt-4-turbo") * estimatedTokens / 1_000_000;
    
    const savingsPercent = expensiveCost > 0 
      ? ((expensiveCost - cheapCost) / expensiveCost) * 100 
      : 0;

    return {
      savingsPercent: Math.round(savingsPercent * 100) / 100,
      cheapModel: decision.targetModel,
      expensiveModel: "gpt-4-turbo",
    };
  }

  /**
   * Get model cost per 1M tokens
   */
  getModelCost(model: string): number {
    return MODEL_COSTS[model.toLowerCase()] ?? 1.0;
  }

  /**
   * Get all configured thresholds
   */
  getThresholds(): TokenThreshold[] {
    return this.config.thresholds;
  }
}

export default TokenAwareFallback;
