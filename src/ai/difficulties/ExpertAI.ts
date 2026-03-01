import type { GameAction, GameState } from '../../engine/types.ts';

import { processAction } from '../../engine/GameEngine.ts';
import { getValidActions } from '../../engine/validation/actionValidator.ts';
import { getRandomAiAction, getRandomInteractionResponse, getFallbackInteractionResponses } from '../RandomAI.ts';
import { createRng } from '../../utils/rng.ts';
import {
  evaluateBoard,
  getPendingResponder,
  tacticalActionBonus,
  getHardGuardReaction,
  getHardWareCardReaction,
  getHardAuctionBidAction,
} from './HardAI.ts';
import { getMediumAiAction } from './MediumAI.ts';

function pick<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function createExpertRng(state: GameState): () => number {
  let seed = state.rngSeed | 0;
  seed ^= Math.imul((state.turn + 11) | 0, 0x1b873593);
  seed ^= Math.imul((state.actionsLeft + 19) | 0, 0x85ebca6b);
  seed ^= Math.imul((state.currentPlayer + 23) | 0, 0xc2b2ae35);
  seed ^= Math.imul(state.log.length | 0, 0x27d4eb2f);
  seed ^= 0xdeadbeef;
  return createRng(seed);
}

function scoreStateDelta(before: GameState, after: GameState, perspective: 0 | 1): number {
  return evaluateBoard(after, perspective) - evaluateBoard(before, perspective);
}

const ROLLOUT_COUNT = 20;
const ROLLOUT_DEPTH = 8;
const TOP_K = 8;
const HARD_WEIGHT = 0.4;
const ROLLOUT_WEIGHT = 0.6;

/**
 * Run a single Monte Carlo rollout from a given state using MediumAI as the
 * rollout policy. Simulates `depth` actions (both players), then evaluates
 * the resulting board from `perspective`.
 */
function monteCarloRollout(
  state: GameState,
  perspective: 0 | 1,
  depth: number,
  rng: () => number
): number {
  let current = state;
  for (let i = 0; i < depth; i++) {
    if (current.phase === 'GAME_OVER') break;
    const rolloutRng = createRng(Math.floor(rng() * 0x7fffffff));
    const action = getMediumAiAction(current, rolloutRng);
    if (!action) break;
    try {
      current = processAction(current, action);
    } catch {
      break;
    }
  }
  return evaluateBoard(current, perspective);
}

/**
 * Run R rollouts from a state and return the average board evaluation.
 */
function averageRolloutScore(
  state: GameState,
  perspective: 0 | 1,
  rollouts: number,
  rng: () => number
): number {
  let total = 0;
  for (let r = 0; r < rollouts; r++) {
    const rolloutRng = createRng(Math.floor(rng() * 0x7fffffff) + r);
    total += monteCarloRollout(state, perspective, ROLLOUT_DEPTH, rolloutRng);
  }
  return total / rollouts;
}

/**
 * Compute the 1-ply "Hard-style" score for an action (immediate delta + tactical bonus).
 * Used for top-K filtering before running expensive rollouts.
 */
function hardScore(state: GameState, action: GameAction): number {
  const me = state.currentPlayer;
  try {
    const next = processAction(state, action);
    const immediate = scoreStateDelta(state, next, me);
    const tactical = tacticalActionBonus(state, action, me);
    return immediate + tactical;
  } catch {
    return Number.NEGATIVE_INFINITY;
  }
}

/**
 * Expert interaction handler — exhaustive evaluation of ALL possible responses.
 *
 * Hard's interaction handler evaluates random + fallback responses (~5-10 options).
 * Expert generates multiple random samples AND all fallback options, giving it
 * a much broader search of the response space. This matters for complex
 * interactions like Draft picks, Shaman trades, Psychic card selection, etc.
 */
function getExpertInteractionAction(state: GameState, rng: () => number): GameAction | null {
  const pr = state.pendingResolution;
  if (!pr) return null;

  const responder = getPendingResponder(state);

  // Gather candidates: multiple random samples + all fallback options
  const seen = new Set<string>();
  const unique: import('../../engine/types.ts').InteractionResponse[] = [];

  // Sample random responses many times to explore the response space broadly
  for (let i = 0; i < 16; i++) {
    const subRng = createRng(Math.floor(rng() * 0x7fffffff) + i);
    const response = getRandomInteractionResponse(state, subRng);
    if (response) {
      const key = JSON.stringify(response);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(response);
      }
    }
  }

  // Add all fallback options
  for (const response of getFallbackInteractionResponses(state)) {
    const key = JSON.stringify(response);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(response);
    }
  }

  if (unique.length === 0) return null;

  if (unique.length === 1) {
    const action: GameAction = { type: 'RESOLVE_INTERACTION', response: unique[0] };
    try {
      processAction(state, action);
      return action;
    } catch {
      return null;
    }
  }

  // Simulate each and pick best by board eval
  let bestAction: GameAction | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const response of unique) {
    const action: GameAction = { type: 'RESOLVE_INTERACTION', response };
    try {
      const next = processAction(state, action);
      const score = evaluateBoard(next, responder);
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    } catch {
      continue;
    }
  }

  return bestAction;
}

// scoreAction removed — replaced by hardScore + MC rollout blending in getExpertAiAction

function isWarePlayAction(action: GameAction): boolean {
  return action.type === 'PLAY_CARD' && (action.wareMode === 'buy' || action.wareMode === 'sell');
}

function pickWareNearTop(scored: ReadonlyArray<{ action: GameAction; score: number }>, topScore: number): GameAction | null {
  const nearTopThreshold = 12;
  const wareCandidates = scored
    .filter((entry) => isWarePlayAction(entry.action) && topScore - entry.score <= nearTopThreshold)
    .sort((a, b) => b.score - a.score);
  return wareCandidates[0]?.action ?? null;
}

export function getExpertAiAction(state: GameState, rng: () => number = createExpertRng(state)): GameAction | null {
  // Auction bidding — reuse Hard's simulation-based handler
  if (state.pendingResolution?.type === 'AUCTION' && state.pendingResolution.wares.length >= 2) {
    const auctionAction = getHardAuctionBidAction(state);
    if (auctionAction) return auctionAction;
  }

  // Pending interactions — Expert's exhaustive response evaluation
  if (state.pendingResolution) {
    const smartAction = getExpertInteractionAction(state, rng);
    if (smartAction) return smartAction;
    return getRandomAiAction(state, rng);
  }

  // Guard reaction — reuse Hard's simulation
  if (state.pendingGuardReaction) {
    return getHardGuardReaction(state);
  }

  // Ware card reaction — reuse Hard's simulation
  if (state.pendingWareCardReaction) {
    return getHardWareCardReaction(state);
  }

  // Action selection: top-K filtering by 1-ply score, then MC rollout evaluation
  const validActions = getValidActions(state);
  if (validActions.length === 0) return null;

  const me = state.currentPlayer;

  // Phase 1: Score all actions with fast 1-ply evaluation
  const hardScored = validActions.map((action) => ({ action, hScore: hardScore(state, action) }));
  hardScored.sort((a, b) => b.hScore - a.hScore);

  // Phase 2: Take top-K candidates for rollout evaluation
  const topK = hardScored.slice(0, TOP_K).filter(s => Number.isFinite(s.hScore));
  if (topK.length === 0) return null;

  // If only one viable candidate, skip rollouts
  if (topK.length === 1) return topK[0].action;

  // Phase 3: Run MC rollouts for each top-K candidate, compute blended score
  const blended: { action: GameAction; score: number }[] = [];
  for (const { action, hScore } of topK) {
    try {
      const next = processAction(state, action);
      const rolloutRng = createRng(Math.floor(rng() * 0x7fffffff));
      const rolloutAvg = averageRolloutScore(next, me, ROLLOUT_COUNT, rolloutRng);
      const baselineEval = evaluateBoard(state, me);
      const rolloutDelta = rolloutAvg - baselineEval;
      const finalScore = HARD_WEIGHT * hScore + ROLLOUT_WEIGHT * rolloutDelta;
      blended.push({ action, score: finalScore });
    } catch {
      blended.push({ action, score: Number.NEGATIVE_INFINITY });
    }
  }

  const topScore = Math.max(...blended.map(s => s.score));

  // Prefer ware plays if near top (same logic as before)
  const wareNearTop = pickWareNearTop(blended, topScore);
  if (wareNearTop) return wareNearTop;

  const best = blended.filter(s => s.score === topScore).map(s => s.action);
  return pick(best, rng);
}
