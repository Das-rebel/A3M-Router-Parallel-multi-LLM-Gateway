/**
 * A3M Router AgentKit Adapter
 * 
 * @example
 * ```typescript
 * import { createAgenticModelFromAiAdapter } from "@inngest/agent-kit";
 * import { createA3MAdapter } from "@a3m/agentkit-adapter";
 * 
 * // Create A3M adapter
 * const a3m = createA3MAdapter({
 *   baseUrl: "http://localhost:8787",
 *   parallel: true,  // Enable parallel ensemble mode
 * });
 * 
 * // Wrap as AgentKit model
 * const model = createAgenticModelFromAiAdapter(a3m as unknown as AiAdapter.Any);
 * 
 * // Use with AgentKit agent
 * const agent = new Agent({
 *   model,
 *   tools: [/* your tools *\/],
 * });
 * ```
 */

export { A3MAdapter, createA3MAdapter } from "./adapter";
export type {
  A3MConfig,
  A3MInferenceOptions,
  A3MMessage,
  A3MTool,
  A3MToolCall,
  A3MStreamChunk,
  A3MResponse,
  ToolChoice,
} from "./types";
