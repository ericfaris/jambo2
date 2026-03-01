// ============================================================================
// Active Select Resolver - Throne (swap), Parrot (steal)
// ============================================================================

import type {
  GameState,
  PendingWareTheftSwap,
  PendingWareTheftSingle,
  InteractionResponse,
} from '../../types.ts';
import { addWareToMarket, removeWareFromMarket } from '../../market/MarketManager.ts';

type ActiveSelectPending = PendingWareTheftSwap | PendingWareTheftSingle;

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
    // Guard: active player's market is full — cannot receive stolen ware
    if (!state.players[activePlayer].market.some(w => w === null)) {
      return {
        ...state,
        pendingResolution: null,
        log: [...state.log, { turn: state.turn, player: activePlayer, action: 'THRONE_SWAP', details: 'Your market is full; cannot steal a ware' }],
      };
    }

    // Guard: opponent has no wares — auto-resolve
    if (!state.players[opponent].market.some(w => w !== null)) {
      return {
        ...state,
        pendingResolution: null,
        log: [...state.log, { turn: state.turn, player: activePlayer, action: 'THRONE_SWAP', details: 'Opponent has no wares to steal' }],
      };
    }

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

    // Guard: active player has no wares to give back — just keep the stolen ware
    if (!newState.players[activePlayer].market.some(w => w !== null)) {
      return {
        ...newState,
        pendingResolution: null,
        log: [...newState.log, { turn: state.turn, player: activePlayer, action: 'THRONE_SWAP', details: `Stole ${ware}, no wares to give back` }],
      };
    }

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
    // Guard: active player has no wares — auto-resolve
    if (!state.players[activePlayer].market.some(w => w !== null)) {
      return {
        ...state,
        pendingResolution: null,
        log: [...state.log, { turn: state.turn, player: activePlayer, action: 'THRONE_SWAP', details: `Stole ${pending.stolenWare}, no wares to give back` }],
      };
    }

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
  const activePlayer = state.currentPlayer;
  const opponent: 0 | 1 = activePlayer === 0 ? 1 : 0;

  // Guard: active player's market is full — cannot receive stolen ware
  if (!state.players[activePlayer].market.some(w => w === null)) {
    return {
      ...state,
      pendingResolution: null,
      log: [...state.log, { turn: state.turn, player: activePlayer, action: 'PARROT_STEAL', details: 'Your market is full; cannot steal a ware' }],
    };
  }

  // Guard: opponent has no wares — auto-resolve
  if (!state.players[opponent].market.some(w => w !== null)) {
    return {
      ...state,
      pendingResolution: null,
      log: [...state.log, { turn: state.turn, player: activePlayer, action: 'PARROT_STEAL', details: 'Opponent has no wares to steal' }],
    };
  }

  if (response.type !== 'SELECT_WARE') {
    throw new Error('Expected SELECT_WARE for Parrot steal');
  }
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

