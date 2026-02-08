// ============================================================================
// Shared Test Helpers — state factories and action shorthand
// ============================================================================

import type {
  GameState,
  GameAction,
  InteractionResponse,
  DeckCardId,
  WareType,
  UtilityDesignId,
  UtilityState,
} from '../../src/engine/types.ts';
import { CONSTANTS } from '../../src/engine/types.ts';
import { createInitialState } from '../../src/engine/GameState.ts';
import { processAction } from '../../src/engine/GameEngine.ts';
import { assertValidState } from '../../src/engine/validation/invariants.ts';

// ---------------------------------------------------------------------------
// State factory helpers
// ---------------------------------------------------------------------------

/** Create a fresh GameState with a fixed seed for deterministic tests. */
export function createTestState(seed = 42): GameState {
  return createInitialState(seed);
}

/** Advance state from DRAW to PLAY phase by drawing then keeping a card. */
export function toPlayPhase(state: GameState): GameState {
  let s = act(state, { type: 'DRAW_CARD' });
  s = act(s, { type: 'KEEP_CARD' });
  return s;
}

/**
 * Replace a player's hand with the given card IDs.
 * Card-count safe: old hand cards return to the deck, new cards are removed from deck.
 */
export function withHand(
  state: GameState,
  player: 0 | 1,
  ids: DeckCardId[]
): GameState {
  const oldHand = state.players[player].hand;
  // Return old hand cards to the deck
  let newDeck = [...state.deck, ...oldHand];
  // Remove new hand cards from the deck
  for (const id of ids) {
    const idx = newDeck.indexOf(id);
    if (idx !== -1) {
      newDeck.splice(idx, 1);
    }
  }
  const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
  newPlayers[player] = { ...newPlayers[player], hand: [...ids] };
  return { ...state, players: newPlayers, deck: newDeck };
}

/** Set a player's market slots. Pads with nulls to match current market size. */
export function withMarket(
  state: GameState,
  player: 0 | 1,
  wares: (WareType | null)[]
): GameState {
  const currentLen = state.players[player].market.length;
  const padded = [...wares];
  while (padded.length < currentLen) padded.push(null);
  const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
  newPlayers[player] = { ...newPlayers[player], market: padded.slice(0, currentLen) };
  return { ...state, players: newPlayers };
}

/** Set a player's gold amount. */
export function withGold(state: GameState, player: 0 | 1, amount: number): GameState {
  const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
  newPlayers[player] = { ...newPlayers[player], gold: amount };
  return { ...state, players: newPlayers };
}

/**
 * Add a utility card to a player's utility area.
 * Card-count safe: removes the card from the deck.
 */
export function withUtility(
  state: GameState,
  player: 0 | 1,
  cardId: DeckCardId,
  designId: UtilityDesignId
): GameState {
  const newUtil: UtilityState = { cardId, designId, usedThisTurn: false };
  const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
  newPlayers[player] = {
    ...newPlayers[player],
    utilities: [...newPlayers[player].utilities, newUtil],
  };
  // Remove from deck to conserve card count
  const newDeck = [...state.deck];
  const idx = newDeck.indexOf(cardId);
  if (idx !== -1) {
    newDeck.splice(idx, 1);
  }
  return { ...state, players: newPlayers, deck: newDeck };
}

/**
 * Remove a specific card ID from the deck and put it in discard.
 * Card-count safe.
 */
export function removeFromDeck(state: GameState, cardId: DeckCardId): GameState {
  const newDeck = [...state.deck];
  const idx = newDeck.indexOf(cardId);
  if (idx !== -1) {
    newDeck.splice(idx, 1);
    return { ...state, deck: newDeck, discardPile: [cardId, ...state.discardPile] };
  }
  return { ...state, deck: newDeck };
}

/**
 * Add card IDs to the discard pile, removing from deck.
 * Card-count safe.
 */
export function withDiscard(state: GameState, cardIds: DeckCardId[]): GameState {
  let newDeck = [...state.deck];
  for (const id of cardIds) {
    const idx = newDeck.indexOf(id);
    if (idx !== -1) {
      newDeck.splice(idx, 1);
    }
  }
  return { ...state, deck: newDeck, discardPile: [...cardIds, ...state.discardPile] };
}

/** Set the ware supply for a specific type. */
export function withSupply(state: GameState, wareType: WareType, amount: number): GameState {
  return { ...state, wareSupply: { ...state.wareSupply, [wareType]: amount } };
}

// ---------------------------------------------------------------------------
// Action helpers
// ---------------------------------------------------------------------------

/**
 * Process an action and assert valid state afterward.
 * This is the primary test helper — every action flows through here.
 */
export function act(state: GameState, action: GameAction): GameState {
  const next = processAction(state, action);
  assertValidState(next);
  return next;
}

/** Shorthand for RESOLVE_INTERACTION action. */
export function resolve(state: GameState, response: InteractionResponse): GameState {
  return act(state, { type: 'RESOLVE_INTERACTION', response });
}

// ---------------------------------------------------------------------------
// Convenience: get player state shorthands
// ---------------------------------------------------------------------------

export function hand(state: GameState, player: 0 | 1): DeckCardId[] {
  return state.players[player].hand;
}

export function gold(state: GameState, player: 0 | 1): number {
  return state.players[player].gold;
}

export function market(state: GameState, player: 0 | 1): (WareType | null)[] {
  return state.players[player].market;
}

export function utilities(state: GameState, player: 0 | 1): UtilityState[] {
  return state.players[player].utilities;
}
