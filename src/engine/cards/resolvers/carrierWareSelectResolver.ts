// ============================================================================
// Carrier Ware Select Resolver - Follow-up step for Carrier binary choice
// Target player picks a ware type, receives 2 from supply into market.
// ============================================================================

import type {
  GameState,
  PendingCarrierWareSelect,
  InteractionResponse,
  PlayerState,
} from '../../types.ts';
import { takeFromSupply } from '../../market/WareSupply.ts';
import { addWaresToMarket, getEmptySlots } from '../../market/MarketManager.ts';

function withPlayer(
  state: GameState,
  player: 0 | 1,
  updates: Partial<PlayerState>
): GameState {
  const newPlayers: [PlayerState, PlayerState] = [
    player === 0 ? { ...state.players[0], ...updates } : state.players[0],
    player === 1 ? { ...state.players[1], ...updates } : state.players[1],
  ];
  return { ...state, players: newPlayers };
}

export function resolveCarrierWareSelect(
  state: GameState,
  pending: PendingCarrierWareSelect,
  response: InteractionResponse
): GameState {
  if (response.type !== 'SELECT_WARE_TYPE') {
    throw new Error('Expected SELECT_WARE_TYPE response for Carrier ware selection');
  }

  const { wareType } = response;
  const target = pending.targetPlayer;

  // Validate supply has at least 2
  const available = state.wareSupply[wareType];
  const count = Math.min(2, available);
  if (count === 0) {
    throw new Error(`No ${wareType} in supply`);
  }

  // Validate market space
  const emptySlots = getEmptySlots(state, target).length;
  const toAdd = Math.min(count, emptySlots);
  if (toAdd === 0) {
    throw new Error('No empty market slots');
  }

  let next = takeFromSupply(state, wareType, toAdd);
  const wares = Array(toAdd).fill(wareType) as typeof wareType[];
  next = addWaresToMarket(next, target, wares);

  next = {
    ...next,
    pendingResolution: null,
    log: [...next.log, {
      turn: state.turn,
      player: state.currentPlayer,
      action: 'CARRIER_WARES',
      details: `Player ${target} received ${toAdd}x ${wareType} from supply`,
    }],
  };

  return next;
}
