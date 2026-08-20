/**
 * A3M Router Setup Wizard
 * Interactive configuration wizard
 */
declare const fs: any;
declare const path: any;
declare const readline: any;
declare const CONFIG_DIR: any;
declare const CONFIG_FILE: any;
declare const API_KEY_ENV_MAP: {
    GROQ_API_KEY: string;
    OPENAI_API_KEY: string;
    ANTHROPIC_API_KEY: string;
    DEEPSEEK_API_KEY: string;
    MISTRAL_API_KEY: string;
    GOOGLE_API_KEY: string;
    CEREBRAS_API_KEY: string;
    TOGETHER_API_KEY: string;
    AI21_API_KEY: string;
    COHERE_API_KEY: string;
    MINIMAX_API_KEY: string;
    KIMI_API_KEY: string;
    MOONSHOT_API_KEY: string;
    QWEN_API_KEY: string;
    ZHIPU_API_KEY: string;
    YI_API_KEY: string;
    BAICHUAN_API_KEY: string;
};
declare const PROVIDER_INFO: {
    groq: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    openai: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    anthropic: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    deepseek: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    mistral: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    google: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    cerebras: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    together: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    ai21: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    cohere: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    minimax: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    kimi: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    moonshot: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    qwen: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    zhipu: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    yi: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
    baichuan: {
        name: string;
        models: string;
        tier: string;
        strength: string;
    };
};
declare function createInterface(): readline.Interface;
declare function question(rl: readline.Interface, text: string): Promise<string>;
declare function detectApiKeys(): Promise<{
    envVar: string;
    providerId: string;
    info: any;
}[]>;
declare function runWizard(): Promise<void>;
//# sourceMappingURL=setupWizard.d.ts.map