/// <reference types="node" />

import { fileURLToPath } from 'node:url';
import { createInitialState } from '../src/engine/GameState.ts';
import { processAction } from '../src/engine/GameEngine.ts';
import type { GameState } from '../src/engine/types.ts';
import type { AIDifficulty } from '../src/ai/difficulties/index.ts';
import { getAiActionByDifficulty } from '../src/ai/difficulties/index.ts';
import { getValidActions } from '../src/engine/validation/actionValidator.ts';
import { getCard } from '../src/engine/cards/CardDatabase.ts';
import type { UtilityDesignId } from '../src/engine/types.ts';

export interface MatchSummary {
  label: string;
  games: number;
  p0Wins: number;
  p1Wins: number;
  ties: number;
  p0WinRate: number;
  p1WinRate: number;
  decisiveSkew: number;
  skewFlag: 'none' | 'moderate' | 'high';
  avgTurns: number;
  avgGoldP0: number;
  avgGoldP1: number;
  avgGoldDelta: number;
  stalls: number;
  stallReasons: Record<string, number>;
  utilityStats: {
    played: Record<UtilityDesignId, number>;
    activated: Record<UtilityDesignId, number>;
    bySeat: {
      p0: {
        played: Record<UtilityDesignId, number>;
        activated: Record<UtilityDesignId, number>;
      };
      p1: {
        played: Record<UtilityDesignId, number>;
        activated: Record<UtilityDesignId, number>;
      };
    };
  };
}

export interface RunLimits {
  maxSteps: number;
  maxGameMs: number;
}

interface GameRunResult {
  winner: 0 | 1 | null;
  stalled: boolean;
  stallReason: string | null;
  turns: number;
  p0Gold: number;
  p1Gold: number;
  utilityPlayed: Record<UtilityDesignId, number>;
  utilityActivated: Record<UtilityDesignId, number>;
  utilityPlayedBySeat: [Record<UtilityDesignId, number>, Record<UtilityDesignId, number>];
  utilityActivatedBySeat: [Record<UtilityDesignId, number>, Record<UtilityDesignId, number>];
}

function createUtilityCounter(): Record<UtilityDesignId, number> {
  return {
    well: 0,
    drums: 0,
    throne: 0,
    boat: 0,
    scale: 0,
    mask_of_transformation: 0,
    supplies: 0,
    kettle: 0,
    leopard_statue: 0,
    weapons: 0,
  };
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
  const utilityPlayed = createUtilityCounter();
  const utilityActivated = createUtilityCounter();
  const utilityPlayedBySeat: [Record<UtilityDesignId, number>, Record<UtilityDesignId, number>] = [
    createUtilityCounter(),
    createUtilityCounter(),
  ];
  const utilityActivatedBySeat: [Record<UtilityDesignId, number>, Record<UtilityDesignId, number>] = [
    createUtilityCounter(),
    createUtilityCounter(),
  ];

  while (state.phase !== 'GAME_OVER' && steps < limits.maxSteps) {
    if (Date.now() - startedAt > limits.maxGameMs) {
      return {
        winner: null as 0 | 1 | null,
        stalled: true,
        stallReason: `game-timeout>${limits.maxGameMs}ms`,
        turns: state.turn,
        p0Gold: state.players[0].gold,
        p1Gold: state.players[1].gold,
        utilityPlayed,
        utilityActivated,
        utilityPlayedBySeat,
        utilityActivatedBySeat,
      } satisfies GameRunResult;
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
        utilityPlayed,
        utilityActivated,
        utilityPlayedBySeat,
        utilityActivatedBySeat,
      } satisfies GameRunResult;
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
        utilityPlayed,
        utilityActivated,
        utilityPlayedBySeat,
        utilityActivatedBySeat,
      } satisfies GameRunResult;
    }

    if (action.type === 'PLAY_CARD') {
      const card = getCard(action.cardId);
      if (card.type === 'utility') {
        utilityPlayed[card.designId as UtilityDesignId] += 1;
        utilityPlayedBySeat[responder][card.designId as UtilityDesignId] += 1;
      }
    }

    if (action.type === 'ACTIVATE_UTILITY') {
      const utility = state.players[state.currentPlayer].utilities[action.utilityIndex];
      if (utility) {
        utilityActivated[utility.designId] += 1;
        utilityActivatedBySeat[responder][utility.designId] += 1;
      }
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
          utilityPlayed,
          utilityActivated,
          utilityPlayedBySeat,
          utilityActivatedBySeat,
        } satisfies GameRunResult;
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
          utilityPlayed,
          utilityActivated,
          utilityPlayedBySeat,
          utilityActivatedBySeat,
        } satisfies GameRunResult;
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
    utilityPlayed,
    utilityActivated,
    utilityPlayedBySeat,
    utilityActivatedBySeat,
  } satisfies GameRunResult;
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
  const utilityPlayed = createUtilityCounter();
  const utilityActivated = createUtilityCounter();
  const utilityPlayedBySeat: [Record<UtilityDesignId, number>, Record<UtilityDesignId, number>] = [
    createUtilityCounter(),
    createUtilityCounter(),
  ];
  const utilityActivatedBySeat: [Record<UtilityDesignId, number>, Record<UtilityDesignId, number>] = [
    createUtilityCounter(),
    createUtilityCounter(),
  ];

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

    for (const key of Object.keys(utilityPlayed) as UtilityDesignId[]) {
      utilityPlayed[key] += result.utilityPlayed[key] ?? 0;
      utilityActivated[key] += result.utilityActivated[key] ?? 0;
      utilityPlayedBySeat[0][key] += result.utilityPlayedBySeat[0][key] ?? 0;
      utilityPlayedBySeat[1][key] += result.utilityPlayedBySeat[1][key] ?? 0;
      utilityActivatedBySeat[0][key] += result.utilityActivatedBySeat[0][key] ?? 0;
      utilityActivatedBySeat[1][key] += result.utilityActivatedBySeat[1][key] ?? 0;
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
    p0WinRate: Number((p0Wins / games).toFixed(4)),
    p1WinRate: Number((p1Wins / games).toFixed(4)),
    decisiveSkew: Number((Math.abs(p0Wins - p1Wins) / games).toFixed(4)),
    skewFlag: Math.abs(p0Wins - p1Wins) / games >= 0.2
      ? 'high'
      : Math.abs(p0Wins - p1Wins) / games >= 0.1
        ? 'moderate'
        : 'none',
    stalls,
    avgTurns: Number((totalTurns / games).toFixed(2)),
    avgGoldP0: Number((totalGoldP0 / games).toFixed(2)),
    avgGoldP1: Number((totalGoldP1 / games).toFixed(2)),
    avgGoldDelta: Number(((totalGoldP0 - totalGoldP1) / games).toFixed(2)),
    stallReasons,
    utilityStats: {
      played: utilityPlayed,
      activated: utilityActivated,
      bySeat: {
        p0: {
          played: utilityPlayedBySeat[0],
          activated: utilityActivatedBySeat[0],
        },
        p1: {
          played: utilityPlayedBySeat[1],
          activated: utilityActivatedBySeat[1],
        },
      },
    },
  };

  return summary;
}

export const DEFAULT_MATCHUPS: Array<[AIDifficulty, AIDifficulty]> = [
  ['easy', 'easy'],
  ['easy', 'medium'],
  ['easy', 'hard'],
  ['medium', 'medium'],
  ['medium', 'hard'],
  ['hard', 'medium'],
  ['hard', 'hard'],
  ['hard', 'expert'],
  ['expert', 'hard'],
  ['expert', 'expert'],
];

export interface MatchupRunResult {
  gamesPerMatchup: number;
  seedBase: number;
  maxSteps: number;
  maxGameMs: number;
  summaries: MatchSummary[];
}

export function runAiMatchups(
  games: number,
  seedBase: number,
  limits: RunLimits,
  matchups: Array<[AIDifficulty, AIDifficulty]> = DEFAULT_MATCHUPS,
): MatchupRunResult {
  const summaries = matchups.map(([p0, p1], idx) => runMatchup(p0, p1, games, seedBase + idx * 1000, limits));
  return {
    gamesPerMatchup: games,
    seedBase,
    maxSteps: limits.maxSteps,
    maxGameMs: limits.maxGameMs,
    summaries,
  };
}

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const games = Number(process.argv[2] ?? 30);
  const seedBase = Number(process.argv[3] ?? 9000);
  const maxSteps = Number(process.argv[4] ?? 2500);
  const maxGameMs = Number(process.argv[5] ?? 15000);
  const limits: RunLimits = { maxSteps, maxGameMs };

  const result = runAiMatchups(games, seedBase, limits);
  console.log(JSON.stringify(result, null, 2));
}
