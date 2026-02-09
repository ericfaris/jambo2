import { create } from 'zustand';
import type { GameState, GameAction } from '../engine/types.ts';
import { processAction } from '../engine/GameEngine.ts';
import { createInitialState } from '../engine/GameState.ts';

interface GameStore {
  state: GameState;
  error: string | null;
  dispatch: (action: GameAction) => void;
  newGame: (seed?: number) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  state: createInitialState(),
  error: null,

  dispatch: (action: GameAction) => {
    set((store) => {
      try {
        const next = processAction(store.state, action);
        return { state: next, error: null };
      } catch (e) {
        return { error: (e as Error).message };
      }
    });
  },

  newGame: (seed?: number) => {
    set({ state: createInitialState(seed), error: null });
  },
}));
