// Smoke test: package compiles, core exports + tokenOptimization module load
const assert = require("assert");

const mod = require("../dist/index.js");

// Core exports exist
for (const name of ["createTMLPD", "TMLPDTools", "ResponseCache", "CostTracker", "ProviderRegistry"]) {
  assert(name in mod, `missing core export: ${name}`);
}

// tokenOptimization sub-module loads (added v1.3.2)
const to = require("../dist/tokenOptimization/index.js");
for (const name of ["SemanticCache", "ContextStratifier", "TokenAwareFallback", "SchemaContractor", "FetchOnceProcessor"]) {
  assert(name in to, `missing tokenOptimization export: ${name}`);
}

// SemanticCache basic behavior
const cache = new to.SemanticCache({ maxEntries: 10 });
assert(typeof cache.get === "function" && typeof cache.set === "function", "SemanticCache API broken");

console.log("✓ smoke test passed — dist loads, tokenOptimization exports verified");
