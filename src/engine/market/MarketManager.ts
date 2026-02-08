// ============================================================================
// MarketManager - Manages a player's 6-slot market stand
// Pure functions, immutable state updates
// ============================================================================

import type { GameState, PlayerState, WareType } from '../types.ts';
import { CONSTANTS } from '../types.ts';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Creates a new GameState with an updated market for the given player.
 */
function withUpdatedMarket(
  state: GameState,
  player: 0 | 1,
  newMarket: (WareType | null)[]
): GameState {
  const newPlayers: [PlayerState, PlayerState] = [
    player === 0 ? { ...state.players[0], market: newMarket } : state.players[0],
    player === 1 ? { ...state.players[1], market: newMarket } : state.players[1],
  ];
  return { ...state, players: newPlayers };
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * Returns the indices of all empty (null) slots in the player's market.
 */
export function getEmptySlots(state: GameState, player: 0 | 1): number[] {
  const market = state.players[player].market;
  const empty: number[] = [];
  for (let i = 0; i < market.length; i++) {
    if (market[i] === null) {
      empty.push(i);
    }
  }
  return empty;
}

/**
 * Returns the indices of all occupied (non-null) slots in the player's market.
 */
export function getOccupiedSlots(state: GameState, player: 0 | 1): number[] {
  const market = state.players[player].market;
  const occupied: number[] = [];
  for (let i = 0; i < market.length; i++) {
    if (market[i] !== null) {
      occupied.push(i);
    }
  }
  return occupied;
}

/**
 * Returns a list of all wares currently on the player's market (no nulls).
 */
export function getMarketWares(state: GameState, player: 0 | 1): WareType[] {
  return state.players[player].market.filter((slot): slot is WareType => slot !== null);
}

/**
 * Returns true if every slot in the player's market is occupied.
 */
export function isMarketFull(state: GameState, player: 0 | 1): boolean {
  return state.players[player].market.every((slot) => slot !== null);
}

/**
 * Counts how many slots contain the specified ware type.
 */
export function countWaresOfType(state: GameState, player: 0 | 1, wareType: WareType): number {
  return state.players[player].market.filter((slot) => slot === wareType).length;
}

/**
 * Returns true if all base 6 slots are occupied, triggering the 6th-slot penalty (-2g).
 * The penalty applies only to the base 6 market slots, not stand expansion slots.
 */
export function hasSixthSlotPenalty(state: GameState, player: 0 | 1): boolean {
  const market = state.players[player].market;
  // Check the first 6 (base) slots only
  const baseSlots = market.slice(0, CONSTANTS.MARKET_SLOTS);
  return baseSlots.every((slot) => slot !== null);
}

// ---------------------------------------------------------------------------
// Mutation functions (return new state)
// ---------------------------------------------------------------------------

/**
 * Place a ware in the first empty slot of the player's market.
 * Throws if the market has no empty slots.
 */
export function addWareToMarket(
  state: GameState,
  player: 0 | 1,
  wareType: WareType
): GameState {
  const emptySlots = getEmptySlots(state, player);
  if (emptySlots.length === 0) {
    throw new Error(`Player ${player}'s market is full: no empty slots available`);
  }

  const newMarket = [...state.players[player].market];
  newMarket[emptySlots[0]] = wareType;

  return withUpdatedMarket(state, player, newMarket);
}

/**
 * Remove and return the ware at the given slot index.
 * Throws if the slot is empty.
 */
export function removeWareFromMarket(
  state: GameState,
  player: 0 | 1,
  slotIndex: number
): { state: GameState; ware: WareType } {
  const market = state.players[player].market;
  const ware = market[slotIndex];

  if (ware === null || ware === undefined) {
    throw new Error(
      `Player ${player}'s market slot ${slotIndex} is empty: cannot remove ware`
    );
  }

  const newMarket = [...market];
  newMarket[slotIndex] = null;

  return {
    state: withUpdatedMarket(state, player, newMarket),
    ware,
  };
}

/**
 * Add multiple wares to the first available empty slots.
 * Throws if there are not enough empty slots for all wares.
 */
export function addWaresToMarket(
  state: GameState,
  player: 0 | 1,
  wares: WareType[]
): GameState {
  const emptySlots = getEmptySlots(state, player);
  if (emptySlots.length < wares.length) {
    throw new Error(
      `Player ${player}'s market has ${emptySlots.length} empty slot(s) but ${wares.length} ware(s) need to be added`
    );
  }

  const newMarket = [...state.players[player].market];
  for (let i = 0; i < wares.length; i++) {
    newMarket[emptySlots[i]] = wares[i];
  }

  return withUpdatedMarket(state, player, newMarket);
}

/**
 * Remove multiple wares at the given slot indices.
 * Throws if any slot is empty.
 */
export function removeWaresFromMarket(
  state: GameState,
  player: 0 | 1,
  slotIndices: number[]
): { state: GameState; wares: WareType[] } {
  const market = state.players[player].market;
  const removedWares: WareType[] = [];

  // Validate all slots first before mutating
  for (const idx of slotIndices) {
    const ware = market[idx];
    if (ware === null || ware === undefined) {
      throw new Error(
        `Player ${player}'s market slot ${idx} is empty: cannot remove ware`
      );
    }
    removedWares.push(ware);
  }

  const newMarket = [...market];
  for (const idx of slotIndices) {
    newMarket[idx] = null;
  }

  return {
    state: withUpdatedMarket(state, player, newMarket),
    wares: removedWares,
  };
}

/**
 * Expand a player's market by adding 3 null slots (for Small Market Stand).
 */
export function expandMarket(
  state: GameState,
  player: 0 | 1
): GameState {
  const market = state.players[player].market;
  const expanded: (WareType | null)[] = [...market, null, null, null];
  return withUpdatedMarket(state, player, expanded);
}
