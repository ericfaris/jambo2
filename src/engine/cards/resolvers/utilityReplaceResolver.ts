// ============================================================================
// Utility Replace Resolver - Replace one of 3 existing utilities with a new one
// ============================================================================

import type {
  GameState,
  PendingUtilityReplace,
  InteractionResponse,
  PlayerState,
} from '../../types.ts';
import { CONSTANTS } from '../../types.ts';
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

function withLog(state: GameState, action: string, details: string): GameState {
  return {
    ...state,
    log: [...state.log, { turn: state.turn, player: state.currentPlayer, action, details }],
  };
}

export function resolveUtilityReplace(
  state: GameState,
  pending: PendingUtilityReplace,
  response: InteractionResponse
): GameState {
  const cp = state.currentPlayer;
  const player = state.players[cp];

  // Guard: if somehow under max, just add the utility directly
  if (player.utilities.length < CONSTANTS.MAX_UTILITIES) {
    const newUtilities = [
      ...player.utilities,
      { cardId: pending.sourceCard, designId: pending.newUtilityDesignId, usedThisTurn: false },
    ];
    let next = withPlayer(state, cp, { utilities: newUtilities });
    next = { ...next, pendingResolution: null };
    next = withLog(next, 'PLAY_UTILITY', `Placed ${pending.sourceCard} in play area`);
    return next;
  }

  if (response.type !== 'SELECT_UTILITY') {
    throw new Error('Expected SELECT_UTILITY response for utility replacement');
  }

  const { utilityIndex } = response;

  if (utilityIndex < 0 || utilityIndex >= player.utilities.length) {
    throw new Error(`Invalid utility index ${utilityIndex}`);
  }

  const discardedUtility = player.utilities[utilityIndex];

  // Discard the old utility card
  let next = discardCard(state, discardedUtility.cardId);

  // Replace in the utilities array
  const newUtilities = [...next.players[cp].utilities];
  newUtilities[utilityIndex] = {
    cardId: pending.sourceCard,
    designId: pending.newUtilityDesignId,
    usedThisTurn: false,
  };

  next = withPlayer(next, cp, { utilities: newUtilities });
  next = { ...next, pendingResolution: null };
  next = withLog(next, 'UTILITY_REPLACE', `Replaced ${discardedUtility.cardId} with ${pending.sourceCard}`);

  return next;
}
