// ============================================================================
// Utility Replace Tests — playing a utility when at max (3) triggers replacement
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  createTestState,
  toPlayPhase,
  act,
  resolve,
  withHand,
  withUtility,
  utilities,
} from '../helpers/testHelpers.ts';
import { CONSTANTS } from '../../src/engine/types.ts';
import { validateAction } from '../../src/engine/validation/actionValidator.ts';

describe('Utility Replace', () => {
  /** Set up a state where player 0 has 3 utilities and a utility card in hand. */
  function setupMaxUtilities() {
    let s = createTestState();
    s = toPlayPhase(s);
    // Give player 0 three utilities
    s = withUtility(s, 0, 'well_1', 'well');
    s = withUtility(s, 0, 'drums_1', 'drums');
    s = withUtility(s, 0, 'throne_1', 'throne');
    // Put a utility card in hand
    s = withHand(s, 0, ['boat_1']);
    return s;
  }

  it('validation allows playing a utility when at max', () => {
    const s = setupMaxUtilities();
    expect(utilities(s, 0).length).toBe(CONSTANTS.MAX_UTILITIES);
    const result = validateAction(s, { type: 'PLAY_CARD', cardId: 'boat_1' });
    expect(result.valid).toBe(true);
  });

  it('playing a utility at max triggers UTILITY_REPLACE pending resolution', () => {
    const s = setupMaxUtilities();
    const next = act(s, { type: 'PLAY_CARD', cardId: 'boat_1' });
    expect(next.pendingResolution).not.toBeNull();
    expect(next.pendingResolution!.type).toBe('UTILITY_REPLACE');
    // Card should be removed from hand
    expect(next.players[0].hand).not.toContain('boat_1');
    // Still have 3 utilities (replacement not yet resolved)
    expect(utilities(next, 0).length).toBe(3);
  });

  it('resolving with SELECT_UTILITY replaces the chosen utility', () => {
    let s = setupMaxUtilities();
    s = act(s, { type: 'PLAY_CARD', cardId: 'boat_1' });
    expect(s.pendingResolution!.type).toBe('UTILITY_REPLACE');

    // Replace the second utility (drums_1 at index 1)
    const next = resolve(s, { type: 'SELECT_UTILITY', utilityIndex: 1 });
    expect(next.pendingResolution).toBeNull();
    const utils = utilities(next, 0);
    expect(utils.length).toBe(3);
    // Index 1 should now be the boat
    expect(utils[1].cardId).toBe('boat_1');
    expect(utils[1].designId).toBe('boat');
    expect(utils[1].usedThisTurn).toBe(false);
    // Old utilities at other indices unchanged
    expect(utils[0].cardId).toBe('well_1');
    expect(utils[2].cardId).toBe('throne_1');
    // Discarded utility should be in discard pile
    expect(next.discardPile).toContain('drums_1');
  });

  it('resolving with SELECT_UTILITY at index 0 replaces first utility', () => {
    let s = setupMaxUtilities();
    s = act(s, { type: 'PLAY_CARD', cardId: 'boat_1' });
    const next = resolve(s, { type: 'SELECT_UTILITY', utilityIndex: 0 });
    const utils = utilities(next, 0);
    expect(utils[0].cardId).toBe('boat_1');
    expect(utils[0].designId).toBe('boat');
    expect(next.discardPile).toContain('well_1');
  });

  it('throws on invalid utility index', () => {
    let s = setupMaxUtilities();
    s = act(s, { type: 'PLAY_CARD', cardId: 'boat_1' });
    expect(() => resolve(s, { type: 'SELECT_UTILITY', utilityIndex: 5 })).toThrow();
  });

  it('playing a utility below max does not trigger replacement', () => {
    let s = createTestState();
    s = toPlayPhase(s);
    s = withUtility(s, 0, 'well_1', 'well');
    s = withHand(s, 0, ['drums_1']);
    const next = act(s, { type: 'PLAY_CARD', cardId: 'drums_1' });
    // Should not have pending resolution — utility placed directly
    expect(next.pendingResolution).toBeNull();
    expect(utilities(next, 0).length).toBe(2);
    expect(utilities(next, 0)[1].cardId).toBe('drums_1');
  });
});
