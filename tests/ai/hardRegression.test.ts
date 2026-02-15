import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/engine/GameState.ts';
import { processAction } from '../../src/engine/GameEngine.ts';
import { getValidActions } from '../../src/engine/validation/actionValidator.ts';
import type { AIDifficulty } from '../../src/ai/difficulties/index.ts';
import { getAiActionByDifficulty } from '../../src/ai/difficulties/index.ts';
import type { GameState } from '../../src/engine/types.ts';

interface GameOutcome {
  winner: 0 | 1 | null;
  stalled: boolean;
}

function getPendingResponder(state: GameState): 0 | 1 {
  const pending = state.pendingResolution;
  if (!pending) return state.currentPlayer;

  switch (pending.type) {
    case 'AUCTION':
      return pending.wares.length < 2 ? state.currentPlayer : pending.nextBidder;
    case 'DRAFT':
      return pending.currentPicker;
    case 'OPPONENT_DISCARD':
    case 'CARRIER_WARE_SELECT':
      return pending.targetPlayer;
    case 'UTILITY_KEEP':
      return pending.step === 'ACTIVE_CHOOSE' ? state.currentPlayer : (state.currentPlayer === 0 ? 1 : 0);
    case 'OPPONENT_CHOICE':
      return state.currentPlayer === 0 ? 1 : 0;
    default:
      return state.currentPlayer;
  }
}

function getResponder(state: GameState): 0 | 1 {
  if (state.pendingGuardReaction) return state.pendingGuardReaction.targetPlayer;
  if (state.pendingWareCardReaction) return state.pendingWareCardReaction.targetPlayer;
  if (state.pendingResolution) return getPendingResponder(state);
  return state.currentPlayer;
}

function playOneGame(seed: number, p0: AIDifficulty, p1: AIDifficulty, maxSteps = 2200): GameOutcome {
  let state = createInitialState(seed);
  let steps = 0;

  while (state.phase !== 'GAME_OVER' && steps < maxSteps) {
    const responder = getResponder(state);
    const difficulty = responder === 0 ? p0 : p1;
    const action = getAiActionByDifficulty(state, difficulty);

    if (!action) {
      return { winner: null, stalled: true };
    }

    try {
      state = processAction(state, action);
    } catch {
      const fallback = getValidActions(state).find((candidate) => {
        try {
          processAction(state, candidate);
          return true;
        } catch {
          return false;
        }
      });

      if (!fallback) {
        return { winner: null, stalled: true };
      }

      state = processAction(state, fallback);
    }

    steps++;
  }

  if (state.phase !== 'GAME_OVER') {
    return { winner: null, stalled: true };
  }

  const p0Gold = state.players[0].gold;
  const p1Gold = state.players[1].gold;
  if (p0Gold > p1Gold) return { winner: 0, stalled: false };
  if (p1Gold > p0Gold) return { winner: 1, stalled: false };
  return { winner: null, stalled: false };
}

describe('Hard AI regression guard', () => {
  it('stays near parity with medium across both seat orders on fixed seeds', () => {
    const gamesPerOrder = 20;
    const seedBase = 22000;

    let hardPoints = 0;
    let mediumPoints = 0;
    let stalls = 0;

    for (let index = 0; index < gamesPerOrder; index++) {
      const mediumFirst = playOneGame(seedBase + index, 'medium', 'hard');
      if (mediumFirst.stalled) stalls++;
      if (mediumFirst.winner === 0) mediumPoints += 1;
      else if (mediumFirst.winner === 1) hardPoints += 1;
      else {
        mediumPoints += 0.5;
        hardPoints += 0.5;
      }

      const hardFirst = playOneGame(seedBase + 1000 + index, 'hard', 'medium');
      if (hardFirst.stalled) stalls++;
      if (hardFirst.winner === 0) hardPoints += 1;
      else if (hardFirst.winner === 1) mediumPoints += 1;
      else {
        mediumPoints += 0.5;
        hardPoints += 0.5;
      }
    }

    expect(stalls).toBe(0);
    expect(hardPoints).toBeGreaterThanOrEqual(mediumPoints - 4);
  });
});
