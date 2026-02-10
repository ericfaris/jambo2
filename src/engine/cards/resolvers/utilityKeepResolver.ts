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
  const cp = state.currentPlayer;
  const opponent: 0 | 1 = cp === 0 ? 1 : 0;

  if (pending.step === 'ACTIVE_CHOOSE') {
    const activeUtils = state.players[cp].utilities;

    // Auto-skip if active player has no utilities
    if (activeUtils.length === 0) {
      if (state.players[opponent].utilities.length === 0) {
        let next: GameState = { ...state, pendingResolution: null };
        next = withLog(next, 'SNAKE_COMPLETE', 'Snake effect resolved (neither player has utilities)');
        return next;
      }
      return {
        ...state,
        pendingResolution: { ...pending, step: 'OPPONENT_CHOOSE' },
      };
    }

    if (response.type !== 'SELECT_UTILITY') {
      throw new Error('Expected SELECT_UTILITY response for Snake');
    }
    const { utilityIndex } = response;

    if (utilityIndex < 0 || utilityIndex >= activeUtils.length) {
      throw new Error(`Invalid utility index ${utilityIndex}`);
    }

    const kept = activeUtils[utilityIndex];
    let next = state;

    for (let i = 0; i < activeUtils.length; i++) {
      if (i !== utilityIndex) {
        next = discardCard(next, activeUtils[i].cardId);
      }
    }

    next = withPlayer(next, cp, { utilities: [kept] });
    next = withLog(next, 'SNAKE_KEEP', `Active player kept ${kept.cardId}`);

    if (next.players[opponent].utilities.length === 0) {
      next = { ...next, pendingResolution: null };
      next = withLog(next, 'SNAKE_COMPLETE', 'Snake effect resolved (opponent has no utilities)');
      return next;
    }

    return {
      ...next,
      pendingResolution: { ...pending, step: 'OPPONENT_CHOOSE' },
    };
  }

  if (pending.step === 'OPPONENT_CHOOSE') {
    const opUtils = state.players[opponent].utilities;

    // Auto-skip if opponent has no utilities
    if (opUtils.length === 0) {
      let next: GameState = { ...state, pendingResolution: null };
      next = withLog(next, 'SNAKE_COMPLETE', 'Snake effect resolved');
      return next;
    }

    if (response.type !== 'SELECT_UTILITY') {
      throw new Error('Expected SELECT_UTILITY response for Snake');
    }
    const { utilityIndex } = response;

    if (utilityIndex < 0 || utilityIndex >= opUtils.length) {
      throw new Error(`Invalid utility index ${utilityIndex}`);
    }

    const kept = opUtils[utilityIndex];
    let next = state;

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
