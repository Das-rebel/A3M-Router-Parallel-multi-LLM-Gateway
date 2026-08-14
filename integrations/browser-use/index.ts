/**
 * A3M Router + browser-use Integration
 * 
 * Provides intelligent LLM routing for browser automation tasks.
 * - Routes to cheapest capable model automatically
 * - Stealth mode for anti-detection
 * - Parallel ensemble for reliable extraction
 */

import { A3MRouter, BrowserConfig } from 'adaptive-memory-multi-model-router';

export interface BrowserUseA3MConfig extends BrowserConfig {
  /**
   * Enable stealth mode to minimize bot detection
   * @default false
   */
  stealth?: boolean;
  
  /**
   * Number of providers to run in parallel for ensemble voting
   * @default 1
   */
  parallelEnsemble?: number;
  
  /**
   * Enable browser-specific optimizations
   * @default true
   */
  browserOptimized?: boolean;
  
  /**
   * Preferred models for browser tasks (in order of preference)
   */
  preferredBrowserModels?: string[];
}

/**
 * Get a browser-use compatible LLM wrapper from A3M Router
 */
export function getBrowserUseLLM(config: BrowserUseA3MConfig) {
  const a3m = new A3MRouter({
    model: config.model || 'auto',
    stealth: config.stealth || false,
    parallelEnsemble: config.parallelEnsemble || 1,
    providers: config.providers,
  });

  // Return a wrapper that's compatible with browser-use's LLM interface
  return {
    a3m,
    
    // Browser-use compatible interface
    async chat(messages: any[]) {
      const lastMessage = messages[messages.length - 1];
      
      const result = await a3m.route({
        task: lastMessage.content,
        context: 'browser_automation',
      });
      
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: result.content,
          },
        }],
      };
    },
    
    // Get routing stats for monitoring
    getStats() {
      return a3m.getStats();
    },
    
    // Get cost for last N requests
    getCost() {
      return a3m.getCost();
    },
  };
}

/**
 * Create an A3M Router optimized for browser automation tasks
 */
export function createBrowserAutomationRouter(config: BrowserUseA3MConfig) {
  const router = new A3MRouter({
    model: config.model || 'auto',
    stealth: config.stealth || true,
    parallelEnsemble: config.parallelEnsemble || 3,
    browserOptimized: config.browserOptimized !== false,
    providers: config.providers || ['openai', 'anthropic', 'google', 'groq'],
  });

  return {
    router,
    
    /**
     * Route a browser task to the optimal provider
     */
    async routeTask(task: string, context?: string) {
      return router.route({
        task,
        context: context || 'browser_automation',
      });
    },
    
    /**
     * Extract structured data from a page
     */
    async extractData(pageSchema: any, html: string) {
      return router.route({
        task: `Extract structured data from this HTML matching the schema: ${JSON.stringify(pageSchema)}`,
        context: 'data_extraction',
      });
    },
    
    /**
     * Fill a form with optimal model selection
     */
    async fillForm(formSchema: any, data: any) {
      return router.route({
        task: `Fill this form with data: ${JSON.stringify(data)}. Form schema: ${JSON.stringify(formSchema)}`,
        context: 'form_filling',
      });
    },
    
    /**
     * Get stealth routing configuration
     */
    getStealthConfig() {
      return {
        stealth: config.stealth || true,
        proxyRotation: true,
        humanizeTiming: true,
        randomizeUserAgent: true,
      };
    },
  };
}

export default {
  getBrowserUseLLM,
  createBrowserAutomationRouter,
};
