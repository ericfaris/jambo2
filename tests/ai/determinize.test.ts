import { describe, expect, it } from 'vitest';
import { determinizeForPlayer, createDeterminizeRng } from '../../src/ai/determinize.ts';
import { getHardAiAction, getHardGuardReaction } from '../../src/ai/difficulties/HardAI.ts';
import { getExpertAiAction } from '../../src/ai/difficulties/ExpertAI.ts';
import { createTestState, toPlayPhase, withHand, withGold } from '../helpers/testHelpers.ts';

describe('determinizeForPlayer', () => {
  it("leaves the acting player's own hand, market, and gold untouched", () => {
    const state = toPlayPhase(createTestState(4242));
    const world = determinizeForPlayer(state, 0, createDeterminizeRng(state, 0));
    expect(world.players[0]).toEqual(state.players[0]);
  });

  it('preserves the total set of cards between opponent hand and deck (just redeals the split)', () => {
    const state = toPlayPhase(createTestState(4242));
    const world = determinizeForPlayer(state, 0, createDeterminizeRng(state, 0));

    const beforePool = [...state.players[1].hand, ...state.deck].sort();
    const afterPool = [...world.players[1].hand, ...world.deck].sort();
    expect(afterPool).toEqual(beforePool);
    expect(world.players[1].hand.length).toBe(state.players[1].hand.length);
    expect(world.deck.length).toBe(state.deck.length);
  });

  it('is a no-op when the opponent has no hand and the deck is empty', () => {
    let state = toPlayPhase(createTestState(4242));
    state = withHand(state, 1, []);
    state = { ...state, deck: [] };
    const world = determinizeForPlayer(state, 0, createDeterminizeRng(state, 0));
    expect(world).toBe(state);
  });

  it('actually redeals the split for a representative seed (not an accidental identity function)', () => {
    const state = toPlayPhase(createTestState(777));
    const world = determinizeForPlayer(state, 0, createDeterminizeRng(state, 0));
    expect(world.players[1].hand).not.toEqual(state.players[1].hand);
  });

  it('produces the same redeal for two states with the same unseen card pool but a different true split', () => {
    // This is the crux of the fairness fix: the AI's guess about the hidden
    // world must depend only on *which* cards are unseen (public knowledge —
    // everything not in my hand, market, or the discard pile), never on the
    // incidental true arrangement of which of those cards sits in the
    // opponent's hand vs. still in the deck.
    const base = toPlayPhase(createTestState(5150));
    const [x, y, z, w] = base.deck;
    const stateA = withHand(base, 1, [x, y, z]); // w ends up in the deck
    const stateB = withHand(base, 1, [x, y, w]); // z ends up in the deck

    const rngA = createDeterminizeRng(stateA, 0);
    const rngB = createDeterminizeRng(stateB, 0);
    const worldA = determinizeForPlayer(stateA, 0, rngA);
    const worldB = determinizeForPlayer(stateB, 0, rngB);

    expect(worldA.players[1].hand).toEqual(worldB.players[1].hand);
    expect(worldA.deck).toEqual(worldB.deck);
  });
});

describe('Hard/Expert AI does not read hidden opponent information', () => {
  function buildComparableStates(seed: number) {
    const base = toPlayPhase(createTestState(seed));
    const withMyHand = withHand(base, 0, ['ware_3k_1', 'ware_3h_1']);
    const readyState = withGold(withMyHand, 0, 20);

    const [x, y, z, w] = readyState.deck;
    const stateA = withHand(readyState, 1, [x, y, z]); // w ends up in the deck
    const stateB = withHand(readyState, 1, [x, y, w]); // z ends up in the deck
    return { stateA, stateB };
  }

  it("HardAI's chosen move is unaffected by which cards are truly in the opponent's hand vs. deck", () => {
    const { stateA, stateB } = buildComparableStates(9001);
    expect(getHardAiAction(stateA)).toEqual(getHardAiAction(stateB));
  });

  it("ExpertAI's chosen move is unaffected by which cards are truly in the opponent's hand vs. deck", () => {
    const { stateA, stateB } = buildComparableStates(9002);
    expect(getExpertAiAction(stateA)).toEqual(getExpertAiAction(stateB));
  });

  it("HardAI's Guard-reaction check still uses the responder's real hand (not determinized)", () => {
    // Reactions are the one place the true hand MUST be read — it's the
    // reacting player's own hand, which they genuinely know.
    let state = toPlayPhase(createTestState(3033));
    state = withHand(state, 1, ['guard_1']);
    state = {
      ...state,
      pendingGuardReaction: { targetPlayer: 1, animalCard: 'elephant_1' },
    };

    const action = getHardGuardReaction(state);
    expect(action.type).toBe('GUARD_REACTION');
  });
});
