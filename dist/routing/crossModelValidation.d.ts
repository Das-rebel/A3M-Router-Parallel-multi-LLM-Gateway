export interface ValidationResult {
    approved: boolean;
    selectedProvider: string;
    validatedProvider: string;
    reason: string;
    costOverhead: number;
}
export declare function validateRouting(query: string, selectedProvider: string, selectedModel: string, options?: {
    validatorProvider?: string;
}): Promise<ValidationResult>;
