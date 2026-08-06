/**
 * Types for A3M Router AgentKit Adapter
 */

import { z } from "zod";

/**
 * Configuration for A3M Router
 */
export interface A3MConfig {
  /** A3M Router base URL (default: http://localhost:8787) */
  baseUrl?: string;
  /** API key for A3M Router (if required) */
  apiKey?: string;
  /** Default model to use (optional - A3M will route automatically) */
  defaultModel?: string;
  /** Enable parallel ensemble mode */
  parallel?: boolean;
  /** Temperature for generation (0-2) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Additional headers to send with each request */
  headers?: Record<string, string>;
}

/**
 * A3M-specific options for inference
 */
export interface A3MInferenceOptions {
  /** Override the model for this call */
  model?: string;
  /** Enable parallel ensemble for this call */
  parallel?: boolean;
  /** Temperature (0-2) */
  temperature?: number;
  /** Maximum tokens */
  maxTokens?: number;
  /** Provider to use (bypass routing) */
  provider?: string;
  /** Stop sequences */
  stop?: string[];
  /** Retry on failure */
  retry?: boolean;
}

/**
 * Message format compatible with AgentKit
 */
export interface A3MMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  toolCallId?: string;
}

/**
 * Tool call format for A3M
 */
export interface A3MToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Tool definition for A3M
 */
export interface A3MTool {
  name: string;
  description: string;
  parameters?: z.ZodType<unknown>;
  strict?: boolean;
}

/**
 * Streaming chunk from A3M
 */
export interface A3MStreamChunk {
  type: "text" | "tool_call" | "done" | "error";
  content?: string;
  toolCall?: A3MToolCall;
  error?: string;
}

/**
 * Response from A3M inference
 */
export interface A3MResponse {
  content: string;
  toolCalls?: A3MToolCall[];
  model?: string;
  provider?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: "stop" | "length" | "tool_calls" | "content_filter";
}

/**
 * Tool choice options
 */
export type ToolChoice = "auto" | "none" | { type: "function"; function: { name: string } };
