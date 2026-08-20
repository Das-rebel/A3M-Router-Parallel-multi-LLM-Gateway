"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiRoundDialogOptimizer = exports.dialogOptimizer = exports.calculateEnhancedShapley = exports.HandicapCalculator = exports.LoyaltyMatrix = exports.EnsembleOrchestrator = exports.createA3MRouter = exports.A3MRouter = void 0;
const index_1 = require("./index");
Object.defineProperty(exports, "createA3MRouter", { enumerable: true, get: function () { return index_1.createA3MRouter; } });
const shapleyValue_1 = require("./ensemble/shapleyValue");
const multiRoundDialog_1 = require("./ensemble/multiRoundDialog");
// ============================================================
// SEMANTIC VOTING: Cluster similar answers together
// ============================================================
/**
 * Simple word-overlap based semantic similarity
 * Returns 0-1 similarity score
 */
function wordOverlapSimilarity(a, b) {
    // Normalize: lowercase, remove code blocks, extract words
    const normalize = (s) => {
        return s.toLowerCase()
            .replace(/```[\s\S]*?```/g, ' CODE ') // Replace code blocks
            .replace(/`[^`]*`/g, ' CODE ') // Replace inline code
            .replace(/[^a-z0-9\s]/g, ' ') // Remove punctuation
            .split(/\s+/)
            .filter(w => w.length > 2); // Remove stopwords
    };
    const wordsA = normalize(a);
    const wordsB = normalize(b);
    if (wordsA.length === 0 || wordsB.length === 0)
        return 0;
    // Jaccard similarity
    const setA = new Set(wordsA);
    const setB = new Set(wordsB);
    let intersection = 0;
    for (const w of setA) {
        if (setB.has(w))
            intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
}
/**
 * Cluster answers by semantic similarity using agglomerative clustering
 * Returns clusters of (representative, [provider indices])
 */
function semanticCluster(answers, threshold = 0.6) {
    if (answers.length === 0)
        return [];
    if (answers.length === 1)
        return [{ cluster: answers[0].answer, providers: [answers[0].provider] }];
    // Build similarity matrix
    const n = answers.length;
    const sims = Array(n).fill(null).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) {
                sims[i][j] = 1.0;
            }
            else if (j > i) {
                const s = wordOverlapSimilarity(answers[i].answer, answers[j].answer);
                sims[i][j] = s;
                sims[j][i] = s;
            }
        }
    }
    // Agglomerative clustering: greedily merge most similar pairs
    const clusters = answers.map((_, i) => new Set([i]));
    const active = new Set(answers.map((_, i) => i));
    while (active.size > 1) {
        let bestSim = 0;
        let bestI = -1, bestJ = -1;
        for (const i of active) {
            for (const j of active) {
                if (i >= j)
                    continue;
                // Average similarity between all pairs in two clusters
                let sumSim = 0, count = 0;
                for (const ci of clusters[i]) {
                    for (const cj of clusters[j]) {
                        sumSim += sims[ci][cj];
                        count++;
                    }
                }
                const avgSim = count > 0 ? sumSim / count : 0;
                if (avgSim > bestSim) {
                    bestSim = avgSim;
                    bestI = i;
                    bestJ = j;
                }
            }
        }
        if (bestSim < threshold || bestI < 0)
            break;
        // Merge clusters
        for (const idx of clusters[bestJ]) {
            clusters[bestI].add(idx);
        }
        active.delete(bestJ);
    }
    // Build result
    return clusters
        .filter((_, i) => active.has(i))
        .map(cluster => {
        const indices = Array.from(cluster);
        // Use the longest answer as cluster representative (most informative)
        let longestIdx = indices[0];
        let longestLen = answers[indices[0]].answer.length;
        for (const idx of indices) {
            if (answers[idx].answer.length > longestLen) {
                longestLen = answers[idx].answer.length;
                longestIdx = idx;
            }
        }
        return {
            cluster: answers[longestIdx].answer,
            providers: indices.map(i => answers[i].provider)
        };
    })
        .sort((a, b) => b.providers.length - a.providers.length); // Largest cluster first
}
// Re-export A3MRouter as the factory for backward compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.A3MRouter = index_1.createA3MRouter;
class EnsembleOrchestrator {
    router;
    loyaltyMatrix = new shapleyValue_1.LoyaltyMatrix();
    handicapCalc = new shapleyValue_1.HandicapCalculator();
    constructor(router) {
        this.router = router;
    }
    /**
     * Execute ensemble with enhanced Shapley value credit assignment
     * Incorporates ethnocentrism (loyalty) and handicap (costly signaling)
     */
    async executeEnsemble(query, providers, strategy = 'majority', weights = {}, dialogId) {
        // 1. Parallel Execution
        const results = await Promise.all(providers.map(async (p) => {
            try {
                const res = await this.router.chat(query, { model: p });
                return { provider: p, answer: res.choices[0].message.content, success: true };
            }
            catch (e) {
                return { provider: p, answer: '', success: false };
            }
        }));
        const successful = results.filter(r => r.success);
        if (successful.length === 0) {
            throw new Error('All ensemble providers failed.');
        }
        // 2. Voting Logic
        let winnerAnswer = '';
        let winnerProvider = '';
        let confidence = 0;
        let shapleySummary;
        // Multi-round: add user turn
        if (dialogId)
            multiRoundDialog_1.dialogOptimizer.addTurn(dialogId, 'user', query);
        if (strategy === 'majority') {
            const counts = {};
            successful.forEach(r => { counts[r.answer] = (counts[r.answer] || 0) + 1; });
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            winnerAnswer = sorted[0][0];
            confidence = sorted[0][1] / successful.length;
            winnerProvider = successful.find(r => r.answer === winnerAnswer)?.provider || 'unknown';
        }
        else if (strategy === 'weighted') {
            const weightedCounts = {};
            successful.forEach(r => {
                const w = weights[r.provider] || 1.0;
                weightedCounts[r.answer] = (weightedCounts[r.answer] || 0) + w;
            });
            const sorted = Object.entries(weightedCounts).sort((a, b) => b[1] - a[1]);
            winnerAnswer = sorted[0][0];
            confidence = sorted[0][1] / successful.length;
            winnerProvider = successful.find(r => r.answer === winnerAnswer)?.provider || 'unknown';
        }
        else if (strategy === 'conservative') {
            const counts = {};
            successful.forEach(r => { counts[r.answer] = (counts[r.answer] || 0) + 1; });
            const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
            if (best && best[1] >= 2) {
                winnerAnswer = best[0];
                confidence = best[1] / successful.length;
                winnerProvider = successful.find(r => r.answer === winnerAnswer)?.provider || 'unknown';
            }
            else {
                winnerAnswer = 'UNCERTAIN';
                confidence = 0;
                winnerProvider = 'none';
            }
        }
        else if (strategy === 'shapley') {
            // === ENHANCED SHAPLEY WITH ETHNOCENTRISM + HANDICAP ===
            const providerIds = successful.map(r => r.provider);
            // Accuracy function based on majority vote as ground truth proxy
            const accFn = (0, shapleyValue_1.createAccuracyFn)(winnerAnswer || successful[0].answer, // Will be updated after first pass
            // Will be updated after first pass
            m => successful.find(r => r.provider === m)?.answer || '');
            // Calculate enhanced Shapley with loyalty and handicap
            const contributions = (0, shapleyValue_1.calculateEnhancedShapley)(providerIds, accFn, this.loyaltyMatrix, this.handicapCalc);
            // Get majority vote using Shapley-weighted voting
            const shapleyWeights = (0, shapleyValue_1.applyCredit)(contributions, weights, 0.5);
            const weightedCounts = {};
            successful.forEach(r => {
                weightedCounts[r.answer] = (weightedCounts[r.answer] || 0) + shapleyWeights[r.provider];
            });
            const sorted = Object.entries(weightedCounts).sort((a, b) => b[1] - a[1]);
            winnerAnswer = sorted[0][0];
            confidence = sorted[0][1];
            winnerProvider = successful.find(r => r.answer === winnerAnswer)?.provider || 'unknown';
            // Update Shapley summary
            shapleySummary = (0, shapleyValue_1.summarize)(contributions);
            // Record performance for handicap tracking
            const isCorrect = (ans) => ans === winnerAnswer;
            successful.forEach(r => {
                const cost = weights[r.provider] || 0.001;
                this.handicapCalc.record(r.provider, cost, isCorrect(r.answer));
            });
        }
        else if (strategy === 'semantic') {
            // === SEMANTIC VOTING: Cluster similar answers together ===
            // This handles cases where models give equivalent answers in different words
            // e.g., "The answer is 42" vs "42 is correct" would be clustered together
            const clusters = semanticCluster(successful, 0.55); // 55% similarity threshold
            if (clusters.length === 0) {
                winnerAnswer = 'UNCERTAIN';
                confidence = 0;
                winnerProvider = 'none';
            }
            else {
                // Use weighted voting: cluster size * average provider weight
                const clusterScores = clusters.map(cluster => {
                    const totalWeight = cluster.providers.reduce((sum, p) => sum + (weights[p] || 1.0), 0);
                    return {
                        cluster: cluster.cluster,
                        providers: cluster.providers,
                        score: cluster.providers.length * totalWeight / cluster.providers.length
                    };
                }).sort((a, b) => b.score - a.score);
                winnerAnswer = clusterScores[0].cluster;
                winnerProvider = clusterScores[0].providers[0];
                confidence = clusterScores[0].providers.length / successful.length;
                // Log cluster info for debugging
                console.log(`[SEMANTIC] ${clusters.length} clusters formed, winner has ${clusterScores[0].providers.length}/${successful.length} providers`);
                clusters.slice(1, 3).forEach((c, i) => {
                    console.log(`[SEMANTIC] Cluster ${i + 2}: ${c.providers.length} providers, preview: ${c.cluster.substring(0, 50)}...`);
                });
            }
        }
        // Record loyalty: successful collaborations build trust
        if (strategy === 'shapley') {
            for (const r of successful) {
                if (r.answer === winnerAnswer) {
                    for (const other of successful) {
                        if (other.provider !== r.provider && other.answer === winnerAnswer) {
                            this.loyaltyMatrix.recordSuccess(r.provider, other.provider, 1.0);
                        }
                    }
                }
            }
        }
        // Multi-round: add assistant turn
        if (dialogId && winnerAnswer !== 'UNCERTAIN') {
            multiRoundDialog_1.dialogOptimizer.addTurn(dialogId, 'assistant', winnerAnswer, winnerProvider);
        }
        // 3. Final Assembly
        const allResults = {};
        successful.forEach(r => {
            allResults[r.provider] = { answer: r.answer, score: r.answer === winnerAnswer ? 1.0 : 0.0 };
        });
        let dialogState;
        if (dialogId)
            dialogState = multiRoundDialog_1.dialogOptimizer.getSummary(dialogId);
        return {
            finalAnswer: winnerAnswer,
            confidence,
            isUncertain: confidence < 0.6 || winnerAnswer === 'UNCERTAIN',
            winner: winnerProvider,
            allResults,
            reasoning: `Ensemble of ${successful.length} models. ${Math.round(confidence * 100)}% agreement.`,
            shapleySummary,
            dialogState,
        };
    }
    /** Get best model for current dialog topic */
    getBestModelForTopic(dialogId, availableModels) {
        return multiRoundDialog_1.dialogOptimizer.getBestModelForTopic(dialogId, availableModels);
    }
    /** Build optimized context for multi-turn conversation */
    buildOptimizedContext(dialogId, newQuery) {
        return multiRoundDialog_1.dialogOptimizer.buildOptimizedContext(dialogId, newQuery);
    }
    /** Clear dialog state */
    clearDialog(dialogId) {
        multiRoundDialog_1.dialogOptimizer.clearState(dialogId);
    }
}
exports.EnsembleOrchestrator = EnsembleOrchestrator;
// Re-export enhanced utilities
var shapleyValue_2 = require("./ensemble/shapleyValue");
Object.defineProperty(exports, "LoyaltyMatrix", { enumerable: true, get: function () { return shapleyValue_2.LoyaltyMatrix; } });
Object.defineProperty(exports, "HandicapCalculator", { enumerable: true, get: function () { return shapleyValue_2.HandicapCalculator; } });
Object.defineProperty(exports, "calculateEnhancedShapley", { enumerable: true, get: function () { return shapleyValue_2.calculateEnhancedShapley; } });
var multiRoundDialog_2 = require("./ensemble/multiRoundDialog");
Object.defineProperty(exports, "dialogOptimizer", { enumerable: true, get: function () { return multiRoundDialog_2.dialogOptimizer; } });
Object.defineProperty(exports, "MultiRoundDialogOptimizer", { enumerable: true, get: function () { return multiRoundDialog_2.MultiRoundDialogOptimizer; } });
//# sourceMappingURL=ensemble.js.map