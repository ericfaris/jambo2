import type { AIDifficulty } from '../difficulties/index.ts';
import type { GameAction, GameState } from '../../engine/types.ts';

export interface AITurnFeatureVector {
  turn: number;
  responder: 0 | 1;
  phase: GameState['phase'];
  actionsLeft: number;
  pendingType: string | null;
  hasGuardWindow: boolean;
  hasRainMakerWindow: boolean;
  myGold: number;
  oppGold: number;
  goldDiff: number;
  myHandCount: number;
  oppHandCount: number;
  handDiff: number;
  myMarketFilled: number;
  oppMarketFilled: number;
  marketDiff: number;
  myUtilityCount: number;
  oppUtilityCount: number;
  utilityDiff: number;
}

export interface AIDecisionCandidate {
  action: GameAction;
}

export interface AIDecisionTelemetryInput {
  gameId: string;
  roomCode: string;
  aiDifficulty: AIDifficulty;
  aiPlayerSlot: 0 | 1;
  turnIndex: number;
  features: AITurnFeatureVector;
  candidates: AIDecisionCandidate[];
  chosen: GameAction;
  schemaVersion: number;
  aiVersion: string;
  engineVersion: string;
  createdAt: number;
}

export interface AIGameTelemetryInput {
  gameId: string;
  roomCode: string;
  aiDifficulty: AIDifficulty;
  aiPlayerSlot: 0 | 1;
  winner: 0 | 1 | null;
  aiGold: number;
  opponentGold: number;
  turnCount: number;
  rngSeed: number;
  schemaVersion: number;
  aiVersion: string;
  engineVersion: string;
  startedAt: number;
  completedAt: number;
}

