export interface Span {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operationName: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    attributes: Record<string, string | number | boolean>;
    status: 'started' | 'completed' | 'error';
    error?: string;
}
export interface Metric {
    name: string;
    value: number;
    timestamp: number;
    labels: Record<string, string>;
    type: 'counter' | 'gauge' | 'histogram';
}
export interface RouteTrace {
    traceId: string;
    timestamp: number;
    query: string;
    queryTokens: number;
    model: string;
    provider: string;
    responseTokens: number;
    latencyMs: number;
    cost: number;
    cacheHit: boolean;
    complexity: number;
    tier: 'budget' | 'standard' | 'premium';
}
export type ObservabilityEvent = {
    type: 'route_complete';
    trace: RouteTrace;
} | {
    type: 'span_started';
    span: Span;
} | {
    type: 'span_completed';
    span: Span;
} | {
    type: 'budget_warning';
    apiKey: string;
    usedCents: number;
    thresholdCents: number;
} | {
    type: 'error';
    spanId: string;
    error: string;
};
