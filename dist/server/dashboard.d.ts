/**
 * A3M Router - Dashboard UI + API Endpoints
 *
 * Single HTML dashboard served at GET / when the proxy server runs.
 * Dark theme, hacker/terminal aesthetic, auto-refreshes every 5s.
 * API endpoints: /api/stats, /api/providers, /api/requests, /api/clear
 *
 * No React, no build step — vanilla HTML/CSS/JS served inline.
 */
import * as http from "http";
export interface DashboardRequest {
    timestamp: number;
    query: string;
    provider: string;
    model: string;
    latency: number;
    cost: number;
    status: "success" | "error";
    error?: string;
    tokens?: {
        input: number;
        output: number;
    };
}
export interface DashboardProvider {
    id: string;
    name: string;
    status: "online" | "offline";
    requestsToday: number;
    costToday: number;
    avgLatency: number;
    lastError: string | null;
    lastErrorTime: number | null;
}
export interface DashboardStats {
    totalRequestsToday: number;
    totalCostToday: number;
    avgLatency: number;
    activeProviders: number;
    totalProviders: number;
    providers: DashboardProvider[];
    recentRequests: DashboardRequest[];
    costByProvider: Record<string, number>;
    uptime: number;
}
/**
 * Record a request for the dashboard.
 */
export declare function recordRequest(req: Omit<DashboardRequest, "timestamp">): void;
/**
 * Register a provider as available (called on startup / health check).
 */
export declare function registerProvider(id: string, name: string): void;
/**
 * Handle dashboard API requests. Returns true if the request was handled.
 */
export declare function handleDashboardRequest(req: http.IncomingMessage, res: http.ServerResponse): boolean;
export declare function getDashboardHTML(): string;
