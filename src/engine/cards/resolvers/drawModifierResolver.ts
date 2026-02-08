// ============================================================================
// Draw Modifier Resolver - Mask of Transformation
// Trade 1 hand card for top of discard pile
// ============================================================================

import type { GameState, PendingDrawModifier, InteractionResponse, PlayerState } from '../../types.ts';
import { discardCard } from '../../deck/DeckManager.ts';

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

export function resolveDrawModifier(
  state: GameState,
  _pending: PendingDrawModifier,
  response?: InteractionResponse
): GameState {
  const cp = state.currentPlayer;

  // If discard pile is empty, no-op
  if (state.discardPile.length === 0) {
    return {
      ...state,
      pendingResolution: null,
      log: [...state.log, {
        turn: state.turn,
        player: cp,
        action: 'DRAW_MODIFIER',
        details: 'Mask of Transformation: discard pile is empty, no swap possible',
      }],
    };
  }

  if (!response || response.type !== 'SELECT_CARD') {
    throw new Error('Expected SELECT_CARD response for Mask of Transformation');
  }

  const { cardId } = response;
  const hand = state.players[cp].hand;

  if (!hand.includes(cardId)) {
    throw new Error(`Card ${cardId} not in hand`);
  }

  // Take top card from discard pile
  const topDiscard = state.discardPile[0];
  const newDiscardPile = state.discardPile.slice(1);

  // Remove selected card from hand, add top discard to hand
  const newHand = hand.filter(id => id !== cardId);
  newHand.push(topDiscard);

  let next: GameState = {
    ...state,
    discardPile: newDiscardPile,
  };
  next = withPlayer(next, cp, { hand: newHand });

  // Put the given card on top of discard
  next = discardCard(next, cardId);

  next = {
    ...next,
    pendingResolution: null,
    log: [...next.log, {
      turn: state.turn,
      player: cp,
      action: 'DRAW_MODIFIER',
      details: `Mask of Transformation: swapped ${cardId} for ${topDiscard}`,
    }],
  };

  return next;
}
