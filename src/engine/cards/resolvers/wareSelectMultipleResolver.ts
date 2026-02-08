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
  if (response.type !== 'SELECT_WARE_TYPE') {
    throw new Error('Expected SELECT_WARE_TYPE response for Basket Maker');
  }

  const { wareType } = response;
  const activePlayer = state.currentPlayer;
  const { count } = pending;

  // Validate: pay 2g
  if (state.players[activePlayer].gold < 2) {
    throw new Error('Not enough gold (need 2g for Basket Maker)');
  }

  // Validate: supply has enough
  if (!hasSupply(state, wareType, count)) {
    throw new Error(`Supply doesn't have ${count} ${wareType}`);
  }

  // Validate: market has room
  const emptySlots = getEmptySlots(state, activePlayer);
  if (emptySlots.length < count) {
    throw new Error(`Not enough empty market slots (need ${count}, have ${emptySlots.length})`);
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
