/**
 * A3M Router - OpenAI-Compatible Proxy Server
 *
 * Lightweight HTTP server that accepts OpenAI API requests and routes them
 * through the A3M Router engine. Uses only Node.js built-in http module.
 *
 * Endpoints:
 *   POST /v1/chat/completions   — OpenAI-compatible chat
 *   POST /v1/completions        — OpenAI completions
 *   GET  /v1/models             — List available models
 *   GET  /health                — Health check with provider status
 *
 * Build: npx tsc
 * Run:   npx a3m-router serve [--port 8787]
 */
import * as http from 'http';
import { ModelMapping } from './modelMapper';
interface ChatMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
}
interface ProviderCallResult {
    content: string;
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    finish_reason: string;
}
/**
 * Call the actual LLM provider with the given messages.
 * Handles OpenAI-compatible APIs, Anthropic, Google, and local providers.
 */
export declare function callProvider(mapping: ModelMapping, messages: ChatMessage[], options: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    stop?: string | string[];
}): Promise<ProviderCallResult>;
/**
 * Stream a provider response as SSE chunks.
 */
export declare function streamProviderResponse(res: http.ServerResponse, mapping: ModelMapping, messages: ChatMessage[], options: {
    temperature?: number;
    max_tokens?: number;
    stop?: string | string[];
}, requestId: string): Promise<void>;
/**
 * Try the primary mapping, then fall back to alternatives.
 */
export declare function callWithFallback(model: string, messages: ChatMessage[], options: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    stop?: string | string[];
}, prompt: string): Promise<{
    result: ProviderCallResult;
    mapping: ModelMapping;
}>;
/**
 * Create and start the A3M Router proxy server.
 *
 * Uses a route table pattern (router.ts) for pluggable endpoint registration.
 * To add a new endpoint:
 *   1. Create src/server/handlers/yourHandler.ts
 *   2. Import and register: registerRoute('GET', /^\/path$/, handleYourPath);
 *
 * @param port - Port to listen on (default: 8787, env: PORT)
 * @returns The http.Server instance
 */
export declare function createProxyServer(port?: number): http.Server;
export { costTracker, requestLogs } from './state';
export type { RequestLog } from './state';
export default createProxyServer;
//# sourceMappingURL=proxyServer.d.ts.map