/**
 * A3M Router - Embeddings Handler
 *
 * Handles POST /v1/embeddings
 * OpenAI-compatible embeddings endpoint.
 *
 * Routes embedding requests to the best available provider:
 * - OpenAI (text-embedding-3-small, text-embedding-3-large, text-embedding-ada-002)
 * - Cohere (embed-english-v3.0, embed-multilingual-v3.0)
 * - Google (text-embedding-004)
 * - Local Ollama (nomic-embed-text, etc.)
 */
import * as http from 'http';
import { RouteContext } from '../router';
export declare function handleEmbeddings(req: http.IncomingMessage, res: http.ServerResponse, ctx: RouteContext): Promise<void>;
export default handleEmbeddings;
//# sourceMappingURL=embeddingsHandler.d.ts.map