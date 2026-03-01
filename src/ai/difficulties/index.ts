export { getEasyAiAction } from './EasyAI.ts';
export { getMediumAiAction } from './MediumAI.ts';
export { getHardAiAction } from './HardAI.ts';
export { getExpertAiAction } from './ExpertAI.ts';

import type { GameAction, GameState } from '../../engine/types.ts';
import { getEasyAiAction } from './EasyAI.ts';
import { getMediumAiAction } from './MediumAI.ts';
import { getHardAiAction } from './HardAI.ts';
import { getExpertAiAction } from './ExpertAI.ts';

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export function getAiActionByDifficulty(
	state: GameState,
	difficulty: AIDifficulty,
	rng?: () => number,
): GameAction | null {
	switch (difficulty) {
		case 'easy':
			return getEasyAiAction(state, rng);
		case 'hard':
			return getHardAiAction(state, rng);
		case 'expert':
			return getExpertAiAction(state, rng);
		case 'medium':
		default:
			return getMediumAiAction(state, rng);
	}
}
