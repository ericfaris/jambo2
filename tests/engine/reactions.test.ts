// ============================================================================
// Reaction Tests — Guard + Rain Maker
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  createTestState,
  toPlayPhase,
  act,
  withHand,
  withMarket,
  withGold,
  removeFromDeck,
  hand,
  gold,
} from '../helpers/testHelpers.ts';
import { processAction } from '../../src/engine/GameEngine.ts';

describe('Guard Reaction', () => {
  /** Helper: set up a state where P0 plays an animal and P1 has a Guard. */
  function setupGuardScenario() {
    let s = toPlayPhase(createTestState());
    // P0 has parrot_1, P1 has guard_1
    s = withHand(s, 0, ['parrot_1']);
    s = withHand(s, 1, ['guard_1']);
    s = removeFromDeck(s, 'parrot_1');
    s = removeFromDeck(s, 'guard_1');
    // P1 needs a ware for parrot to steal if guard is declined
    s = withMarket(s, 1, ['trinkets', null, null, null, null, null]);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 5 } };
    return s;
  }

  it('animal triggers guard window when opponent has guard', () => {
    const s = setupGuardScenario();
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'parrot_1' });
    expect(s2.pendingGuardReaction).not.toBeNull();
    expect(s2.pendingGuardReaction!.animalCard).toBe('parrot_1');
    expect(s2.pendingGuardReaction!.targetPlayer).toBe(1);
  });

  it('guard play cancels animal, both cards discarded', () => {
    const s = setupGuardScenario();
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'parrot_1' });
    const s3 = act(s2, { type: 'GUARD_REACTION', play: true });

    // Guard reaction cleared
    expect(s3.pendingGuardReaction).toBeNull();
    // No pending resolution (animal was cancelled)
    expect(s3.pendingResolution).toBeNull();
    // Both cards in discard
    expect(s3.discardPile).toContain('guard_1');
    expect(s3.discardPile).toContain('parrot_1');
    // Guard removed from P1's hand
    expect(hand(s3, 1)).not.toContain('guard_1');
  });

  it('guard decline: animal effect proceeds', () => {
    const s = setupGuardScenario();
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'parrot_1' });
    const s3 = act(s2, { type: 'GUARD_REACTION', play: false });

    // Guard reaction cleared, pending resolution set for Parrot
    expect(s3.pendingGuardReaction).toBeNull();
    expect(s3.pendingResolution).not.toBeNull();
    expect(s3.pendingResolution!.type).toBe('WARE_THEFT_SINGLE');
    // Guard still in P1's hand (they declined, didn't play it)
    expect(hand(s3, 1)).toContain('guard_1');
  });

  it('no guard in hand: animal effect fires immediately', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['parrot_1']);
    s = withHand(s, 1, ['ware_3k_1']); // no guard
    s = removeFromDeck(s, 'parrot_1');
    s = removeFromDeck(s, 'ware_3k_1');
    s = withMarket(s, 1, ['trinkets', null, null, null, null, null]);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 5 } };

    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'parrot_1' });
    // No guard window — goes straight to resolution
    expect(s2.pendingGuardReaction).toBeNull();
    expect(s2.pendingResolution).not.toBeNull();
    expect(s2.pendingResolution!.type).toBe('WARE_THEFT_SINGLE');
  });

  it('cannot send guard reaction when none pending', () => {
    const s = toPlayPhase(createTestState());
    expect(() => processAction(s, { type: 'GUARD_REACTION', play: true })).toThrow();
  });
});

describe('Rain Maker Reaction', () => {
  /** Helper: set up P0 buys wares, P1 has Rain Maker. */
  function setupRainMakerScenario() {
    let s = toPlayPhase(createTestState());
    // P0 has ware_3k_1, P1 has rain_maker_1
    s = withHand(s, 0, ['ware_3k_1']);
    s = withHand(s, 1, ['rain_maker_1']);
    s = removeFromDeck(s, 'ware_3k_1');
    s = removeFromDeck(s, 'rain_maker_1');
    s = withGold(s, 0, 20);
    return s;
  }

  it('ware card triggers Rain Maker window', () => {
    const s = setupRainMakerScenario();
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'ware_3k_1', wareMode: 'buy' });
    expect(s2.pendingWareCardReaction).not.toBeNull();
    expect(s2.pendingWareCardReaction!.wareCardId).toBe('ware_3k_1');
    expect(s2.pendingWareCardReaction!.targetPlayer).toBe(1);
  });

  it('Rain Maker play: takes ware card from discard, discards Rain Maker', () => {
    const s = setupRainMakerScenario();
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'ware_3k_1', wareMode: 'buy' });
    const s3 = act(s2, { type: 'WARE_CARD_REACTION', play: true });

    expect(s3.pendingWareCardReaction).toBeNull();
    // P1 got the ware card
    expect(hand(s3, 1)).toContain('ware_3k_1');
    // Rain Maker discarded
    expect(hand(s3, 1)).not.toContain('rain_maker_1');
    expect(s3.discardPile).toContain('rain_maker_1');
  });

  it('Rain Maker decline: no effect', () => {
    const s = setupRainMakerScenario();
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'ware_3k_1', wareMode: 'buy' });
    const s3 = act(s2, { type: 'WARE_CARD_REACTION', play: false });

    expect(s3.pendingWareCardReaction).toBeNull();
    // Rain Maker still in P1's hand
    expect(hand(s3, 1)).toContain('rain_maker_1');
    // Ware card remains in discard
    expect(s3.discardPile).toContain('ware_3k_1');
  });

  it('cannot send ware card reaction when none pending', () => {
    const s = toPlayPhase(createTestState());
    expect(() => processAction(s, { type: 'WARE_CARD_REACTION', play: true })).toThrow();
  });
});
