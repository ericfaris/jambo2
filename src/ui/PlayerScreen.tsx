// ============================================================================
// Cast Mode — Player Screen
// Private player view: hand, interaction panels, action buttons.
// All actions sent via WebSocket.
// ============================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { WebSocketGameState } from '../multiplayer/client.ts';
import type { PublicGameState, PrivateGameState } from '../multiplayer/types.ts';
import type { GameAction, DeckCardId, WareType, GameState } from '../engine/types.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';
import { validatePlayCard, validateActivateUtility } from '../engine/validation/actionValidator.ts';
import { MarketDisplay } from './MarketDisplay.tsx';
import { UtilityArea } from './UtilityArea.tsx';
import { HandDisplay } from './HandDisplay.tsx';
import { InteractionPanel } from './InteractionPanel.tsx';
import { ResolveMegaView } from './ResolveMegaView.tsx';
import { MegaView } from './MegaView.tsx';
import { CardPlayDialog } from './ActionButtons.tsx';
import { useAudioEvents } from './useAudioEvents.ts';
import { useVisualFeedback } from './useVisualFeedback.ts';

type AnimationSpeed = 'normal' | 'fast';
const ANIMATION_SPEED_STORAGE_KEY = 'jambo.animationSpeed';
const DEV_TELEMETRY_STORAGE_KEY = 'jambo.devTelemetry';
const HIGH_CONTRAST_STORAGE_KEY = 'jambo.highContrast';

function getInitialAnimationSpeed(): AnimationSpeed {
  if (typeof window === 'undefined') return 'normal';
  const saved = window.localStorage.getItem(ANIMATION_SPEED_STORAGE_KEY);
  return saved === 'fast' ? 'fast' : 'normal';
}

function getInitialDevTelemetry(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DEV_TELEMETRY_STORAGE_KEY) === 'true';
}

function getInitialHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY) === 'true';
}

function isDevMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

interface PlayerScreenProps {
  ws: WebSocketGameState;
}

export function PlayerScreen({ ws }: PlayerScreenProps) {
  const pub = ws.publicState;
  const priv = ws.privateState;
  const slot = ws.playerSlot;
  const [wareDialog, setWareDialog] = useState<DeckCardId | null>(null);
  const [drawModalOpen, setDrawModalOpen] = useState(false);
  const [cardError, setCardError] = useState<{cardId: DeckCardId, message: string} | null>(null);
  const [megaCardId, setMegaCardId] = useState<DeckCardId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(() => getInitialAnimationSpeed());
  const [showDevTelemetry, setShowDevTelemetry] = useState(() => getInitialDevTelemetry());
  const [highContrast, setHighContrast] = useState(() => getInitialHighContrast());
  const [telemetryEvents, setTelemetryEvents] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  useAudioEvents(ws.audioEvent, ws.clearAudioEvent);

  const isCardActionValidationError = (message: string) => (
    message.startsWith('Invalid action PLAY_CARD:') ||
    message.startsWith('Invalid action ACTIVATE_UTILITY:')
  );

  // Auto-open draw modal when entering draw phase
  useEffect(() => {
    if (pub && pub.phase === 'DRAW' && pub.currentPlayer === slot && !drawModalOpen) {
      setDrawModalOpen(true);
    } else if (pub && pub.phase !== 'DRAW' && drawModalOpen) {
      setDrawModalOpen(false);
    }
  }, [pub?.phase, pub?.currentPlayer, slot, drawModalOpen]);

  useEffect(() => {
    if (!cardError) return;
    const timer = setTimeout(() => setCardError(null), 5000);
    return () => clearTimeout(timer);
  }, [cardError]);

  useEffect(() => {
    if (ws.error && isCardActionValidationError(ws.error)) {
      ws.clearError();
    }
  }, [ws.error, ws.clearError]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-anim-speed', animationSpeed);
    window.localStorage.setItem(ANIMATION_SPEED_STORAGE_KEY, animationSpeed);
  }, [animationSpeed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DEV_TELEMETRY_STORAGE_KEY, String(showDevTelemetry));
  }, [showDevTelemetry]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
    window.localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(highContrast));
  }, [highContrast]);

  if (!pub || !priv || slot === null) return null;

  const dispatch = (action: GameAction) => ws.sendAction(action);
  const isMyTurn = isWaitingForMe(pub, priv, slot);
  const myPublic = pub.players[slot];
  const lastLog = pub.log.length > 0 ? pub.log[pub.log.length - 1] : null;

  const visualFeedback = useVisualFeedback({
    phase: pub.phase,
    actionsLeft: pub.actionsLeft,
    deckCount: pub.deckCount,
    discardCount: pub.discardPile.length,
    topDiscardCard: pub.discardPile.length > 0 ? pub.discardPile[0] : null,
    players: [
      {
        gold: pub.players[0].gold,
        handCount: pub.players[0].handCount,
        market: pub.players[0].market,
      },
      {
        gold: pub.players[1].gold,
        handCount: pub.players[1].handCount,
        market: pub.players[1].market,
      },
    ],
    lastLog: lastLog ? { player: lastLog.player, action: lastLog.action } : null,
  });

  useEffect(() => {
    if (!showDevTelemetry) return;

    const newEvents: string[] = [];
    if (visualFeedback.trail) {
      newEvents.push(`[trail] ${visualFeedback.trail.actor === slot ? 'you' : 'opponent'} ${visualFeedback.trail.kind}`);
    }
    if (visualFeedback.goldDeltas[0] !== 0 || visualFeedback.goldDeltas[1] !== 0) {
      const myDelta = visualFeedback.goldDeltas[slot];
      const oppDelta = visualFeedback.goldDeltas[slot === 0 ? 1 : 0];
      newEvents.push(`[gold] you ${myDelta}, opp ${oppDelta}`);
    }
    if (visualFeedback.marketFlashSlots[0].length > 0 || visualFeedback.marketFlashSlots[1].length > 0) {
      const mySlots = visualFeedback.marketFlashSlots[slot];
      const oppSlots = visualFeedback.marketFlashSlots[slot === 0 ? 1 : 0];
      newEvents.push(`[market] you ${mySlots.join(',') || '-'} | opp ${oppSlots.join(',') || '-'}`);
    }

    if (newEvents.length === 0) return;
    newEvents.forEach((entry) => console.debug(`[JamboPlayer] ${entry}`));
    setTelemetryEvents((previous) => [...newEvents, ...previous].slice(0, 8));
  }, [showDevTelemetry, visualFeedback.trail, visualFeedback.goldDeltas, visualFeedback.marketFlashSlots, slot]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const resetUiPrefs = useCallback(() => {
    setAnimationSpeed('normal');
    setShowDevTelemetry(false);
    setHighContrast(false);
    setTelemetryEvents([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ANIMATION_SPEED_STORAGE_KEY);
      window.localStorage.removeItem(DEV_TELEMETRY_STORAGE_KEY);
      window.localStorage.removeItem(HIGH_CONTRAST_STORAGE_KEY);
    }
  }, []);

  const hasPendingInteraction = !!(
    priv.pendingResolution ||
    (pub.pendingGuardReaction && pub.pendingGuardReaction.targetPlayer === slot) ||
    (pub.pendingWareCardReaction && pub.pendingWareCardReaction.targetPlayer === slot)
  );

  const inPlayPhase = pub.phase === 'PLAY' && pub.currentPlayer === slot;
  const actionsDisabled = !isMyTurn || (hasPendingInteraction && pub.phase !== 'DRAW');

  const validationState: GameState = {
    version: 'cast-mode-validation',
    rngSeed: 0,
    rngState: 0,
    turn: pub.turn,
    currentPlayer: pub.currentPlayer,
    phase: pub.phase,
    actionsLeft: pub.actionsLeft,
    drawsThisPhase: pub.drawsThisPhase,
    drawnCard: slot === pub.currentPlayer ? priv.drawnCard : null,
    keptCardThisDrawPhase: false,
    deck: [],
    discardPile: pub.discardPile,
    reshuffleCount: 0,
    wareSupply: pub.wareSupply,
    players: [
      {
        gold: pub.players[0].gold,
        hand: slot === 0 ? priv.hand : [],
        market: pub.players[0].market,
        utilities: pub.players[0].utilities,
        smallMarketStands: pub.players[0].smallMarketStands,
      },
      {
        gold: pub.players[1].gold,
        hand: slot === 1 ? priv.hand : [],
        market: pub.players[1].market,
        utilities: pub.players[1].utilities,
        smallMarketStands: pub.players[1].smallMarketStands,
      },
    ],
    pendingResolution: priv.pendingResolution,
    turnModifiers: pub.turnModifiers,
    endgame: pub.endgame,
    pendingGuardReaction: pub.pendingGuardReaction,
    crocodileCleanup: null,
    pendingWareCardReaction: pub.pendingWareCardReaction,
    log: pub.log,
  };

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
    return 'This card cannot be played right now.';
  };

  const handlePlayCard = useCallback((cardId: DeckCardId) => {
    if (!inPlayPhase || actionsDisabled) return;
    const cardDef = getCard(cardId);
    if (cardDef.type === 'ware') {
      setWareDialog(cardId);
    } else {
      const validation = validatePlayCard(validationState, cardId);
      if (!validation.valid) {
        const friendlyMessage = getFriendlyErrorMessage(validation.reason || 'Invalid play');
        setCardError({ cardId, message: friendlyMessage });
        return;
      }
      setCardError(null);
      dispatch({ type: 'PLAY_CARD', cardId });
    }
  }, [inPlayPhase, actionsDisabled, dispatch, validationState]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: '12px 16px',
      minHeight: '100vh',
      maxWidth: 600,
      margin: '0 auto',
    }}>
      {/* Turn indicator - show player identity first */}
      <TurnIndicator pub={pub} slot={slot} isMyTurn={isMyTurn} />

      {/* Error */}
      {ws.error && !isCardActionValidationError(ws.error) && (
        <div style={{
          background: '#4a1a12',
          border: '1px solid #8a3a2a',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 13,
          color: '#ff9977',
        }}
          onClick={ws.clearError}
        >
          {ws.error}
        </div>
      )}

      {/* Interaction panel */}
      {hasPendingInteraction && (
        <ResolveMegaView>
          <CastInteractionPanel pub={pub} priv={priv} slot={slot} dispatch={dispatch} onMegaView={setMegaCardId} />
        </ResolveMegaView>
      )}

      <div className={`turn-emphasis ${isMyTurn ? 'turn-emphasis-active' : 'turn-emphasis-inactive'}`} style={{
        borderRadius: 12,
        padding: 12,
        backgroundImage: 'linear-gradient(rgba(20,10,5,0.54), rgba(20,10,5,0.54)), url(/assets/panels/wood_1.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
        {/* Own market + utilities */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          background: 'rgba(20,10,5,0.24)',
          borderRadius: 10,
          padding: 12,
          border: '1px solid var(--border)',
        }}>
          <MarketDisplay market={myPublic.market} label="Your Market" />
          <UtilityArea
            utilities={myPublic.utilities}
            onActivate={(i) => {
              const validation = validateActivateUtility(validationState, i);
              if (!validation.valid) {
                const friendlyMessage = getFriendlyErrorMessage(validation.reason || 'Cannot activate utility');
                setCardError({ cardId: myPublic.utilities[i].cardId, message: friendlyMessage });
                return;
              }
              setCardError(null);
              dispatch({ type: 'ACTIVATE_UTILITY', utilityIndex: i });
            }}
            disabled={actionsDisabled || !inPlayPhase || pub.actionsLeft <= 0}
            cardError={cardError}
            label="Your Utilities"
          />
        </div>

        {/* Play phase: End Turn button */}
        {inPlayPhase && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
            <button
              className="danger"
              disabled={actionsDisabled}
              onClick={() => dispatch({ type: 'END_TURN' })}
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
                        backgroundColor: i < pub.actionsLeft ? 'var(--gold)' : 'rgba(90,64,48,0.5)',
                        border: '2px solid var(--gold)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Hand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div className="panel-section-title" style={{ fontSize: 15, marginBottom: 0 }}>
              Your Hand ({priv.hand.length} cards)
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold)', fontWeight: 700, fontSize: 20, textShadow: '0 0 8px rgba(212,168,80,0.4)' }}>
                {myPublic.gold}g
              </span>
            </div>
          </div>
          <HandDisplay
            hand={priv.hand}
            onPlayCard={handlePlayCard}
            disabled={actionsDisabled || !inPlayPhase || pub.actionsLeft <= 0}
            cardError={cardError}
            useWoodBackground={false}
            onMegaView={setMegaCardId}
          />
        </div>
      </div>

      {/* Ware dialog */}
      {wareDialog && (
        <CardPlayDialog
          cardId={wareDialog}
          onBuy={() => {
            const validation = validatePlayCard(validationState, wareDialog, 'buy');
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
            const validation = validatePlayCard(validationState, wareDialog, 'sell');
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

      {/* Connection indicator */}
      <div style={{
        position: 'fixed',
        bottom: 8,
        right: 12,
        fontSize: 11,
        color: ws.connected ? '#6a6' : '#a66',
      }}>
        {ws.connected ? 'Connected' : 'Reconnecting...'}
      </div>

      {/* Settings */}
      <div ref={menuRef} style={{ position: 'fixed', top: 12, right: 16, zIndex: 50 }}>
        <button
          onClick={() => setMenuOpen((previous) => !previous)}
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
              Player Settings
            </div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              fontSize: 15,
              color: 'var(--text)',
            }}>
              Animation Speed
              <select
                value={animationSpeed}
                onChange={(event) => setAnimationSpeed(event.target.value as AnimationSpeed)}
                style={{
                  background: 'var(--surface-light)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 14,
                }}
              >
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginTop: 10,
              cursor: 'pointer',
              fontSize: 15,
              color: 'var(--text)',
            }}>
              High Contrast Mode
              <input
                type="checkbox"
                checked={highContrast}
                onChange={() => setHighContrast((previous) => !previous)}
                style={{ accentColor: 'var(--gold)', width: 16, height: 16, cursor: 'pointer' }}
              />
            </label>
            {isDevMode() && (
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                marginTop: 10,
                cursor: 'pointer',
                fontSize: 15,
                color: 'var(--text)',
              }}>
                Dev Telemetry Overlay
                <input
                  type="checkbox"
                  checked={showDevTelemetry}
                  onChange={() => setShowDevTelemetry((previous) => !previous)}
                  style={{ accentColor: 'var(--gold)', width: 16, height: 16, cursor: 'pointer' }}
                />
              </label>
            )}
            <button
              onClick={resetUiPrefs}
              style={{
                marginTop: 12,
                width: '100%',
                background: 'var(--surface-light)',
                border: '1px solid var(--border-light)',
                color: 'var(--text)',
                borderRadius: 8,
                padding: '8px 10px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Reset UI Preferences
            </button>
          </div>
        )}
      </div>

      {/* Draw modal */}
      {drawModalOpen && (
        <DrawModal
          pub={pub}
          priv={priv}
          dispatch={dispatch}
          disabled={actionsDisabled}
          onClose={() => setDrawModalOpen(false)}
          slot={slot}
        />
      )}

      {/* Mega view */}
      {megaCardId && (
        <MegaView cardId={megaCardId} onClose={() => setMegaCardId(null)} />
      )}

      {isDevMode() && showDevTelemetry && telemetryEvents.length > 0 && (
        <div style={{
          position: 'fixed',
          left: 12,
          bottom: 12,
          width: 300,
          maxHeight: 220,
          overflowY: 'auto',
          background: 'rgba(20,10,5,0.88)',
          border: '1px solid var(--border-light)',
          borderRadius: 8,
          padding: 8,
          zIndex: 1500,
          fontSize: 11,
          color: 'var(--text-muted)',
        }}>
          <div style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>Player Telemetry</div>
          {telemetryEvents.map((entry, index) => (
            <div key={`${entry}-${index}`} style={{ marginBottom: 3 }}>
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function DrawModal({ pub, priv, dispatch, disabled, onClose, slot }: {
  pub: PublicGameState;
  priv: PrivateGameState;
  dispatch: (action: GameAction) => void;
  disabled: boolean;
  onClose: () => void;
  slot: 0 | 1;
}) {
  const [showCardBack, setShowCardBack] = useState(false);
  
  // Show modal if we have a drawn card OR if we're in draw phase (even without a drawn card yet)
  const shouldShowModal = priv.drawnCard || (pub.phase === 'DRAW' && pub.currentPlayer === slot);
  if (!shouldShowModal && !showCardBack) return null;

  const card = priv.drawnCard ? getCard(priv.drawnCard) : null;

  // CSS linen finish — fine crosshatch over off-white base
  const LINEN_BG = [
    'linear-gradient(0deg, rgba(180,170,155,0.08) 0.3px, transparent 0.3px)',
    'linear-gradient(90deg, rgba(180,170,155,0.08) 0.3px, transparent 0.3px)',
    'linear-gradient(135deg, rgba(200,190,175,0.04) 0.3px, transparent 0.3px)',
    'linear-gradient(45deg, rgba(200,190,175,0.04) 0.3px, transparent 0.3px)',
  ].join(', ');
  const LINEN_BG_SIZE = '1px 1px, 1px 1px, 1.5px 1.5px, 1.5px 1.5px';
  const LINEN_BASE = '#e8e4df';

  const handleDiscard = () => {
    dispatch({ type: 'DISCARD_DRAWN' });
    setShowCardBack(true);
  };

  const handleDrawCard = () => {
    dispatch({ type: 'DRAW_CARD' });
    setShowCardBack(false);
  };

  const handleSkipDraw = () => {
    dispatch({ type: 'SKIP_DRAW' });
    setShowCardBack(false);
    onClose();
  };

  return (
    <div
      className="overlay-fade"
      onClick={() => {
        setShowCardBack(false);
        onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        background: 'rgba(20,10,5,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="dialog-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380,
          borderRadius: 14,
          padding: 8,
          backgroundImage: LINEN_BG,
          backgroundSize: LINEN_BG_SIZE,
          backgroundColor: LINEN_BASE,
          border: '2px solid #a89880',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {showCardBack || !priv.drawnCard ? (
          <img
            src="/assets/cards/card_back.png"
            alt="Card back"
            style={{
              width: '100%',
              borderRadius: 10,
              display: 'block',
            }}
            draggable={false}
          />
        ) : (
          <>
            <img
              src={`/assets/cards/${card!.designId}.png`}
              alt={card!.name}
              style={{
                width: '100%',
                borderRadius: 10,
                display: 'block',
              }}
              draggable={false}
            />
            <div style={{ padding: '0 6px 6px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1714', marginBottom: 6 }}>
                {card!.name}
              </div>
              <div style={{ fontSize: 15, color: '#4a4540', lineHeight: 1.4 }}>
                {card!.description}
              </div>
            </div>
          </>
        )}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          padding: '0 6px 6px',
        }}>
          {showCardBack || !priv.drawnCard ? (
            <>
              <button
                className="primary"
                disabled={disabled || pub.actionsLeft <= 0}
                onClick={handleDrawCard}
                style={{ flex: 1, padding: '12px' }}
              >
                Draw Card ({pub.actionsLeft} actions left)
              </button>
              <button
                disabled={disabled}
                onClick={handleSkipDraw}
                style={{ flex: 1, padding: '12px' }}
              >
                Skip Draw Phase
              </button>
            </>
          ) : (
            <>
              <button
                className="primary"
                disabled={disabled}
                onClick={() => {
                  dispatch({ type: 'KEEP_CARD' });
                  setShowCardBack(false);
                  onClose();
                }}
                style={{ flex: 1, padding: '12px' }}
              >
                Keep Card
              </button>
              <button
                className="danger"
                disabled={disabled}
                onClick={handleDiscard}
                style={{ flex: 1, padding: '12px' }}
              >
                Discard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TurnIndicator({ pub, slot, isMyTurn }: {
  pub: PublicGameState;
  slot: 0 | 1;
  isMyTurn: boolean;
}) {
  const phaseColor = pub.phase === 'DRAW' ? '#5a9ab0' : pub.phase === 'PLAY' ? '#7a9a4a' : '#c04030';

  return (
    <div style={{
      textAlign: 'center',
      padding: '8px 16px',
      background: isMyTurn ? phaseColor + '25' : 'var(--surface)',
      borderRadius: 8,
      border: `1px solid ${isMyTurn ? phaseColor : 'var(--border)'}`,
    }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
        You are Player {slot + 1} &middot; {pub.players[slot].gold}g
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Turn {pub.turn}
      </div>
      <div style={{
        fontWeight: 700,
        fontSize: 16,
        color: isMyTurn ? phaseColor : 'var(--text-muted)',
      }}>
        {isMyTurn ? (pub.phase === 'DRAW' ? 'Your Draw Phase' : pub.phase === 'PLAY' ? 'Your Play Phase' : 'Game Over')
          : pub.phase === 'GAME_OVER' ? 'Game Over' : "Opponent's Turn"}
      </div>
      {pub.endgame && (
        <div style={{ fontSize: 12, color: '#c04030', fontWeight: 700, marginTop: 2 }}>
          {pub.endgame.isFinalTurn ? 'FINAL TURN!' : 'Endgame triggered!'}
        </div>
      )}
    </div>
  );
}

/**
 * Wraps InteractionPanel for cast mode by constructing a synthetic GameState
 * from the public + private data. InteractionPanel expects a full GameState.
 */
function CastInteractionPanel({ pub, priv, slot, dispatch, onMegaView }: {
  pub: PublicGameState;
  priv: PrivateGameState;
  slot: 0 | 1;
  dispatch: (action: GameAction) => void;
  onMegaView?: (cardId: DeckCardId) => void;
}) {
  // Build a minimal synthetic GameState that InteractionPanel can work with.
  // It only reads: pendingResolution, pendingGuardReaction, pendingWareCardReaction,
  // currentPlayer, players[cp].hand, players[cp].market, players[opp].market,
  // players[opp].utilities, wareSupply, discardPile
  const syntheticState = {
    currentPlayer: pub.currentPlayer,
    phase: pub.phase,
    pendingResolution: priv.pendingResolution,
    pendingGuardReaction: pub.pendingGuardReaction?.targetPlayer === slot ? pub.pendingGuardReaction : null,
    pendingWareCardReaction: pub.pendingWareCardReaction?.targetPlayer === slot ? pub.pendingWareCardReaction : null,
    wareSupply: pub.wareSupply,
    discardPile: pub.discardPile,
    players: [
      { ...pub.players[0], hand: slot === 0 ? priv.hand : [] as DeckCardId[] },
      { ...pub.players[1], hand: slot === 1 ? priv.hand : [] as DeckCardId[] },
    ] as [
      { gold: number; market: (WareType | null)[]; utilities: typeof pub.players[0]['utilities']; hand: DeckCardId[]; smallMarketStands: number },
      { gold: number; market: (WareType | null)[]; utilities: typeof pub.players[1]['utilities']; hand: DeckCardId[]; smallMarketStands: number },
    ],
    log: pub.log,
    turnModifiers: pub.turnModifiers,
    endgame: pub.endgame,
  };

  // InteractionPanel expects GameState — cast as any since we're providing a subset
  return (
    <InteractionPanel
      state={syntheticState as import('../engine/types.ts').GameState}
      dispatch={dispatch}
      onMegaView={onMegaView}
    />
  );
}

// --- Helpers ---

function isWaitingForMe(
  pub: PublicGameState,
  priv: PrivateGameState,
  slot: 0 | 1,
): boolean {
  if (pub.phase === 'GAME_OVER') return false;

  // Guard reaction
  if (pub.pendingGuardReaction?.targetPlayer === slot) return true;
  // Ware card reaction
  if (pub.pendingWareCardReaction?.targetPlayer === slot) return true;
  // Resolution
  if (priv.pendingResolution && pub.waitingOnPlayer === slot) return true;
  // Normal turn
  if (!pub.pendingGuardReaction && !pub.pendingWareCardReaction && !pub.pendingResolutionType) {
    return pub.currentPlayer === slot;
  }

  return pub.waitingOnPlayer === slot;
}

