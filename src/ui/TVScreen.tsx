// ============================================================================
// Cast Mode — TV Screen
// Full shared board view for TV/large display. No private info shown.
// ============================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { WebSocketGameState } from '../multiplayer/client.ts';
import type { PublicGameState, PublicPlayerState } from '../multiplayer/types.ts';
import type { WareType } from '../engine/types.ts';
import { WARE_TYPES } from '../engine/types.ts';
import { MarketDisplay } from './MarketDisplay.tsx';
import { UtilityArea } from './UtilityArea.tsx';
import { GameLog } from './GameLog.tsx';
import { CardFace, WareToken } from './CardFace.tsx';
import { SpeechBubble } from './SpeechBubble.tsx';
import { useAudioEvents } from './useAudioEvents.ts';
import { useVisualFeedback } from './useVisualFeedback.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';
import { FEEDBACK_TIMINGS } from './animationTimings.ts';

type AnimationSpeed = 'normal' | 'fast';
const ANIMATION_SPEED_STORAGE_KEY = 'jambo.animationSpeed';
const SHOW_LOG_STORAGE_KEY = 'jambo.showGameLog';
const DEV_TELEMETRY_STORAGE_KEY = 'jambo.devTelemetry';
const HIGH_CONTRAST_STORAGE_KEY = 'jambo.highContrast';

function getInitialAnimationSpeed(): AnimationSpeed {
  if (typeof window === 'undefined') return 'normal';
  const saved = window.localStorage.getItem(ANIMATION_SPEED_STORAGE_KEY);
  return saved === 'fast' ? 'fast' : 'normal';
}

function getInitialShowLog(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = window.localStorage.getItem(SHOW_LOG_STORAGE_KEY);
  return saved === null ? true : saved === 'true';
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

interface TVScreenProps {
  ws: WebSocketGameState;
}

export function TVScreen({ ws }: TVScreenProps) {
  const pub = ws.publicState;
  const [showLog, setShowLog] = useState(() => getInitialShowLog());
  const [menuOpen, setMenuOpen] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(() => getInitialAnimationSpeed());
  const [showDevTelemetry, setShowDevTelemetry] = useState(() => getInitialDevTelemetry());
  const [highContrast, setHighContrast] = useState(() => getInitialHighContrast());
  const [telemetryEvents, setTelemetryEvents] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  useAudioEvents(ws.audioEvent, ws.clearAudioEvent);

  const handleAiMessageHide = useCallback(() => {
    // For TV screen, we don't need to clear the message as it's handled by the WebSocket state
  }, []);

  if (!pub) return null;

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
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-anim-speed', animationSpeed);
    window.localStorage.setItem(ANIMATION_SPEED_STORAGE_KEY, animationSpeed);
  }, [animationSpeed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SHOW_LOG_STORAGE_KEY, String(showLog));
  }, [showLog]);

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

  useEffect(() => {
    if (!showDevTelemetry) return;

    const newEvents: string[] = [];
    if (visualFeedback.trail) {
      newEvents.push(`[trail] ${visualFeedback.trail.actor === 1 ? 'player 2' : 'player 1'} ${visualFeedback.trail.kind}`);
    }
    if (visualFeedback.goldDeltas[0] !== 0 || visualFeedback.goldDeltas[1] !== 0) {
      newEvents.push(`[gold] p1 ${visualFeedback.goldDeltas[0]}, p2 ${visualFeedback.goldDeltas[1]}`);
    }
    if (visualFeedback.marketFlashSlots[0].length > 0 || visualFeedback.marketFlashSlots[1].length > 0) {
      newEvents.push(`[market] p1 ${visualFeedback.marketFlashSlots[0].join(',') || '-'} | p2 ${visualFeedback.marketFlashSlots[1].join(',') || '-'}`);
    }

    if (newEvents.length === 0) return;
    newEvents.forEach((entry) => console.debug(`[JamboTV] ${entry}`));
    setTelemetryEvents((previous) => [...newEvents, ...previous].slice(0, 8));
  }, [showDevTelemetry, visualFeedback.trail, visualFeedback.goldDeltas, visualFeedback.marketFlashSlots]);

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
    setShowLog(true);
    setAnimationSpeed('normal');
    setShowDevTelemetry(false);
    setHighContrast(false);
    setTelemetryEvents([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SHOW_LOG_STORAGE_KEY);
      window.localStorage.removeItem(ANIMATION_SPEED_STORAGE_KEY);
      window.localStorage.removeItem(DEV_TELEMETRY_STORAGE_KEY);
      window.localStorage.removeItem(HIGH_CONTRAST_STORAGE_KEY);
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      gap: 16,
      padding: '16px 20px',
      minHeight: '100vh',
      position: 'relative',
    }}>
      {/* Main board */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
      }}>
        {/* Player 2 area (top) */}
        <TVPlayerArea
          player={pub.players[1]}
          label="Player 2"
          isActive={pub.currentPlayer === 1}
          flipWoodBackground={true}
          aiMessage={ws.aiMessage || undefined}
          onMessageHide={handleAiMessageHide}
          goldDelta={visualFeedback.goldDeltas[1]}
          marketFlashSlots={visualFeedback.marketFlashSlots[1]}
        />

        {/* Center row */}
        <TVCenterRow pub={pub} visualFeedback={visualFeedback} supply={pub.wareSupply} />

        {/* Waiting indicator */}
        <TVWaitingIndicator pub={pub} />

        {/* Player 1 area (bottom) */}
        <TVPlayerArea
          player={pub.players[0]}
          label="Player 1"
          isActive={pub.currentPlayer === 0}
          goldDelta={visualFeedback.goldDeltas[0]}
          marketFlashSlots={visualFeedback.marketFlashSlots[0]}
        />
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-muted)', fontWeight: 600 }}>
              Game Log
            </span>
            <button
              onClick={() => setShowLog(false)}
              style={{
                background: 'var(--surface-light)',
                border: '1px solid var(--border-light)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: 13,
                borderRadius: 6,
                padding: '4px 8px',
              }}
            >
              Hide
            </button>
          </div>
          <GameLog log={pub.log} />
        </div>
      )}

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
            cursor: 'pointer',
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
              TV Settings
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
                onChange={() => setShowLog((previous) => !previous)}
                style={{ accentColor: 'var(--gold)', width: 16, height: 16, cursor: 'pointer' }}
              />
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginTop: 10,
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
                fontSize: 14,
              }}
            >
              Reset UI Preferences
            </button>
          </div>
        )}
      </div>

      {/* Endgame overlay */}
      {pub.phase === 'GAME_OVER' && <TVEndgameOverlay pub={pub} />}

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
          <div style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>TV Telemetry</div>
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

function TVPlayerArea({ player, label, isActive, flipWoodBackground, aiMessage, onMessageHide, goldDelta, marketFlashSlots }: {
  player: PublicPlayerState;
  label: string;
  isActive: boolean;
  flipWoodBackground?: boolean;
  aiMessage?: string;
  onMessageHide?: () => void;
  goldDelta?: number;
  marketFlashSlots?: number[];
}) {
  return (
    <div className={`etched-wood-border turn-emphasis ${isActive ? 'turn-emphasis-active' : 'turn-emphasis-inactive'}`} style={{ position: 'relative', borderRadius: 12, background: 'rgba(20,10,5,0.34)', padding: 12 }}>
      <div style={{ position: 'absolute', top: 150, right: 0, zIndex: 9999, pointerEvents: 'none' }}>
        <SpeechBubble
          message={aiMessage || ''}
          visible={!!aiMessage}
          onHide={onMessageHide || (() => {})}
        />
      </div>
      <div className="etched-wood-border" style={{
        position: 'relative',
        borderRadius: 10,
        padding: 10,
        overflow: 'hidden',
        background: 'rgba(20,10,5,0.24)',
      }}>
        <img
          src="/assets/panels/wood_1.png"
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: flipWoodBackground ? 'scaleY(-1)' : undefined,
            pointerEvents: 'none',
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(20,10,5,0.54)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <MarketDisplay market={player.market} flashSlots={marketFlashSlots} label="Market" />
          <UtilityArea utilities={player.utilities} disabled label="Utilities" />
        </div>
        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 10,
        }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 18,
            color: isActive ? 'var(--gold)' : 'var(--text)',
          }}>
            {label} {isActive && '(Active)'}
          </span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span key={`tv-gold-${label}-${goldDelta ?? 0}`} className={(goldDelta ?? 0) !== 0 ? 'gold-pop' : undefined} style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16, position: 'relative' }}>
              {player.gold}g
              {(goldDelta ?? 0) !== 0 && (
                <span className="gold-delta-text" style={{
                  position: 'absolute',
                  top: -18,
                  right: -20,
                  color: (goldDelta ?? 0) > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {(goldDelta ?? 0) > 0 ? `+${goldDelta}g` : `${goldDelta}g`}
                </span>
              )}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              {player.handCount} cards
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TVCenterRow({ pub, visualFeedback, supply }: { pub: PublicGameState; visualFeedback: ReturnType<typeof useVisualFeedback>; supply: Record<WareType, number> }) {
  const phaseLabel = pub.phase === 'DRAW'
    ? `Draw Phase (${pub.drawsThisPhase}/5)`
    : pub.phase === 'PLAY'
    ? 'Play Phase'
    : 'Game Over';

  const phaseColor = pub.phase === 'DRAW' ? '#5a9ab0' : pub.phase === 'PLAY' ? '#7a9a4a' : '#c04030';

  const topDiscard = pub.discardPile.length > 0 ? pub.discardPile[0] : null;
  const [displayDiscardCard, setDisplayDiscardCard] = useState(topDiscard);
  const [actionTag, setActionTag] = useState<string | null>(null);
  const [lastActionRecap, setLastActionRecap] = useState<string | null>(null);

  useEffect(() => {
    const trail = visualFeedback?.trail;
    if (trail?.kind === 'discard' && trail.cardId) {
      const previousTop = pub.discardPile.length > 1 ? pub.discardPile[1] : null;
      setDisplayDiscardCard(previousTop);
      const timer = window.setTimeout(() => {
        setDisplayDiscardCard(pub.discardPile.length > 0 ? pub.discardPile[0] : null);
      }, FEEDBACK_TIMINGS.discardPileRevealDelayMs);
      return () => window.clearTimeout(timer);
    }

    setDisplayDiscardCard(topDiscard);
    return;
  }, [visualFeedback?.trail, pub.discardPile, topDiscard]);

  useEffect(() => {
    const trail = visualFeedback?.trail;
    if (!trail) return;
    const actorLabel = `Player ${trail.actor + 1}`;
    const verb = trail.kind === 'draw' ? 'drew a card' : 'discarded a card';
    setActionTag(`${actorLabel} ${verb}`);
    const timer = window.setTimeout(() => setActionTag(null), FEEDBACK_TIMINGS.actionTagDurationMs);
    return () => window.clearTimeout(timer);
  }, [visualFeedback?.trail]);

  useEffect(() => {
    if (pub.log.length === 0) return;
    const latest = pub.log[pub.log.length - 1];
    const recap = `P${latest.player + 1}: ${latest.action}${latest.details ? ` - ${latest.details}` : ''}`;
    setLastActionRecap(recap);
    const timer = window.setTimeout(() => setLastActionRecap(null), 2500);
    return () => window.clearTimeout(timer);
  }, [pub.log.length]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '14px 12px',
      borderRadius: 10,
      background: 'rgba(20,10,5,0.24)',
      width: '100%'
    }}>
      {visualFeedback.trail && (
        <div
          key={visualFeedback.trail.id}
          className={`center-row-trail center-row-trail-${visualFeedback.trail.kind}-${visualFeedback.trail.actor === 0 ? 'bottom' : 'top'}`}
          aria-hidden
        >
          {visualFeedback.trail.kind === 'discard' && visualFeedback.trail.cardId ? (
            <img src={`/assets/cards/${getCard(visualFeedback.trail.cardId).designId}.png`} alt="" draggable={false} />
          ) : (
            <img src="/assets/cards/card_back.png" alt="" draggable={false} />
          )}
        </div>
      )}

      {actionTag && (
        <div className={`center-row-action-tag${visualFeedback?.trail?.actor === 1 ? ' center-row-action-tag-opponent' : ''}`}>
          {actionTag}
        </div>
      )}

      {lastActionRecap && (
        <div className="center-row-recap">
          {lastActionRecap}
        </div>
      )}

      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', alignItems: 'center', gap: 24, marginTop: 25 }}>
        {/* Left: Ware supply */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 26 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 16,
            padding: '16px 18px',
            borderRadius: 10,
            background: 'rgba(20,10,5,0.24)',
            minWidth: 420,
          }}>
            {WARE_TYPES.map((wareType) => (
              <div key={wareType} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                background: 'var(--surface)',
                borderRadius: 8,
                padding: '12px 14px',
                border: '1px solid var(--border)',
                minHeight: 72,
              }}>
                <WareToken type={wareType} size={50} />
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: 'var(--text-muted)', fontWeight: 700 }}>{`x${supply[wareType]}`}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Deck / Phase / Discard */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24, flexShrink: 0 }}>
          <div key={`tv-deck-${visualFeedback.deckPulse}`} className={visualFeedback.deckPulse ? 'pile-pulse' : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 190 }}>
            {pub.deckCount > 0 ? (
              <CardFace cardId="guard_1" faceDown large />
            ) : (
              <div style={{ width: 180, height: 240, borderRadius: 10, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Empty</div>
            )}
            <div className="panel-section-title" style={{ marginBottom: 0, fontSize: 16 }}>Deck ({pub.deckCount})</div>
          </div>

          <div key={`tv-phase-${visualFeedback.phasePulse}-${visualFeedback.actionsPulse}`} className={(visualFeedback.phasePulse || visualFeedback.actionsPulse) ? 'phase-pulse' : undefined} style={{ background: phaseColor + '20', borderRadius: 12, padding: '20px 34px', border: `1px solid ${phaseColor}`, textAlign: 'center', minWidth: 320 }}>
            <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>Turn {pub.turn} &middot; Player {pub.currentPlayer + 1}</div>
            <div style={{ fontWeight: 700, fontSize: 24, color: phaseColor }}>{phaseLabel}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: i < pub.actionsLeft ? 'var(--gold)' : 'rgba(90,64,48,0.5)', border: '2px solid var(--gold)' }} />
              ))}
            </div>
            {pub.endgame && (<div style={{ fontSize: 12, color: '#c04030', fontWeight: 700, marginTop: 2 }}>{pub.endgame.isFinalTurn ? 'FINAL TURN!' : 'Endgame triggered!'}</div>)}
          </div>

          <div key={`tv-discard-${visualFeedback.discardPulse}`} className={visualFeedback.discardPulse ? 'pile-pulse' : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 190 }}>
            {displayDiscardCard ? <CardFace cardId={displayDiscardCard} large /> : <div style={{ width: 180, height: 240, borderRadius: 10, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Empty</div>}
            <div className="panel-section-title" style={{ marginBottom: 0, fontSize: 16 }}>Discard ({pub.discardPile.length})</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TVWaitingIndicator({ pub }: { pub: PublicGameState }) {
  if (pub.phase === 'GAME_OVER') return null;

  let message: string;
  if (pub.pendingGuardReaction) {
    message = `Player ${pub.pendingGuardReaction.targetPlayer + 1} may play a Guard...`;
  } else if (pub.pendingWareCardReaction) {
    message = `Player ${pub.pendingWareCardReaction.targetPlayer + 1} may react with Rain Maker...`;
  } else if (pub.pendingResolutionType) {
    const who = pub.waitingOnPlayer;
    message = who !== null
      ? `Player ${who + 1} is choosing... (${pub.pendingResolutionType})`
      : `Resolving ${pub.pendingResolutionType}...`;
  } else {
    return null;
  }

  return (
    <div className="disabled-hint" style={{
      textAlign: 'center',
      padding: '8px 16px',
      fontSize: 15,
      fontFamily: 'var(--font-heading)',
    }}>
      {message}
    </div>
  );
}

function TVEndgameOverlay({ pub }: { pub: PublicGameState }) {
  const p1Gold = pub.players[0].gold;
  const p2Gold = pub.players[1].gold;
  const winner = p1Gold > p2Gold ? 0
    : p2Gold > p1Gold ? 1
    : pub.endgame?.finalTurnPlayer ?? 1; // tie goes to final turn player

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(20,10,5,0.88)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #3d2a1a 0%, #2d1c12 100%)',
        borderRadius: 16,
        padding: 48,
        border: '3px solid var(--gold)',
        textAlign: 'center',
        maxWidth: 500,
      }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 40,
          fontWeight: 700,
          color: 'var(--gold)',
          marginBottom: 20,
        }}>
          Player {winner + 1} Wins!
        </div>
        <div style={{
          fontSize: 22,
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontSize: 16 }}>Player 1</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--gold)', fontSize: 36 }}>{p1Gold}g</div>
          </div>
          <div style={{ color: 'var(--border-light)', alignSelf: 'center', fontSize: 18 }}>vs</div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontSize: 16 }}>Player 2</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#D4A574', fontSize: 36 }}>{p2Gold}g</div>
          </div>
        </div>
        <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>
          Turns played: {pub.turn}
        </div>
      </div>
    </div>
  );
}
