/**
 * Multi-Round Dialog Optimization
 *
 * Tracks conversation context over multiple turns and optimizes routing
 * decisions based on accumulated dialogue history.
 *
 * Key features:
 * - Conversation state management
 * - Topic tracking across turns
 * - Model performance history per topic
 * - Adaptive routing based on dialog state
 */
import { RouteDecision } from '../routing/advancedRouter';
export interface DialogTurn {
    turn: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
    timestamp: number;
    routingDecision?: RouteDecision;
}
export interface DialogState {
    conversationId: string;
    turns: DialogTurn[];
    topics: Set<string>;
    topicHistory: Map<string, number>;
    modelPerformance: Map<string, Map<string, number>>;
    currentTopic: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    complexity: number;
    startedAt: number;
    lastTurnAt: number;
}
export interface MultiRoundConfig {
    /** Max turns to keep in conversation context */
    maxContextTurns: number;
    /** Topic similarity threshold */
    topicThreshold: number;
    /** Performance window size */
    performanceWindow: number;
    /** Enable adaptive complexity tracking */
    trackComplexity: boolean;
}
export declare class MultiRoundDialogOptimizer {
    private config;
    private dialogStates;
    constructor(config?: Partial<MultiRoundConfig>);
    /**
     * Create or get existing dialog state
     */
    getDialogState(conversationId: string): DialogState;
    /**
     * Create a fresh dialog state
     */
    private createNewState;
    /**
     * Add a turn to the conversation
     */
    addTurn(conversationId: string, role: 'user' | 'assistant' | 'system', content: string, model?: string, routingDecision?: RouteDecision): DialogState;
    /**
     * Extract topics from content using keyword analysis
     */
    private extractTopics;
    /**
     * Get most frequently mentioned topic
     */
    private getMostFrequentTopic;
    /**
     * Calculate complexity based on content and history
     */
    private calculateComplexity;
    /**
     * Update model performance tracking for a topic
     */
    private updateModelPerformance;
    /**
     * Score response quality (simple heuristic)
     */
    private scoreResponseQuality;
    /**
     * Get best model for current topic based on history
     */
    getBestModelForTopic(conversationId: string, availableModels: string[]): string | null;
    /**
     * Build optimized context for next query
     */
    buildOptimizedContext(conversationId: string, newQuery: string): string;
    /**
     * Get routing hints based on dialog state
     */
    getRoutingHints(conversationId: string): Record<string, number>;
    /**
     * Calculate topic affinity for routing
     */
    private topicAffinityScore;
    /**
     * Clear dialog state
     */
    clearState(conversationId: string): void;
    /**
     * Get dialog summary
     */
    getSummary(conversationId: string): {
        turns: number;
        topics: string[];
        currentTopic: string;
        complexity: number;
        duration: number;
        modelsUsed: string[];
    };
}
export declare const dialogOptimizer: MultiRoundDialogOptimizer;
export default dialogOptimizer;
//# sourceMappingURL=multiRoundDialog.d.ts.map