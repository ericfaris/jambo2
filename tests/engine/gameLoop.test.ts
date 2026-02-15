// ============================================================================
// Game Loop Tests — core turn flow, draw/keep/play, ware buy/sell, end turn
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  createTestState,
  toPlayPhase,
  act,
  withHand,
  withMarket,
  withGold,
  withUtility,
  hand,
  gold,
  market,
  removeFromDeck,
} from '../helpers/testHelpers.ts';
import { CONSTANTS } from '../../src/engine/types.ts';
import { processAction } from '../../src/engine/GameEngine.ts';

describe('Draw Phase', () => {
  it('DRAW_CARD reveals a card', () => {
    const s0 = createTestState();
    expect(s0.phase).toBe('DRAW');
    expect(s0.drawnCard).toBeNull();

    const s1 = act(s0, { type: 'DRAW_CARD' });
    expect(s1.drawnCard).not.toBeNull();
    expect(s1.drawsThisPhase).toBe(1);
  });

  it('KEEP_CARD transitions to PLAY phase', () => {
    const s0 = createTestState();
    const s1 = act(s0, { type: 'DRAW_CARD' });
    const drawn = s1.drawnCard!;

    const s2 = act(s1, { type: 'KEEP_CARD' });
    expect(s2.phase).toBe('PLAY');
    expect(s2.drawnCard).toBeNull();
    expect(s2.actionsLeft).toBe(CONSTANTS.MAX_ACTIONS - 1); // 1 action spent drawing
    expect(hand(s2, 0)).toContain(drawn);
  });

  it('DISCARD_DRAWN clears drawnCard and allows drawing again', () => {
    const s0 = createTestState();
    const s1 = act(s0, { type: 'DRAW_CARD' });
    const s2 = act(s1, { type: 'DISCARD_DRAWN' });

    expect(s2.drawnCard).toBeNull();
    expect(s2.phase).toBe('DRAW');
    expect(s2.drawsThisPhase).toBe(1);

    // Can draw again
    const s3 = act(s2, { type: 'DRAW_CARD' });
    expect(s3.drawnCard).not.toBeNull();
    expect(s3.drawsThisPhase).toBe(2);
  });

  it('5 discards auto-transitions to PLAY phase and auto-ends turn', () => {
    let s = createTestState();
    for (let i = 0; i < 5; i++) {
      s = act(s, { type: 'DRAW_CARD' });
      s = act(s, { type: 'DISCARD_DRAWN' });
    }
    expect(s.phase).toBe('DRAW'); // Turn auto-ended, back to DRAW for next player
    expect(s.actionsLeft).toBe(5); // Reset for next player
    expect(s.currentPlayer).toBe(1); // Switched to opponent
    expect(s.turn).toBe(2); // Turn incremented
  });

  it('cannot play card during DRAW phase', () => {
    const s = createTestState();
    const cardId = hand(s, 0)[0];
    expect(() => act(s, { type: 'PLAY_CARD', cardId })).toThrow();
  });

  it('cannot draw during PLAY phase (DRAW_CARD)', () => {
    const s = toPlayPhase(createTestState());
    expect(s.phase).toBe('PLAY');
    expect(() => act(s, { type: 'DRAW_CARD' })).toThrow();
  });
});

describe('Play Phase — Card Play', () => {
  it('playing a card decrements actionsLeft', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['small_market_stand_1']);
    s = withGold(s, 0, 20);
    // toPlayPhase spends 1 action drawing, so 4 remain
    expect(s.actionsLeft).toBe(4);
    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'small_market_stand_1' });
    expect(s2.actionsLeft).toBe(3);
  });

  it('PLAY_CARD costs 1 action and removes card from hand', () => {
    const s = toPlayPhase(createTestState());
    const s1 = withHand(s, 0, ['small_market_stand_1']);
    const sReady = withGold(s1, 0, 20);
    const handBefore = hand(sReady, 0).length;
    const s2 = act(sReady, { type: 'PLAY_CARD', cardId: 'small_market_stand_1' });
    expect(s2.actionsLeft).toBe(s.actionsLeft - 1);
    expect(hand(s2, 0).length).toBe(handBefore - 1);
  });

  it('auto-ends turn when actions exhausted', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, [
      'small_market_stand_1',
      'small_market_stand_2',
      'small_market_stand_3',
      'small_market_stand_4',
    ]);
    s = withGold(s, 0, 30);
    // toPlayPhase spent 1, spend remaining 4 via PLAY_CARD
    for (let i = 0; i < 4; i++) {
      s = act(s, { type: 'PLAY_CARD', cardId: `small_market_stand_${i + 1}` });
    }
    expect(s.phase).toBe('DRAW'); // Turn auto-ended, back to DRAW for next player
    expect(s.actionsLeft).toBe(5); // Reset for next player
    expect(s.currentPlayer).toBe(1); // Switched to opponent
  });
});

describe('Ware Buy/Sell', () => {
  it('ware buy deducts gold, takes from supply, adds to market', () => {
    let s = toPlayPhase(createTestState());
    // Put a ware card in hand and ensure we have gold + empty market
    s = withHand(s, 0, ['ware_3k_1']);
    s = removeFromDeck(s, 'ware_3k_1');
    s = withGold(s, 0, 20);
    // ware_3k: buy 3g, 3x trinkets

    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'ware_3k_1', wareMode: 'buy' });
    expect(gold(s2, 0)).toBe(20 - 3); // buy price 3g
    expect(s2.wareSupply.trinkets).toBe(6 - 3); // took 3 trinkets
    const mkt = market(s2, 0);
    const trinketCount = mkt.filter(w => w === 'trinkets').length;
    expect(trinketCount).toBe(3);
    expect(s2.actionsLeft).toBe(3); // 1 for draw + 1 for play
  });

  it('ware sell removes from market, returns to supply, adds gold', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['ware_3k_1']);
    s = removeFromDeck(s, 'ware_3k_1');
    s = withMarket(s, 0, ['trinkets', 'trinkets', 'trinkets', null, null, null]);
    s = withGold(s, 0, 20);
    // Take the trinkets out of supply first so totals balance
    s = { ...s, wareSupply: { ...s.wareSupply, trinkets: 3 } };
    // ware_3k: sell 10g

    const s2 = act(s, { type: 'PLAY_CARD', cardId: 'ware_3k_1', wareMode: 'sell' });
    expect(gold(s2, 0)).toBe(20 + 10); // sell price 10g
    expect(s2.wareSupply.trinkets).toBe(3 + 3); // returned 3
    const trinketCount = market(s2, 0).filter(w => w === 'trinkets').length;
    expect(trinketCount).toBe(0);
  });

  it('cannot buy without enough gold', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['ware_3k_1']);
    s = removeFromDeck(s, 'ware_3k_1');
    s = withGold(s, 0, 2); // need 3g
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'ware_3k_1', wareMode: 'buy' })).toThrow();
  });

  it('cannot buy without enough market space', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['ware_3k_1']);
    s = removeFromDeck(s, 'ware_3k_1');
    s = withGold(s, 0, 20);
    s = withMarket(s, 0, ['tea', 'tea', 'tea', 'tea', null, null]); // only 2 empty, need 3
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'ware_3k_1', wareMode: 'buy' })).toThrow();
  });

  it('cannot sell without matching wares', () => {
    let s = toPlayPhase(createTestState());
    s = withHand(s, 0, ['ware_3k_1']);
    s = removeFromDeck(s, 'ware_3k_1');
    s = withMarket(s, 0, ['hides', 'hides', null, null, null, null]);
    expect(() => act(s, { type: 'PLAY_CARD', cardId: 'ware_3k_1', wareMode: 'sell' })).toThrow();
  });
});

describe('End Turn', () => {
  it('+1g bonus for 2+ remaining actions', () => {
    let s = toPlayPhase(createTestState());
    s = withGold(s, 0, 20);
    // actionsLeft is 4 (1 spent drawing), which is >= 2
    const s2 = act(s, { type: 'END_TURN' });
    // Player 0 should have gotten +1g bonus
    expect(gold(s2, 0)).toBe(21);
  });

  it('no bonus with fewer than 2 actions', () => {
    let s = toPlayPhase(createTestState());
    s = withGold(s, 0, 20);
    s = withHand(s, 0, [
      'small_market_stand_1',
      'small_market_stand_2',
      'small_market_stand_3',
    ]);
    // 4 actions left after draw+keep, spend 3 to get down to 1
    s = act(s, { type: 'PLAY_CARD', cardId: 'small_market_stand_1' });
    s = act(s, { type: 'PLAY_CARD', cardId: 'small_market_stand_2' });
    s = act(s, { type: 'PLAY_CARD', cardId: 'small_market_stand_3' });
    expect(s.actionsLeft).toBe(1);
    const goldBeforeEndTurn = gold(s, 0);
    const s2 = act(s, { type: 'END_TURN' });
    expect(gold(s2, 0)).toBe(goldBeforeEndTurn); // no bonus
  });

  it('turn modifiers reset', () => {
    let s = toPlayPhase(createTestState());
    s = { ...s, turnModifiers: { buyDiscount: 2, sellBonus: 2 } };
    const s2 = act(s, { type: 'END_TURN' });
    expect(s2.turnModifiers.buyDiscount).toBe(0);
    expect(s2.turnModifiers.sellBonus).toBe(0);
  });

  it('utility usedThisTurn flags reset', () => {
    let s = toPlayPhase(createTestState());
    s = withUtility(s, 0, 'well_1', 'well');
    // Mark as used
    s = {
      ...s,
      players: [
        {
          ...s.players[0],
          utilities: s.players[0].utilities.map(u => ({ ...u, usedThisTurn: true })),
        },
        s.players[1],
      ] as [typeof s.players[0], typeof s.players[1]],
    };
    const s2 = act(s, { type: 'END_TURN' });
    // P0's utilities should be reset (usedThisTurn = false)
    expect(s2.players[0].utilities[0].usedThisTurn).toBe(false);
  });

  it('player switches and turn increments', () => {
    let s = toPlayPhase(createTestState());
    expect(s.currentPlayer).toBe(0);
    expect(s.turn).toBe(1);
    const s2 = act(s, { type: 'END_TURN' });
    expect(s2.currentPlayer).toBe(1);
    expect(s2.turn).toBe(2);
    expect(s2.phase).toBe('DRAW');
  });

  it('cannot end turn during DRAW phase', () => {
    const s = createTestState();
    expect(() => act(s, { type: 'END_TURN' })).toThrow();
  });

  it('blocked during pending resolution', () => {
    let s = toPlayPhase(createTestState());
    s = {
      ...s,
      pendingResolution: {
        type: 'BINARY_CHOICE',
        sourceCard: 'carrier_1',
        options: ['a', 'b'],
      },
    };
    expect(() => processAction(s, { type: 'END_TURN' })).toThrow();
  });
});
