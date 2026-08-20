/**
 * Provider Registry - Central registry for all A3M Router providers
 */
export const PROVIDERS = new Map();

// Register providers by name
export function registerProvider(name, config) {
  PROVIDERS.set(name, config);
}

// Get provider by name
export function getProvider(name) {
  return PROVIDERS.get(name);
}

// List all registered providers
export function listProviders() {
  return [...PROVIDERS.entries()];
}

// Remove provider by name
export function removeProvider(name) {
  return PROVIDERS.delete(name);
}

// Export all providers
export * from './registry.js';
