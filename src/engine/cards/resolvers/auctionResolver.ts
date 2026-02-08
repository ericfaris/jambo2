// ============================================================================
// Auction Resolver - Traveling Merchant bidding mechanic
// ============================================================================

import type { GameState, PendingAuction, InteractionResponse } from '../../types.ts';
import { removeWaresFromMarket, addWaresToMarket } from '../../market/MarketManager.ts';
import { returnToSupply } from '../../market/WareSupply.ts';

export function resolveAuction(
  state: GameState,
  pending: PendingAuction,
  response: InteractionResponse
): GameState {
  // Step 1: If wares haven't been selected yet, active player selects 2 wares to auction
  if (pending.wares.length === 0) {
    if (response.type !== 'SELECT_WARES') {
      throw new Error('Expected SELECT_WARES to choose wares for auction');
    }
    if (response.wareIndices.length !== 2) {
      throw new Error('Must select exactly 2 wares for auction');
    }

    const { wares } = removeWaresFromMarket(state, state.currentPlayer, response.wareIndices);

    return {
      ...state,
      players: removeWaresFromMarket(state, state.currentPlayer, response.wareIndices).state.players,
      pendingResolution: {
        ...pending,
        wares,
        currentBid: 1,
        currentBidder: state.currentPlayer,
        nextBidder: state.currentPlayer === 0 ? 1 : 0,
        passed: [false, false],
      },
    };
  }

  // Step 2+: Bidding rounds
  if (response.type === 'AUCTION_BID') {
    const { amount } = response;
    if (amount <= pending.currentBid) {
      throw new Error(`Bid ${amount} must be higher than current bid ${pending.currentBid}`);
    }
    if (state.players[pending.nextBidder].gold < amount) {
      throw new Error(`Player ${pending.nextBidder} cannot afford bid of ${amount}`);
    }

    return {
      ...state,
      pendingResolution: {
        ...pending,
        currentBid: amount,
        currentBidder: pending.nextBidder,
        nextBidder: pending.currentBidder,
      },
    };
  }

  if (response.type === 'AUCTION_PASS') {
    const passingPlayer = pending.nextBidder;
    const newPassed = [...pending.passed] as [boolean, boolean];
    newPassed[passingPlayer] = true;

    // If both passed with no bids, wares go to discard/supply
    if (pending.currentBid <= 0 || (newPassed[0] && newPassed[1])) {
      // Return wares to supply
      let newState = state;
      for (const ware of pending.wares) {
        newState = returnToSupply(newState, ware, 1);
      }
      return {
        ...newState,
        pendingResolution: null,
        log: [...newState.log, {
          turn: state.turn,
          player: state.currentPlayer,
          action: 'AUCTION_NO_WINNER',
          details: 'Auction ended with no winner, wares returned to supply',
        }],
      };
    }

    // One player passed, other wins the auction
    const winner = pending.currentBidder;
    const winnerGold = state.players[winner].gold - pending.currentBid;

    const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
    newPlayers[winner] = { ...newPlayers[winner], gold: winnerGold };

    let newState: GameState = { ...state, players: newPlayers };
    newState = addWaresToMarket(newState, winner, pending.wares);

    return {
      ...newState,
      pendingResolution: null,
      log: [...newState.log, {
        turn: state.turn,
        player: state.currentPlayer,
        action: 'AUCTION_WON',
        details: `Player ${winner} won auction for ${pending.wares.join(', ')} at ${pending.currentBid}g`,
      }],
    };
  }

  throw new Error('Expected AUCTION_BID or AUCTION_PASS response');
}
