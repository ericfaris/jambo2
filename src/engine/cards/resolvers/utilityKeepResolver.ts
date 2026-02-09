// ============================================================================
// Utility Keep Resolver - Snake (both players keep 1 utility, discard rest)
// ============================================================================

import type {
  GameState,
  PendingUtilityKeep,
  InteractionResponse,
  PlayerState,
} from '../../types.ts';
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

export function resolveUtilityKeep(
  state: GameState,
  pending: PendingUtilityKeep,
  response: InteractionResponse
): GameState {
  if (response.type !== 'SELECT_UTILITY') {
    throw new Error('Expected SELECT_UTILITY response for Snake');
  }

  const cp = state.currentPlayer;
  const opponent: 0 | 1 = cp === 0 ? 1 : 0;
  const { utilityIndex } = response;

  if (pending.step === 'ACTIVE_CHOOSE') {
    // Active player keeps 1 utility, discard rest
    const activeUtils = state.players[cp].utilities;

    if (activeUtils.length === 0) {
      // No utilities — check if opponent also has none
      if (state.players[opponent].utilities.length === 0) {
        let next = { ...state, pendingResolution: null };
        next = withLog(next, 'SNAKE_COMPLETE', 'Snake effect resolved (neither player has utilities)');
        return next;
      }
      // Skip to opponent's turn
      return {
        ...state,
        pendingResolution: {
          ...pending,
          step: 'OPPONENT_CHOOSE',
        },
      };
    }

    if (utilityIndex < 0 || utilityIndex >= activeUtils.length) {
      throw new Error(`Invalid utility index ${utilityIndex}`);
    }

    const kept = activeUtils[utilityIndex];
    let next = state;

    // Discard all except the kept utility
    for (let i = 0; i < activeUtils.length; i++) {
      if (i !== utilityIndex) {
        next = discardCard(next, activeUtils[i].cardId);
      }
    }

    next = withPlayer(next, cp, { utilities: [kept] });
    next = withLog(next, 'SNAKE_KEEP', `Active player kept ${kept.cardId}`);

    // Check if opponent has utilities to choose from
    if (next.players[opponent].utilities.length === 0) {
      next = { ...next, pendingResolution: null };
      next = withLog(next, 'SNAKE_COMPLETE', 'Snake effect resolved (opponent has no utilities)');
      return next;
    }

    // Move to opponent's turn
    return {
      ...next,
      pendingResolution: {
        ...pending,
        step: 'OPPONENT_CHOOSE',
      },
    };
  }

  if (pending.step === 'OPPONENT_CHOOSE') {
    // Opponent keeps 1 utility, discard rest
    const opUtils = state.players[opponent].utilities;

    if (opUtils.length === 0) {
      // No utilities — resolve
      return {
        ...state,
        pendingResolution: null,
        log: [...state.log, { turn: state.turn, player: cp, action: 'SNAKE_COMPLETE', details: 'Snake effect resolved' }],
      };
    }

    if (utilityIndex < 0 || utilityIndex >= opUtils.length) {
      throw new Error(`Invalid utility index ${utilityIndex}`);
    }

    const kept = opUtils[utilityIndex];
    let next = state;

    // Discard all except the kept utility
    for (let i = 0; i < opUtils.length; i++) {
      if (i !== utilityIndex) {
        next = discardCard(next, opUtils[i].cardId);
      }
    }

    next = withPlayer(next, opponent, { utilities: [kept] });
    next = { ...next, pendingResolution: null };
    next = withLog(next, 'SNAKE_COMPLETE', `Opponent kept ${kept.cardId}`);

    return next;
  }

  throw new Error(`Unknown Snake step: ${pending.step}`);
}
