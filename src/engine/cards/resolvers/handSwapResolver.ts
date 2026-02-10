// ============================================================================
// Hand Swap Resolver - Hyena (view opponent hand, take 1, give 1)
// ============================================================================

import type {
  GameState,
  PendingHandSwap,
  InteractionResponse,
  PlayerState,
} from '../../types.ts';

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

function withLog(state: GameState, action: string, details: string): GameState {
  return {
    ...state,
    log: [...state.log, { turn: state.turn, player: state.currentPlayer, action, details }],
  };
}

export function resolveHandSwap(
  state: GameState,
  pending: PendingHandSwap,
  response: InteractionResponse
): GameState {
  const cp = state.currentPlayer;
  const opponent: 0 | 1 = cp === 0 ? 1 : 0;

  if (pending.step === 'TAKE') {
    // Guard: opponent has no cards — auto-resolve
    if (state.players[opponent].hand.length === 0) {
      let next: GameState = { ...state, pendingResolution: null };
      next = withLog(next, 'HYENA_SWAP', 'Opponent has no cards to take');
      return next;
    }

    // Active player selects 1 card to take from opponent's hand
    if (response.type !== 'SELECT_CARD') {
      throw new Error('Expected SELECT_CARD response for Hyena take step');
    }
    const { cardId } = response;
    const opponentHand = state.players[opponent].hand;
    if (!opponentHand.includes(cardId)) {
      throw new Error(`Card ${cardId} not in opponent's hand`);
    }

    // Move card from opponent to active player
    const newOpponentHand = opponentHand.filter(id => id !== cardId);
    let next = withPlayer(state, opponent, { hand: newOpponentHand });
    const newActiveHand = [...next.players[cp].hand, cardId];
    next = withPlayer(next, cp, { hand: newActiveHand });

    return {
      ...next,
      pendingResolution: {
        ...pending,
        step: 'GIVE',
        takenCard: cardId,
      },
    };
  }

  if (pending.step === 'GIVE') {
    // Active player selects 1 card from own hand to give to opponent
    if (response.type !== 'SELECT_CARD') {
      throw new Error('Expected SELECT_CARD response for Hyena give step');
    }
    const { cardId } = response;
    const activeHand = state.players[cp].hand;
    if (!activeHand.includes(cardId)) {
      throw new Error(`Card ${cardId} not in hand`);
    }

    // Move card from active player to opponent
    const newActiveHand = activeHand.filter(id => id !== cardId);
    let next = withPlayer(state, cp, { hand: newActiveHand });
    const newOpponentHand = [...next.players[opponent].hand, cardId];
    next = withPlayer(next, opponent, { hand: newOpponentHand });

    next = { ...next, pendingResolution: null };
    next = withLog(next, 'HYENA_SWAP', `Took ${pending.takenCard}, gave ${cardId}`);

    return next;
  }

  throw new Error(`Unknown Hyena step: ${pending.step}`);
}
