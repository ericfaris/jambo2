// ============================================================================
// Ware Return Resolver - Leopard (opponent returns wares to supply)
// ============================================================================

import type { GameState, PendingWareReturn, InteractionResponse, WareType } from '../../types.ts';
import { returnToSupply } from '../../market/WareSupply.ts';

export function resolveWareReturn(
  state: GameState,
  pending: PendingWareReturn,
  response: InteractionResponse
): GameState {
  const activePlayer = state.currentPlayer;
  const opponent: 0 | 1 = activePlayer === 0 ? 1 : 0;
  const market = state.players[opponent].market;

  // Guard: opponent has no wares — auto-resolve
  if (!market.some(w => w !== null)) {
    return {
      ...state,
      pendingResolution: null,
      log: [...state.log, { turn: state.turn, player: activePlayer, action: 'LEOPARD_RETURN', details: 'Opponent has no wares to return' }],
    };
  }

  if (response.type !== 'RETURN_WARE') {
    throw new Error('Expected RETURN_WARE response for ware return');
  }

  const { wareIndex } = response;

  // Validate the target slot is occupied
  if (wareIndex < 0 || wareIndex >= market.length || market[wareIndex] === null) {
    throw new Error(`Invalid or empty market slot ${wareIndex}`);
  }

  const ware = market[wareIndex] as WareType;

  // Remove ware from opponent's market and return to supply
  const newMarket = [...market];
  newMarket[wareIndex] = null;
  let newState = returnToSupply(state, ware, 1);

  const newPlayers = [...newState.players] as [typeof newState.players[0], typeof newState.players[1]];
  newPlayers[opponent] = {
    ...newPlayers[opponent],
    market: newMarket,
  };

  // Check if more wares need to be returned
  const returnsRemaining = pending.count - 1;
  if (returnsRemaining > 0) {
    // Check if opponent still has wares to return
    const opponentHasWares = newMarket.some(slot => slot !== null);
    if (opponentHasWares) {
      return {
        ...newState,
        players: newPlayers,
        pendingResolution: {
          ...pending,
          count: returnsRemaining,
        },
      };
    }
    // No more wares to return, resolve early
  }

  return {
    ...newState,
    players: newPlayers,
    pendingResolution: null,
    log: [...newState.log, {
      turn: state.turn,
      player: activePlayer,
      action: 'LEOPARD_RETURN',
      details: `Opponent returned ${ware} from market slot ${wareIndex}`,
    }],
  };
}
