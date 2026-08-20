import { EventEmitter } from 'events';
import { Span, RouteTrace } from './types';
interface LangfuseConfig {
    publicKey?: string;
    secretKey?: string;
    baseUrl?: string;
}
export declare class Tracer extends EventEmitter {
    private traces;
    private routeTraces;
    private langfuseClient?;
    private langfuseConfig?;
    constructor();
    /**
     * Initialize Langfuse if configured
     */
    initLangfuse(config: LangfuseConfig): void;
    /**
     * Create a new trace span
     */
    startSpan(operationName: string, parentSpanId?: string): Span;
    /**
     * End a span
     */
    endSpan(spanId: string, attributes?: Record<string, any>): void;
    /**
     * Record an error on a span
     */
    errorSpan(spanId: string, error: string, attributes?: Record<string, any>): void;
    /**
     * Record a route decision
     */
    recordRoute(trace: RouteTrace): void;
    /**
     * Generate a unique trace ID
     */
    generateTraceId(): string;
    /**
     * Get all route traces
     */
    getTraces(limit?: number): RouteTrace[];
    /**
     * Get all spans for a trace
     */
    getSpans(traceId: string): Span[];
    /**
     * Export to Langfuse (async, non-blocking)
     */
    flushToLangfuse(): Promise<void>;
    /**
     * Clear all traces (for testing)
     */
    reset(): void;
}
export declare function getTracer(): Tracer;
export declare function createTracer(): Tracer;
export {};
//# sourceMappingURL=tracer.d.ts.map