// ============================================================================
// Discard Pick Resolver - Drummer (pick utility from discard pile)
// ============================================================================

import type { GameState, PendingDiscardPick, InteractionResponse } from '../../types.ts';

export function resolveDiscardPick(
  state: GameState,
  pending: PendingDiscardPick,
  response: InteractionResponse
): GameState {
  // Guard: no eligible cards remain — auto-resolve
  if (pending.eligibleCards.length === 0) {
    return {
      ...state,
      pendingResolution: null,
      log: [...state.log, {
        turn: state.turn,
        player: state.currentPlayer,
        action: 'DRUMMER_PICK',
        details: 'No eligible discard cards available',
      }],
    };
  }

  if (response.type !== 'DISCARD_PICK') {
    throw new Error('Expected DISCARD_PICK response');
  }

  const { cardId } = response;
  const activePlayer = state.currentPlayer;

  // Validate card is in eligible list
  if (!pending.eligibleCards.includes(cardId)) {
    throw new Error(`Card ${cardId} is not eligible for pickup`);
  }

  // Validate card is in discard pile
  const discardIndex = state.discardPile.indexOf(cardId);
  if (discardIndex === -1) {
    throw new Error(`Card ${cardId} not found in discard pile`);
  }

  // Remove from discard, add to hand
  const newDiscard = state.discardPile.filter((_, i) => i !== discardIndex);
  const newHand = [...state.players[activePlayer].hand, cardId];

  const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
  newPlayers[activePlayer] = { ...newPlayers[activePlayer], hand: newHand };

  return {
    ...state,
    players: newPlayers,
    discardPile: newDiscard,
    pendingResolution: null,
    log: [...state.log, {
      turn: state.turn,
      player: activePlayer,
      action: 'DRUMMER_PICK',
      details: `Picked ${cardId} from discard pile`,
    }],
  };
}
