// ============================================================================
// Jambo Digital - Game State Factory & Utilities
// ============================================================================

import type {
  GameState,
  PlayerState,
  DeckCardId,
  WareType,
  TurnModifiers,
} from './types.ts';
import {
  CONSTANTS,
  INITIAL_WARE_SUPPLY,
  WARE_TYPES,
} from './types.ts';
import { createRng, seededShuffle, generateSeed } from '../utils/rng.ts';

import { ALL_DECK_CARD_IDS } from './cards/CardDatabase.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyPlayerState(): PlayerState {
  return {
    gold: CONSTANTS.STARTING_GOLD,
    hand: [],
    market: [null, null, null, null, null, null],
    utilities: [],
    smallMarketStands: 0,
  };
}

function createEmptyTurnModifiers(): TurnModifiers {
  return {
    buyDiscount: 0,
    sellBonus: 0,
  };
}

function cloneWareSupply(supply: Record<WareType, number>): Record<WareType, number> {
  const clone = {} as Record<WareType, number>;
  for (const ware of WARE_TYPES) {
    clone[ware] = supply[ware];
  }
  return clone;
}

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------

/**
 * Creates a fresh game state ready for the first turn.
 *
 * - Shuffles the full deck using a seeded RNG.
 * - Deals INITIAL_HAND_SIZE cards to each player.
 * - Sets starting gold, empty markets, turn 1, DRAW phase.
 */
export function createInitialState(seed?: number): GameState {
  const rngSeed = seed ?? generateSeed();
  const rng = createRng(rngSeed);

  // Track how many times the RNG has been called so we can reproduce state.
  let rngCallCount = 0;
  const trackedRng = (): number => {
    rngCallCount++;
    return rng();
  };

  // Shuffle deck
  const shuffledDeck = seededShuffle(ALL_DECK_CARD_IDS, trackedRng);

  // Deal hands: 5 cards to each player from the top of the deck
  const player0Hand = shuffledDeck.splice(0, CONSTANTS.INITIAL_HAND_SIZE);
  const player1Hand = shuffledDeck.splice(0, CONSTANTS.INITIAL_HAND_SIZE);

  // Build player states
  const player0: PlayerState = {
    ...createEmptyPlayerState(),
    hand: player0Hand,
  };
  const player1: PlayerState = {
    ...createEmptyPlayerState(),
    hand: player1Hand,
  };

  return {
    version: '1.0.0',
    rngSeed,
    rngState: rngCallCount,
    turn: 1,
    currentPlayer: 0,
    phase: 'DRAW',
    actionsLeft: CONSTANTS.MAX_ACTIONS,
    drawsThisPhase: 0,
    drawnCard: null,
    keptCardThisDrawPhase: false,

    deck: shuffledDeck,
    discardPile: [],
    reshuffleCount: 0,

    wareSupply: cloneWareSupply(INITIAL_WARE_SUPPLY),

    players: [player0, player1],

    pendingResolution: null,
    turnModifiers: createEmptyTurnModifiers(),
    endgame: null,

    pendingGuardReaction: null,
    crocodileCleanup: null,
    pendingWareCardReaction: null,

    log: [],
  };
}

// ---------------------------------------------------------------------------
// cloneState
// ---------------------------------------------------------------------------

/**
 * Deep clone a GameState for immutable update patterns.
 *
 * Uses structuredClone for a correct deep copy of all nested arrays,
 * objects, and null values without sharing any references.
 */
export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}
