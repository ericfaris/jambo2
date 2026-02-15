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

interface GameStore {
  state: GameState;
  error: string | null;
  replayActions: GameAction[];
  dispatch: (action: GameAction) => void;
  newGame: (seed?: number) => void;
  exportReplay: () => string;
  importReplay: (payload: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  state: createInitialState(),
  error: null,
  replayActions: [],

  dispatch: (action: GameAction) => {
    set((store) => {
      try {
        const next = processAction(store.state, action);
        return {
          state: next,
          error: null,
          replayActions: [...store.replayActions, action],
        };
      } catch (e) {
        return { error: (e as Error).message };
      }
    });
  },

  newGame: (seed?: number) => {
    set({ state: createInitialState(seed), error: null, replayActions: [] });
  },

  exportReplay: () => {
    const store = useGameStore.getState();
    const replay = createReplayLog(store.state, store.replayActions);
    return exportReplayLog(replay);
  },

  importReplay: (payload: string) => {
    const replay = importReplayLog(payload);
    const state = replayToState(replay);
    set({ state, error: null, replayActions: [...replay.actions] });
  },
}));
