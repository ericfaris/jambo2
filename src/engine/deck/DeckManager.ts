// ============================================================================
// Jambo Digital - Deck Manager
// Manages draw deck and discard pile with pure, immutable state functions.
// ============================================================================

import type { GameState, DeckCardId } from '../types.ts';
import { createRng, seededShuffle } from '../../utils/rng.ts';

// --- Helpers ---

/**
 * Advance a seeded RNG to a given position by calling it `steps` times.
 * Returns the RNG function ready to produce the next value.
 */
function advanceRng(seed: number, steps: number): () => number {
  const rng = createRng(seed);
  for (let i = 0; i < steps; i++) {
    rng();
  }
  return rng;
}

// --- Public API ---

/**
 * Check whether the draw deck is empty.
 */
export function isDeckEmpty(state: GameState): boolean {
  return state.deck.length === 0;
}

/**
 * Check whether both the deck and discard pile are empty (deadlock).
 */
export function isDeadlock(state: GameState): boolean {
  return state.deck.length === 0 && state.discardPile.length === 0;
}

/**
 * Return the top N cards from the deck without removing them.
 * Returns fewer than N if the deck has fewer cards.
 */
export function peekDeck(state: GameState, count: number): DeckCardId[] {
  return state.deck.slice(0, count);
}

/**
 * Move all cards from the discard pile into the deck and shuffle
 * using the seeded RNG. Clears the discard pile and increments reshuffleCount.
 */
export function reshuffleDeck(state: GameState): GameState {
  const rng = advanceRng(state.rngSeed, state.rngState);
  const shuffled = seededShuffle(state.discardPile, rng);

  // seededShuffle calls rng once per element (for indices i from length-1 down to 1)
  const rngCallsUsed = Math.max(0, state.discardPile.length - 1);

  return {
    ...state,
    deck: shuffled,
    discardPile: [],
    reshuffleCount: state.reshuffleCount + 1,
    rngState: state.rngState + rngCallsUsed,
  };
}

/**
 * Add a card to the top of the discard pile.
 */
export function discardCard(state: GameState, card: DeckCardId): GameState {
  return {
    ...state,
    discardPile: [card, ...state.discardPile],
  };
}

/**
 * Draw the top card from the deck.
 * If the deck is empty, reshuffles the discard pile first.
 * If both deck and discard are empty, returns null (deadlock).
 */
export function drawFromDeck(
  state: GameState
): { state: GameState; card: DeckCardId | null } {
  // Deadlock: nothing to draw from
  if (isDeadlock(state)) {
    return { state, card: null };
  }

  // Reshuffle if deck is empty but discard has cards
  let current = state;
  if (isDeckEmpty(current)) {
    current = reshuffleDeck(current);
  }

  const [topCard, ...remainingDeck] = current.deck;

  return {
    state: {
      ...current,
      deck: remainingDeck,
    },
    card: topCard,
  };
}
