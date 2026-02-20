// ============================================================================
// Cast Mode — TV Screen
// Full shared board view for TV/large display. No private info shown.
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { WebSocketGameState } from '../multiplayer/client.ts';
import type { PublicGameState, PublicPlayerState } from '../multiplayer/types.ts';
import type { WareType } from '../engine/types.ts';
import { WARE_TYPES } from '../engine/types.ts';
import { MarketDisplay } from './MarketDisplay.tsx';
import { UtilityArea } from './UtilityArea.tsx';
import { CardFace, WareToken } from './CardFace.tsx';
import { useAudioEvents } from './useAudioEvents.ts';
import { useBackgroundMusic } from './useBackgroundMusic.ts';
import { useVisualFeedback } from './useVisualFeedback.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';
import { FEEDBACK_TIMINGS } from './animationTimings.ts';
import { CastEndgameOverlay } from './CastEndgameOverlay.tsx';
import { useCastRoomSync } from '../cast/useCastRoomSync.ts';
import { isCastSdkEnabled } from '../cast/factory.ts';

type AnimationSpeed = 'normal' | 'fast';
const ANIMATION_SPEED_STORAGE_KEY = 'jambo.animationSpeed';
const DEV_TELEMETRY_STORAGE_KEY = 'jambo.devTelemetry';
const HIGH_CONTRAST_STORAGE_KEY = 'jambo.highContrast';
const PLAYER_SECTION_EXTRA_HEIGHT_PX = 0;

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

interface TVScreenProps {
  ws: WebSocketGameState;
}

function getWaitingInfo(pub: PublicGameState): { targetPlayer: 0 | 1 | null; message: string | null } {
  if (pub.phase === 'GAME_OVER') {
    return { targetPlayer: null, message: null };
  }

  if (pub.pendingGuardReaction) {
    return {
      targetPlayer: pub.pendingGuardReaction.targetPlayer,
      message: `Player ${pub.pendingGuardReaction.targetPlayer + 1} may play a Guard...`,
    };
  }

  if (pub.pendingWareCardReaction) {
    return {
      targetPlayer: pub.pendingWareCardReaction.targetPlayer,
      message: `Player ${pub.pendingWareCardReaction.targetPlayer + 1} may react with Rain Maker...`,
    };
  }

  if (pub.pendingResolutionType) {
    const who = pub.waitingOnPlayer;
    return {
      targetPlayer: who,
      message: who !== null
        ? `Player ${who + 1} is choosing... (${pub.pendingResolutionType})`
        : `Resolving ${pub.pendingResolutionType}...`,
    };
  }

  return { targetPlayer: null, message: null };
}

export function TVScreen({ ws }: TVScreenProps) {
  const pub = ws.publicState;
  const castEnabled = isCastSdkEnabled();
  const castSync = useCastRoomSync({
    roomCode: ws.roomCode,
    roomMode: ws.roomMode,
    senderPlayerSlot: null,
    castAccessToken: ws.castAccessToken,
  });
  const [animationSpeed] = useState<AnimationSpeed>(() => getInitialAnimationSpeed());
  const [showDevTelemetry] = useState(() => getInitialDevTelemetry());
  const [highContrast] = useState(() => getInitialHighContrast());
  const [telemetryEvents, setTelemetryEvents] = useState<string[]>([]);
  const [playerSectionHeight, setPlayerSectionHeight] = useState<number | null>(null);
  useAudioEvents(ws.audioEvent, ws.clearAudioEvent);
  useBackgroundMusic();

  // Make #root full-viewport for TV layout
  useEffect(() => {
    const root = document.getElementById('root');
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.display = 'block';
    if (root) {
      root.style.maxWidth = 'none';
      root.style.width = '100%';
      root.style.margin = '0';
    }
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
      body.style.display = '';
      if (root) {
        root.style.maxWidth = '';
        root.style.width = '';
        root.style.margin = '';
      }
    };
  }, []);

  if (!pub) return null;
  const waitingInfo = getWaitingInfo(pub);

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

  const rematchStatusMessage = pub.phase === 'GAME_OVER' && ws.rematchRequired.length > 0
    ? (() => {
      const waiting = ws.rematchRequired.filter((slot) => !ws.rematchVotes.includes(slot));
      if (waiting.length === 0) return 'Starting rematch...';
      return `Waiting for ${waiting.map((slot) => `Player ${slot + 1}`).join(' & ')} to confirm rematch...`;
    })()
    : undefined;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: '32px 64px',
      height: '100vh',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* Player 2 area (top) */}
      <TVPlayerArea
        player={pub.players[1]}
        playerIndex={1}
        label="Player 2"
        isActive={pub.currentPlayer === 1}
        flipWoodBackground={true}
        fixedHeight={playerSectionHeight !== null ? playerSectionHeight + PLAYER_SECTION_EXTRA_HEIGHT_PX : null}
        goldDelta={visualFeedback.goldDeltas[1]}
        marketFlashSlots={visualFeedback.marketFlashSlots[1]}
        waitingMessage={waitingInfo.targetPlayer === 1 ? waitingInfo.message ?? undefined : undefined}
      />

      {/* Center row */}
      <TVCenterRow pub={pub} visualFeedback={visualFeedback} supply={pub.wareSupply} />

      {/* Waiting indicator fallback (only when not tied to one player panel) */}
      {waitingInfo.message && waitingInfo.targetPlayer === null && (
        <TVWaitingIndicator message={waitingInfo.message} />
      )}

      {/* Player 1 area (bottom) */}
      <TVPlayerArea
        player={pub.players[0]}
        playerIndex={0}
        label="Player 1"
        isActive={pub.currentPlayer === 0}
        fixedHeight={playerSectionHeight !== null ? playerSectionHeight + PLAYER_SECTION_EXTRA_HEIGHT_PX : null}
        onMeasureHeight={setPlayerSectionHeight}
        goldDelta={visualFeedback.goldDeltas[0]}
        marketFlashSlots={visualFeedback.marketFlashSlots[0]}
        waitingMessage={waitingInfo.targetPlayer === 0 ? waitingInfo.message ?? undefined : undefined}
      />

      {/* Endgame overlay */}
      {pub.phase === 'GAME_OVER' && <CastEndgameOverlay pub={pub} rematchStatusMessage={rematchStatusMessage} />}

      {/* Connection indicator */}
      <div style={{
        position: 'fixed',
        bottom: 8,
        right: 12,
        fontSize: 11,
        color: ws.connected ? '#6a6' : '#a66',
      }}>
        {ws.connected ? 'Connected' : 'Reconnecting...'}
        {castEnabled ? ` | Cast Sync: ${castSync.status}` : ''}
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

function TVPlayerArea({ player, playerIndex, label, isActive, flipWoodBackground, fixedHeight, onMeasureHeight, goldDelta, marketFlashSlots, waitingMessage }: {
  player: PublicPlayerState;
  playerIndex: 0 | 1;
  label: string;
  isActive: boolean;
  flipWoodBackground?: boolean;
  fixedHeight?: number | null;
  onMeasureHeight?: (height: number) => void;
  goldDelta?: number;
  marketFlashSlots?: number[];
  waitingMessage?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onMeasureHeight || fixedHeight !== null) return;
    const panel = panelRef.current;
    if (!panel) return;

    const measure = () => {
      const height = Math.round(panel.getBoundingClientRect().height);
      if (height > 0) {
        onMeasureHeight(height);
      }
    };

    measure();
    const rafId = window.requestAnimationFrame(measure);
    return () => window.cancelAnimationFrame(rafId);
  }, [fixedHeight, onMeasureHeight]);

  return (
    <div
      ref={panelRef}
      data-center-target={playerIndex === 1 ? 'top' : 'bottom'}
      className={`etched-wood-border turn-emphasis ${isActive ? 'turn-emphasis-active' : 'turn-emphasis-inactive'}`}
      style={{
        position: 'relative',
        borderRadius: 12,
        background: 'rgba(20,10,5,0.34)',
        padding: '0 12px 0',
        flex: '0.3 1 auto',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {waitingMessage && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 12,
          zIndex: 20,
          background: 'rgba(20,10,5,0.82)',
          border: '1px solid var(--border-light)',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 13,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-heading)',
          maxWidth: 360,
          textAlign: 'right',
        }}>
          {waitingMessage.replace(`Player ${playerIndex + 1} `, '')}
        </div>
      )}
      <div style={{
        position: 'relative',
        borderRadius: 10,
        padding: '10px 10px 4px',
        height: '100%',
        overflow: 'visible',
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
        <div style={{ position: 'relative', display: 'flex', gap: 28, flexWrap: 'wrap', height: '100%', transform: 'scale(1.7)', transformOrigin: 'top left' }}>
          <MarketDisplay market={player.market} flashSlots={marketFlashSlots} label="Market" columns={6} />
          {/* Coins + Cards icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 12px', alignSelf: 'center', marginTop: -110, marginLeft: 30 }}>
            <div style={{ position: 'relative', width: 230, height: 154 }}>
              <img src="/assets/coins/coins.png" alt="gold" draggable={false} style={{ width: 230, height: 154, objectFit: 'contain' }} />
              <span key={`tv-gold-${label}-${goldDelta ?? 0}`} className={(goldDelta ?? 0) !== 0 ? 'gold-pop' : undefined} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#f5e6c8',
                border: '2px solid #d4a850',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a1008',
                fontWeight: 700,
                fontSize: 30,
                fontFamily: 'var(--font-heading)',
              }}>
                {player.gold}
                {(goldDelta ?? 0) !== 0 && (
                  <span className="gold-delta-text" style={{
                    position: 'absolute',
                    top: -14,
                    right: -18,
                    color: (goldDelta ?? 0) > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    {(goldDelta ?? 0) > 0 ? `+${goldDelta}g` : `${goldDelta}g`}
                  </span>
                )}
              </span>
            </div>
            <div style={{ position: 'relative', width: 226, height: 154 }}>
              <img src="/assets/cards/cards_fanned_out.png" alt="hand" draggable={false} style={{ width: 226, height: 154, objectFit: 'contain' }} />
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#f5e6c8',
                border: '2px solid #d4a850',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a1008',
                fontWeight: 700,
                fontSize: 30,
                fontFamily: 'var(--font-heading)',
              }}>
                {player.handCount}
              </span>
            </div>
          </div>
          <div style={{ marginLeft: 40 }}>
            <UtilityArea utilities={player.utilities} disabled label="Utilities" cardSize="small" cardScale={1.0} />
          </div>
        </div>
        <span style={{
          position: 'absolute',
          left: 14,
          bottom: 8,
          paddingTop: 24,
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: 28,
          color: isActive ? 'var(--gold)' : 'var(--text)',
        }}>
          {label} {isActive && '(Active)'}
        </span>
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
  const rowRef = useRef<HTMLDivElement | null>(null);
  const deckPileRef = useRef<HTMLDivElement | null>(null);
  const discardPileRef = useRef<HTMLDivElement | null>(null);
  const [drawTrailPath, setDrawTrailPath] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [discardTrailTarget, setDiscardTrailTarget] = useState<{ x: number; y: number } | null>(null);

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

  useEffect(() => {
    const updateDrawTrailPath = () => {
      const rowEl = rowRef.current;
      const deckEl = deckPileRef.current;
      if (!rowEl || !deckEl) return;

      const trail = visualFeedback?.trail;
      if (!trail || trail.kind !== 'draw') return;

      const targetEl = document.querySelector<HTMLElement>(`[data-center-target="${trail.actor === 1 ? 'top' : 'bottom'}"]`);
      if (!targetEl) return;

      const rowRect = rowEl.getBoundingClientRect();
      const deckRect = deckEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      setDrawTrailPath({
        startX: deckRect.left + (deckRect.width / 2) - (rowRect.left + (rowRect.width / 2)),
        startY: deckRect.top + (deckRect.height / 2) - (rowRect.top + (rowRect.height / 2)),
        endX: targetRect.left + (targetRect.width / 2) - (rowRect.left + (rowRect.width / 2)),
        endY: targetRect.top + (targetRect.height / 2) - (rowRect.top + (rowRect.height / 2)),
      });
    };

    updateDrawTrailPath();
    window.addEventListener('resize', updateDrawTrailPath);
    return () => window.removeEventListener('resize', updateDrawTrailPath);
  }, [visualFeedback?.trail]);

  useEffect(() => {
    const updateDiscardTrailTarget = () => {
      const rowEl = rowRef.current;
      const discardEl = discardPileRef.current;
      if (!rowEl || !discardEl) return;

      const rowRect = rowEl.getBoundingClientRect();
      const discardRect = discardEl.getBoundingClientRect();
      setDiscardTrailTarget({
        x: discardRect.left + (discardRect.width / 2) - (rowRect.left + (rowRect.width / 2)),
        y: discardRect.top + (discardRect.height / 2) - (rowRect.top + (rowRect.height / 2)),
      });
    };

    updateDiscardTrailTarget();
    window.addEventListener('resize', updateDiscardTrailTarget);
    return () => window.removeEventListener('resize', updateDiscardTrailTarget);
  }, []);

  return (
    <div ref={rowRef} style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0 12px 0',
      borderRadius: 10,
      background: 'rgba(20,10,5,0.24)',
      width: '100%',
      flex: 1,
      minHeight: 0,
    }}>
      {visualFeedback.trail && (
        <div
          key={visualFeedback.trail.id}
          className={`center-row-trail center-row-trail-${visualFeedback.trail.kind}-${visualFeedback.trail.actor === 0 ? 'bottom' : 'top'}`}
          style={(() => {
            const vars: Record<string, string> = {};
            if (visualFeedback.trail.kind === 'draw' && drawTrailPath) {
              vars['--trail-draw-start-x'] = `${drawTrailPath.startX}px`;
              vars['--trail-draw-start-y'] = `${drawTrailPath.startY}px`;
              vars['--trail-draw-end-x'] = `${drawTrailPath.endX}px`;
              vars['--trail-draw-end-y'] = `${drawTrailPath.endY}px`;
            }
            if (visualFeedback.trail.kind === 'discard' && discardTrailTarget) {
              vars['--trail-discard-end-x'] = `${discardTrailTarget.x}px`;
              vars['--trail-discard-end-y'] = `${discardTrailTarget.y}px`;
            }
            return Object.keys(vars).length > 0 ? (vars as CSSProperties) : undefined;
          })()}
          aria-hidden
        >
          {visualFeedback.trail.kind === 'discard' && visualFeedback.trail.cardId ? (
            <img src={`/assets/cards/${getCard(visualFeedback.trail.cardId).designId}.png`} alt="" draggable={false} />
          ) : (
            <img src="/assets/cards/card_back.png" alt="" draggable={false} />
          )}
        </div>
      )}

      {lastActionRecap && (
        <div className="center-row-recap">
          {lastActionRecap}
        </div>
      )}

      <div style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: 48, marginTop: 0 }}>
        {/* Left: Ware supply */}
        <div style={{ display: 'flex', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 38 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 28,
            padding: '26px 28px',
            borderRadius: 14,
            background: 'rgba(20,10,5,0.24)',
            minWidth: 660,
          }}>
            {WARE_TYPES.map((wareType) => (
              <div key={wareType} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                background: 'var(--surface)',
                borderRadius: 10,
                padding: '18px 20px',
                border: '1px solid var(--border)',
                minHeight: 100,
              }}>
                <WareToken type={wareType} size={78} />
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 36, color: 'var(--text-muted)', fontWeight: 700 }}>{`x${supply[wareType]}`}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Deck / Phase / Discard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div ref={deckPileRef} key={`tv-deck-${visualFeedback.deckPulse}`} className={visualFeedback.deckPulse ? 'pile-pulse' : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 270 }}>
            {pub.deckCount > 0 ? (
              <CardFace cardId="guard_1" faceDown large scale={1.5} />
            ) : (
              <div style={{ width: 270, height: 360, borderRadius: 14, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 18 }}>Empty</div>
            )}
            <div className="panel-section-title" style={{ marginBottom: 0, fontSize: 22 }}>Deck ({pub.deckCount})</div>
          </div>

          <div style={{ position: 'relative' }}>
            {actionTag && (
              <div
                className={`center-row-action-tag${visualFeedback?.trail?.actor === 1 ? ' center-row-action-tag-opponent' : ''}`}
                style={{ top: -18, left: '50%', transform: 'translateX(-50%)' }}
              >
                {actionTag}
              </div>
            )}
            <div key={`tv-phase-${visualFeedback.phasePulse}-${visualFeedback.actionsPulse}`} className={(visualFeedback.phasePulse || visualFeedback.actionsPulse) ? 'phase-pulse' : undefined} style={{ background: phaseColor + '20', borderRadius: 16, padding: '32px 56px', border: `1px solid ${phaseColor}`, textAlign: 'center', minWidth: 440 }}>
              <div style={{ fontSize: 22, color: 'var(--text-muted)' }}>Turn {pub.turn} &middot; Player {pub.currentPlayer + 1}</div>
              <div style={{ fontWeight: 700, fontSize: 40, color: phaseColor }}>{phaseLabel}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 18 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: i < pub.actionsLeft ? 'var(--gold)' : 'rgba(90,64,48,0.5)', border: '3px solid var(--gold)' }} />
                ))}
              </div>
              {pub.endgame && (<div style={{ fontSize: 16, color: '#c04030', fontWeight: 700, marginTop: 6 }}>{pub.endgame.isFinalTurn ? 'FINAL TURN!' : 'Endgame triggered!'}</div>)}
            </div>
          </div>

          <div ref={discardPileRef} key={`tv-discard-${visualFeedback.discardPulse}`} className={visualFeedback.discardPulse ? 'pile-pulse' : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 270 }}>
            <div key={`tv-discard-card-${displayDiscardCard ?? 'empty'}-${pub.discardPile.length}`} className="discard-soft-fade">
              {displayDiscardCard ? <CardFace cardId={displayDiscardCard} large scale={1.5} /> : <div style={{ width: 270, height: 360, borderRadius: 14, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 18 }}>Empty</div>}
            </div>
            <div className="panel-section-title" style={{ marginBottom: 0, fontSize: 22 }}>Discard ({pub.discardPile.length})</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TVWaitingIndicator({ message }: { message: string }) {
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

