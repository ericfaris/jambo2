import { create } from 'zustand';
import type { GameState, GameAction } from '../engine/types.ts';
import { processAction } from '../engine/GameEngine.ts';
import { createInitialState } from '../engine/GameState.ts';
import {
  createReplayLog,
  exportReplayLog,
  importReplayLog,
  replayToState,
} from '../persistence/replayLog.ts';

export interface TaggedAction {
  player: 0 | 1;
  playerLabel: string;
  action: GameAction;
}

interface GameStore {
  state: GameState;
  error: string | null;
  replayActions: GameAction[];
  taggedActions: TaggedAction[];
  dispatch: (action: GameAction, playerLabel?: string) => void;
  newGame: (seed?: number, startingPlayer?: 0 | 1) => void;
  exportReplay: () => string;
  importReplay: (payload: string) => void;
}

function getResponder(state: GameState): 0 | 1 {
  if (state.pendingGuardReaction) return state.pendingGuardReaction.targetPlayer;
  if (state.pendingWareCardReaction) return state.pendingWareCardReaction.targetPlayer;
  if (state.pendingResolution) {
    const pr = state.pendingResolution;
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
  return state.currentPlayer;
}

export const useGameStore = create<GameStore>((set) => ({
  state: createInitialState(),
  error: null,
  replayActions: [],
  taggedActions: [],

  dispatch: (action: GameAction, playerLabel?: string) => {
    set((store) => {
      try {
        const player = getResponder(store.state);
        const label = playerLabel ?? (player === 0 ? 'Player' : 'AI');
        const next = processAction(store.state, action);
        const tagged: TaggedAction = { player, playerLabel: label, action };
        return {
          state: next,
          error: null,
          replayActions: [...store.replayActions, action],
          taggedActions: [...store.taggedActions, tagged],
        };
      } catch (e) {
        return { error: (e as Error).message };
      }
    });
  },

  newGame: (seed?: number, startingPlayer: 0 | 1 = 0) => {
    const initial = createInitialState(seed);
    const next = startingPlayer === 0
      ? initial
      : {
          ...initial,
          currentPlayer: 1 as const,
        };
    set({ state: next, error: null, replayActions: [], taggedActions: [] });
  },

  exportReplay: () => {
    const store = useGameStore.getState();
    const replay = createReplayLog(store.state, store.replayActions);
    return exportReplayLog(replay);
  },

  importReplay: (payload: string) => {
    const replay = importReplayLog(payload);
    const state = replayToState(replay);
    set({ state, error: null, replayActions: [...replay.actions], taggedActions: [] });
  },
}));
