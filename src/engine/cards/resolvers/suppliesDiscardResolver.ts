// ============================================================================
// Supplies Discard Resolver - Follow-up for Supplies binary choice (discard)
// Player picks card to discard, then draw-until-ware executes.
// ============================================================================

import type {
  GameState,
  PendingSuppliesDiscard,
  InteractionResponse,
  PlayerState,
} from '../../types.ts';
import { drawFromDeck, discardCard } from '../../deck/DeckManager.ts';
import { getCard } from '../CardDatabase.ts';

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

/**
 * Draw cards from deck until a ware card is found. Keep the ware, discard the rest.
 */
export function drawUntilWare(state: GameState, player: 0 | 1): GameState {
  let next = state;
  while (next.deck.length > 0 || next.discardPile.length > 0) {
    const result = drawFromDeck(next);
    if (!result.card) break;
    next = result.state;
    const card = getCard(result.card);
    if (card.type === 'ware') {
      // Found a ware card — add to hand
      const newHand = [...next.players[player].hand, result.card];
      next = withPlayer(next, player, { hand: newHand });
      return next;
    }
    // Not a ware — discard it
    next = discardCard(next, result.card);
  }
  return next; // Deck exhausted without finding a ware
}

export function resolveSuppliesDiscard(
  state: GameState,
  _pending: PendingSuppliesDiscard,
  response: InteractionResponse
): GameState {
  const cp = state.currentPlayer;

  // Guard: no cards in hand — skip discard, just draw until ware
  if (state.players[cp].hand.length === 0) {
    let next = drawUntilWare(state, cp);
    next = {
      ...next,
      pendingResolution: null,
      log: [...next.log, { turn: state.turn, player: cp, action: 'SUPPLIES_DRAW', details: 'No cards to discard, drew until ware found' }],
    };
    return next;
  }

  if (response.type !== 'SELECT_CARD') {
    throw new Error('Expected SELECT_CARD response for Supplies discard');
  }

  const { cardId } = response;
  const hand = state.players[cp].hand;

  if (!hand.includes(cardId)) {
    throw new Error(`Card ${cardId} not in hand`);
  }

  // Discard the selected card
  const newHand = hand.filter(id => id !== cardId);
  let next = withPlayer(state, cp, { hand: newHand });
  next = discardCard(next, cardId);

  // Draw until ware
  next = drawUntilWare(next, cp);

  next = {
    ...next,
    pendingResolution: null,
    log: [...next.log, {
      turn: state.turn,
      player: cp,
      action: 'SUPPLIES_DRAW',
      details: `Discarded ${cardId}, drew until ware found`,
    }],
  };

  return next;
}
