// ============================================================================
// People Card Resolver Tests
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
  withDiscard,
  withSupply,
  withUtility,
  removeFromDeck,
  hand,
  gold,
  market,
} from '../../helpers/testHelpers.ts';
import { getCard } from '../../../src/engine/cards/CardDatabase.ts';

describe('Shaman (Ware Trade)', () => {
  function setupShaman() {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['shaman_1']);
    s = removeFromDeck(s, 'shaman_1');
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, ['trinkets', 'trinkets', null, null, null, null]);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 4, hides: 6 } };
    return s;
  }

  it('select give → select receive → market swap', () => {
    const s = setupShaman();
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'shaman_1' });
    expect(s2.pendingResolution).not.toBeNull();
    expect(s2.pendingResolution!.type).toBe('WARE_TRADE');

    // Step 1: select give type
    const s3 = resolve(s2, { type: 'SELECT_WARE_TYPE', wareType: 'trinkets' });
    expect(s3.pendingResolution).not.toBeNull();
    expect((s3.pendingResolution as any).step).toBe('SELECT_RECEIVE');

    // Step 2: select receive type
    const s4 = resolve(s3, { type: 'SELECT_WARE_TYPE', wareType: 'hides' });
    expect(s4.pendingResolution).toBeNull();

    // Market should have 2 hides instead of 2 trinkets
    const mkt = market(s4, 0);
    expect(mkt.filter(w => w === 'hides').length).toBe(2);
    expect(mkt.filter(w => w === 'trinkets').length).toBe(0);

    // Supply updated
    expect(s4.wareSupply.trinkets).toBe(4 + 2);
    expect(s4.wareSupply.hides).toBe(6 - 2);
  });

  it('cannot trade for same ware type', () => {
    const s = setupShaman();
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'shaman_1' });
    const s3 = resolve(s2, { type: 'SELECT_WARE_TYPE', wareType: 'trinkets' });
    expect(() => resolve(s3, { type: 'SELECT_WARE_TYPE', wareType: 'trinkets' })).toThrow();
  });
});

describe('Psychic (Deck Peek)', () => {
  it('peek 6, pick 1, card goes to hand', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['psychic_1']);
    s = removeFromDeck(s, 'psychic_1');
    s = withGold(s, 0, 20);
    const deckBefore = [...s.deck];

    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'psychic_1' });
    expect(s2.pendingResolution).not.toBeNull();
    expect(s2.pendingResolution!.type).toBe('DECK_PEEK');
    const peek = s2.pendingResolution as any;
    expect(peek.revealedCards.length).toBeLessThanOrEqual(6);

    // Pick card at index 0
    const pickedCard = peek.revealedCards[0];
    const s3 = resolve(s2, { type: 'DECK_PEEK_PICK', cardIndex: 0 });
    expect(s3.pendingResolution).toBeNull();
    expect(hand(s3, 0)).toContain(pickedCard);
    // Card removed from deck
    expect(s3.deck).not.toContain(pickedCard);
  });
});

describe('Tribal Elder (Opponent Discard)', () => {
  it('opponent discards to 3 cards', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['tribal_elder_1']);
    s = withHand(s, 1, ['ware_3k_1', 'ware_3h_1', 'ware_3t_1', 'ware_3l_1', 'ware_3f_1']);
    s = removeFromDeck(s, 'tribal_elder_1');
    s = removeFromDeck(s, 'ware_3k_1');
    s = removeFromDeck(s, 'ware_3h_1');
    s = removeFromDeck(s, 'ware_3t_1');
    s = removeFromDeck(s, 'ware_3l_1');
    s = removeFromDeck(s, 'ware_3f_1');
    s = withGold(s, 0, 20);

    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'tribal_elder_1' });
    expect(s2.pendingResolution!.type).toBe('OPPONENT_DISCARD');
    expect((s2.pendingResolution as any).discardTo).toBe(3);

    // Opponent discards 2 cards (5 → 3)
    const s3 = resolve(s2, { type: 'OPPONENT_DISCARD_SELECTION', cardIndices: [0, 1] });
    expect(s3.pendingResolution).toBeNull();
    expect(hand(s3, 1).length).toBe(3);
  });
});

describe('Wise Man (Turn Modifier)', () => {
  it('auto-applies -2g buy / +2g sell modifier', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['wise_man_1']);
    s = removeFromDeck(s, 'wise_man_1');
    s = withGold(s, 0, 20);

    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'wise_man_1' });
    // Auto-resolves — no pending resolution
    expect(s2.pendingResolution).toBeNull();
    expect(s2.turnModifiers.buyDiscount).toBe(2);
    expect(s2.turnModifiers.sellBonus).toBe(2);
  });

  it('wise man discount applies to ware buy', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['wise_man_1', 'ware_3k_1']);
    s = removeFromDeck(s, 'wise_man_1');
    s = removeFromDeck(s, 'ware_3k_1');
    s = withGold(s, 0, 20);

    // Play Wise Man first
    let s2 = act(s, { type: 'PLAY_CARD', cardId: 'wise_man_1' });
    const goldAfterWise = gold(s2, 0);

    // Now buy ware_3k (normally 3g, with -2g = 1g)
    s2 = act(s2, { type: 'PLAY_CARD', cardId: 'ware_3k_1', wareMode: 'buy' });
    expect(gold(s2, 0)).toBe(goldAfterWise - 1);
  });
});

describe('Portuguese (Ware Sell Bulk)', () => {
  it('sell any wares at 2g each', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['portuguese_1']);
    s = removeFromDeck(s, 'portuguese_1');
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, ['trinkets', 'hides', 'tea', null, null, null]);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 5, hides: 5, tea: 5 } };

    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'portuguese_1' });
    expect(s2.pendingResolution!.type).toBe('WARE_SELL_BULK');

    // Sell 2 wares at 2g each = +4g, minus 1g play cost
    const s3 = resolve(s2, { type: 'SELL_WARES', wareIndices: [0, 1] });
    expect(s3.pendingResolution).toBeNull();
    expect(gold(s3, 0)).toBe(20 - 1 + 4);
    expect(market(s3, 0)[0]).toBeNull();
    expect(market(s3, 0)[1]).toBeNull();
    expect(market(s3, 0)[2]).toBe('tea'); // untouched
  });
});

describe('Basket Maker (Ware Select Multiple)', () => {
  it('pay 2g, pick type, receive 2', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['basket_maker_1']);
    s = removeFromDeck(s, 'basket_maker_1');
    s = withGold(s, 0, 20);

    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'basket_maker_1' });
    expect(s2.pendingResolution!.type).toBe('WARE_SELECT_MULTIPLE');

    const s3 = resolve(s2, { type: 'SELECT_WARE_TYPE', wareType: 'silk' });
    expect(s3.pendingResolution).toBeNull();
    // Paid play cost (1g) + basket maker cost (2g) = 3g
    expect(gold(s3, 0)).toBe(20 - 1 - 2);
    const silkCount = market(s3, 0).filter(w => w === 'silk').length;
    expect(silkCount).toBe(2);
    expect(s3.wareSupply.silk).toBe(6 - 2);
  });
});

describe('Traveling Merchant (Auction)', () => {
  it('initializes auction for ware selection', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['traveling_merchant_1']);
    s = removeFromDeck(s, 'traveling_merchant_1');
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, ['trinkets', 'hides', null, null, null, null]);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 5, hides: 5 } };

    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'traveling_merchant_1' });
    expect(s2.pendingResolution!.type).toBe('AUCTION');
  });
});

describe('Dancer (Ware Cash Conversion)', () => {
  it('select ware card → return 3 wares → get sell price', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['dancer_1', 'ware_3k_1']);
    s = removeFromDeck(s, 'dancer_1');
    s = removeFromDeck(s, 'ware_3k_1');
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, ['trinkets', 'hides', 'tea', null, null, null]);
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 5, hides: 5, tea: 5 } };

    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'dancer_1' });
    expect(s2.pendingResolution!.type).toBe('WARE_CASH_CONVERSION');

    // Step 1: select ware card from hand
    const s3 = resolve(s2, { type: 'SELECT_CARD', cardId: 'ware_3k_1' });
    expect((s3.pendingResolution as any).step).toBe('SELECT_WARES');

    // Step 2: return 3 wares (indices 0, 1, 2)
    const s4 = resolve(s3, { type: 'SELECT_WARES', wareIndices: [0, 1, 2] });
    expect(s4.pendingResolution).toBeNull();

    // Got sell price of ware_3k (10g), paid 1g play cost
    expect(gold(s4, 0)).toBe(20 - 1 + 10);
    // ware_3k_1 discarded
    expect(hand(s4, 0)).not.toContain('ware_3k_1');
    // 3 wares removed from market
    expect(market(s4, 0).filter(w => w !== null).length).toBe(0);
  });
});

describe('Carrier (Binary Choice)', () => {
  it('choice 0: active gets wares, opponent gets cards', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['carrier_1']);
    s = removeFromDeck(s, 'carrier_1');
    s = withGold(s, 0, 20);
    const opHandBefore = hand(s, 1).length;

    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'carrier_1' });
    expect(s2.pendingResolution!.type).toBe('BINARY_CHOICE');

    // Choose option 0: active takes wares, opponent draws 2 cards
    const s3 = resolve(s2, { type: 'BINARY_CHOICE', choice: 0 });
    // Now chains to CARRIER_WARE_SELECT
    expect(s3.pendingResolution!.type).toBe('CARRIER_WARE_SELECT');
    // Opponent drew 2 cards
    expect(hand(s3, 1).length).toBe(opHandBefore + 2);

    // Active selects ware type
    const s4 = resolve(s3, { type: 'SELECT_WARE_TYPE', wareType: 'fruit' });
    expect(s4.pendingResolution).toBeNull();
    const fruitCount = market(s4, 0).filter(w => w === 'fruit').length;
    expect(fruitCount).toBe(2);
  });
});

describe('Drummer (Discard Pick)', () => {
  it('pick utility from discard pile', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['drummer_1']);
    s = withDiscard(s, ['well_1']);
    s = withGold(s, 0, 20);

    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'drummer_1' });
    expect(s2.pendingResolution!.type).toBe('DISCARD_PICK');
    const eligible = (s2.pendingResolution as any).eligibleCards;
    expect(eligible).toContain('well_1');

    const s3 = resolve(s2, { type: 'DISCARD_PICK', cardId: 'well_1' });
    expect(s3.pendingResolution).toBeNull();
    expect(hand(s3, 0)).toContain('well_1');
    expect(s3.discardPile).not.toContain('well_1');
  });
});

describe('Supplies (Binary Choice → draw-until-ware)', () => {
  it('pay 1g option draws until ware found', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, []);
    s = withGold(s, 0, 20);
    s = withUtility(s, 0, 'supplies_1', 'supplies');

    const s2 = act(s, { type: 'ACTIVATE_UTILITY', utilityIndex: 0 });
    expect(s2.pendingResolution!.type).toBe('BINARY_CHOICE');

    // Choose option 0: pay 1g
    const s3 = resolve(s2, { type: 'BINARY_CHOICE', choice: 0 });
    expect(s3.pendingResolution).toBeNull();
    // Should have drawn until a ware card was found (or deck exhausted)
    // Gold decreased by 1
    expect(gold(s3, 0)).toBe(20 - 1);
  });
});
