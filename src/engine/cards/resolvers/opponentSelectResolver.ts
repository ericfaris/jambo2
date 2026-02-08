// ============================================================================
// Opponent Select Resolver - Tribal Elder, Snake (opponent discards)
// ============================================================================

import type { GameState, PendingOpponentDiscard, InteractionResponse } from '../../types.ts';

export function resolveOpponentSelect(
  state: GameState,
  pending: PendingOpponentDiscard,
  response: InteractionResponse
): GameState {
  if (response.type !== 'OPPONENT_DISCARD_SELECTION') {
    throw new Error('Expected OPPONENT_DISCARD_SELECTION response');
  }

  const { targetPlayer, discardTo } = pending;
  const targetHand = state.players[targetPlayer].hand;

  // If already at or below target, no discard needed
  if (targetHand.length <= discardTo) {
    return { ...state, pendingResolution: null };
  }

  const { cardIndices } = response;
  const expectedDiscards = targetHand.length - discardTo;

  if (cardIndices.length !== expectedDiscards) {
    throw new Error(
      `Must discard exactly ${expectedDiscards} cards, got ${cardIndices.length}`
    );
  }

  // Validate all indices are valid and unique
  const uniqueIndices = new Set(cardIndices);
  if (uniqueIndices.size !== cardIndices.length) {
    throw new Error('Duplicate card indices in discard selection');
  }
  for (const idx of cardIndices) {
    if (idx < 0 || idx >= targetHand.length) {
      throw new Error(`Invalid card index ${idx}`);
    }
  }

  // Remove selected cards from hand, add to discard pile
  const discardedCards = cardIndices.map(i => targetHand[i]);
  const newHand = targetHand.filter((_, i) => !uniqueIndices.has(i));

  const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
  newPlayers[targetPlayer] = { ...newPlayers[targetPlayer], hand: newHand };

  return {
    ...state,
    players: newPlayers,
    discardPile: [...discardedCards, ...state.discardPile],
    pendingResolution: null,
    log: [...state.log, {
      turn: state.turn,
      player: targetPlayer,
      action: 'OPPONENT_DISCARD',
      details: `Discarded ${discardedCards.length} cards (down to ${discardTo})`,
    }],
  };
}
