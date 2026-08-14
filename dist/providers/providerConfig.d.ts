/**
 * A3M Router - Generic Provider Configuration System
 *
 * Users can configure their available LLM providers via:
 * 1. Environment variables (*_API_KEY patterns)
 * 2. Config file at ~/.config/a3m-router/providers.json
 * 3. Runtime registration via registerProvider()
 *
 * 70+ providers across free, cheap, mid-tier, premium, and enterprise tiers.
 * Coverage: Cloudflare Workers AI, HuggingFace Inference, Modal, Lepton, NVIDIA NIM,
 * Baseten, RunPod, Predibase, Featherless, Abacus, Hyperbolic, Stability AI,
 * SiliconFlow, Yandex, Tencent, VolcEngine, Baidu, Kuaishou, 360 AI, Naver, Kakao,
 * AWS Bedrock/SageMaker, Azure, and more.
 */
export type ProviderTier = 'free' | 'cheap' | 'mid' | 'premium' | 'enterprise';
export type ProviderFormat = 'openai' | 'anthropic' | 'google' | 'cohere' | 'aws-bedrock' | 'google-vertex';
export type ProviderType = 'api' | 'cli' | 'local';
export type ProviderStrategy = 'aggressive' | 'balanced' | 'conservative';
export interface ProviderCost {
    input: number;
    output: number;
}
export interface ProviderDefinition {
    id: string;
    name: string;
    baseUrl: string;
    apiKeyEnv: string;
    models: string[];
    costPerK: ProviderCost;
    tier: ProviderTier;
    format: ProviderFormat;
    type: ProviderType;
    priority: number;
    maxTokens: number;
    cliCommand?: string;
    apiKey?: string | null;
    supports_multimodal?: boolean;
    strategy?: ProviderStrategy;
}
export declare const DEFAULT_PROVIDERS: Record<string, ProviderDefinition>;
export declare function loadConfig(configPath?: string): Record<string, ProviderDefinition>;
export declare function getAvailableProviders(): Record<string, ProviderDefinition>;
export declare function registerProvider(id: string, config: Partial<ProviderDefinition>): ProviderDefinition;
export declare function deregisterProvider(id: string): void;
export declare function updateProvider(id: string, updates: Partial<ProviderDefinition>): ProviderDefinition | null;
export declare function healthCheck(providerId: string): Promise<{
    healthy: boolean;
    error?: string;
    latency?: number;
    model?: string;
    type?: string;
}>;
export declare function checkAllProviders(): Promise<Record<string, any>>;
export declare function findCheapestAvailableProvider(model?: string): ProviderDefinition | null;
export declare function findFastestAvailableProvider(): ProviderDefinition | null;
export declare function saveConfig(configPath?: string): string;
