/**
 * A3M Router AgentKit Adapter
 * 
 * Wraps A3M Router as an AgentKit-compatible LLM backend.
 * Supports tool calling, streaming, and parallel ensemble mode.
 */

import { type AiAdapter } from "@inngest/ai";
import { z } from "zod";
import { stringifyError } from "./util";
import type {
  A3MConfig,
  A3MInferenceOptions,
  A3MMessage,
  A3MTool,
  A3MStreamChunk,
  A3MToolCall,
} from "./types";

/**
 * A3M Router adapter for AgentKit
 */
export class A3MAdapter {
  private config: Required<A3MConfig>;
  private format: AiAdapter.Format = "openai-chat";
  private url: string;
  private authKey: string = "";

  constructor(config: A3MConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || "http://localhost:8787",
      apiKey: config.apiKey || "",
      defaultModel: config.defaultModel || "",
      parallel: config.parallel ?? false,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      headers: config.headers || {},
    };
    this.url = `${this.config.baseUrl}/v1/chat/completions`;
    this.authKey = this.config.apiKey;
  }

  /**
   * Get the adapter format
   */
  getFormat(): AiAdapter.Format {
    return this.format;
  }

  /**
   * Get adapter options (required by AgentKit)
   */
  getOptions(): AiAdapter.Any["options"] {
    return {
      model: this.config.defaultModel || "auto",
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
    } as AiAdapter.Any["options"];
  }

  /**
   * Convert AgentKit messages to A3M format
   */
  private convertMessages(messages: Array<{
    type: string;
    role?: string;
    content?: string;
    tool?: { id?: string; name?: string };
    tools?: unknown[];
  }>): A3MMessage[] {
    return messages.map((m) => {
      if (m.type === "tool_result") {
        return {
          role: "tool" as const,
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
          toolCallId: m.tool?.id,
        };
      }
      if (m.type === "tool_call") {
        // Tool calls are handled separately
        return {
          role: "assistant" as const,
          content: "",
        };
      }
      return {
        role: (m.role as "user" | "assistant" | "system") || "user",
        content: m.content || "",
      };
    }).filter((m) => m.content || m.role === "system");
  }

  /**
   * Convert AgentKit tools to A3M/OpenAI format
   */
  private convertTools(tools: Array<{
    name: string;
    description?: string;
    parameters?: z.ZodType<unknown>;
    strict?: boolean;
  }>) {
    return tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description || "",
        parameters: t.parameters ? z.toJSONSchema(t.parameters, { target: "draft-7" }) : undefined,
        strict: t.strict ?? Boolean(t.parameters),
      },
    }));
  }

  /**
   * Parse A3M/OpenAI response to AgentKit messages
   */
  private parseResponse(input: Record<string, unknown>): Array<{
    type: string;
    role?: string;
    content?: string;
    tools?: A3MToolCall[];
    stop_reason?: string;
  }> {
    const result: Array<{
      type: string;
      role?: string;
      content?: string;
      tools?: A3MToolCall[];
      stop_reason?: string;
    }> = [];

    if (input.error) {
      throw new Error(`A3M request failed: ${JSON.stringify(input.error)}`);
    }

    const choices = (input.choices as Array<Record<string, unknown>>) || [];
    
    for (const choice of choices) {
      const message = choice.message as Record<string, unknown> || {};
      const finishReason = choice.finish_reason as string || "stop";

      // Text content
      if (message.content && (message.content as string).trim()) {
        result.push({
          type: "text",
          role: message.role as string,
          content: message.content as string,
          stop_reason: finishReason,
        });
      }

      // Tool calls
      const toolCalls = message.tool_calls as Array<Record<string, unknown>> || [];
      if (toolCalls.length > 0) {
        result.push({
          type: "tool_call",
          role: message.role as string,
          tools: toolCalls.map((tc) => ({
            id: tc.id as string,
            name: (tc.function as Record<string, string>)?.name || "",
            arguments: JSON.parse((tc.function as Record<string, string>)?.arguments || "{}"),
          })),
          stop_reason: "tool",
        });
      }
    }

    return result;
  }

  /**
   * Run inference through A3M Router
   */
  async infer(
    stepID: string,
    messages: Array<{
      type: string;
      role?: string;
      content?: string;
      tool?: { id?: string; name?: string };
      tools?: unknown[];
    }>,
    tools: Array<{
      name: string;
      description?: string;
      parameters?: z.ZodType<unknown>;
      strict?: boolean;
    }>,
    toolChoice: "auto" | "none" | { type: "function"; function: { name: string } } = "auto",
    options: A3MInferenceOptions = {}
  ): Promise<{
    output: Array<{ type: string; role?: string; content?: string; tools?: A3MToolCall[]; stop_reason?: string }>;
    raw: Record<string, unknown>;
  }> {
    const body: Record<string, unknown> = {
      model: options.model || this.config.defaultModel || "auto",
      messages: this.convertMessages(messages),
      temperature: options.temperature ?? this.config.temperature,
      max_tokens: options.maxTokens ?? this.config.maxTokens,
    };

    if (tools.length > 0) {
      body.tools = this.convertTools(tools);
      if (toolChoice === "auto") {
        body.tool_choice = "auto";
      } else if (toolChoice === "none") {
        body.tool_choice = "none";
      } else if (toolChoice && typeof toolChoice === "object") {
        body.tool_choice = {
          type: "function",
          function: { name: toolChoice.function.name },
        };
      }
    }

    if (options.provider) {
      body.provider = options.provider;
    }

    if (options.stop) {
      body.stop = options.stop;
    }

    // Parallel ensemble mode
    if (options.parallel ?? this.config.parallel) {
      body.parallel = true;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.headers,
    };

    if (this.authKey) {
      headers["Authorization"] = `Bearer ${this.authKey}`;
    }

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`A3M request failed: ${response.status} ${response.statusText}`);
      }

      const result = (await response.json()) as Record<string, unknown>;
      return {
        output: this.parseResponse(result),
        raw: result,
      };
    } catch (err) {
      throw new Error(`A3M inference error: ${stringifyError(err)}`);
    }
  }

  /**
   * Stream inference through A3M Router
   */
  async *stream(
    messages: A3MMessage[],
    tools: A3MTool[] = [],
    options: A3MInferenceOptions = {}
  ): AsyncGenerator<A3MStreamChunk> {
    const body: Record<string, unknown> = {
      model: options.model || this.config.defaultModel || "auto",
      messages,
      temperature: options.temperature ?? this.config.temperature,
      max_tokens: options.maxTokens ?? this.config.maxTokens,
      stream: true,
    };

    if (tools.length > 0) {
      body.tools = this.convertTools(tools);
      body.tool_choice = "auto";
    }

    if (options.provider) {
      body.provider = options.provider;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.headers,
    };

    if (this.authKey) {
      headers["Authorization"] = `Bearer ${this.authKey}`;
    }

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`A3M stream failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("A3M stream: no response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            yield { type: "done" };
            return;
          }

          try {
            const chunk = JSON.parse(data) as Record<string, unknown>;
            const delta = chunk.choices?.[0]?.delta as Record<string, unknown>;

            if (delta?.content) {
              yield { type: "text", content: delta.content as string };
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls as Array<Record<string, unknown>>) {
                yield {
                  type: "tool_call",
                  toolCall: {
                    id: tc.id as string,
                    name: (tc.function as Record<string, string>)?.name || "",
                    arguments: JSON.parse((tc.function as Record<string, string>)?.arguments || "{}"),
                  },
                };
              }
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      yield { type: "done" };
    } catch (err) {
      yield { type: "error", error: stringifyError(err) };
    }
  }

  /**
   * Check if A3M Router is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Create an A3M adapter with default settings
 */
export function createA3MAdapter(config?: A3MConfig): A3MAdapter {
  return new A3MAdapter(config);
}
