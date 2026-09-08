/**
 * Schema-Contracted Prompts - Token Optimization Pattern #4
 * 
 * Use structured schemas to reduce prompt size.
 * Instead of verbose descriptions, reference schema directly.
 * 
 * Based on: arXiv:2608.17188 - Token Optimization and Context Window Management
 */

export interface SchemaContractConfig {
  includeExamples: boolean;
  maxSchemaSize: number;
}

export interface SchemaInfo {
  name: string;
  description?: string;
  schema: Record<string, unknown>;
  examples?: Array<Record<string, unknown>>;
}

/**
 * Generate schema instruction for prompt
 */
function generateSchemaInstruction(schema: SchemaInfo): string {
  const parts: string[] = [];
  
  parts.push(`Response Schema: ${schema.name}`);
  
  if (schema.description) {
    parts.push(`Description: ${schema.description}`);
  }
  
  parts.push(`Schema: ${JSON.stringify(schema.schema)}`);
  
  if (schema.examples && schema.examples.length > 0) {
    parts.push(`Examples: ${JSON.stringify(schema.examples.slice(0, 2))}`);
  }
  
  return parts.join("\n");
}

export class SchemaContractor {
  private config: SchemaContractConfig;

  constructor(config: Partial<SchemaContractConfig> = {}) {
    this.config = {
      includeExamples: config.includeExamples ?? true,
      maxSchemaSize: config.maxSchemaSize ?? 500,
    };
  }

  /**
   * Contract a prompt by injecting schema reference
   */
  contract(prompt: string, schema: SchemaInfo): string {
    const schemaInstruction = generateSchemaInstruction(schema);
    
    return `${prompt}

IMPORTANT: Your response MUST conform to this schema:
${schemaInstruction}

Respond ONLY with valid JSON matching the above schema.`;
  }

  /**
   * Contract with inline schema (smaller)
   */
  contractInline(prompt: string, schema: SchemaInfo): string {
    const schemaJson = JSON.stringify(schema.schema).substring(0, this.config.maxSchemaSize);
    
    return `${prompt}

Response Schema: ${schema.name}
${schemaJson}`;
  }

  /**
   * Extract schema from Pydantic-style model definition
   */
  static extractSchemaFromModel(modelDef: string): SchemaInfo {
    // Simple parser for TypeScript/JavaScript interface or Python Pydantic
    const nameMatch = modelDef.match(/class\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : "Response";
    
    // Extract field types (simplified)
    const fields: Record<string, string> = {};
    const fieldMatches = modelDef.matchAll(/(\w+)(\??):\s*(\w+)/g);
    for (const match of fieldMatches) {
      fields[match[1]] = match[3];
    }

    return {
      name,
      schema: fields as Record<string, unknown>,
    };
  }
}

export default SchemaContractor;
