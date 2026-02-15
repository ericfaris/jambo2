// ============================================================================
// Deck Peek Resolver - Psychic (reveal top 5, pick 1)
// ============================================================================

import type { GameState, PendingDeckPeek, InteractionResponse } from '../../types.ts';

export function resolveDeckPeek(
  state: GameState,
  pending: PendingDeckPeek,
  response: InteractionResponse
): GameState {
  // Guard: no revealed cards to pick from — auto-resolve
  if (pending.revealedCards.length === 0) {
    return {
      ...state,
      pendingResolution: null,
      log: [...state.log, {
        turn: state.turn,
        player: state.currentPlayer,
        action: 'PSYCHIC_PEEK',
        details: 'No cards available to peek',
      }],
    };
  }

  if (response.type !== 'DECK_PEEK_PICK') {
    throw new Error('Expected DECK_PEEK_PICK response');
  }

  const { cardIndex } = response;
  if (cardIndex < 0 || cardIndex >= pending.revealedCards.length) {
    throw new Error(`Invalid card index ${cardIndex}`);
  }

  const pickedCard = pending.revealedCards[cardIndex];
  const activePlayer = state.currentPlayer;

  // Add picked card to hand
  const newHand = [...state.players[activePlayer].hand, pickedCard];
  const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
  newPlayers[activePlayer] = { ...newPlayers[activePlayer], hand: newHand };

  // Remove picked card from deck (it was at position cardIndex in the top of deck)
  // The remaining revealed cards stay in the deck in their original order
  const newDeck = [...state.deck];
  newDeck.splice(cardIndex, 1);

  return {
    ...state,
    players: newPlayers,
    deck: newDeck,
    pendingResolution: null,
    log: [...state.log, {
      turn: state.turn,
      player: activePlayer,
      action: 'PSYCHIC_PEEK',
      details: `Peeked at ${pending.revealedCards.length} cards, picked ${pickedCard}`,
    }],
  };
}
