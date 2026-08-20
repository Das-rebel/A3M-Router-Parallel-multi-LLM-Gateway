/**
 * A3M Router — Science Adapter
 *
 * Wraps Google DeepMind science skills as A3M tools for research queries.
 *
 * Available skills (39+):
 *   Genomics: alphagenome_single_variant_analysis, ensembl, gnomad, dbsnp
 *   Proteins: alphafold, uniprot, pdb, string
 *   Chemistry: chembl, pubchem, openfda
 *   Literature: arxiv, biorxiv, openalex, pubmed
 *   Clinical: clinical_trials, clinvar
 *   Expression: gtex, human_protein_atlas
 */
export interface ScienceQuery {
    domain: 'genomics' | 'proteins' | 'chemistry' | 'literature' | 'clinical' | 'expression';
    query: string;
    species?: string;
    protein?: string;
    gene?: string;
    disease?: string;
}
export interface ScienceResult {
    success: boolean;
    tool: string;
    answer: string;
    citations?: string[];
    metadata?: Record<string, any>;
}
export declare const RESEARCH_TEMPLATES: Record<string, string>;
/**
 * Route a science query to the appropriate skill
 */
export declare function routeScienceQuery(query: ScienceQuery): string;
/**
 * Execute a science query using A3M routing
 */
export declare function executeScienceQuery(query: ScienceQuery): Promise<ScienceResult>;
/**
 * Check if a query is a science/research query
 */
export declare function isScienceQuery(prompt: string): boolean;
/**
 * Detect science domain from query
 */
export declare function detectScienceDomain(prompt: string): ScienceQuery['domain'] | null;
export declare const scienceTools: {
    alphafold: string;
    uniprot: string;
    pdb: string;
    ensembl: string;
    pubmed: string;
    arxiv: string;
    chembl: string;
    pubchem: string;
    clinicalTrials: string;
    gtex: string;
};
declare const _default: {
    executeScienceQuery: typeof executeScienceQuery;
    routeScienceQuery: typeof routeScienceQuery;
    isScienceQuery: typeof isScienceQuery;
    detectScienceDomain: typeof detectScienceDomain;
    scienceTools: {
        alphafold: string;
        uniprot: string;
        pdb: string;
        ensembl: string;
        pubmed: string;
        arxiv: string;
        chembl: string;
        pubchem: string;
        clinicalTrials: string;
        gtex: string;
    };
    RESEARCH_TEMPLATES: Record<string, string>;
};
export default _default;
//# sourceMappingURL=scienceAdapter.d.ts.map