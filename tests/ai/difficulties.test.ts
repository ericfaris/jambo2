import { describe, expect, it } from 'vitest';
import { validateAction } from '../../src/engine/validation/actionValidator.ts';
import { getEasyAiAction } from '../../src/ai/difficulties/EasyAI.ts';
import { getMediumAiAction } from '../../src/ai/difficulties/MediumAI.ts';
import { getHardAiAction } from '../../src/ai/difficulties/HardAI.ts';
import { getAiActionByDifficulty } from '../../src/ai/difficulties/index.ts';
import { createTestState, toPlayPhase, withGold, withHand, withMarket, withUtility } from '../helpers/testHelpers.ts';

describe('AI difficulties baseline', () => {
  it('returns valid PLAY actions for all difficulty levels', () => {
    let state = toPlayPhase(createTestState(321));
    state = withHand(state, 0, ['ware_3k_1', 'ware_3h_1', 'well_1']);
    state = withGold(state, 0, 20);

    const easy = getEasyAiAction(state);
    const medium = getMediumAiAction(state);
    const hard = getHardAiAction(state);

    expect(easy).not.toBeNull();
    expect(medium).not.toBeNull();
    expect(hard).not.toBeNull();

    expect(validateAction(state, easy!).valid).toBe(true);
    expect(validateAction(state, medium!).valid).toBe(true);
    expect(validateAction(state, hard!).valid).toBe(true);
  });

  it('handles pending interaction states across all difficulties', () => {
    let state = createTestState(11);
    state = {
      ...state,
      pendingResolution: {
        type: 'BINARY_CHOICE',
        sourceCard: 'carrier_1',
        options: ['wares', 'cards'],
      },
    };

    const easy = getEasyAiAction(state, () => 0.1);
    const medium = getMediumAiAction(state, () => 0.1);
    const hard = getHardAiAction(state, () => 0.1);

    expect(easy).toEqual({ type: 'RESOLVE_INTERACTION', response: { type: 'BINARY_CHOICE', choice: 0 } });
    expect(medium).toEqual({ type: 'RESOLVE_INTERACTION', response: { type: 'BINARY_CHOICE', choice: 0 } });
    expect(hard).toEqual({ type: 'RESOLVE_INTERACTION', response: { type: 'BINARY_CHOICE', choice: 0 } });
  });

  it('is deterministic when injected with seeded rng', () => {
    let state = toPlayPhase(createTestState(77));
    state = withHand(state, 0, ['ware_3k_1', 'well_1']);
    state = withGold(state, 0, 20);

    const seeded = () => 0.2;
    expect(getMediumAiAction(state, seeded)).toEqual(getMediumAiAction(state, seeded));
    expect(getHardAiAction(state, seeded)).toEqual(getHardAiAction(state, seeded));
  });

  it('routes by selected difficulty', () => {
    let state = createTestState(12);
    state = {
      ...state,
      pendingGuardReaction: {
        animalCard: 'parrot_1',
        targetPlayer: 0,
      },
    };

    const low = () => 0.0;
    const high = () => 0.99;

    expect(getAiActionByDifficulty(state, 'easy', low)).toEqual({ type: 'GUARD_REACTION', play: true });
    expect(getAiActionByDifficulty(state, 'medium', high)).toEqual({ type: 'GUARD_REACTION', play: false });
    expect(getAiActionByDifficulty(state, 'hard', low)).toEqual({ type: 'GUARD_REACTION', play: true });
  });

  it('medium and hard prefer profitable ware sell over ending turn', () => {
    let state = toPlayPhase(createTestState(444));
    state = withHand(state, 0, ['ware_3k_1']);
    state = withMarket(state, 0, ['trinkets', 'trinkets', 'trinkets', null, null, null]);
    state = withGold(state, 0, 20);

    const medium = getMediumAiAction(state, () => 0.1);
    const hard = getHardAiAction(state, () => 0.1);

    expect(medium).toEqual({ type: 'PLAY_CARD', cardId: 'ware_3k_1', wareMode: 'sell' });
    expect(hard).toEqual({ type: 'PLAY_CARD', cardId: 'ware_3k_1', wareMode: 'sell' });
  });

  it('medium keeps a strong drawn card in draw phase', () => {
    let state = createTestState(1001);
    state = {
      ...state,
      phase: 'DRAW',
      drawnCard: 'wise_man_1',
    };

    const action = getMediumAiAction(state, () => 0.1);
    expect(action).toEqual({ type: 'KEEP_CARD' });
  });

  it('can choose utility play when utility area is full (triggers replacement)', () => {
    let state = toPlayPhase(createTestState(2026));
    state = withUtility(state, 0, 'well_1', 'well');
    state = withUtility(state, 0, 'drums_1', 'drums');
    state = withUtility(state, 0, 'throne_1', 'throne');
    state = withHand(state, 0, ['drums_3']);

    const easy = getEasyAiAction(state, () => 0.1);
    const medium = getMediumAiAction(state, () => 0.1);
    const hard = getHardAiAction(state, () => 0.1);

    expect(easy).not.toBeNull();
    expect(medium).not.toBeNull();
    expect(hard).not.toBeNull();

    expect(validateAction(state, easy!).valid).toBe(true);
    expect(validateAction(state, medium!).valid).toBe(true);
    expect(validateAction(state, hard!).valid).toBe(true);
  });
});
