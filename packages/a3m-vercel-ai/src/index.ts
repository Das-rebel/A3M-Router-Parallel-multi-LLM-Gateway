/**
 * @a3m/vercel-ai - A3M Router Provider for Vercel AI SDK
 * 
 * Drop-in replacement that routes to the cheapest capable provider
 * with parallel execution, caching, and automatic fallback.
 * 
 * @example
 * ```typescript
 * import { createA3MProvider } from '@a3m/vercel-ai';
 * import { generateText } from 'ai';
 * 
 * const a3m = createA3MProvider();
 * 
 * const { text } = await generateText({
 *   model: a3m('auto'),
 *   prompt: 'What is the capital of France?',
 * });
 * ```
 */

export type { A3MRouterConfig, A3MRouteResponse, A3MStreamChunk } from './types';
export { createA3MLanguageModel } from './a3m-language-model';

import type { LanguageModelV1 } from '@ai-sdk/provider';
import type { A3MRouterConfig } from './types';
import { createA3MLanguageModel } from './a3m-language-model';

/**
 * A3M Router provider for Vercel AI SDK
 */
export interface A3MProvider {
  name: 'a3m';
  /**
   * Returns an A3M language model.
   * 
   * @param modelId - Use 'auto' for automatic routing, or specify a model like 'gpt-4', 'claude-3', etc.
   */
  (modelId: string): LanguageModelV1;
}

/**
 * Create an A3M Router provider for Vercel AI SDK
 */
export function createA3MProvider(config: A3MRouterConfig = {}): A3MProvider {
  const languageModel = createA3MLanguageModel(config);
  
  const provider = Object.assign(
    (modelId: string) => {
      // Return the language model - A3M handles model selection internally
      return languageModel;
    },
    {
      name: 'a3m' as const,
      // Allow accessing config for introspection
      __config: config,
    }
  );
  
  return provider;
}

/**
 * Example usage with Next.js App Router
 * 
 * ```typescript
 * // app/api/chat/route.ts
 * import { createA3MProvider } from '@a3m/vercel-ai';
 * import { generateText } from 'ai';
 * 
 * const a3m = createA3MProvider({
 *   parallelEnsemble: true,
 * });
 * 
 * export async function POST(req: Request) {
 *   const { messages } = await req.json();
 *   
 *   const result = await generateText({
 *     model: a3m('auto'),
 *     messages,
 *   });
 *   
 *   return Response.json(result);
 * }
 * ```
 */

/**
 * Example usage with streaming
 * 
 * ```typescript
 * import { createA3MProvider } from '@a3m/vercel-ai';
 * import { streamText } from 'ai';
 * 
 * const a3m = createA3MProvider();
 * 
 * const result = await streamText({
 *   model: a3m('auto'),
 *   prompt: 'Write a story about a robot...',
 * });
 * 
 * // Stream to response
 * return result.toDataStreamResponse();
 * ```
 */
