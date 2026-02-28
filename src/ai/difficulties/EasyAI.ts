import type { GameAction, GameState } from '../../engine/types.ts';
import { getValidActions } from '../../engine/validation/actionValidator.ts';
import { getRandomAiAction } from '../RandomAI.ts';

function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)];
}

function isWarePlayAction(action: GameAction): boolean {
  return action.type === 'PLAY_CARD' && (action.wareMode === 'buy' || action.wareMode === 'sell');
}

function isWareSellAction(action: GameAction): boolean {
  return action.type === 'PLAY_CARD' && action.wareMode === 'sell';
}

export function getEasyAiAction(state: GameState, rng: () => number = Math.random): GameAction | null {
  // Easy plays guard 40% (vs Random's 30%)
  if (state.pendingGuardReaction) {
    return { type: 'GUARD_REACTION', play: rng() < 0.4 };
  }

  // Easy plays Rain Maker 40% (vs Random's 30%)
  if (state.pendingWareCardReaction) {
    return { type: 'WARE_CARD_REACTION', play: rng() < 0.4 };
  }

  if (state.pendingResolution) {
    return getRandomAiAction(state, rng);
  }

  const validActions = getValidActions(state);
  if (validActions.length === 0) return null;

  // Prefer selling when possible (75% chance to pick a sell if available)
  const sellActions = validActions.filter(isWareSellAction);
  if (sellActions.length > 0 && rng() < 0.75) {
    return pick(sellActions, rng);
  }

  // Otherwise 60% ware bias (buy or sell)
  const wareActions = validActions.filter(isWarePlayAction);
  if (wareActions.length > 0 && rng() < 0.6) {
    return pick(wareActions, rng);
  }

  return getRandomAiAction(state, rng);
}
