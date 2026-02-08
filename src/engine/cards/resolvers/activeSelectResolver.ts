// ============================================================================
// Active Select Resolver - Throne (swap), Parrot (steal), Crocodile (utility)
// ============================================================================

import type {
  GameState,
  PendingWareTheftSwap,
  PendingWareTheftSingle,
  PendingUtilityTheft,
  InteractionResponse,
} from '../../types.ts';
import { addWareToMarket, removeWareFromMarket } from '../../market/MarketManager.ts';

type ActiveSelectPending = PendingWareTheftSwap | PendingWareTheftSingle | PendingUtilityTheft;

export function resolveActiveSelect(
  state: GameState,
  pending: ActiveSelectPending,
  response: InteractionResponse
): GameState {
  switch (pending.type) {
    case 'WARE_THEFT_SWAP':
      return resolveThrone(state, pending, response);
    case 'WARE_THEFT_SINGLE':
      return resolveParrot(state, pending, response);
    case 'UTILITY_THEFT_SINGLE':
      return resolveCrocodile(state, pending, response);
    default:
      throw new Error(`Unknown active select type`);
  }
}

function resolveThrone(
  state: GameState,
  pending: PendingWareTheftSwap,
  response: InteractionResponse
): GameState {
  const activePlayer = state.currentPlayer;
  const opponent: 0 | 1 = activePlayer === 0 ? 1 : 0;

  if (pending.step === 'STEAL') {
    // Step 1: Active player selects a ware to steal from opponent
    if (response.type !== 'SELECT_WARE') {
      throw new Error('Expected SELECT_WARE for Throne steal step');
    }
    const { wareIndex } = response;
    const opponentMarket = state.players[opponent].market;
    const ware = opponentMarket[wareIndex];
    if (!ware) {
      throw new Error(`Opponent's slot ${wareIndex} is empty`);
    }

    // Remove from opponent, add to active player
    let newState = removeWareFromMarket(state, opponent, wareIndex).state;
    newState = addWareToMarket(newState, activePlayer, ware);

    return {
      ...newState,
      pendingResolution: {
        ...pending,
        step: 'GIVE',
        stolenWare: ware,
      },
    };
  }

  if (pending.step === 'GIVE') {
    // Step 2: Active player selects a ware to give to opponent
    if (response.type !== 'SELECT_WARE') {
      throw new Error('Expected SELECT_WARE for Throne give step');
    }
    const { wareIndex } = response;
    const activeMarket = state.players[activePlayer].market;
    const ware = activeMarket[wareIndex];
    if (!ware) {
      throw new Error(`Your slot ${wareIndex} is empty`);
    }

    // Remove from active, add to opponent
    let newState = removeWareFromMarket(state, activePlayer, wareIndex).state;
    newState = addWareToMarket(newState, opponent, ware);

    // Mark Throne utility as used this turn
    const newUtilities = state.players[activePlayer].utilities.map(u =>
      u.designId === 'throne' ? { ...u, usedThisTurn: true } : u
    );
    const newPlayers = [...newState.players] as [typeof newState.players[0], typeof newState.players[1]];
    newPlayers[activePlayer] = { ...newPlayers[activePlayer], utilities: newUtilities };

    return {
      ...newState,
      players: newPlayers,
      pendingResolution: null,
      log: [...newState.log, {
        turn: state.turn,
        player: activePlayer,
        action: 'THRONE_SWAP',
        details: `Stole ${pending.stolenWare}, gave ${ware}`,
      }],
    };
  }

  throw new Error(`Unknown Throne step: ${pending.step}`);
}

function resolveParrot(
  state: GameState,
  _pending: PendingWareTheftSingle,
  response: InteractionResponse
): GameState {
  if (response.type !== 'SELECT_WARE') {
    throw new Error('Expected SELECT_WARE for Parrot steal');
  }
  const activePlayer = state.currentPlayer;
  const opponent: 0 | 1 = activePlayer === 0 ? 1 : 0;
  const { wareIndex } = response;

  const ware = state.players[opponent].market[wareIndex];
  if (!ware) {
    throw new Error(`Opponent's slot ${wareIndex} is empty`);
  }

  let newState = removeWareFromMarket(state, opponent, wareIndex).state;
  newState = addWareToMarket(newState, activePlayer, ware);

  return {
    ...newState,
    pendingResolution: null,
    log: [...newState.log, {
      turn: state.turn,
      player: activePlayer,
      action: 'PARROT_STEAL',
      details: `Stole ${ware} from opponent`,
    }],
  };
}

function resolveCrocodile(
  state: GameState,
  _pending: PendingUtilityTheft,
  response: InteractionResponse
): GameState {
  if (response.type !== 'SELECT_WARE') {
    // Reusing SELECT_WARE index for utility selection
    throw new Error('Expected SELECT_WARE (index) for Crocodile utility discard');
  }
  const activePlayer = state.currentPlayer;
  const opponent: 0 | 1 = activePlayer === 0 ? 1 : 0;
  const { wareIndex: utilityIndex } = response;

  const opponentUtils = state.players[opponent].utilities;
  if (utilityIndex < 0 || utilityIndex >= opponentUtils.length) {
    throw new Error(`Invalid opponent utility index ${utilityIndex}`);
  }

  const discardedUtility = opponentUtils[utilityIndex];
  const newUtilities = opponentUtils.filter((_, i) => i !== utilityIndex);

  const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
  newPlayers[opponent] = { ...newPlayers[opponent], utilities: newUtilities };

  return {
    ...state,
    players: newPlayers,
    discardPile: [discardedUtility.cardId, ...state.discardPile],
    pendingResolution: null,
    log: [...state.log, {
      turn: state.turn,
      player: activePlayer,
      action: 'CROCODILE_DISCARD',
      details: `Discarded opponent's ${discardedUtility.cardId}`,
    }],
  };
}
