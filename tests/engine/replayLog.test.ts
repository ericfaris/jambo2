import { describe, it, expect } from 'vitest';
import type { GameAction } from '../../src/engine/types.ts';
import { createInitialState } from '../../src/engine/GameState.ts';
import { processAction } from '../../src/engine/GameEngine.ts';
import {
  createReplayLog,
  exportReplayLog,
  importReplayLog,
  replayToState,
} from '../../src/persistence/replayLog.ts';

describe('Replay log', () => {
  it('replays deterministic final state from seed and action sequence', () => {
    const actions: GameAction[] = [
      { type: 'DRAW_CARD' },
      { type: 'KEEP_CARD' },
      { type: 'END_TURN' },
      { type: 'SKIP_DRAW' },
      { type: 'END_TURN' },
    ];

    let state = createInitialState(12345);
    for (const action of actions) {
      state = processAction(state, action);
    }

    const replay = createReplayLog(state, actions);
    const replayedState = replayToState(replay);

    expect(replayedState).toEqual(state);
  });

  it('exports and imports replay JSON losslessly', () => {
    const baseState = createInitialState(2026);
    const actions: GameAction[] = [
      { type: 'DRAW_CARD' },
      { type: 'DISCARD_DRAWN' },
      { type: 'DRAW_CARD' },
      { type: 'KEEP_CARD' },
    ];

    const replay = createReplayLog(baseState, actions);
    const payload = exportReplayLog(replay);
    const importedReplay = importReplayLog(payload);

    expect(importedReplay).toEqual(replay);
  });
});
