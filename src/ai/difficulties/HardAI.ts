import type { GameAction, GameState, UtilityDesignId } from '../../engine/types.ts';
import { getCard } from '../../engine/cards/CardDatabase.ts';
import { processAction } from '../../engine/GameEngine.ts';
import { getValidActions } from '../../engine/validation/actionValidator.ts';
import { getMediumAiAction } from './MediumAI.ts';
import { getRandomAiAction } from '../RandomAI.ts';
import { createRng } from '../../utils/rng.ts';
import {
  getCardEconomyValue,
  getCardPressureBonus,
  getHandRiskPenalty,
  getMarketExposurePenalty,
  getUtilityActivationPriority,
  getUtilityPlayPriority,
  getUtilitySetStrength,
  getWareAcquisitionPriority,
} from '../strategyHeuristics.ts';

function pick<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function createHardRng(state: GameState): () => number {
  let seed = state.rngSeed | 0;
  seed ^= Math.imul((state.turn + 7) | 0, 0x1b873593);
  seed ^= Math.imul((state.actionsLeft + 13) | 0, 0x85ebca6b);
  seed ^= Math.imul((state.currentPlayer + 17) | 0, 0xc2b2ae35);
  seed ^= Math.imul(state.log.length | 0, 0x27d4eb2f);
  return createRng(seed);
}

function getPendingResponder(state: GameState): 0 | 1 {
  const pr = state.pendingResolution;
  if (!pr) return state.currentPlayer;

  switch (pr.type) {
    case 'AUCTION':
      return pr.wares.length < 2 ? state.currentPlayer : pr.nextBidder;
    case 'DRAFT':
      return pr.currentPicker;
    case 'OPPONENT_DISCARD':
    case 'CARRIER_WARE_SELECT':
      return pr.targetPlayer;
    case 'UTILITY_KEEP':
      return pr.step === 'ACTIVE_CHOOSE' ? state.currentPlayer : (state.currentPlayer === 0 ? 1 : 0);
    case 'OPPONENT_CHOICE':
      return state.currentPlayer === 0 ? 1 : 0;
    default:
      return state.currentPlayer;
  }
}

function getResponder(state: GameState): 0 | 1 {
  if (state.pendingGuardReaction) return state.pendingGuardReaction.targetPlayer;
  if (state.pendingWareCardReaction) return state.pendingWareCardReaction.targetPlayer;
  if (state.pendingResolution) return getPendingResponder(state);
  return state.currentPlayer;
}

function evaluateBoard(state: GameState, perspective: 0 | 1): number {
  const me = perspective;
  const opp: 0 | 1 = me === 0 ? 1 : 0;

  const myGold = state.players[me].gold;
  const oppGold = state.players[opp].gold;
  const myMarketFilled = state.players[me].market.filter(w => w !== null).length;
  const oppMarketFilled = state.players[opp].market.filter(w => w !== null).length;
  const myCapacity = state.players[me].market.length - myMarketFilled;
  const oppCapacity = state.players[opp].market.length - oppMarketFilled;
  const myHand = state.players[me].hand.length;
  const oppHand = state.players[opp].hand.length;
  const myUtilities = state.players[me].utilities.length;
  const oppUtilities = state.players[opp].utilities.length;
  const myHandValue = getCardEconomyValue(myHand);
  const oppHandValue = getCardEconomyValue(oppHand);
  const myExposurePenalty = getMarketExposurePenalty(state.players[me]);
  const oppExposurePenalty = getMarketExposurePenalty(state.players[opp]);

  let score = 0;
  score += myGold * 6.5;
  score -= oppGold * 3.0;
  score += myCapacity * 0.8;
  score -= oppCapacity * 0.5;
  score += (myMarketFilled - oppMarketFilled) * 0.5;
  score += (myHandValue - oppHandValue) * 0.42;
  score += (myUtilities - oppUtilities) * 1.2;
  score += getUtilitySetStrength(state, me);
  score -= getUtilitySetStrength(state, opp) * 0.8;
  score -= myExposurePenalty;
  score += oppExposurePenalty * 0.55;
  score -= getHandRiskPenalty(myHand);
  score += getHandRiskPenalty(oppHand) * 0.45;

  if (state.turnModifiers.buyDiscount > 0 && state.currentPlayer === me) score += 6;
  if (state.turnModifiers.sellBonus > 0 && state.currentPlayer === me) score += 9;

  const meTargetGap = Math.max(0, 60 - myGold);
  score += (60 - meTargetGap) * 0.15;

  if (state.phase === 'GAME_OVER') {
    if (myGold > oppGold) score += 800;
    if (myGold < oppGold) score -= 800;
  }

  return score;
}

function scoreStateDelta(before: GameState, after: GameState, perspective: 0 | 1): number {
  return evaluateBoard(after, perspective) - evaluateBoard(before, perspective);
}

function tacticalActionBonus(state: GameState, action: GameAction, me: 0 | 1): number {
  const opponent: 0 | 1 = me === 0 ? 1 : 0;

  if (action.type === 'PLAY_CARD') {
    const card = getCard(action.cardId);
    if (card.type === 'ware' && action.wareMode === 'sell' && card.wares) {
      return 12 + card.wares.sellPrice * 0.6;
    }
    if (card.type === 'ware' && action.wareMode === 'buy' && card.wares) {
      return (getWareAcquisitionPriority(state, me, card.wares) - 44) * 0.5;
    }
    if (card.type === 'animal') {
      const pressure = getCardPressureBonus(state, me, action.cardId);
      if (card.designId === 'crocodile') {
        return state.players[opponent].utilities.length * 2.6 + pressure;
      }
      if (card.designId === 'parrot') {
        return 8 + pressure;
      }
      return 2 + pressure;
    }
    if (card.type === 'people') {
      const pressure = getCardPressureBonus(state, me, action.cardId);
      if (card.designId === 'portuguese') return state.players[me].market.filter(w => w !== null).length * 1.5;
      return 3 + pressure;
    }
    if (card.type === 'utility') {
      if (state.players[me].utilities.length >= 3) return -8;
      return (getUtilityPlayPriority(state, me, card.designId as UtilityDesignId) - 58) * 0.45;
    }
  }

  if (action.type === 'ACTIVATE_UTILITY') {
    const utility = state.players[me].utilities[action.utilityIndex];
    if (!utility) return 0;
    return (getUtilityActivationPriority(state, me, utility.designId) - 55) * 0.45;
  }

  if (action.type === 'END_TURN' && state.actionsLeft > 1) {
    const handSize = state.players[me].hand.length;
    return -4 - Math.min(5, getCardEconomyValue(handSize) * 0.4) + getHandRiskPenalty(handSize) * 0.4;
  }

  return 0;
}

function opponentBestReplyPenalty(nextState: GameState, perspective: 0 | 1): number {
  if (nextState.phase === 'GAME_OVER') return 0;

  const responder = getResponder(nextState);
  if (responder === perspective) return 0;

  const opponentActions = getValidActions(nextState);
  if (opponentActions.length === 0) return 0;

  let worstOpponentDelta = Number.POSITIVE_INFINITY;

  for (const opponentAction of opponentActions.slice(0, 12)) {
    try {
      const afterReply = processAction(nextState, opponentAction);
      const deltaForPerspective = scoreStateDelta(nextState, afterReply, perspective);
      if (deltaForPerspective < worstOpponentDelta) {
        worstOpponentDelta = deltaForPerspective;
      }
    } catch {
      continue;
    }
  }

  if (!Number.isFinite(worstOpponentDelta)) return 0;
  if (worstOpponentDelta >= 0) return 0;
  return -worstOpponentDelta * 0.2;
}

function scoreAction(state: GameState, action: GameAction): number {
  const me = state.currentPlayer;
  try {
    const next = processAction(state, action);
    const immediate = scoreStateDelta(state, next, me);
    const tactical = tacticalActionBonus(state, action, me);
    const penalty = opponentBestReplyPenalty(next, me);
    return immediate + tactical - penalty;
  } catch {
    return Number.NEGATIVE_INFINITY;
  }
}

export function getHardAiAction(state: GameState, rng: () => number = createHardRng(state)): GameAction | null {
  if (state.pendingResolution || state.pendingGuardReaction || state.pendingWareCardReaction) {
    return getRandomAiAction(state, rng);
  }

  const validActions = getValidActions(state);
  if (validActions.length === 0) return null;

  const scored = validActions.map((action) => ({ action, score: scoreAction(state, action) }));
  const topScore = Math.max(...scored.map(s => s.score));

  const mediumAction = getMediumAiAction(state, rng);
  if (mediumAction) {
    if (state.turn <= 3) {
      return mediumAction;
    }

    const mediumKey = JSON.stringify(mediumAction);
    const mediumScored = scored.find(s => JSON.stringify(s.action) === mediumKey);
    const divergenceThreshold = state.currentPlayer === 0 ? 40 : 20;
    if (mediumScored && topScore - mediumScored.score <= divergenceThreshold) {
      return mediumAction;
    }
  }

  const best = scored.filter(s => s.score === topScore).map(s => s.action);
  return pick(best, rng);
}
