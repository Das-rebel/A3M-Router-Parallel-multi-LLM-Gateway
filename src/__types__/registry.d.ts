declare module '@my-org/a3m-router/src/providers/registry' {
  const PROVIDERS: Map<string, any>;
  const registry: Map<string, any>;
  export function registerProvider(name: string, config: any): void;
  export function getProvider(name: string): any;
  export function listProviders(): Array<[string, any]>;
  export interface ProviderRegistry {
    registerProvider: (name: string, config: any) => void;
    getProvider: (name: string) => any;
    listProviders: () => Array<[string, any]>;
  }
  const registryInstance: ProviderRegistry;
  export default registryInstance;
}
