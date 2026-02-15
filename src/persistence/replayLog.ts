import type { GameAction, GameState, InteractionResponse } from '../engine/types.ts';
import { createInitialState } from '../engine/GameState.ts';
import { processAction } from '../engine/GameEngine.ts';

export interface ReplayLog {
  formatVersion: '1.0';
  gameVersion: string;
  createdAt: string;
  rngSeed: number;
  actions: GameAction[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function isWareType(value: unknown): boolean {
  return value === 'trinkets' || value === 'hides' || value === 'tea' || value === 'silk' || value === 'fruit' || value === 'salt';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isIntegerArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => isInteger(item));
}

function isInteractionResponse(value: unknown): value is InteractionResponse {
  if (!isObject(value) || typeof value.type !== 'string') {
    return false;
  }

  switch (value.type) {
    case 'SELECT_WARE':
      return isInteger(value.wareIndex);
    case 'SELECT_WARE_TYPE':
      return isWareType(value.wareType);
    case 'SELECT_CARD':
      return typeof value.cardId === 'string';
    case 'SELECT_CARDS':
      return isStringArray(value.cardIds);
    case 'SELECT_WARES':
      return isIntegerArray(value.wareIndices);
    case 'AUCTION_BID':
      return isInteger(value.amount);
    case 'AUCTION_PASS':
      return true;
    case 'BINARY_CHOICE':
      return value.choice === 0 || value.choice === 1;
    case 'DECK_PEEK_PICK':
      return isInteger(value.cardIndex);
    case 'DISCARD_PICK':
      return typeof value.cardId === 'string';
    case 'SELL_WARES':
      return isIntegerArray(value.wareIndices);
    case 'RETURN_WARE':
      return isInteger(value.wareIndex);
    case 'OPPONENT_DISCARD_SELECTION':
      return isIntegerArray(value.cardIndices);
    case 'OPPONENT_CHOICE':
      return value.choice === 0 || value.choice === 1;
    case 'SELECT_UTILITY':
      return isInteger(value.utilityIndex);
    default:
      return false;
  }
}

function isGameAction(value: unknown): value is GameAction {
  if (!isObject(value) || typeof value.type !== 'string') {
    return false;
  }

  switch (value.type) {
    case 'DRAW_CARD':
    case 'KEEP_CARD':
    case 'DISCARD_DRAWN':
    case 'SKIP_DRAW':
    case 'DRAW_ACTION':
    case 'END_TURN':
      return true;
    case 'PLAY_CARD':
      return typeof value.cardId === 'string' && (value.wareMode === undefined || value.wareMode === 'buy' || value.wareMode === 'sell');
    case 'ACTIVATE_UTILITY':
      return isInteger(value.utilityIndex);
    case 'RESOLVE_INTERACTION':
      return isInteractionResponse(value.response);
    case 'GUARD_REACTION':
    case 'WARE_CARD_REACTION':
      return typeof value.play === 'boolean';
    default:
      return false;
  }
}

function parseReplayLog(value: unknown): ReplayLog {
  if (!isObject(value)) {
    throw new Error('Replay payload must be an object');
  }

  if (value.formatVersion !== '1.0') {
    throw new Error('Unsupported replay format version');
  }

  if (typeof value.gameVersion !== 'string') {
    throw new Error('Replay missing gameVersion');
  }

  if (typeof value.createdAt !== 'string') {
    throw new Error('Replay missing createdAt');
  }

  if (!isInteger(value.rngSeed)) {
    throw new Error('Replay missing integer rngSeed');
  }

  if (!Array.isArray(value.actions)) {
    throw new Error('Replay actions must be an array');
  }

  if (!value.actions.every((action) => isGameAction(action))) {
    throw new Error('Replay contains invalid action entries');
  }

  return {
    formatVersion: '1.0',
    gameVersion: value.gameVersion,
    createdAt: value.createdAt,
    rngSeed: value.rngSeed,
    actions: [...value.actions],
  };
}

export function createReplayLog(
  state: GameState,
  actions: readonly GameAction[]
): ReplayLog {
  return {
    formatVersion: '1.0',
    gameVersion: state.version,
    createdAt: new Date().toISOString(),
    rngSeed: state.rngSeed,
    actions: [...actions],
  };
}

export function exportReplayLog(log: ReplayLog): string {
  return JSON.stringify(log, null, 2);
}

export function importReplayLog(payload: string): ReplayLog {
  const parsed = JSON.parse(payload) as unknown;
  return parseReplayLog(parsed);
}

export function replayToState(log: ReplayLog): GameState {
  let state = createInitialState(log.rngSeed);
  for (const action of log.actions) {
    state = processAction(state, action);
  }
  return state;
}