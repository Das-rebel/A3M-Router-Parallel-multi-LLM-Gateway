/**
 * A3M Router — Reproducible Benchmark
 *
 * Run: npx a3m-router benchmark --reproducible
 *
 * "Everything is open source. Run the exact benchmark."
 *   — Napkin AI style
 *
 * 20 fixed queries with deterministic seed = 42.
 * Routes each query through the router, then scores accuracy.
 */
interface BenchmarkQuery {
    id: number;
    query: string;
    category: 'trivial' | 'code' | 'creative' | 'edge' | 'reasoning';
    expectedTier: 'free' | 'budget' | 'premium';
    expectedCostMax: number;
    minComplexity: number;
    maxComplexity: number;
    tags: string[];
}
interface BenchmarkResult {
    queryId: number;
    query: string;
    category: string;
    provider: string;
    model: string;
    cost: number;
    latency: number;
    complexity: number;
    confidence: number;
    reasoning: string;
    complexityInRange: boolean;
    costUnderLimit: boolean;
    tierCorrect: boolean;
    passed: boolean;
}
export declare function runReproducibleBenchmark(seed?: number, count?: number): {
    results: BenchmarkResult[];
    summary: {
        total: number;
        passed: number;
        accuracy: number;
        totalCost: number;
        avgLatency: number;
        routerArenaScore: number;
    };
};
export declare function formatBenchmarkOutput(run: ReturnType<typeof runReproducibleBenchmark>): string;
declare const _default: {
    runReproducibleBenchmark: typeof runReproducibleBenchmark;
    formatBenchmarkOutput: typeof formatBenchmarkOutput;
    BENCHMARK_QUERIES: BenchmarkQuery[];
};
export default _default;
