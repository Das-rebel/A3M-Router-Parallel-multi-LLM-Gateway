/**
 * Quickselect algorithm for O(n) top-K selection
 * Returns top k elements sorted descending by compare function
 *
 * Best case: O(n), Worst case: O(n log n), Average: O(n)
 * vs Timsort O(n log n) for full sort + O(k log n) for top-k slice
 */
export declare function quickselectTopK<T>(arr: T[], k: number, compare: (a: T) => number): T[];
/**
 * Select top candidate using Quickselect
 */
export declare function selectTop<T>(arr: T[], compare: (a: T) => number): T | undefined;
