/**
 * A3M Router Cost Calculator
 * Pure JS, no dependencies.
 */

// --- Pricing constants (per 1M tokens) ---
const PRICING = {
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'claude-3.5-sonnet': { input: 3.0, output: 15.0 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'gemini-1.5-pro': { input: 3.5, output: 10.5 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'groq-llama-3.3-70b': { input: 0.59, output: 0.79 },
  'groq-mixtral-8x7b': { input: 0.24, output: 0.24 },
};

const ROUTING_SAVINGS = {
  // % of requests A3M routes to cheaper model
  'gpt-4o': 0.35,        // 35% routed to 4o-mini
  'claude-3.5-sonnet': 0.40, // 40% routed to Haiku
  'gemini-1.5-pro': 0.45,    // 45% routed to Flash
};

const AVG_TOKENS = {
  input: 500,    // avg input tokens
  output: 800,   // avg output tokens
};

/**
 * @param {{ requestsPerMonth: number, modelMix: Array<{model: string, percent: number}> }} cfg
 * @returns {{ totalCost: number, breakdown: Array<{model, requests, cost}> }}
 */
function calculateBaselineCost({ requestsPerMonth, modelMix }) {
  const breakdown = modelMix.map(({ model, percent }) => {
    const reqCount = Math.round(requestsPerMonth * (percent / 100));
    const pricing = PRICING[model] || { input: 3.0, output: 15.0 };
    const cost = reqCount * (
      (pricing.input * AVG_TOKENS.input / 1_000_000) +
      (pricing.output * AVG_TOKENS.output / 1_000_000)
    );
    return { model, requests: reqCount, cost };
  });

  const totalCost = breakdown.reduce((sum, b) => sum + b.cost, 0);
  return { totalCost, breakdown };
}

/**
 * @param {{ requestsPerMonth: number, modelMix: Array<{model: string, percent: number}> }} cfg
 * @returns {{ totalCost: number, breakdown: Array<{model, requests, cost, routedTo?, savings?}> }}
 */
function calculateA3mCost({ requestsPerMonth, modelMix }) {
  const breakdown = modelMix.map(({ model, percent }) => {
    const reqCount = Math.round(requestsPerMonth * (percent / 100));
    const routingSavings = ROUTING_SAVINGS[model] || 0;
    const routedRequests = Math.round(reqCount * routingSavings);

    // Baseline: all requests on premium model
    const pricing = PRICING[model] || { input: 3.0, output: 15.0 };
    const baselineCost = reqCount * (
      (pricing.input * AVG_TOKENS.input / 1_000_000) +
      (pricing.output * AVG_TOKENS.output / 1_000_000)
    );

    // A3M: some routed to cheaper model
    // Find a cheaper alternative (heuristic: -mini, -flash, -haiku, or groq)
    const cheaper = findCheaperModel(model);
    const cheaperPricing = cheaper ? PRICING[cheaper] : pricing;

    const a3mCost = (reqCount - routedRequests) * (
      (pricing.input * AVG_TOKENS.input / 1_000_000) +
      (pricing.output * AVG_TOKENS.output / 1_000_000)
    ) + routedRequests * (
      (cheaperPricing.input * AVG_TOKENS.input / 1_000_000) +
      (cheaperPricing.output * AVG_TOKENS.output / 1_000_000)
    );

    return {
      model,
      requests: reqCount,
      cost: a3mCost,
      routedTo: routedRequests > 0 ? cheaper : null,
      savings: baselineCost - a3mCost,
    };
  });

  const totalCost = breakdown.reduce((sum, b) => sum + b.cost, 0);
  const totalSavings = breakdown.reduce((sum, b) => sum + (b.savings || 0), 0);
  return { totalCost, breakdown, totalSavings };
}

function findCheaperModel(model) {
  const cheaperMap = {
    'gpt-4o': 'gpt-4o-mini',
    'claude-3.5-sonnet': 'claude-3-haiku',
    'gemini-1.5-pro': 'gemini-1.5-flash',
    'groq-llama-3.3-70b': 'groq-mixtral-8x7b',
  };
  return cheaperMap[model] || null;
}

/**
 * @param {number} baseline
 * @param {number} a3m
 * @returns {{ savingsPercent: number, savingsAmount: number }}
 */
function computeSavings(baseline, a3m) {
  return {
    savingsPercent: baseline > 0 ? ((baseline - a3m) / baseline) * 100 : 0,
    savingsAmount: baseline - a3m,
  };
}

/**
 * Encodes calculator config into a URL-safe string
 * @param {{ requestsPerMonth: number, modelMix: Array }} cfg
 * @returns {string} base64url encoded config
 */
function encodeConfig({ requestsPerMonth, modelMix }) {
  const json = JSON.stringify({ requestsPerMonth, modelMix });
  // btoa but URL-safe
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decodes a URL-safe base64 string back to config
 * @param {string} encoded
 * @returns {{ requestsPerMonth: number, modelMix: Array }}
 */
function decodeConfig(encoded) {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(base64);
  return JSON.parse(json);
}

/**
 * Generates a full shareable URL
 * @param {{ requestsPerMonth: number, modelMix: Array }} cfg
 * @returns {string}
 */
function generateShareableLink(cfg) {
  const encoded = encodeConfig(cfg);
  return `${window.location.origin}${window.location.pathname}?cfg=${encoded}`;
}

// --- Exports for testing ---
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateBaselineCost, calculateA3mCost, computeSavings, encodeConfig, decodeConfig, PRICING };
}
