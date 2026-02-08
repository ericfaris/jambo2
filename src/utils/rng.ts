// ============================================================================
// Seeded Pseudo-Random Number Generator (Mulberry32)
// Deterministic RNG for reproducible shuffles, replays, and testing.
// ============================================================================

/**
 * Create a seeded PRNG using Mulberry32 algorithm.
 * Fast, simple, good distribution for game purposes.
 */
export function createRng(seed: number): () => number {
  let state = seed | 0;
  return function mulberry32(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle using a seeded RNG.
 * Returns a new shuffled array (does not mutate input).
 */
export function seededShuffle<T>(array: readonly T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a random seed from current time + entropy.
 */
export function generateSeed(): number {
  return (Date.now() ^ (Math.random() * 0x7fffffff)) | 0;
}
