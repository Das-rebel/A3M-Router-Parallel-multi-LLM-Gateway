/**
 * A3M Router configuration for Vercel AI SDK
 */

export interface A3MRouterConfig {
  /**
   * A3M Router endpoint
   * @default 'http://localhost:8787'
   */
  baseURL?: string;

  /**
   * API key for A3M Router
   * @default 'not-needed' for local
   */
  apiKey?: string;

  /**
   * Enable parallel ensemble execution
   * Runs multiple providers and picks the best result
   * @default false
   */
  parallelEnsemble?: boolean;

  /**
   * Number of providers to run in parallel when parallelEnsemble is true
   * @default 3
   */
  parallelCount?: number;

  /**
   * Enable stealth mode (anti-detection for browser automation)
   * @default false
   */
  stealth?: boolean;

  /**
   * Cache configuration
   */
  cache?: {
    enabled?: boolean;
    ttl?: number; // seconds
  };

  /**
   * Provider configuration
   * Maps provider names to their API keys
   */
  providers?: Record<string, {
    apiKey: string;
    /** Override the base URL for this provider */
    baseURL?: string;
  }>;

  /**
   * Cost limits per provider
   */
  budgetLimits?: Record<string, {
    maxCostPerRequest?: number;
    maxRequestsPerMinute?: number;
  }>;
}

/**
 * A3M Router response from /route or /generate
 */
export interface A3MRouteResponse {
  /** The generated content */
  content: string;

  /** The provider that was selected */
  provider: string;

  /** The model that was used */
  model: string;

  /** Cost in USD */
  cost: number;

  /** Latency in ms */
  latencyMs: number;

  /** Token usage */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** Confidence score (0-1) */
  confidence?: number;

  /** Finish reason */
  finishReason?: 'stop' | 'length' | 'error';
}

/**
 * A3M Router streaming response chunk
 */
export interface A3MStreamChunk {
  /** The delta content */
  delta: string;

  /** Provider that responded */
  provider: string;

  /** Whether this is the final chunk */
  done: boolean;

  /** Token usage (only on final chunk) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
