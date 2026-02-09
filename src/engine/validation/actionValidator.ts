// ============================================================================
// Action Validator - Pre-play validation for each card and action type
// ============================================================================

import type { GameState, DeckCardId, GameAction } from '../types.ts';
import { CONSTANTS } from '../types.ts';
import { getCard } from '../cards/CardDatabase.ts';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const ok: ValidationResult = { valid: true };
const fail = (reason: string): ValidationResult => ({ valid: false, reason });

/**
 * Check if a game action is valid in the current state.
 */
export function validateAction(state: GameState, action: GameAction): ValidationResult {
  // Can't act during GAME_OVER
  if (state.phase === 'GAME_OVER') {
    return fail('Game is over');
  }

  // Can't act while pending resolution exists (except RESOLVE_INTERACTION and GUARD_REACTION)
  if (state.pendingResolution && action.type !== 'RESOLVE_INTERACTION') {
    return fail('Must resolve pending interaction first');
  }
  if (state.pendingGuardReaction && action.type !== 'GUARD_REACTION') {
    return fail('Must respond to Guard reaction first');
  }
  if (state.pendingWareCardReaction && action.type !== 'WARE_CARD_REACTION') {
    return fail('Must respond to ware card reaction first');
  }

  switch (action.type) {
    case 'DRAW_CARD':
      return validateDrawCard(state);
    case 'KEEP_CARD':
      return validateKeepCard(state);
    case 'DISCARD_DRAWN':
      return validateDiscardDrawn(state);
    case 'PLAY_CARD':
      return validatePlayCard(state, action.cardId, action.wareMode);
    case 'ACTIVATE_UTILITY':
      return validateActivateUtility(state, action.utilityIndex);
    case 'DRAW_ACTION':
      return validateDrawAction(state);
    case 'END_TURN':
      return validateEndTurn(state);
    case 'RESOLVE_INTERACTION':
      return state.pendingResolution ? ok : fail('No pending interaction to resolve');
    case 'GUARD_REACTION':
      return state.pendingGuardReaction ? ok : fail('No pending Guard reaction');
    case 'WARE_CARD_REACTION':
      return state.pendingWareCardReaction ? ok : fail('No pending ware card reaction');
    default:
      return fail('Unknown action type');
  }
}

function validateDrawCard(state: GameState): ValidationResult {
  if (state.phase !== 'DRAW') {
    return fail('Can only draw during DRAW phase');
  }
  if (state.keptCardThisDrawPhase) {
    return fail('Already kept a card this draw phase');
  }
  if (state.drawnCard !== null) {
    return fail('Must keep or discard the current drawn card first');
  }
  if (state.actionsLeft <= 0) {
    return fail('No actions remaining');
  }
  if (state.deck.length === 0 && state.discardPile.length === 0) {
    return fail('No cards available to draw (deadlock)');
  }
  return ok;
}

function validateKeepCard(state: GameState): ValidationResult {
  if (state.phase !== 'DRAW') {
    return fail('Can only keep during DRAW phase');
  }
  if (state.drawnCard === null) {
    return fail('No card drawn to keep');
  }
  return ok;
}

function validateDiscardDrawn(state: GameState): ValidationResult {
  if (state.phase !== 'DRAW') {
    return fail('Can only discard during DRAW phase');
  }
  if (state.drawnCard === null) {
    return fail('No card drawn to discard');
  }
  return ok;
}

function validatePlayCard(
  state: GameState,
  cardId: DeckCardId,
  wareMode?: 'buy' | 'sell'
): ValidationResult {
  if (state.phase !== 'PLAY') {
    return fail('Can only play cards during PLAY phase');
  }
  if (state.actionsLeft <= 0) {
    return fail('No actions remaining');
  }

  const player = state.players[state.currentPlayer];

  // Card must be in hand
  if (!player.hand.includes(cardId)) {
    return fail(`Card "${cardId}" not in hand`);
  }

  const cardDef = getCard(cardId);

  // Ware cards require wareMode
  if (cardDef.type === 'ware') {
    if (!wareMode) {
      return fail('wareMode (buy or sell) is required when playing a ware card');
    }
    if (wareMode !== 'buy' && wareMode !== 'sell') {
      return fail(`Invalid wareMode: "${wareMode}"`);
    }
  }

  // Stand card validation
  if (cardDef.type === 'stand') {
    const cost = player.smallMarketStands === 0
      ? CONSTANTS.FIRST_STAND_COST
      : CONSTANTS.ADDITIONAL_STAND_COST;
    if (player.gold < cost) {
      return fail(`Not enough gold for stand: need ${cost}g, have ${player.gold}g`);
    }
  }

  return ok;
}

function validateActivateUtility(state: GameState, utilityIndex: number): ValidationResult {
  if (state.phase !== 'PLAY') {
    return fail('Can only activate utilities during PLAY phase');
  }
  if (state.actionsLeft <= 0) {
    return fail('No actions remaining');
  }

  const player = state.players[state.currentPlayer];

  if (utilityIndex < 0 || utilityIndex >= player.utilities.length) {
    return fail(`Invalid utility index ${utilityIndex}`);
  }

  const utility = player.utilities[utilityIndex];
  if (utility.usedThisTurn) {
    return fail(`Utility "${utility.cardId}" already used this turn`);
  }

  return ok;
}

function validateDrawAction(state: GameState): ValidationResult {
  if (state.phase !== 'PLAY') {
    return fail('Can only draw-as-action during PLAY phase');
  }
  if (state.actionsLeft <= 0) {
    return fail('No actions remaining');
  }
  if (state.deck.length === 0 && state.discardPile.length === 0) {
    return fail('No cards available to draw');
  }
  return ok;
}

function validateEndTurn(state: GameState): ValidationResult {
  if (state.phase !== 'PLAY') {
    return fail('Can only end turn during PLAY phase');
  }
  if (state.pendingResolution) {
    return fail('Must resolve pending interaction before ending turn');
  }
  return ok;
}

/**
 * Get all valid actions for the current state.
 * Used by AI and UI to show available moves.
 */
export function getValidActions(state: GameState): GameAction[] {
  const actions: GameAction[] = [];

  if (state.phase === 'GAME_OVER') return actions;

  // Pending resolution takes priority
  if (state.pendingResolution) {
    return actions;
  }

  if (state.pendingGuardReaction) {
    actions.push({ type: 'GUARD_REACTION', play: true });
    actions.push({ type: 'GUARD_REACTION', play: false });
    return actions;
  }

  if (state.pendingWareCardReaction) {
    actions.push({ type: 'WARE_CARD_REACTION', play: true });
    actions.push({ type: 'WARE_CARD_REACTION', play: false });
    return actions;
  }

  if (state.phase === 'DRAW') {
    if (validateDrawCard(state).valid) {
      actions.push({ type: 'DRAW_CARD' });
    }
    if (validateKeepCard(state).valid) {
      actions.push({ type: 'KEEP_CARD' });
    }
    if (validateDiscardDrawn(state).valid) {
      actions.push({ type: 'DISCARD_DRAWN' });
    }
  }

  if (state.phase === 'PLAY') {
    const player = state.players[state.currentPlayer];
    if (state.actionsLeft > 0) {
      for (const cardId of player.hand) {
        const cardDef = getCard(cardId);
        if (cardDef.type === 'ware') {
          // Ware cards produce two possible actions: buy and sell
          actions.push({ type: 'PLAY_CARD', cardId, wareMode: 'buy' });
          actions.push({ type: 'PLAY_CARD', cardId, wareMode: 'sell' });
        } else {
          actions.push({ type: 'PLAY_CARD', cardId });
        }
      }

      // Activate utilities
      for (let i = 0; i < player.utilities.length; i++) {
        if (!player.utilities[i].usedThisTurn) {
          actions.push({ type: 'ACTIVATE_UTILITY', utilityIndex: i });
        }
      }

      // Draw as action
      if (validateDrawAction(state).valid) {
        actions.push({ type: 'DRAW_ACTION' });
      }
    }

    // Can always end turn during PLAY
    actions.push({ type: 'END_TURN' });
  }

  return actions;
}
