/**
 * Inter-Agent Communication Compression - Token Optimization Pattern #6
 * 
 * Compress messages between agents to reduce token usage.
 * Uses summarization for long messages, preserves key info for short ones.
 * 
 * Based on: arXiv:2608.17188 - Token Optimization and Context Window Management
 */

export interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  metadata?: Record<string, unknown>;
}

export interface CompressionConfig {
  maxMessageLength: number;
  summarizeThreshold: number;
  preserveKeywords: string[];
  summaryModel?: string;
}

export interface CompressionResult {
  messages: Message[];
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
}

/**
 * Keywords that should be preserved in compression
 */
const PRESERVE_KEYWORDS = [
  "error", "warning", "fail", "success", "api", "url",
  "id", "token", "key", "config", "path", "file",
  "function", "class", "method", "variable", "import",
  "json", "xml", "html", "css", "sql"
];

/**
 * Simple summarizer (in production, use actual LLM)
 */
function simpleSummarize(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  // Truncate and add indicator
  const summary = text.substring(0, maxLength - 20);
  return summary + "... [truncated]";
}

export class InterAgentCompressor {
  private config: CompressionConfig;

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = {
      maxMessageLength: config.maxMessageLength ?? 500,
      summarizeThreshold: config.summarizeThreshold ?? 300,
      preserveKeywords: config.preserveKeywords ?? PRESERVE_KEYWORDS,
      summaryModel: config.summaryModel ?? "gpt-4o-mini",
    };
  }

  /**
   * Estimate tokens in text (rough)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if text contains preserved keywords
   */
  private containsPreservedKeyword(text: string): boolean {
    const lower = text.toLowerCase();
    return this.config.preserveKeywords.some(kw => lower.includes(kw));
  }

  /**
   * Compress a single message
   */
  compressMessage(message: Message): Message {
    const content = message.content ?? "";
    const tokens = this.estimateTokens(content);

    // If below threshold, no compression needed
    if (tokens <= this.config.summarizeThreshold && !this.containsPreservedKeyword(content)) {
      return message;
    }

    // If very long, truncate
    if (content.length > this.config.maxMessageLength * 2) {
      return {
        ...message,
        content: simpleSummarize(content, this.config.maxMessageLength),
      };
    }

    // Otherwise, truncate to threshold
    return {
      ...message,
      content: simpleSummarize(content, this.config.maxMessageLength),
    };
  }

  /**
   * Compress array of messages
   */
  compress(messages: Message[]): CompressionResult {
    const originalTokens = messages.reduce(
      (sum, msg) => sum + this.estimateTokens(msg.content ?? ""),
      0
    );

    const compressed = messages.map(msg => this.compressMessage(msg));

    const compressedTokens = compressed.reduce(
      (sum, msg) => sum + this.estimateTokens(msg.content ?? ""),
      0
    );

    return {
      messages: compressed,
      originalTokens,
      compressedTokens,
      compressionRatio: originalTokens > 0 ? compressedTokens / originalTokens : 1,
    };
  }

  /**
   * Compress messages in-place (mutates array)
   */
  compressInPlace(messages: Message[]): void {
    for (let i = 0; i < messages.length; i++) {
      messages[i] = this.compressMessage(messages[i]);
    }
  }

  /**
   * Get compression statistics
   */
  getStats(result: CompressionResult): {
    tokensReduced: number;
    percentReduction: string;
  } {
    const tokensReduced = result.originalTokens - result.compressedTokens;
    const percentReduction = result.originalTokens > 0
      ? ((tokensReduced / result.originalTokens) * 100).toFixed(1) + "%"
      : "0%";

    return {
      tokensReduced,
      percentReduction,
    };
  }
}

export default InterAgentCompressor;
