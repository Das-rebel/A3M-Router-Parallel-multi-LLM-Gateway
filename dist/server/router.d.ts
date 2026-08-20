/**
 * A3M Router - HTTP Route Registry
 *
 * Pluggable route table pattern replacing monolithic if/else routing.
 * Adding a new endpoint = 1 handler file + 1 registration line.
 *
 * Usage:
 *   import { createRouter, registerRoute } from './router';
 *   registerRoute('GET', /^\/health$/, handleHealth);
 *   registerRoute('POST', /^\/v1\/chat\/completions$/, handleChatCompletions);
 *   const router = createRouter();
 *   server.use(router);
 */
import * as http from 'http';
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
export interface RouteContext {
    requestId: string;
    startTime: number;
    method: HTTPMethod;
    path: string;
    query: Record<string, string>;
}
export type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse, ctx: RouteContext) => Promise<void> | void;
export interface Route {
    method: HTTPMethod;
    pattern: RegExp;
    handler: RouteHandler;
    name: string;
}
/**
 * Register a route. Routes are matched in registration order.
 */
export declare function registerRoute(method: HTTPMethod, pattern: RegExp, handler: RouteHandler, name?: string): void;
/**
 * Create the request handler function for the registered routes.
 * Returns a function compatible with http.createServer's requestListener.
 */
export declare function createRequestHandler(): (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>;
/**
 * Get all registered routes (for debugging and /routes endpoint).
 */
export declare function getRegisteredRoutes(): Route[];
declare const _default: {
    registerRoute: typeof registerRoute;
    createRequestHandler: typeof createRequestHandler;
    getRegisteredRoutes: typeof getRegisteredRoutes;
};
export default _default;
//# sourceMappingURL=router.d.ts.map