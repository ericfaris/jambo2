import type { GameState } from '../engine/types.ts';
import { createRng } from '../utils/rng.ts';

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns a copy of `state` where everything `me` cannot actually see — the
 * opponent's hand and the draw deck — has been pooled, reshuffled, and
 * redealt (card counts preserved). `me`'s own hand/market/gold/discard/etc.
 * are untouched, since those are truly known to them.
 *
 * AI move-scoring should run against this instead of the raw state whenever
 * it's evaluating its own candidate actions — otherwise it's reasoning with
 * the opponent's real hand and real future draws, which a human player
 * cannot do. Do NOT use this for a player's own reaction/resolution
 * decisions (Guard, Rain Maker, Psychic, etc.) — those legitimately depend
 * on that player's real hand.
 */
export function determinizeForPlayer(state: GameState, me: 0 | 1, rng: () => number): GameState {
  const opponent: 0 | 1 = me === 0 ? 1 : 0;
  const opponentHand = state.players[opponent].hand;
  if (opponentHand.length === 0 && state.deck.length === 0) return state;

  // Sort before shuffling so the result depends only on *which* cards are
  // unseen (a set), not on the incidental true order/split of hand vs. deck —
  // otherwise Fisher-Yates on an un-canonicalized array can still correlate
  // its output with the true hidden arrangement, quietly reopening the leak.
  const canonicalPool = [...opponentHand, ...state.deck].sort();
  const pool = shuffle(canonicalPool, rng);
  const newOpponentHand = pool.slice(0, opponentHand.length);
  const newDeck = pool.slice(opponentHand.length);

  const newPlayers = [...state.players] as [GameState['players'][0], GameState['players'][1]];
  newPlayers[opponent] = { ...newPlayers[opponent], hand: newOpponentHand };

  return { ...state, players: newPlayers, deck: newDeck };
}

/** Deterministic-but-varied seed for a determinization pass, derived from game state plus a salt to decorrelate multiple call sites. */
export function createDeterminizeRng(state: GameState, salt: number): () => number {
  let seed = state.rngSeed | 0;
  seed ^= Math.imul((state.turn + 29) | 0, 0x27d4eb2f);
  seed ^= Math.imul((state.actionsLeft + 31) | 0, 0x1b873593);
  seed ^= Math.imul((state.currentPlayer + 37) | 0, 0x85ebca6b);
  seed ^= Math.imul(state.log.length | 0, 0x9e3779b1);
  seed ^= Math.imul(salt | 0, 0xc2b2ae35);
  return createRng(seed);
}
