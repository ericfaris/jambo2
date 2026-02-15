import type {
  DeckCardId,
  GameState,
  PlayerState,
  UtilityDesignId,
  WareCardWares,
  WareType,
} from '../engine/types.ts';
import { WARE_TYPES } from '../engine/types.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';

const UTILITY_PLAY_BASE: Record<UtilityDesignId, number> = {
  supplies: 77,
  well: 75,
  leopard_statue: 73,
  boat: 71,
  weapons: 68,
  scale: 64,
  kettle: 62,
  throne: 56,
  mask_of_transformation: 52,
  drums: 50,
};

const UTILITY_ACTIVATE_BASE: Record<UtilityDesignId, number> = {
  supplies: 76,
  well: 74,
  leopard_statue: 71,
  boat: 70,
  weapons: 67,
  scale: 63,
  kettle: 60,
  throne: 55,
  mask_of_transformation: 51,
  drums: 48,
};

function countMarket(player: PlayerState): { filled: number; empty: number; counts: Record<WareType, number> } {
  const counts: Record<WareType, number> = {
    trinkets: 0,
    hides: 0,
    tea: 0,
    silk: 0,
    fruit: 0,
    salt: 0,
  };

  let filled = 0;
  for (const slot of player.market) {
    if (!slot) continue;
    filled += 1;
    counts[slot] += 1;
  }

  return { filled, empty: player.market.length - filled, counts };
}

function hasUtility(player: PlayerState, designId: UtilityDesignId): boolean {
  return player.utilities.some((utility) => utility.designId === designId);
}

function hasCardDesign(player: PlayerState, designId: string): boolean {
  return player.hand.some((cardId) => getCard(cardId).designId === designId);
}

function getNeededByType(wares: WareCardWares, marketCounts: Record<WareType, number>): Record<WareType, number> {
  const required: Record<WareType, number> = {
    trinkets: 0,
    hides: 0,
    tea: 0,
    silk: 0,
    fruit: 0,
    salt: 0,
  };

  for (const wareType of wares.types) required[wareType] += 1;

  const needed: Record<WareType, number> = {
    trinkets: 0,
    hides: 0,
    tea: 0,
    silk: 0,
    fruit: 0,
    salt: 0,
  };

  for (const wareType of WARE_TYPES) {
    needed[wareType] = Math.max(0, required[wareType] - marketCounts[wareType]);
  }

  return needed;
}

function getSellReadinessBonus(wares: WareCardWares, marketCounts: Record<WareType, number>): number {
  const needed = getNeededByType(wares, marketCounts);
  const missingTotal = WARE_TYPES.reduce((sum, type) => sum + needed[type], 0);
  if (missingTotal === 0) return 6;
  if (missingTotal === 1) return 3;
  if (missingTotal === 2) return 1;
  return 0;
}

function estimateOpponentMarketValue(state: GameState, playerIndex: 0 | 1): number {
  const opponent = state.players[playerIndex];
  const { filled, counts } = countMarket(opponent);
  if (filled === 0) return 0;

  let likelySold = 0;
  let maybeSold = 0;
  for (const cardId of opponent.hand) {
    const card = getCard(cardId);
    if (card.type !== 'ware' || !card.wares) continue;
    const needed = getNeededByType(card.wares, counts);
    const missing = WARE_TYPES.reduce((sum, type) => sum + needed[type], 0);
    if (missing === 0) likelySold += 1;
    else if (missing <= 2) maybeSold += 1;
  }

  if (likelySold > 0) return filled * 2;
  if (maybeSold > 0) return filled;
  return filled * 0.5;
}

export function getCardEconomyValue(handSize: number): number {
  return Math.min(handSize, 3) * 2 + Math.max(0, handSize - 3);
}

export function getHandRiskPenalty(handSize: number): number {
  if (handSize <= 4) return 0;
  if (handSize === 5) return 0.8;
  if (handSize === 6) return 1.8;
  return 3 + (handSize - 7) * 0.6;
}

export function getMarketExposurePenalty(player: PlayerState): number {
  const filled = player.market.filter((slot) => slot !== null).length;
  return filled <= 3 ? 0 : (filled - 3) * 1.5;
}

export function getUtilityPlayPriority(state: GameState, playerIndex: 0 | 1, designId: UtilityDesignId): number {
  const me = state.players[playerIndex];
  const opponent: 0 | 1 = playerIndex === 0 ? 1 : 0;
  const op = state.players[opponent];
  const myMarket = countMarket(me);
  const opMarket = countMarket(op);

  let score = UTILITY_PLAY_BASE[designId];

  if (designId === 'boat') {
    if (me.hand.length <= 1) score -= 12;
    if (me.hand.length >= 5) score += 5;
    if (hasUtility(me, 'well')) score += 8;
    if (hasUtility(me, 'drums')) score += 3;
    if (myMarket.empty === 0) score -= 10;
  }

  if (designId === 'leopard_statue') {
    if (me.gold < 2) score -= 12;
    if (myMarket.empty > 0) score += 4;
    if (hasUtility(me, 'weapons')) score += 6;
    if (hasUtility(me, 'supplies')) score += 3;
  }

  if (designId === 'kettle') {
    if (me.hand.length <= 1) score -= 9;
    if (me.hand.length >= 4) score += 4;
    if (hasUtility(me, 'well')) score += 5;
  }

  if (designId === 'well') {
    if (me.gold < 1) score -= 10;
    if (me.hand.length <= 3) score += 7;
    if (hasUtility(me, 'boat') || hasUtility(me, 'weapons') || hasUtility(me, 'kettle')) score += 4;
  }

  if (designId === 'weapons') {
    if (me.hand.length <= 1) score -= 8;
    if (me.hand.length >= 4) score += 5;
    if (hasUtility(me, 'well')) score += 3;
    if (hasUtility(me, 'leopard_statue')) score += 5;
  }

  if (designId === 'throne') {
    if (opMarket.filled > 0) score += 4;
    if (hasCardDesign(me, 'parrot')) score += 4;
    if (opMarket.filled === 0) score -= 7;
  }

  if (designId === 'scale') {
    if (me.hand.length <= 4) score += 3;
    if (hasCardDesign(me, 'psychic')) score += 5;
  }

  if (designId === 'mask_of_transformation') {
    if (state.discardPile.length === 0 || me.hand.length === 0) score -= 8;
  }

  if (designId === 'supplies') {
    if (me.gold < 1 && me.hand.length === 0) score -= 15;
    if (me.smallMarketStands > 0) score += 3;
  }

  if (designId === 'drums') {
    if (myMarket.filled >= 3) score += 3;
    if (hasUtility(me, 'boat')) score += 4;
    if (myMarket.filled === 0) score -= 12;
  }

  score += Math.min(estimateOpponentMarketValue(state, opponent), 8) * 0.2;

  return score;
}

export function getUtilityActivationPriority(state: GameState, playerIndex: 0 | 1, designId: UtilityDesignId): number {
  const me = state.players[playerIndex];
  const opponent: 0 | 1 = playerIndex === 0 ? 1 : 0;
  const op = state.players[opponent];
  const myMarket = countMarket(me);
  const opMarket = countMarket(op);
  let score = UTILITY_ACTIVATE_BASE[designId];

  if (designId === 'well') {
    if (me.gold < 1) score -= 15;
    if (me.hand.length <= 3) score += 5;
  }

  if (designId === 'boat') {
    if (me.hand.length <= 0) score -= 20;
    if (myMarket.empty === 0) score -= 12;
    if (hasUtility(me, 'well')) score += 7;
  }

  if (designId === 'leopard_statue') {
    if (me.gold < 2) score -= 18;
    if (myMarket.empty === 0) score -= 12;
    if (hasUtility(me, 'weapons')) score += 4;
  }

  if (designId === 'weapons') {
    if (me.hand.length <= 0) score -= 16;
    if (me.hand.length >= 4) score += 4;
  }

  if (designId === 'throne') {
    if (opMarket.filled === 0 || myMarket.empty === 0) score -= 12;
    else score += 4;
  }

  if (designId === 'drums') {
    if (myMarket.filled === 0) score -= 18;
    if (hasUtility(me, 'boat')) score += 3;
  }

  if (designId === 'kettle') {
    if (me.hand.length <= 0) score -= 14;
    if (me.hand.length >= 3) score += 3;
  }

  if (designId === 'mask_of_transformation') {
    if (state.discardPile.length === 0 || me.hand.length === 0) score -= 12;
  }

  if (designId === 'supplies') {
    if (me.gold < 1 && me.hand.length === 0) score -= 18;
    if (me.smallMarketStands > 0) score += 2;
  }

  if (designId === 'scale' && hasCardDesign(me, 'psychic')) {
    score += 4;
  }

  return score;
}

export function getUtilitySetStrength(state: GameState, playerIndex: 0 | 1): number {
  const player = state.players[playerIndex];
  let score = 0;
  for (const utility of player.utilities) {
    score += getUtilityActivationPriority(state, playerIndex, utility.designId) * 0.08;
  }
  return score;
}

export function getCardPressureBonus(state: GameState, playerIndex: 0 | 1, cardId: DeckCardId): number {
  const me = state.players[playerIndex];
  const opponentIndex: 0 | 1 = playerIndex === 0 ? 1 : 0;
  const opponent = state.players[opponentIndex];
  const card = getCard(cardId);

  if (card.type === 'animal') {
    if (card.designId === 'cheetah') {
      const goldOptionLikely = opponent.gold >= 2 ? 4 : 0;
      const drawOptionLikely = opponent.gold < 2 ? 3 : 0;
      return 11 + goldOptionLikely + drawOptionLikely;
    }
    if (card.designId === 'crocodile') return 7 + opponent.utilities.length * 2;
    if (card.designId === 'parrot') return 5 + opponent.market.filter((w) => w !== null).length;
    if (card.designId === 'elephant') {
      const myWares = me.market.filter((w) => w !== null).length;
      const opWares = opponent.market.filter((w) => w !== null).length;
      return 5 + Math.max(0, opWares - myWares) * 2;
    }
    if (card.designId === 'ape') {
      return 4 + Math.max(0, opponent.hand.length - me.hand.length) * 1.2;
    }
    if (card.designId === 'lion') {
      return 4 + Math.max(0, opponent.utilities.length - me.utilities.length) * 2.2;
    }
  }

  if (card.type === 'people') {
    if (card.designId === 'psychic') return 10;
    if (card.designId === 'dancer') {
      const marketFilled = me.market.filter((w) => w !== null).length;
      return marketFilled >= 3 ? 9 : 5;
    }
    if (card.designId === 'tribal_elder') {
      const cardDelta = opponent.hand.length - me.hand.length;
      return 6 + (cardDelta > 0 ? cardDelta * 1.5 : 0);
    }
  }

  return 0;
}

export function getWareAcquisitionPriority(
  state: GameState,
  playerIndex: 0 | 1,
  wares: WareCardWares,
): number {
  const player = state.players[playerIndex];
  const { counts, empty } = countMarket(player);
  const effectiveBuy = Math.max(0, wares.buyPrice - state.turnModifiers.buyDiscount);
  const effectiveSell = wares.sellPrice + state.turnModifiers.sellBonus;
  const margin = effectiveSell - effectiveBuy;
  const needed = getNeededByType(wares, counts);
  const missing = WARE_TYPES.reduce((sum, type) => sum + needed[type], 0);
  const sellReadiness = getSellReadinessBonus(wares, counts);

  let score = 42;
  score += margin * 1.1;
  score += sellReadiness * 2;
  score += missing <= 1 ? 8 : missing === 2 ? 3 : -2;
  if (empty < wares.types.length) score -= 20;
  if (player.gold < effectiveBuy) score -= 25;
  score -= getMarketExposurePenalty(player) * 0.5;

  return score;
}

function getWareTypeDemandScore(state: GameState, playerIndex: 0 | 1, wareType: WareType): number {
  const player = state.players[playerIndex];
  const { counts } = countMarket(player);
  let score = 0;

  for (const cardId of player.hand) {
    const card = getCard(cardId);
    if (card.type !== 'ware' || !card.wares) continue;
    const needed = getNeededByType(card.wares, counts);
    const missing = WARE_TYPES.reduce((sum, type) => sum + needed[type], 0);
    if (needed[wareType] <= 0) continue;
    score += 2.5;
    if (missing <= 2) score += 1.5;
    score += getSellReadinessBonus(card.wares, counts) * 0.35;
  }

  score += counts[wareType] * 0.45;
  score += state.wareSupply[wareType] <= 1 ? -0.4 : 0;

  return score;
}

export function pickBestWareType(state: GameState, playerIndex: 0 | 1, candidates: readonly WareType[]): WareType {
  let bestType = candidates[0] ?? 'trinkets';
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const wareType of candidates) {
    const score = getWareTypeDemandScore(state, playerIndex, wareType);
    if (score > bestScore) {
      bestScore = score;
      bestType = wareType;
    }
  }

  return bestType;
}

function getCardDiscardCost(state: GameState, playerIndex: 0 | 1, cardId: DeckCardId): number {
  const card = getCard(cardId);

  if (card.type === 'ware' && card.wares) {
    const me = state.players[playerIndex];
    const { counts } = countMarket(me);
    const needed = getNeededByType(card.wares, counts);
    const missing = WARE_TYPES.reduce((sum, type) => sum + needed[type], 0);
    const margin = card.wares.sellPrice - card.wares.buyPrice;
    return margin * 0.8 + (missing <= 1 ? 4 : missing <= 2 ? 2 : 0);
  }

  if (card.type === 'animal') {
    if (card.designId === 'cheetah') return 10;
    if (card.designId === 'crocodile') return 8;
    if (card.designId === 'elephant' || card.designId === 'ape' || card.designId === 'lion') return 8;
    return 6;
  }

  if (card.type === 'people') {
    if (card.designId === 'guard') return 11;
    if (card.designId === 'psychic' || card.designId === 'dancer') return 9;
    if (card.designId === 'tribal_elder') return 8;
    return 5;
  }

  if (card.type === 'utility') {
    return getUtilityPlayPriority(state, playerIndex, card.designId as UtilityDesignId);
  }

  if (card.type === 'stand') {
    return state.players[playerIndex].smallMarketStands === 0 ? 5 : 2;
  }

  return 1;
}

export function pickDiscardCardForValue(state: GameState, playerIndex: 0 | 1, cards: readonly DeckCardId[]): DeckCardId {
  let best = cards[0] ?? '';
  let bestCost = Number.POSITIVE_INFINITY;

  for (const cardId of cards) {
    const cost = getCardDiscardCost(state, playerIndex, cardId);
    if (cost < bestCost) {
      bestCost = cost;
      best = cardId;
    }
  }

  return best;
}

export function pickBestUtilityIndex(
  state: GameState,
  utilityOwner: 0 | 1,
  utilityDesigns: readonly UtilityDesignId[],
): number {
  let bestIndex = 0;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < utilityDesigns.length; index += 1) {
    const designId = utilityDesigns[index];
    const score = getUtilityActivationPriority(state, utilityOwner, designId);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex;
}
