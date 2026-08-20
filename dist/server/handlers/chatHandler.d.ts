/**
 * A3M Router - Chat Completions Handler
 *
 * Handles POST /v1/chat/completions
 * Plug-and-play: register with router.registerRoute('POST', /^\/v1\/chat\/completions$/, handleChatCompletions);
 */
import * as http from 'http';
import { RouteContext } from '../router';
export declare function handleChatCompletions(req: http.IncomingMessage, res: http.ServerResponse, ctx: RouteContext): Promise<void>;
export default handleChatCompletions;
//# sourceMappingURL=chatHandler.d.ts.map