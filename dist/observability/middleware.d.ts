import { Request, Response, NextFunction } from 'express';
/**
 * Express middleware for observability
 * - Adds trace ID to all requests
 * - Records request/response metrics
 * - Attaches span context
 */
export declare function observabilityMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Fastify plugin for observability middleware
 */
export declare function observabilityPlugin(instance: any, options: any, next: (err?: Error) => void): void;
/**
 * Middleware for budget warning alerts
 */
export declare function budgetAlertMiddleware(req: Request, res: Response, next: NextFunction): void;
