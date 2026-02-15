// ============================================================================
// Ware Select Multiple Resolver - Basket Maker (pay 2g, choose type, get 2)
// ============================================================================

import type { GameState, PendingWareSelectMultiple, InteractionResponse } from '../../types.ts';
import { hasSupply, takeFromSupply } from '../../market/WareSupply.ts';
import { addWareToMarket, getEmptySlots } from '../../market/MarketManager.ts';

export function resolveWareSelectMultiple(
  state: GameState,
  pending: PendingWareSelectMultiple,
  response: InteractionResponse
): GameState {
  const activePlayer = state.currentPlayer;
  const { count } = pending;

  // Guard: can't afford or no market space — auto-resolve with no effect
  const emptySlots = getEmptySlots(state, activePlayer);
  if (state.players[activePlayer].gold < 2 || emptySlots.length < count) {
    return {
      ...state,
      pendingResolution: null,
      log: [...state.log, {
        turn: state.turn,
        player: activePlayer,
        action: 'BASKET_MAKER',
        details: 'Cannot afford or no market space — no effect',
      }],
    };
  }

  // Guard: no ware type has sufficient supply — auto-resolve with no effect
  const hasAnyValidSupply =
    hasSupply(state, 'trinkets', count) ||
    hasSupply(state, 'hides', count) ||
    hasSupply(state, 'tea', count) ||
    hasSupply(state, 'silk', count) ||
    hasSupply(state, 'fruit', count) ||
    hasSupply(state, 'salt', count);
  if (!hasAnyValidSupply) {
    return {
      ...state,
      pendingResolution: null,
      log: [...state.log, {
        turn: state.turn,
        player: activePlayer,
        action: 'BASKET_MAKER',
        details: 'No ware type has enough supply — no effect',
      }],
    };
  }

  if (response.type !== 'SELECT_WARE_TYPE') {
    throw new Error('Expected SELECT_WARE_TYPE response for Basket Maker');
  }

  const { wareType } = response;

  // Validate: supply has enough
  if (!hasSupply(state, wareType, count)) {
    throw new Error(`Supply doesn't have ${count} ${wareType}`);
  }

  // Execute: pay gold, take from supply, add to market
  let newState = takeFromSupply(state, wareType, count);

  for (let i = 0; i < count; i++) {
    newState = addWareToMarket(newState, activePlayer, wareType);
  }

  const newPlayers = [...newState.players] as [typeof newState.players[0], typeof newState.players[1]];
  newPlayers[activePlayer] = {
    ...newPlayers[activePlayer],
    gold: newPlayers[activePlayer].gold - 2,
  };

  return {
    ...newState,
    players: newPlayers,
    pendingResolution: null,
    log: [...newState.log, {
      turn: state.turn,
      player: activePlayer,
      action: 'BASKET_MAKER',
      details: `Paid 2g, received ${count} ${wareType}`,
    }],
  };
}
