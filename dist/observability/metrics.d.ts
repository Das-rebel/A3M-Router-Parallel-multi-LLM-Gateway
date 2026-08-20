import { Metric } from './types';
export declare class MetricsCollector {
    private counters;
    private gauges;
    private histograms;
    private createdAt;
    /**
     * Increment counter
     */
    incrementCounter(name: string, labels?: Record<string, string>, value?: number): void;
    /**
     * Set gauge
     */
    setGauge(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Record histogram value
     */
    recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Get metrics in Prometheus format
     */
    getPrometheusMetrics(): string;
    /**
     * Get all metrics as Metric objects
     */
    getMetrics(): Metric[];
    private extractLabels;
    /**
     * Clear metrics
     */
    reset(): void;
}
export declare function getMetrics(): MetricsCollector;
export declare function createMetricsCollector(): MetricsCollector;
//# sourceMappingURL=metrics.d.ts.map