import type { GameState, GameAction, InteractionResponse, WareType, WareCardWares } from '../engine/types.ts';
import { WARE_TYPES, CONSTANTS } from '../engine/types.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';
import { validateAction } from '../engine/validation/actionValidator.ts';
import { processAction } from '../engine/GameEngine.ts';

function canBuyWares(state: GameState, player: 0 | 1, wares: WareCardWares): boolean {
  const p = state.players[player];
  const effectivePrice = Math.max(0, wares.buyPrice - state.turnModifiers.buyDiscount);
  const emptySlots = p.market.filter(s => s === null).length;
  return p.gold >= effectivePrice && emptySlots >= wares.types.length;
}

function canSellWares(state: GameState, player: 0 | 1, wares: WareCardWares): boolean {
  const market = state.players[player].market;
  const needed: Partial<Record<WareType, number>> = {};
  for (const w of wares.types) needed[w] = (needed[w] ?? 0) + 1;
  const have: Partial<Record<WareType, number>> = {};
  for (const s of market) if (s) have[s] = (have[s] ?? 0) + 1;
  for (const [w, count] of Object.entries(needed)) {
    if ((have[w as WareType] ?? 0) < count!) return false;
  }
  return true;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function tryAction(state: GameState, action: GameAction): boolean {
  return validateAction(state, action).valid;
}

/** Try executing an action; return true if it doesn't throw. */
function safeExec(state: GameState, action: GameAction): boolean {
  try {
    processAction(state, action);
    return true;
  } catch {
    return false;
  }
}

/** Get ware types that have supply available. */
function availableWareTypes(state: GameState): WareType[] {
  return WARE_TYPES.filter(w => state.wareSupply[w] > 0);
}

function getRandomInteractionResponse(state: GameState): InteractionResponse | null {
  const pr = state.pendingResolution;
  if (!pr) return null;

  const cp = state.currentPlayer;
  const player = state.players[cp];

  switch (pr.type) {
    case 'WARE_TRADE': {
      if (pr.step === 'SELECT_GIVE') {
        const wareTypesInMarket = player.market.filter((w): w is WareType => w !== null);
        if (wareTypesInMarket.length === 0) return null;
        return { type: 'SELECT_WARE_TYPE', wareType: pick(wareTypesInMarket) };
      }
      // SELECT_RECEIVE: pick from supply, exclude give type
      const available = availableWareTypes(state).filter(w => w !== pr.giveType);
      if (available.length === 0) return null;
      return { type: 'SELECT_WARE_TYPE', wareType: pick(available) };
    }

    case 'WARE_SELECT_MULTIPLE': {
      // Need supply >= count and market space >= count
      const emptySlots = player.market.filter(s => s === null).length;
      const available = availableWareTypes(state).filter(w => state.wareSupply[w] >= pr.count);
      if (available.length === 0 || emptySlots < pr.count) return null;
      return { type: 'SELECT_WARE_TYPE', wareType: pick(available) };
    }

    case 'CARRIER_WARE_SELECT': {
      const target = state.players[pr.targetPlayer];
      const emptySlots = target.market.filter(s => s === null).length;
      const available = availableWareTypes(state).filter(w => state.wareSupply[w] >= 2);
      if (available.length === 0 || emptySlots < 2) return null;
      return { type: 'SELECT_WARE_TYPE', wareType: pick(available) };
    }

    case 'WARE_THEFT_SINGLE': {
      const opponent: 0 | 1 = cp === 0 ? 1 : 0;
      const opMarket = state.players[opponent].market;
      const filledSlots = opMarket.map((w, i) => ({ w, i })).filter(s => s.w !== null);
      if (filledSlots.length === 0) return null;
      return { type: 'SELECT_WARE', wareIndex: pick(filledSlots).i };
    }

    case 'WARE_THEFT_SWAP': {
      if (pr.step === 'STEAL') {
        const opponent: 0 | 1 = cp === 0 ? 1 : 0;
        const opMarket = state.players[opponent].market;
        const filledSlots = opMarket.map((w, i) => ({ w, i })).filter(s => s.w !== null);
        if (filledSlots.length === 0) return null;
        return { type: 'SELECT_WARE', wareIndex: pick(filledSlots).i };
      }
      const mySlots = player.market.map((w, i) => ({ w, i })).filter(s => s.w !== null);
      if (mySlots.length === 0) return null;
      return { type: 'SELECT_WARE', wareIndex: pick(mySlots).i };
    }

    case 'UTILITY_THEFT_SINGLE': {
      const opponent: 0 | 1 = cp === 0 ? 1 : 0;
      const opUtils = state.players[opponent].utilities;
      if (opUtils.length === 0) return null;
      return { type: 'SELECT_UTILITY', utilityIndex: Math.floor(Math.random() * opUtils.length) };
    }

    case 'HAND_SWAP': {
      if (pr.step === 'TAKE') {
        if (pr.revealedHand.length === 0) return null;
        return { type: 'SELECT_CARD', cardId: pick(pr.revealedHand) };
      }
      if (player.hand.length === 0) return null;
      return { type: 'SELECT_CARD', cardId: pick(player.hand) };
    }

    case 'BINARY_CHOICE':
      return { type: 'BINARY_CHOICE', choice: Math.random() < 0.5 ? 0 : 1 };

    case 'OPPONENT_CHOICE':
      return { type: 'OPPONENT_CHOICE', choice: Math.random() < 0.5 ? 0 : 1 };

    case 'AUCTION': {
      const bidAmount = pr.currentBid + 1;
      const bidder = state.players[pr.nextBidder];
      // Only bid if we can afford it
      if (Math.random() < 0.5 && bidder.gold >= bidAmount) {
        return { type: 'AUCTION_BID', amount: bidAmount };
      }
      return { type: 'AUCTION_PASS' };
    }

    case 'DECK_PEEK': {
      if (pr.revealedCards.length === 0) return null;
      return { type: 'DECK_PEEK_PICK', cardIndex: Math.floor(Math.random() * pr.revealedCards.length) };
    }

    case 'DISCARD_PICK': {
      if (pr.eligibleCards.length === 0) return null;
      return { type: 'DISCARD_PICK', cardId: pick(pr.eligibleCards) };
    }

    case 'WARE_CASH_CONVERSION': {
      if (pr.step === 'SELECT_CARD') {
        const wareCards = player.hand.filter(id => getCard(id).type === 'ware');
        if (wareCards.length === 0) return null;
        return { type: 'SELECT_CARD', cardId: pick(wareCards) };
      }
      if (pr.step === 'SELECT_WARES') {
        const filledSlots = player.market
          .map((w, i) => ({ w, i }))
          .filter(s => s.w !== null);
        if (filledSlots.length < 3) return null;
        const toReturn = filledSlots.sort(() => Math.random() - 0.5).slice(0, 3);
        return { type: 'SELECT_WARES', wareIndices: toReturn.map(s => s.i) };
      }
      return null;
    }

    case 'WARE_SELL_BULK': {
      const filledSlots = player.market
        .map((w, i) => ({ w, i }))
        .filter(s => s.w !== null);
      if (filledSlots.length === 0) return null;
      const count = Math.min(1 + Math.floor(Math.random() * 3), filledSlots.length);
      const shuffled = filledSlots.sort(() => Math.random() - 0.5).slice(0, count);
      return { type: 'SELL_WARES', wareIndices: shuffled.map(s => s.i) };
    }

    case 'WARE_RETURN': {
      const filledSlots = player.market
        .map((w, i) => ({ w, i }))
        .filter(s => s.w !== null);
      if (filledSlots.length === 0) return null;
      return { type: 'RETURN_WARE', wareIndex: pick(filledSlots).i };
    }

    case 'OPPONENT_DISCARD': {
      const target = pr.targetPlayer;
      const targetPlayer = state.players[target];
      const handSize = targetPlayer.hand.length;
      const discardCount = handSize - pr.discardTo;
      if (discardCount <= 0) return null;
      const indices = Array.from({ length: handSize }, (_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, discardCount);
      return { type: 'OPPONENT_DISCARD_SELECTION', cardIndices: indices };
    }

    case 'DRAFT': {
      if (pr.draftMode === 'wares') {
        if (pr.availableWares.length === 0) return null;
        return { type: 'SELECT_WARE_TYPE', wareType: pick(pr.availableWares) };
      }
      if (pr.availableCards && pr.availableCards.length > 0) {
        return { type: 'SELECT_CARD', cardId: pick(pr.availableCards) };
      }
      return null;
    }

    case 'SUPPLIES_DISCARD': {
      if (player.hand.length === 0) return null;
      return { type: 'SELECT_CARD', cardId: pick(player.hand) };
    }

    case 'UTILITY_KEEP': {
      const responder = pr.step === 'ACTIVE_CHOOSE' ? cp : (cp === 0 ? 1 : 0);
      const utils = state.players[responder].utilities;
      if (utils.length === 0) return null;
      return { type: 'SELECT_UTILITY', utilityIndex: Math.floor(Math.random() * utils.length) };
    }

    case 'CROCODILE_USE': {
      if (pr.step === 'SELECT_UTILITY') {
        const opUtils = state.players[pr.opponentPlayer].utilities;
        if (opUtils.length === 0) return null;
        return { type: 'SELECT_UTILITY', utilityIndex: Math.floor(Math.random() * opUtils.length) };
      }
      return null;
    }

    case 'UTILITY_EFFECT': {
      if (pr.step === 'SELECT_CARD') {
        if (player.hand.length === 0) return null;
        const maxCards = pr.utilityDesign === 'kettle' ? 2 : 1;
        const count = Math.min(1 + Math.floor(Math.random() * maxCards), player.hand.length);
        const cards = player.hand.slice().sort(() => Math.random() - 0.5).slice(0, count);
        return count === 1
          ? { type: 'SELECT_CARD', cardId: cards[0] }
          : { type: 'SELECT_CARDS', cardIds: cards };
      }
      if (pr.step === 'SELECT_WARE_TYPE') {
        const available = availableWareTypes(state);
        if (available.length === 0) return null;
        return { type: 'SELECT_WARE_TYPE', wareType: pick(available) };
      }
      return null;
    }

    case 'DRAW_MODIFIER': {
      if (player.hand.length === 0) return null;
      return { type: 'SELECT_CARD', cardId: pick(player.hand) };
    }

    case 'TURN_MODIFIER':
      return null;

    default:
      return null;
  }
}

export function getRandomAiAction(state: GameState): GameAction | null {
  // Guard reaction
  if (state.pendingGuardReaction) {
    return { type: 'GUARD_REACTION', play: Math.random() < 0.3 };
  }

  // Ware card reaction
  if (state.pendingWareCardReaction) {
    return { type: 'WARE_CARD_REACTION', play: Math.random() < 0.3 };
  }

  // Pending resolution
  if (state.pendingResolution) {
    const response = getRandomInteractionResponse(state);
    if (response) {
      const action: GameAction = { type: 'RESOLVE_INTERACTION', response };
      // Validate the resolution won't throw
      if (safeExec(state, action)) return action;
    }
    return null;
  }

  // Draw phase
  if (state.phase === 'DRAW') {
    if (state.drawnCard !== null) {
      return Math.random() < 0.5
        ? { type: 'KEEP_CARD' }
        : { type: 'DISCARD_DRAWN' };
    }
    if (tryAction(state, { type: 'DRAW_CARD' })) {
      return { type: 'DRAW_CARD' };
    }
    return null;
  }

  // Play phase
  if (state.phase === 'PLAY') {
    if (state.actionsLeft <= 0) {
      return { type: 'END_TURN' };
    }

    const roll = Math.random();
    const cp = state.currentPlayer;
    const player = state.players[cp];

    // 40% play card
    if (roll < 0.4 && player.hand.length > 0) {
      const cardId = pick(player.hand);
      const cardDef = getCard(cardId);

      if (cardDef.type === 'ware' && cardDef.wares) {
        const cb = canBuyWares(state, cp, cardDef.wares);
        const cs = canSellWares(state, cp, cardDef.wares);
        let wareMode: 'buy' | 'sell' | null = null;
        if (cb && cs) wareMode = Math.random() < 0.5 ? 'buy' : 'sell';
        else if (cb) wareMode = 'buy';
        else if (cs) wareMode = 'sell';
        if (wareMode) {
          const action: GameAction = { type: 'PLAY_CARD', cardId, wareMode };
          if (tryAction(state, action) && safeExec(state, action)) return action;
        }
      } else if (cardDef.type === 'utility') {
        // Check utility count limit
        if (player.utilities.length < CONSTANTS.MAX_UTILITIES) {
          const action: GameAction = { type: 'PLAY_CARD', cardId };
          if (tryAction(state, action) && safeExec(state, action)) return action;
        }
      } else if (cardDef.type === 'stand') {
        const standCost = player.smallMarketStands === 0 ? CONSTANTS.FIRST_STAND_COST : CONSTANTS.ADDITIONAL_STAND_COST;
        if (player.gold >= standCost) {
          const action: GameAction = { type: 'PLAY_CARD', cardId };
          if (tryAction(state, action) && safeExec(state, action)) return action;
        }
      } else if (cardDef.type !== 'ware') {
        // People/animal cards
        const action: GameAction = { type: 'PLAY_CARD', cardId };
        if (tryAction(state, action) && safeExec(state, action)) return action;
      }
    }

    // 20% activate utility
    if (roll < 0.6) {
      const unusedUtils = player.utilities
        .map((u, i) => ({ u, i }))
        .filter(({ u }) => !u.usedThisTurn);
      if (unusedUtils.length > 0) {
        const { i } = pick(unusedUtils);
        const action: GameAction = { type: 'ACTIVATE_UTILITY', utilityIndex: i };
        if (tryAction(state, action) && safeExec(state, action)) return action;
      }
    }

    // 15% draw action
    if (roll < 0.75) {
      const action: GameAction = { type: 'DRAW_ACTION' };
      if (tryAction(state, action)) return action;
    }

    return { type: 'END_TURN' };
  }

  return null;
}
