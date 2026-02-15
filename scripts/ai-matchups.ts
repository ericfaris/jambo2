import { createInitialState } from '../src/engine/GameState.ts';
import { processAction } from '../src/engine/GameEngine.ts';
import type { GameState } from '../src/engine/types.ts';
import type { AIDifficulty } from '../src/ai/difficulties/index.ts';
import { getAiActionByDifficulty } from '../src/ai/difficulties/index.ts';
import { getValidActions } from '../src/engine/validation/actionValidator.ts';

interface MatchSummary {
  label: string;
  games: number;
  p0Wins: number;
  p1Wins: number;
  ties: number;
  avgTurns: number;
  avgGoldP0: number;
  avgGoldP1: number;
  stalls: number;
  stallReasons: Record<string, number>;
}

interface RunLimits {
  maxSteps: number;
  maxGameMs: number;
}

function getPendingResponder(state: GameState): 0 | 1 {
  const pr = state.pendingResolution;
  if (!pr) return state.currentPlayer;

  switch (pr.type) {
    case 'AUCTION':
      return pr.wares.length < 2 ? state.currentPlayer : pr.nextBidder;
    case 'DRAFT':
      return pr.currentPicker;
    case 'OPPONENT_DISCARD':
    case 'CARRIER_WARE_SELECT':
      return pr.targetPlayer;
    case 'UTILITY_KEEP':
      return pr.step === 'ACTIVE_CHOOSE' ? state.currentPlayer : (state.currentPlayer === 0 ? 1 : 0);
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

function playOneGame(seed: number, p0: AIDifficulty, p1: AIDifficulty, limits: RunLimits) {
  let state = createInitialState(seed);
  let steps = 0;
  const startedAt = Date.now();

  while (state.phase !== 'GAME_OVER' && steps < limits.maxSteps) {
    if (Date.now() - startedAt > limits.maxGameMs) {
      return {
        winner: null as 0 | 1 | null,
        stalled: true,
        stallReason: `game-timeout>${limits.maxGameMs}ms`,
        turns: state.turn,
        p0Gold: state.players[0].gold,
        p1Gold: state.players[1].gold,
      };
    }

    const responder = getResponder(state);
    const difficulty = responder === 0 ? p0 : p1;
    let action;
    try {
      action = getAiActionByDifficulty(state, difficulty);
    } catch (error) {
      return {
        winner: null as 0 | 1 | null,
        stalled: true,
        stallReason: `ai-throw:${difficulty}:${(error as Error).message}`,
        turns: state.turn,
        p0Gold: state.players[0].gold,
        p1Gold: state.players[1].gold,
      };
    }

    if (!action) {
      const pendingType = state.pendingResolution?.type ?? 'none';
      const reason = `no-action:${difficulty}:phase=${state.phase}:pending=${pendingType}:responder=${responder}`;
      return {
        winner: null as 0 | 1 | null,
        stalled: true,
        stallReason: reason,
        turns: state.turn,
        p0Gold: state.players[0].gold,
        p1Gold: state.players[1].gold,
      };
    }

    try {
      state = processAction(state, action);
    } catch (error) {
      const fallback = getValidActions(state)
        .filter(a => a.type !== 'DRAW_ACTION')
        .find((candidate) => {
          try {
            processAction(state, candidate);
            return true;
          } catch {
            return false;
          }
        });

      if (!fallback) {
        const pendingType = state.pendingResolution?.type ?? 'none';
        const message = (error as Error).message.replace(/\s+/g, ' ').slice(0, 120);
        const reason = `fallback-none:${difficulty}:phase=${state.phase}:pending=${pendingType}:responder=${responder}:err=${message}`;
        return {
          winner: null as 0 | 1 | null,
          stalled: true,
          stallReason: reason,
          turns: state.turn,
          p0Gold: state.players[0].gold,
          p1Gold: state.players[1].gold,
        };
      }

      try {
        state = processAction(state, fallback);
      } catch (error) {
        return {
          winner: null as 0 | 1 | null,
          stalled: true,
          stallReason: `fallback-throw:${difficulty}:${(error as Error).message}`,
          turns: state.turn,
          p0Gold: state.players[0].gold,
          p1Gold: state.players[1].gold,
        };
      }
    }
    steps++;
  }

  const p0Gold = state.players[0].gold;
  const p1Gold = state.players[1].gold;
  let winner: 0 | 1 | null = null;
  if (p0Gold > p1Gold) winner = 0;
  else if (p1Gold > p0Gold) winner = 1;

  return {
    winner,
    stalled: state.phase !== 'GAME_OVER',
    stallReason: state.phase !== 'GAME_OVER' ? `max-steps>${limits.maxSteps}` : null,
    turns: state.turn,
    p0Gold,
    p1Gold,
  };
}

function runMatchup(p0: AIDifficulty, p1: AIDifficulty, games: number, seedBase: number, limits: RunLimits): MatchSummary {
  let p0Wins = 0;
  let p1Wins = 0;
  let ties = 0;
  let stalls = 0;
  let totalTurns = 0;
  let totalGoldP0 = 0;
  let totalGoldP1 = 0;
  const stallReasons: Record<string, number> = {};

  for (let i = 0; i < games; i++) {
    let result;
    try {
      result = playOneGame(seedBase + i, p0, p1, limits);
    } catch (error) {
      result = {
        winner: null as 0 | 1 | null,
        stalled: true,
        stallReason: `game-throw:${(error as Error).message}`,
        turns: 0,
        p0Gold: 0,
        p1Gold: 0,
      };
    }
    totalTurns += result.turns;
    totalGoldP0 += result.p0Gold;
    totalGoldP1 += result.p1Gold;
    if (result.stalled) stalls++;
    if (result.stallReason) {
      stallReasons[result.stallReason] = (stallReasons[result.stallReason] ?? 0) + 1;
    }

    if (result.winner === 0) p0Wins++;
    else if (result.winner === 1) p1Wins++;
    else ties++;
  }

  const summary: MatchSummary = {
    label: `${p0} vs ${p1}`,
    games,
    p0Wins,
    p1Wins,
    ties,
    stalls,
    avgTurns: Number((totalTurns / games).toFixed(2)),
    avgGoldP0: Number((totalGoldP0 / games).toFixed(2)),
    avgGoldP1: Number((totalGoldP1 / games).toFixed(2)),
    stallReasons,
  };

  return summary;
}

const games = Number(process.argv[2] ?? 30);
const seedBase = Number(process.argv[3] ?? 9000);
const maxSteps = Number(process.argv[4] ?? 2500);
const maxGameMs = Number(process.argv[5] ?? 8000);
const limits: RunLimits = { maxSteps, maxGameMs };

const matchups: Array<[AIDifficulty, AIDifficulty]> = [
  ['easy', 'easy'],
  ['easy', 'medium'],
  ['easy', 'hard'],
  ['medium', 'medium'],
  ['medium', 'hard'],
  ['hard', 'medium'],
  ['hard', 'hard'],
];

const summaries = matchups.map(([p0, p1], idx) => runMatchup(p0, p1, games, seedBase + idx * 1000, limits));

console.log(JSON.stringify({ gamesPerMatchup: games, seedBase, maxSteps, maxGameMs, summaries }, null, 2));
