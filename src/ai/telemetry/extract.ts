import type { GameState } from '../../engine/types.ts';
import type { AITurnFeatureVector } from './types.ts';

export function extractAiTurnFeatures(state: GameState, responder: 0 | 1): AITurnFeatureVector {
  const opponent: 0 | 1 = responder === 0 ? 1 : 0;
  const me = state.players[responder];
  const opp = state.players[opponent];

  const myMarketFilled = me.market.filter((w) => w !== null).length;
  const oppMarketFilled = opp.market.filter((w) => w !== null).length;

  return {
    turn: state.turn,
    responder,
    phase: state.phase,
    actionsLeft: state.actionsLeft,
    pendingType: state.pendingResolution?.type ?? null,
    hasGuardWindow: state.pendingGuardReaction !== null,
    hasRainMakerWindow: state.pendingWareCardReaction !== null,
    myGold: me.gold,
    oppGold: opp.gold,
    goldDiff: me.gold - opp.gold,
    myHandCount: me.hand.length,
    oppHandCount: opp.hand.length,
    handDiff: me.hand.length - opp.hand.length,
    myMarketFilled,
    oppMarketFilled,
    marketDiff: myMarketFilled - oppMarketFilled,
    myUtilityCount: me.utilities.length,
    oppUtilityCount: opp.utilities.length,
    utilityDiff: me.utilities.length - opp.utilities.length,
  };
}

