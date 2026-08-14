/**
 * A3M Router - Guardrails Engine
 *
 * Comprehensive input/output guardrail system for production LLM routing:
 * - Prompt injection detection (score-based 0-100)
 * - PII detection and redaction
 * - Content filtering with configurable blocklist
 * - Language detection for intelligent routing
 * - Output validation and quality checks
 * - Custom user-defined guardrails
 */
export interface GuardrailResult {
    passed: boolean;
    blocked: boolean;
    reason?: string;
    modified?: string;
    metadata?: Record<string, any>;
}
export interface GuardrailConfig {
    promptInjection: boolean;
    piiDetection: boolean;
    contentFilter: boolean;
    maxLength: number;
    languageDetection: boolean;
    outputFilter: boolean;
    outputPII: boolean;
    hallucinationCheck: boolean;
}
export type GuardrailCheck = (content: string) => GuardrailResult;
interface ContentRule {
    category: string;
    pattern: RegExp;
    severity: 'warn' | 'block';
}
export type DetectedLanguage = 'latin' | 'cjk' | 'cyrillic' | 'arabic' | 'devanagari' | 'mixed' | 'unknown';
export declare class GuardrailEngine {
    private config;
    private customGuardrails;
    private contentRules;
    private blocklist;
    constructor(config?: Partial<GuardrailConfig>);
    /**
     * Check input content before routing to an LLM.
     */
    checkInput(content: string): Promise<GuardrailResult>;
    /**
     * Check output content before returning to caller.
     */
    checkOutput(input: string, output: string): Promise<GuardrailResult>;
    /**
     * Register a custom guardrail check function.
     */
    addGuardrail(name: string, check: GuardrailCheck): void;
    /**
     * Remove a custom guardrail.
     */
    removeGuardrail(name: string): boolean;
    /**
     * Add a term to the blocklist.
     */
    addBlocklistTerm(term: string): void;
    /**
     * Add a content filter rule.
     */
    addContentRule(rule: ContentRule): void;
    /**
     * Get the current configuration.
     */
    getConfig(): Readonly<GuardrailConfig>;
    /**
     * Update configuration.
     */
    updateConfig(partial: Partial<GuardrailConfig>): void;
}
export declare function createGuardrails(config?: Partial<GuardrailConfig>): GuardrailEngine;
export {};
