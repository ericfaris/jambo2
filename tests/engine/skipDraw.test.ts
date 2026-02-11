// ============================================================================
// Skip Draw Phase Tests — SKIP_DRAW action validation and behavior
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  createTestState,
  act,
} from '../helpers/testHelpers.ts';
import { CONSTANTS } from '../../src/engine/types.ts';
import { validateAction } from '../../src/engine/validation/actionValidator.ts';
import { getValidActions } from '../../src/engine/validation/actionValidator.ts';

describe('SKIP_DRAW', () => {
  it('transitions from DRAW to PLAY phase', () => {
    const s0 = createTestState();
    expect(s0.phase).toBe('DRAW');

    const s1 = act(s0, { type: 'SKIP_DRAW' });
    expect(s1.phase).toBe('PLAY');
    expect(s1.actionsLeft).toBe(CONSTANTS.MAX_ACTIONS); // no actions consumed
  });

  it('preserves all 5 actions when skipping', () => {
    const s0 = createTestState();
    const s1 = act(s0, { type: 'SKIP_DRAW' });
    expect(s1.actionsLeft).toBe(5);
  });

  it('adds a log entry for the skip', () => {
    const s0 = createTestState();
    const s1 = act(s0, { type: 'SKIP_DRAW' });
    const lastLog = s1.log[s1.log.length - 1];
    expect(lastLog.action).toBe('SKIP_DRAW');
  });

  it('is rejected during PLAY phase', () => {
    const s0 = createTestState();
    const s1 = act(s0, { type: 'SKIP_DRAW' }); // now in PLAY
    expect(s1.phase).toBe('PLAY');

    const result = validateAction(s1, { type: 'SKIP_DRAW' });
    expect(result.valid).toBe(false);
    expect(() => act(s1, { type: 'SKIP_DRAW' })).toThrow();
  });

  it('is rejected with a pending drawn card', () => {
    const s0 = createTestState();
    const s1 = act(s0, { type: 'DRAW_CARD' });
    expect(s1.drawnCard).not.toBeNull();

    const result = validateAction(s1, { type: 'SKIP_DRAW' });
    expect(result.valid).toBe(false);
    expect(() => act(s1, { type: 'SKIP_DRAW' })).toThrow();
  });

  it('is available after discarding a drawn card', () => {
    const s0 = createTestState();
    const s1 = act(s0, { type: 'DRAW_CARD' });
    const s2 = act(s1, { type: 'DISCARD_DRAWN' });
    // Still in DRAW phase, no pending card
    expect(s2.phase).toBe('DRAW');
    expect(s2.drawnCard).toBeNull();

    const result = validateAction(s2, { type: 'SKIP_DRAW' });
    expect(result.valid).toBe(true);

    const s3 = act(s2, { type: 'SKIP_DRAW' });
    expect(s3.phase).toBe('PLAY');
  });

  it('appears in getValidActions during DRAW phase', () => {
    const s0 = createTestState();
    const actions = getValidActions(s0);
    const skipActions = actions.filter(a => a.type === 'SKIP_DRAW');
    expect(skipActions.length).toBe(1);
  });

  it('does not appear in getValidActions during PLAY phase', () => {
    const s0 = createTestState();
    const s1 = act(s0, { type: 'SKIP_DRAW' });
    const actions = getValidActions(s1);
    const skipActions = actions.filter(a => a.type === 'SKIP_DRAW');
    expect(skipActions.length).toBe(0);
  });

  it('does not appear in getValidActions when a card is drawn', () => {
    const s0 = createTestState();
    const s1 = act(s0, { type: 'DRAW_CARD' });
    const actions = getValidActions(s1);
    const skipActions = actions.filter(a => a.type === 'SKIP_DRAW');
    expect(skipActions.length).toBe(0);
  });
});
