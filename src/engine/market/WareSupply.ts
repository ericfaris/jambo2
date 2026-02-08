// ============================================================================
// WareSupply - Manages the global ware supply pool
// Pure functions, immutable state updates
// ============================================================================

import type { GameState, WareType } from '../types.ts';

/**
 * Returns the current supply count for a given ware type.
 */
export function getSupplyCount(state: GameState, wareType: WareType): number {
  return state.wareSupply[wareType];
}

/**
 * Returns true if the supply has at least `count` of the given ware type.
 */
export function hasSupply(state: GameState, wareType: WareType, count: number): boolean {
  return state.wareSupply[wareType] >= count;
}

/**
 * Take wares from the global supply, decreasing the count.
 * Throws if insufficient supply available.
 */
export function takeFromSupply(state: GameState, wareType: WareType, count: number): GameState {
  const current = state.wareSupply[wareType];
  if (current < count) {
    throw new Error(
      `Insufficient supply: cannot take ${count} ${wareType} (only ${current} available)`
    );
  }

  return {
    ...state,
    wareSupply: {
      ...state.wareSupply,
      [wareType]: current - count,
    },
  };
}

/**
 * Return wares to the global supply, increasing the count.
 */
export function returnToSupply(state: GameState, wareType: WareType, count: number): GameState {
  return {
    ...state,
    wareSupply: {
      ...state.wareSupply,
      [wareType]: state.wareSupply[wareType] + count,
    },
  };
}
