import type { DeckCardId, GameAction, GameState } from '../../engine/types.ts';
import { getCard } from '../../engine/cards/CardDatabase.ts';
import { getValidActions } from '../../engine/validation/actionValidator.ts';
import { getRandomAiAction } from '../RandomAI.ts';
import { createRng } from '../../utils/rng.ts';

function pick<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function createMediumRng(state: GameState): () => number {
  let seed = state.rngSeed | 0;
  seed ^= Math.imul((state.turn + 1) | 0, 0x7feb352d);
  seed ^= Math.imul((state.actionsLeft + 3) | 0, 0x846ca68b);
  seed ^= Math.imul((state.currentPlayer + 11) | 0, 0x9e3779b1);
  return createRng(seed);
}

function classifyPlayCard(state: GameState, cardId: DeckCardId, wareMode?: 'buy' | 'sell'): number {
  const card = getCard(cardId);
  const me = state.currentPlayer;
  const opponent: 0 | 1 = me === 0 ? 1 : 0;
  const player = state.players[me];
  const opponentPlayer = state.players[opponent];
  const emptySlots = player.market.filter(slot => slot === null).length;

  if (card.type === 'ware') {
    const wares = card.wares;
    if (!wares) return 0;

    const effectiveSell = wares.sellPrice + state.turnModifiers.sellBonus;
    const effectiveBuy = Math.max(0, wares.buyPrice - state.turnModifiers.buyDiscount);
    const margin = effectiveSell - effectiveBuy;
    const efficiency = margin / Math.max(1, wares.types.length);

    if (wareMode === 'sell') {
      return 88 + efficiency * 2 + wares.types.length;
    }
    if (wareMode === 'buy') {
      const capacityBonus = emptySlots >= wares.types.length ? 4 : -20;
      return 52 + efficiency * 1.5 + capacityBonus;
    }
    return 30;
  }

  if (card.type === 'people') {
    if (card.designId === 'wise_man') return 82 + (state.actionsLeft > 2 ? 6 : 0);
    if (card.designId === 'portuguese') return 80 + player.market.filter(w => w !== null).length * 2;
    return 76;
  }

  if (card.type === 'animal') {
    if (card.designId === 'crocodile') return 74 + opponentPlayer.utilities.length * 4;
    if (card.designId === 'parrot') return 72 + opponentPlayer.market.filter(w => w !== null).length * 2;
    if (card.designId === 'elephant') {
      const oppWares = opponentPlayer.market.filter(w => w !== null).length;
      const myWares = player.market.filter(w => w !== null).length;
      return 68 + (oppWares - myWares) * 3;
    }
    return 70;
  }

  if (card.type === 'utility') {
    if (player.utilities.length >= 3) return 10;
    if (card.designId === 'well' || card.designId === 'weapons') return 60;
    if (card.designId === 'leopard_statue' || card.designId === 'drums') return 56;
    return 50;
  }

  if (card.type === 'stand') {
    const currentSlots = player.market.length;
    const filledSlots = currentSlots - emptySlots;
    return filledSlots >= currentSlots - 1 ? 64 : 38;
  }

  return 0;
}

function scoreAction(state: GameState, action: GameAction): number {
  const me = state.currentPlayer;
  const player = state.players[me];

  switch (action.type) {
    case 'PLAY_CARD':
      return classifyPlayCard(state, action.cardId, action.wareMode);
    case 'ACTIVATE_UTILITY': {
      const utility = player.utilities[action.utilityIndex];
      if (!utility) return 30;
      switch (utility.designId) {
        case 'well':
          return 71;
        case 'weapons':
          return 66;
        case 'leopard_statue':
          return 64;
        case 'drums':
          return 60;
        case 'kettle':
          return 58;
        default:
          return 54;
      }
    }
    case 'DRAW_CARD':
      return state.actionsLeft > 2 ? 63 : 56;
    case 'KEEP_CARD':
      if (state.drawnCard) {
        const card = getCard(state.drawnCard);
        if (card.type === 'people' || card.type === 'animal') return 73;
        if (card.type === 'utility') return 70;
        if (card.type === 'ware') {
          const margin = card.wares ? card.wares.sellPrice - card.wares.buyPrice : 0;
          return 64 + Math.max(0, margin);
        }
      }
      return 64;
    case 'DISCARD_DRAWN':
      return 44;
    case 'SKIP_DRAW':
      return 28;
    case 'END_TURN':
      return state.actionsLeft >= 2 ? 8 : 20;
    default:
      return 10;
  }
}

export function getMediumAiAction(state: GameState, rng: () => number = createMediumRng(state)): GameAction | null {
  if (state.pendingResolution || state.pendingGuardReaction || state.pendingWareCardReaction) {
    return getRandomAiAction(state, rng);
  }

  const validActions = getValidActions(state);
  if (validActions.length === 0) return null;

  const scored = validActions.map((action) => ({ action, score: scoreAction(state, action) }));
  const topScore = Math.max(...scored.map(s => s.score));
  const best = scored.filter(s => s.score === topScore).map(s => s.action);
  return pick(best, rng);
}
