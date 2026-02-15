import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../hooks/useGameStore.ts';
import { getRandomAiAction } from '../ai/RandomAI.ts';
import { getAiActionDescription } from '../ai/aiActionDescriptions.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';
import { validatePlayCard, validateActivateUtility } from '../engine/validation/actionValidator.ts';
import type { DeckCardId, GameState, PendingResolution } from '../engine/types.ts';
import { CONSTANTS } from '../engine/types.ts';
import { OpponentArea } from './OpponentArea.tsx';
import { CenterRow } from './CenterRow.tsx';
import { MarketDisplay } from './MarketDisplay.tsx';
import { UtilityArea } from './UtilityArea.tsx';
import { HandDisplay } from './HandDisplay.tsx';
import { ActionButtons, CardPlayDialog, DrawModal } from './ActionButtons.tsx';
import { InteractionPanel } from './InteractionPanel.tsx';
import { GameLog } from './GameLog.tsx';
import { EndgameOverlay } from './EndgameOverlay.tsx';
import { ResolveMegaView } from './ResolveMegaView.tsx';
import { MegaView } from './MegaView.tsx';

export function GameScreen({ onBackToMenu }: { onBackToMenu?: () => void }) {
  const { state, dispatch, error, newGame } = useGameStore();
  const [wareDialog, setWareDialog] = useState<DeckCardId | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawModalOpen, setDrawModalOpen] = useState(false);
  const [cardError, setCardError] = useState<{cardId: DeckCardId, message: string} | null>(null);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [megaCardId, setMegaCardId] = useState<DeckCardId | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Is it the AI's turn to act?
  const getPendingResponder = (state: GameState, pr: PendingResolution): 0 | 1 => {
    switch (pr.type) {
      case 'AUCTION':
        return pr.wares.length < 2 ? state.currentPlayer : pr.nextBidder;
      case 'DRAFT':
        return pr.currentPicker;
      case 'OPPONENT_DISCARD':
      case 'CARRIER_WARE_SELECT':
        return pr.targetPlayer;
      case 'UTILITY_KEEP':
        return pr.step === 'ACTIVE_CHOOSE'
          ? state.currentPlayer
          : (state.currentPlayer === 0 ? 1 : 0);
      case 'OPPONENT_CHOICE':
        return state.currentPlayer === 0 ? 1 : 0;
      default:
        return state.currentPlayer;
    }
  };

  const isAiResponder = (state: GameState) => {
    if (!state.pendingResolution) return false;
    return getPendingResponder(state, state.pendingResolution) === 1;
  };

  const isAiTurn = state.phase !== 'GAME_OVER' && (
    state.pendingResolution !== null ? isAiResponder(state) :
    state.pendingGuardReaction !== null ? state.pendingGuardReaction.targetPlayer === 1 :
    state.pendingWareCardReaction !== null ? state.pendingWareCardReaction.targetPlayer === 1 :
    state.currentPlayer === 1
  );

  const getFriendlyErrorMessage = (reason: string) => {
    if (reason.includes('PLAY phase')) {
      return 'You can only play cards during your turn.';
    }
    if (reason.includes('No actions remaining')) {
      return "You've used all your actions this turn.";
    }
    if (reason.includes('not in hand')) {
      return 'This card is not in your hand.';
    }
    if (reason.includes('wareMode')) {
      return 'Please choose buy or sell for this ware card.';
    }
    if (reason.includes('gold') || reason.includes('cost')) {
      return 'You do not have enough gold for this action.';
    }
    if (reason.includes('market') || reason.includes('space')) {
      return 'You do not have space in your market for this ware.';
    }
    if (reason.includes('wares') || reason.includes('supply')) {
      return 'There are no wares available to buy or sell.';
    }
    // Default friendly message
    return 'This card cannot be played right now.';
  };

  // Handle playing a card from hand
  const handlePlayCard = useCallback((cardId: DeckCardId) => {
    const card = getCard(cardId);
    if (card.type === 'ware') {
      // For ware cards, show buy/sell dialog
      setWareDialog(cardId);
    } else {
      // For other cards, validate first
      const validation = validatePlayCard(state, cardId);
      if (!validation.valid) {
        const friendlyMessage = getFriendlyErrorMessage(validation.reason || 'Invalid play');
        setCardError({ cardId, message: friendlyMessage });
        return;
      }
      // Clear any previous error
      setCardError(null);
      dispatch({ type: 'PLAY_CARD', cardId });
    }
  }, [dispatch, state]);

  // AI move effect
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

    const isFirstTurn = state.turn === 0;
    const delay = isFirstTurn ? 0 : CONSTANTS.AI_ACTION_DELAY_MS;

    const timer = setTimeout(() => {
      aiAttemptRef.current++;
      const action = getRandomAiAction(state);
      if (action) {
        // Set AI message before dispatching action
        const message = getAiActionDescription(action, state);
        setAiMessage(message);
        dispatch(action);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isAiTurn, state, dispatch, error]);

  // Auto-open draw modal when entering draw phase
  useEffect(() => {
    if (state.phase === 'DRAW' && state.currentPlayer === 0 && !drawModalOpen) {
      setDrawModalOpen(true);
    } else if (state.phase !== 'DRAW' && drawModalOpen) {
      setDrawModalOpen(false);
    }
  }, [state.phase, state.currentPlayer, drawModalOpen]);

  useEffect(() => {
    if (!cardError) return;
    const timer = setTimeout(() => setCardError(null), 5000);
    return () => clearTimeout(timer);
  }, [cardError]);

  const handleAiMessageHide = useCallback(() => {
    setAiMessage('');
  }, []);

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
      gap: 16,
      padding: '16px 20px',
      minHeight: '100vh',
      position: 'relative',
    }}>
      {/* Menu button */}
      {onBackToMenu && (
        <button
          onClick={onBackToMenu}
          style={{
            position: 'absolute',
            top: 16,
            right: 20,
            background: 'rgba(90,64,48,0.8)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 16px',
            color: 'white',
            fontSize: 14,
            cursor: 'pointer',
            zIndex: 1000,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(90,64,48,0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(90,64,48,0.8)';
          }}
        >
          Menu
        </button>
      )}

      {/* Main game area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
      }}>
        {/* Opponent area */}
        <div style={{
          ...(state.currentPlayer === 1 && {
            boxShadow: '0 0 20px rgba(212, 168, 80, 0.4), inset 0 0 20px rgba(212, 168, 80, 0.1)',
            border: '2px solid rgba(212, 168, 80, 0.6)',
            borderRadius: 12,
          })
        }}>
          <OpponentArea
            player={state.players[1]}
            aiMessage={aiMessage}
            onMessageHide={handleAiMessageHide}
          />
        </div>

        {/* Center row */}
        <div>
          <CenterRow state={state} dispatch={dispatch} isLocalMode={true} showGlow={false} />
        </div>

        {/* Player sections */}
        <div style={{
          ...(state.currentPlayer === 0 && {
            boxShadow: '0 0 20px rgba(212, 168, 80, 0.4), inset 0 0 20px rgba(212, 168, 80, 0.1)',
            borderRadius: 12,
            padding: '12px',
            background: 'rgba(90,64,48,0.1)',
          })
        }}>
          {/* Player board */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            background: 'rgba(90,64,48,0.3)',
            borderRadius: 10,
            padding: 14,
            border: '1px solid var(--border)',
            marginBottom: 10,
          }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {(state.turnModifiers.buyDiscount > 0 || state.turnModifiers.sellBonus > 0) && (
              <span style={{ fontSize: 13, color: '#6a8a40', fontWeight: 600 }}>
                {state.turnModifiers.buyDiscount > 0 && `Buy -${state.turnModifiers.buyDiscount}g `}
                {state.turnModifiers.sellBonus > 0 && `Sell +${state.turnModifiers.sellBonus}g`}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <MarketDisplay
              market={state.players[0].market}
              label="Your Market"
            />
            <UtilityArea
              utilities={state.players[0].utilities}
              onActivate={(i) => {
                const validation = validateActivateUtility(state, i);
                if (!validation.valid) {
                  const friendlyMessage = getFriendlyErrorMessage(validation.reason || 'Cannot activate utility');
                  setCardError({ cardId: state.players[0].utilities[i].cardId, message: friendlyMessage });
                  return;
                }
                setCardError(null);
                dispatch({ type: 'ACTIVATE_UTILITY', utilityIndex: i });
              }}
              disabled={actionsDisabled || state.phase !== 'PLAY' || state.actionsLeft <= 0}
              cardError={cardError}
              label="Your Utilities"
            />
          </div>
        </div>

        {/* Action buttons */}
        <ActionButtons 
          state={state}
        />

          {/* Player hand */}
          <div style={{
            marginBottom: 10,
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-muted)', fontWeight: 600 }}>
              Your Hand ({state.players[0].hand.length} cards)
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold)', fontWeight: 700, fontSize: 20, textShadow: '0 0 8px rgba(212,168,80,0.4)' }}>
                {state.players[0].gold}g
              </span>
            </div>
          </div>
          <HandDisplay
            hand={state.players[0].hand}
            onPlayCard={handlePlayCard}
            disabled={actionsDisabled || state.phase !== 'PLAY' || state.actionsLeft <= 0}
            cardError={cardError}
            onMegaView={setMegaCardId}
          />
        </div>

        {/* End Turn button */}
        {state.phase === 'PLAY' && state.currentPlayer === 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 16,
          }}>
            <button
              onClick={() => dispatch({ type: 'END_TURN' })}
              style={{
                background: 'linear-gradient(135deg, #c04030 0%, #a03020 50%, #c04030 100%)',
                border: '2px solid #ff6b5a',
                borderRadius: 8,
                padding: '12px 24px',
                color: 'white',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(192, 64, 48, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                animation: 'shimmer 2s ease-in-out infinite alternate',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(192, 64, 48, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(192, 64, 48, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div>End Turn</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: i < state.actionsLeft ? 'var(--gold)' : 'rgba(90,64,48,0.5)',
                        border: '2px solid var(--gold)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Right sidebar — Game log */}
      {showLog && (
        <div style={{
          width: 280,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-muted)', fontWeight: 600 }}>
            Game Log
          </div>
          <GameLog log={state.log} />
        </div>
      )}

      {/* Settings hamburger menu */}
      <div ref={menuRef} style={{ position: 'fixed', top: 12, right: 16, zIndex: 50 }}>
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          style={{
            width: 42,
            height: 42,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: menuOpen ? 'var(--surface-accent)' : 'var(--surface-light)',
            border: '1px solid var(--border-light)',
            borderRadius: 8,
          }}
          title="Settings"
        >
          <span style={{ width: 16, height: 2, background: 'var(--text-muted)', borderRadius: 1 }} />
          <span style={{ width: 16, height: 2, background: 'var(--text-muted)', borderRadius: 1 }} />
          <span style={{ width: 16, height: 2, background: 'var(--text-muted)', borderRadius: 1 }} />
        </button>

        {menuOpen && (
          <div className="dialog-pop" style={{
            position: 'absolute',
            top: 42,
            right: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 10,
            padding: 12,
            minWidth: 220,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--gold)', marginBottom: 12 }}>
              Settings
            </div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              cursor: 'pointer',
              fontSize: 15,
              color: 'var(--text)',
            }}>
              Show Game Log
              <input
                type="checkbox"
                checked={showLog}
                onChange={() => setShowLog(prev => !prev)}
                style={{ accentColor: 'var(--gold)', width: 16, height: 16, cursor: 'pointer' }}
              />
            </label>
          </div>
        )}
      </div>

      {/* Ware buy/sell dialog */}
      {wareDialog && (
        <CardPlayDialog
          cardId={wareDialog}
          onBuy={() => {
            const validation = validatePlayCard(state, wareDialog, 'buy');
            if (!validation.valid) {
              const friendlyMessage = getFriendlyErrorMessage(validation.reason || 'Cannot buy wares');
              setCardError({ cardId: wareDialog, message: friendlyMessage });
              setWareDialog(null);
              return;
            }
            setCardError(null);
            dispatch({ type: 'PLAY_CARD', cardId: wareDialog, wareMode: 'buy' });
            setWareDialog(null);
          }}
          onSell={() => {
            const validation = validatePlayCard(state, wareDialog, 'sell');
            if (!validation.valid) {
              const friendlyMessage = getFriendlyErrorMessage(validation.reason || 'Cannot sell wares');
              setCardError({ cardId: wareDialog, message: friendlyMessage });
              setWareDialog(null);
              return;
            }
            setCardError(null);
            dispatch({ type: 'PLAY_CARD', cardId: wareDialog, wareMode: 'sell' });
            setWareDialog(null);
          }}
          onCancel={() => setWareDialog(null)}
        />
      )}

      {/* Draw modal */}
      {drawModalOpen && (
        <DrawModal
          state={state}
          dispatch={dispatch}
          disabled={actionsDisabled}
          onClose={() => setDrawModalOpen(false)}
        />
      )}

      {/* Endgame overlay */}
      <EndgameOverlay state={state} onNewGame={() => newGame()} />

      {/* Resolve mega view */}
      {hasPendingInteraction && !isAiTurn && (
        <ResolveMegaView verticalAlign="center">
          <InteractionPanel state={state} dispatch={dispatch} onMegaView={setMegaCardId} />
        </ResolveMegaView>
      )}

      {/* Mega view */}
      {megaCardId && (
        <MegaView cardId={megaCardId} onClose={() => setMegaCardId(null)} />
      )}
    </div>
  );
}

// Add shimmering animation CSS
const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      box-shadow: 0 0 20px rgba(192, 64, 48, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
    100% {
      box-shadow: 0 0 25px rgba(255, 107, 90, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.4);
    }
  }
`;

// Inject the keyframes into the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
}
