import type { GameAction, GameState } from '../../engine/types.ts';
import { getRandomAiAction } from '../RandomAI.ts';

export function getEasyAiAction(state: GameState, rng?: () => number): GameAction | null {
  return getRandomAiAction(state, rng);
}
