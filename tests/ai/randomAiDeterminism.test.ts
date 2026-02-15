import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/utils/rng.ts';
import { getRandomAiAction } from '../../src/ai/RandomAI.ts';
import { createTestState, toPlayPhase, withHand, withGold } from '../helpers/testHelpers.ts';

describe('RandomAI determinism', () => {
  it('returns the same action for the same state by default', () => {
    let state = toPlayPhase(createTestState(123));
    state = withHand(state, 0, ['ware_3k_1', 'ware_3h_1', 'well_1']);
    state = withGold(state, 0, 20);

    const first = getRandomAiAction(state);
    const second = getRandomAiAction(state);

    expect(first).toEqual(second);
  });

  it('uses injected seeded RNG deterministically', () => {
    let state = toPlayPhase(createTestState(7));
    state = {
      ...state,
      pendingResolution: {
        type: 'BINARY_CHOICE',
        sourceCard: 'carrier_1',
        options: ['take wares', 'draw cards'],
      },
    };

    const a = getRandomAiAction(state, createRng(99));
    const b = getRandomAiAction(state, createRng(99));

    expect(a).toEqual(b);
  });

  it('respects injected RNG values for reaction decisions', () => {
    let state = createTestState(42);
    state = {
      ...state,
      pendingGuardReaction: {
        animalCard: 'parrot_1',
        targetPlayer: 0,
      },
    };

    const alwaysLow = () => 0.0;
    const alwaysHigh = () => 0.99;

    expect(getRandomAiAction(state, alwaysLow)).toEqual({ type: 'GUARD_REACTION', play: true });
    expect(getRandomAiAction(state, alwaysHigh)).toEqual({ type: 'GUARD_REACTION', play: false });
  });
});
