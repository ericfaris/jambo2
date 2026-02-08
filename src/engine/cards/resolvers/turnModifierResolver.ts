// ============================================================================
// Turn Modifier Resolver - Wise Man (modify buy/sell prices this turn)
// ============================================================================

import type { GameState, PendingTurnModifier } from '../../types.ts';

export function resolveTurnModifier(
  state: GameState,
  pending: PendingTurnModifier
): GameState {
  // Apply turn modifiers immediately (no player interaction needed)
  const newTurnModifiers = {
    buyDiscount: state.turnModifiers.buyDiscount + pending.buyDiscount,
    sellBonus: state.turnModifiers.sellBonus + pending.sellBonus,
  };

  return {
    ...state,
    turnModifiers: newTurnModifiers,
    pendingResolution: null,
    log: [...state.log, {
      turn: state.turn,
      player: state.currentPlayer,
      action: 'WISE_MAN_MODIFIER',
      details: `Applied -${pending.buyDiscount}g buy discount, +${pending.sellBonus}g sell bonus this turn`,
    }],
  };
}
