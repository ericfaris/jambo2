// ============================================================================
// Stall Prevention Tests — Validation blocks cards/utilities with unmet preconditions
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  createTestState,
  toPlayPhase,
  act,
  resolve,
  withHand,
  withMarket,
  withGold,
  withUtility,
  withDiscard,
  removeFromDeck,
  hand,
  gold,
  market,
  utilities,
} from '../../helpers/testHelpers.ts';
import { validateAction } from '../../../src/engine/validation/actionValidator.ts';
import { getValidActions } from '../../../src/engine/validation/actionValidator.ts';

// ============================================================================
// Animal card preconditions
// ============================================================================

describe('Crocodile: requires opponent utilities', () => {
  it('blocks when opponent has no utilities', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['crocodile_1']);
    s = withHand(s, 1, []);
    s = withGold(s, 0, 20);
    // Opponent has no utilities
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'crocodile_1' })).toThrow(/opponent has no utilities/);
  });

  it('allowed when opponent has at least 1 utility', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['crocodile_1']);
    s = withHand(s, 1, []);
    s = withGold(s, 0, 20);
    s = withUtility(s, 1, 'well_1', 'well');
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'crocodile_1' });
    expect(s2.pendingResolution!.type).toBe('CROCODILE_USE');
  });
});

describe('Parrot: requires opponent wares', () => {
  it('blocks when opponent market is empty', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['parrot_1']);
    s = withHand(s, 1, []);
    s = withGold(s, 0, 20);
    s = withMarket(s, 1, [null, null, null, null, null, null]);
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'parrot_1' })).toThrow(/opponent has no wares/);
  });
});

describe('Elephant: requires at least 1 ware total', () => {
  it('blocks when both markets are empty', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['elephant_1']);
    s = withHand(s, 1, []);
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, [null, null, null, null, null, null]);
    s = withMarket(s, 1, [null, null, null, null, null, null]);
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'elephant_1' })).toThrow(/no wares on either market/);
  });

  it('allowed when only one side has wares', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['elephant_1']);
    s = withHand(s, 1, []);
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, ['trinkets', null, null, null, null, null]);
    s = withMarket(s, 1, [null, null, null, null, null, null]);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 5 } };
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'elephant_1' });
    expect(s2.pendingResolution!.type).toBe('DRAFT');
  });
});

describe('Ape: requires at least 1 other card in either hand', () => {
  it('blocks when ape is the only card in both hands', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['ape_1']);
    s = withHand(s, 1, []);
    s = withGold(s, 0, 20);
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'ape_1' })).toThrow(/no other cards in either hand/);
  });

  it('allowed when opponent has cards', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['ape_1']);
    s = withHand(s, 1, ['ware_3k_1']);
    s = withGold(s, 0, 20);
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'ape_1' });
    expect(s2.pendingResolution!.type).toBe('DRAFT');
  });
});

describe('Lion: requires at least 1 utility total', () => {
  it('blocks when neither player has utilities', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['lion_1']);
    s = withHand(s, 1, []);
    s = withGold(s, 0, 20);
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'lion_1' })).toThrow(/no utilities on either side/);
  });
});

describe('Snake: requires at least 1 utility total', () => {
  it('blocks when neither player has utilities', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['snake_1']);
    s = withHand(s, 1, []);
    s = withGold(s, 0, 20);
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'snake_1' })).toThrow(/no utilities on either side/);
  });
});

// ============================================================================
// People card preconditions
// ============================================================================

describe('Hyena: requires opponent hand cards', () => {
  it('blocks when opponent hand is empty', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['hyena_1']);
    s = withHand(s, 1, []);
    s = removeFromDeck(s, 'hyena_1');
    s = withGold(s, 0, 20);
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'hyena_1' })).toThrow(/opponent has no cards in hand/);
  });

  it('allowed when opponent has cards', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['hyena_1', 'ware_3k_1']);
    s = withHand(s, 1, ['ware_3h_1']);
    s = removeFromDeck(s, 'hyena_1');
    s = removeFromDeck(s, 'ware_3k_1');
    s = removeFromDeck(s, 'ware_3h_1');
    s = withGold(s, 0, 20);
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'hyena_1' });
    expect(s2.pendingResolution!.type).toBe('HAND_SWAP');
  });
});

describe('Shaman: requires wares in market', () => {
  it('blocks when market is empty', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['shaman_1']);
    s = removeFromDeck(s, 'shaman_1');
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, [null, null, null, null, null, null]);
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'shaman_1' })).toThrow(/no wares in market/);
  });
});

describe('Traveling Merchant: wares come from supply', () => {
  it('can be played even with empty market (wares come from supply)', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['traveling_merchant_1']);
    s = removeFromDeck(s, 'traveling_merchant_1');
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, [null, null, null, null, null, null]);
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'traveling_merchant_1' });
    expect(s2.pendingResolution!.type).toBe('AUCTION');
    expect((s2.pendingResolution as any).wares.length).toBe(0); // wares not yet selected
  });
});

describe('Basket Maker: requires 2g and 2 empty market slots', () => {
  it('blocks with insufficient gold', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['basket_maker_1']);
    s = removeFromDeck(s, 'basket_maker_1');
    s = withGold(s, 0, 1);
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'basket_maker_1' })).toThrow(/need at least 2g/);
  });

  it('blocks with fewer than 2 empty market slots', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['basket_maker_1']);
    s = removeFromDeck(s, 'basket_maker_1');
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, ['trinkets', 'hides', 'tea', 'silk', 'fruit', null]);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 5, hides: 5, tea: 5, silk: 5, fruit: 5 } };
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'basket_maker_1' })).toThrow(/need at least 2 empty market slots/);
  });

  it('allowed when 2g and 2+ empty slots', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['basket_maker_1']);
    s = removeFromDeck(s, 'basket_maker_1');
    s = withGold(s, 0, 20);
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'basket_maker_1' });
    expect(s2.pendingResolution!.type).toBe('WARE_SELECT_MULTIPLE');
  });
});

describe('Dancer: requires ware card in hand and >= 3 wares in market', () => {
  it('blocks when no ware cards in hand', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['dancer_1']);
    s = removeFromDeck(s, 'dancer_1');
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, ['trinkets', 'hides', 'tea', null, null, null]);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 5, hides: 5, tea: 5 } };
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'dancer_1' })).toThrow(/no ware cards in hand/);
  });

  it('blocks when fewer than 3 wares in market', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['dancer_1', 'ware_3k_1']);
    s = removeFromDeck(s, 'dancer_1');
    s = removeFromDeck(s, 'ware_3k_1');
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, ['trinkets', 'hides', null, null, null, null]);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 5, hides: 5 } };
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'dancer_1' })).toThrow(/need at least 3 wares/);
  });
});

describe('Drummer: requires utility in discard pile', () => {
  it('blocks when discard has no utility cards', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['drummer_1']);
    s = withGold(s, 0, 20);
    // Discard pile has no utility cards (only ware/people/etc from removeFromDeck)
    // Clear discard pile
    s = { ...s, discardPile: [] };
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'drummer_1' })).toThrow(/no utility cards in discard pile/);
  });
});

// ============================================================================
// Utility activation preconditions
// ============================================================================

describe('Drums: requires wares in market', () => {
  it('blocks with empty market', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, []);
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, [null, null, null, null, null, null]);
    s = withUtility(s, 0, 'drums_1', 'drums');
    expect(() => act(s, { type: 'ACTIVATE_UTILITY', utilityIndex: 0 })).toThrow(/no wares in market/);
  });

  it('allowed when market has wares', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, []);
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, ['trinkets', null, null, null, null, null]);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 5 } };
    s = withUtility(s, 0, 'drums_1', 'drums');
    const s2 = act(s, { type: 'ACTIVATE_UTILITY', utilityIndex: 0 });
    expect(s2.pendingResolution!.type).toBe('UTILITY_EFFECT');
  });
});

describe('Boat: requires cards in hand and empty market slot', () => {
  it('blocks with empty hand', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, []);
    s = withGold(s, 0, 20);
    s = withUtility(s, 0, 'boat_1', 'boat');
    expect(() => act(s, { type: 'ACTIVATE_UTILITY', utilityIndex: 0 })).toThrow(/no cards in hand/);
  });

  it('blocks with full market', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['ware_3k_1']);
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, ['trinkets', 'hides', 'tea', 'silk', 'fruit', 'salt']);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 5, hides: 5, tea: 5, silk: 5, fruit: 5, salt: 5 } };
    s = withUtility(s, 0, 'boat_1', 'boat');
    expect(() => act(s, { type: 'ACTIVATE_UTILITY', utilityIndex: 0 })).toThrow(/no empty market slots/);
  });
});

describe('Weapons: requires cards in hand', () => {
  it('blocks with empty hand', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, []);
    s = withGold(s, 0, 20);
    s = withUtility(s, 0, 'weapons_1', 'weapons');
    expect(() => act(s, { type: 'ACTIVATE_UTILITY', utilityIndex: 0 })).toThrow(/no cards in hand/);
  });
});

describe('Kettle: requires cards in hand', () => {
  it('blocks with empty hand', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, []);
    s = withGold(s, 0, 20);
    s = withUtility(s, 0, 'kettle_1', 'kettle');
    expect(() => act(s, { type: 'ACTIVATE_UTILITY', utilityIndex: 0 })).toThrow(/no cards in hand/);
  });
});

describe('Throne: requires opponent wares', () => {
  it('blocks when opponent market is empty', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, []);
    s = withGold(s, 0, 20);
    s = withMarket(s, 1, [null, null, null, null, null, null]);
    s = withUtility(s, 0, 'throne_1', 'throne');
    expect(() => act(s, { type: 'ACTIVATE_UTILITY', utilityIndex: 0 })).toThrow(/opponent has no wares/);
  });
});

describe('Leopard Statue: requires 2g and empty market slot', () => {
  it('blocks with insufficient gold', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, []);
    s = withGold(s, 0, 1);
    s = withUtility(s, 0, 'leopard_statue_1', 'leopard_statue');
    expect(() => act(s, { type: 'ACTIVATE_UTILITY', utilityIndex: 0 })).toThrow(/need at least 2g/);
  });

  it('blocks with full market', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, []);
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, ['trinkets', 'hides', 'tea', 'silk', 'fruit', 'salt']);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 5, hides: 5, tea: 5, silk: 5, fruit: 5, salt: 5 } };
    s = withUtility(s, 0, 'leopard_statue_1', 'leopard_statue');
    expect(() => act(s, { type: 'ACTIVATE_UTILITY', utilityIndex: 0 })).toThrow(/no empty market slots/);
  });
});

describe('Mask of Transformation: requires hand cards and discard pile', () => {
  it('blocks with empty hand', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, []);
    s = withGold(s, 0, 20);
    s = withDiscard(s, ['ware_3k_1']);
    s = withUtility(s, 0, 'mask_of_transformation_1', 'mask_of_transformation');
    expect(() => act(s, { type: 'ACTIVATE_UTILITY', utilityIndex: 0 })).toThrow(/no cards in hand/);
  });

  it('blocks with empty discard pile', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['ware_3k_1']);
    s = withGold(s, 0, 20);
    s = { ...s, discardPile: [] };
    s = withUtility(s, 0, 'mask_of_transformation_1', 'mask_of_transformation');
    expect(() => act(s, { type: 'ACTIVATE_UTILITY', utilityIndex: 0 })).toThrow(/discard pile is empty/);
  });
});

// ============================================================================
// getValidActions filters out blocked cards/utilities
// ============================================================================

describe('getValidActions respects preconditions', () => {
  it('excludes cards that fail preconditions', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['crocodile_1', 'parrot_1', 'ware_3k_1']);
    s = withHand(s, 1, []);
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, [null, null, null, null, null, null]);
    s = withMarket(s, 1, [null, null, null, null, null, null]);
    // Opponent has no utilities (blocks crocodile) and no wares (blocks parrot)

    const actions = getValidActions(s);
    const playActions = actions.filter(a => a.type === 'PLAY_CARD');
    const playedCardIds = playActions.map(a => (a as any).cardId);
    expect(playedCardIds).not.toContain('crocodile_1');
    expect(playedCardIds).not.toContain('parrot_1');
    // ware_3k_1 should still be playable (buy mode)
    expect(playedCardIds).toContain('ware_3k_1');
  });

  it('excludes utilities that fail preconditions', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, []); // empty hand blocks Boat, Weapons, Kettle
    s = withGold(s, 0, 20);
    s = withUtility(s, 0, 'boat_1', 'boat');
    s = withUtility(s, 0, 'weapons_1', 'weapons');
    s = withUtility(s, 0, 'well_1', 'well'); // Well should still work

    const actions = getValidActions(s);
    const utilActions = actions.filter(a => a.type === 'ACTIVATE_UTILITY');
    const utilIndices = utilActions.map(a => (a as any).utilityIndex);
    // boat is index 0, weapons is index 1, well is index 2
    expect(utilIndices).not.toContain(0); // boat blocked
    expect(utilIndices).not.toContain(1); // weapons blocked
    expect(utilIndices).toContain(2);     // well allowed
  });
});
