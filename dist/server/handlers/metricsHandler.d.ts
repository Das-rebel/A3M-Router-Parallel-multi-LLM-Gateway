/**
 * A3M Router - Prometheus Metrics Handler
 *
 * Handles GET /metrics
 * Returns Prometheus-compatible metrics output.
 */
import * as http from 'http';
import { RouteContext } from '../router';
export declare function handleMetrics(_req: http.IncomingMessage, res: http.ServerResponse, _ctx: RouteContext): void;
export default handleMetrics;
//# sourceMappingURL=metricsHandler.d.ts.map