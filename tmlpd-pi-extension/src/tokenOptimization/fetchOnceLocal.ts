/**
 * Fetch-Once/Process-Locally - Token Optimization Pattern #5
 * 
 * Fetch data once with expensive model, then process locally with cheap model.
 * Reduces API calls by extracting only needed info from fetched content.
 * 
 * Based on: arXiv:2608.17188 - Token Optimization and Context Window Management
 */

export interface FetchOnceConfig {
  expensiveModel?: string;
  cheapModel?: string;
  extractionPrompt?: string;
}

export interface FetchOnceResult {
  extractedData: string;
  fullFetched: boolean;
  tokensSaved: number;
  costSaved: number;
}

/**
 * Simulated content fetcher (replace with actual HTTP client)
 */
async function fetchContent(url: string): Promise<string> {
  // In production, use: fetch, axios, or similar
  // This is a placeholder
  // console.log(`[FetchOnce] Fetching: ${url}`);
  return `[Content from ${url}]...`;
}

/**
 * Extract specific data from content using cheap model
 */
async function extractWithCheapModel(
  content: string,
  task: string,
  cheapModel: string
): Promise<string> {
  // In production, call cheap LLM here
  // console.log(`[FetchOnce] Extracting "${task}" using ${cheapModel}`);
  return `[Extracted ${task} from content]`;
}

export class FetchOnceProcessor {
  private config: FetchOnceConfig;

  constructor(config: Partial<FetchOnceConfig> = {}) {
    this.config = {
      expensiveModel: config.expensiveModel ?? "gpt-4o",
      cheapModel: config.cheapModel ?? "gpt-4o-mini",
      extractionPrompt: config.extractionPrompt ?? `Extract only the following from the content: {task}. Be concise.`,
    };
  }

  /**
   * Fetch URL content once, then extract needed data locally
   */
  async process(
    url: string,
    task: string,
    options: {
      fullContent?: boolean;
      expensiveModel?: string;
      cheapModel?: string;
    } = {}
  ): Promise<FetchOnceResult> {
    const expensiveModel = options.expensiveModel ?? this.config.expensiveModel!;
    const cheapModel = options.cheapModel ?? this.config.cheapModel!;

    // Step 1: Fetch content (one expensive call)
    const fullContent = await fetchContent(url);
    const fullTokens = Math.ceil(fullContent.length / 4);
    const fullCost = this.estimateCost(fullTokens, expensiveModel);

    // If full content requested, return it
    if (options.fullContent) {
      return {
        extractedData: fullContent,
        fullFetched: true,
        tokensSaved: 0,
        costSaved: 0,
      };
    }

    // Step 2: Extract only needed data (cheap call)
    const extracted = await extractWithCheapModel(fullContent, task, cheapModel);
    const extractedTokens = Math.ceil(extracted.length / 4);
    const extractedCost = this.estimateCost(extractedTokens, cheapModel);

    // Calculate savings
    const cheapFullCost = this.estimateCost(fullTokens, cheapModel);
    const tokensSaved = fullTokens - extractedTokens;
    const costSaved = cheapFullCost - extractedCost;

    return {
      extractedData: extracted,
      fullFetched: false,
      tokensSaved,
      costSaved,
    };
  }

  /**
   * Batch process multiple URLs for same extraction task
   */
  async processBatch(
    urls: string[],
    task: string,
    options: {
      expensiveModel?: string;
      cheapModel?: string;
    } = {}
  ): Promise<FetchOnceResult[]> {
    return Promise.all(
      urls.map(url => this.process(url, task, options))
    );
  }

  /**
   * Estimate cost (simplified)
   */
  private estimateCost(tokens: number, model: string): number {
    const costsPerMillion: Record<string, number> = {
      "gpt-4o": 2.50,
      "gpt-4o-mini": 0.15,
      "claude-opus": 15.00,
      "claude-haiku": 0.25,
    };
    const costPerMillion = costsPerMillion[model] ?? 1.0;
    return (tokens / 1_000_000) * costPerMillion;
  }
}

export default FetchOnceProcessor;
