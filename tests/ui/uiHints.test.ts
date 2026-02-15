import { describe, expect, it } from 'vitest';
import { formatResolutionBreadcrumb, getDrawDisabledReason, getPlayDisabledReason } from '../../src/ui/uiHints.ts';
import { createTestState, toPlayPhase, act, withHand, removeFromDeck } from '../helpers/testHelpers.ts';

describe('uiHints', () => {
  it('returns play disabled reason for draw phase', () => {
    const reason = getPlayDisabledReason({
      phase: 'DRAW',
      currentPlayer: 0,
      actionsLeft: 5,
      hasPendingInteraction: false,
      isAiTurn: false,
    });

    expect(reason).toMatch(/Play phase/i);
  });

  it('returns draw disabled reason when not local turn', () => {
    const reason = getDrawDisabledReason({
      phase: 'DRAW',
      currentPlayer: 1,
      isAiTurn: true,
    });

    expect(reason).toMatch(/your turn/i);
  });

  it('formats breadcrumb for Tribal Elder discard resolution', () => {
    let state = toPlayPhase(createTestState());
    state = withHand(state, 0, ['tribal_elder_1']);
    state = withHand(state, 1, ['ware_3k_1', 'ware_3h_1', 'ware_3t_1', 'ware_3l_1', 'ware_3f_1']);
    state = removeFromDeck(state, 'tribal_elder_1');
    state = removeFromDeck(state, 'ware_3k_1');
    state = removeFromDeck(state, 'ware_3h_1');
    state = removeFromDeck(state, 'ware_3t_1');
    state = removeFromDeck(state, 'ware_3l_1');
    state = removeFromDeck(state, 'ware_3f_1');

    const afterPlay = act(state, { type: 'PLAY_CARD', cardId: 'tribal_elder_1' });
    const afterChoice = act(afterPlay, { type: 'RESOLVE_INTERACTION', response: { type: 'BINARY_CHOICE', choice: 1 } });

    expect(afterChoice.pendingResolution?.type).toBe('OPPONENT_DISCARD');
    const breadcrumb = formatResolutionBreadcrumb(afterChoice.pendingResolution!);
    expect(breadcrumb).toContain('Tribal Elder');
    expect(breadcrumb).toContain('3');
  });
});
