import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../hooks/useGameStore.ts';
import { getRandomAiAction } from '../ai/RandomAI.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';
import type { DeckCardId } from '../engine/types.ts';
import { OpponentArea } from './OpponentArea.tsx';
import { CenterRow } from './CenterRow.tsx';
import { StatusBar } from './StatusBar.tsx';
import { MarketDisplay } from './MarketDisplay.tsx';
import { UtilityArea } from './UtilityArea.tsx';
import { HandDisplay } from './HandDisplay.tsx';
import { ActionButtons, CardPlayDialog } from './ActionButtons.tsx';
import { InteractionPanel } from './InteractionPanel.tsx';
import { GameLog } from './GameLog.tsx';
import { EndgameOverlay } from './EndgameOverlay.tsx';

export function GameScreen() {
  const { state, dispatch, error, newGame } = useGameStore();
  const [wareDialog, setWareDialog] = useState<DeckCardId | null>(null);

  // Is it the AI's turn to act?
  const isAiTurn = (
    state.phase !== 'GAME_OVER' && (
      state.currentPlayer === 1 ||
      (state.pendingGuardReaction !== null && state.pendingGuardReaction.targetPlayer === 1) ||
      (state.pendingWareCardReaction !== null && state.pendingWareCardReaction.targetPlayer === 1) ||
      (state.pendingResolution !== null && isAiResponder(state))
    )
  );

  // AI move effect — retries on error, gives up after 10 attempts per state
  const aiAttemptRef = useRef(0);
  const prevStateRef = useRef(state);

  useEffect(() => {
    if (prevStateRef.current !== state) {
      aiAttemptRef.current = 0;
      prevStateRef.current = state;
    }
  }, [state]);

  useEffect(() => {
    if (!isAiTurn) return;
    if (aiAttemptRef.current >= 10) return;

    const timer = setTimeout(() => {
      aiAttemptRef.current++;
      const action = getRandomAiAction(state);
      if (action) {
        dispatch(action);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isAiTurn, state, dispatch, error]);

  const handlePlayCard = useCallback((cardId: DeckCardId) => {
    if (state.phase !== 'PLAY' || state.currentPlayer !== 0) return;
    const cardDef = getCard(cardId);
    if (cardDef.type === 'ware') {
      setWareDialog(cardId);
    } else {
      dispatch({ type: 'PLAY_CARD', cardId });
    }
  }, [state.phase, state.currentPlayer, dispatch]);

  const hasPendingInteraction = !!(
    state.pendingResolution ||
    state.pendingGuardReaction ||
    state.pendingWareCardReaction
  );
  const isMyTurn = state.currentPlayer === 0;
  const actionsDisabled = !isMyTurn || isAiTurn || (hasPendingInteraction && state.phase !== 'DRAW');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '12px 16px',
      minHeight: '100vh',
    }}>
      {/* Error banner — only show for human player errors */}
      {error && !isAiTurn && (
        <div style={{
          background: '#6a2d2d',
          border: '1px solid #9a4a4a',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 12,
          color: '#ff8888',
        }}>
          {error}
        </div>
      )}

      {/* Opponent area */}
      <OpponentArea player={state.players[1]} />

      {/* Center row */}
      <CenterRow state={state} />

      {/* Interaction panel */}
      {hasPendingInteraction && !isAiTurn && (
        <InteractionPanel state={state} dispatch={dispatch} />
      )}

      {/* Status bar */}
      <StatusBar state={state} />

      {/* Player board */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <MarketDisplay
          market={state.players[0].market}
          label="Your Market"
        />
        <UtilityArea
          utilities={state.players[0].utilities}
          onActivate={(i) => dispatch({ type: 'ACTIVATE_UTILITY', utilityIndex: i })}
          disabled={actionsDisabled || state.phase !== 'PLAY' || state.actionsLeft <= 0}
          label="Your Utilities"
        />
      </div>

      {/* Action buttons (draw phase / play phase controls) */}
      <ActionButtons state={state} dispatch={dispatch} disabled={actionsDisabled} />

      {/* Player hand */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
          Your Hand ({state.players[0].hand.length} cards)
        </div>
        <HandDisplay
          hand={state.players[0].hand}
          onPlayCard={handlePlayCard}
          disabled={actionsDisabled || state.phase !== 'PLAY' || state.actionsLeft <= 0}
        />
      </div>

      {/* Game log */}
      <GameLog log={state.log} />

      {/* Ware buy/sell dialog */}
      {wareDialog && (
        <CardPlayDialog
          cardId={wareDialog}
          onBuy={() => { dispatch({ type: 'PLAY_CARD', cardId: wareDialog, wareMode: 'buy' }); setWareDialog(null); }}
          onSell={() => { dispatch({ type: 'PLAY_CARD', cardId: wareDialog, wareMode: 'sell' }); setWareDialog(null); }}
          onCancel={() => setWareDialog(null)}
        />
      )}

      {/* Endgame overlay */}
      <EndgameOverlay state={state} onNewGame={() => newGame()} />
    </div>
  );
}

/**
 * Determine if the AI (player 1) is the one who needs to respond
 * to the current pending resolution.
 */
function isAiResponder(state: import('../engine/types.ts').GameState): boolean {
  const pr = state.pendingResolution;
  if (!pr) return false;

  switch (pr.type) {
    case 'OPPONENT_DISCARD':
      return pr.targetPlayer === 1;
    case 'OPPONENT_CHOICE':
      return state.currentPlayer !== 1; // opponent of current player responds
    case 'AUCTION':
      return pr.nextBidder === 1;
    case 'DRAFT':
      return pr.currentPicker === 1;
    case 'UTILITY_KEEP':
      return (pr.step === 'ACTIVE_CHOOSE' && state.currentPlayer === 1) ||
             (pr.step === 'OPPONENT_CHOOSE' && state.currentPlayer === 0);
    default:
      // Most resolutions are handled by the current player
      return state.currentPlayer === 1;
  }
}
