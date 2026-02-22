import type { GameAction, GameState } from '../../engine/types.ts';
import { getValidActions } from '../../engine/validation/actionValidator.ts';
import { getRandomAiAction } from '../RandomAI.ts';

function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)];
}

function isWarePlayAction(action: GameAction): boolean {
  return action.type === 'PLAY_CARD' && (action.wareMode === 'buy' || action.wareMode === 'sell');
}

export function getEasyAiAction(state: GameState, rng: () => number = Math.random): GameAction | null {
  if (state.pendingResolution || state.pendingGuardReaction || state.pendingWareCardReaction) {
    return getRandomAiAction(state, rng);
  }

  const validActions = getValidActions(state);
  if (validActions.length === 0) return null;

  const wareActions = validActions.filter(isWarePlayAction);
  if (wareActions.length > 0 && rng() < 0.6) {
    return pick(wareActions, rng);
  }

  return getRandomAiAction(state, rng);
}
