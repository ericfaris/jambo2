// ============================================================================
// Cast Mode — TV Screen
// Full shared board view for TV/large display. No private info shown.
// ============================================================================

import { useState } from 'react';
import type { WebSocketGameState } from '../multiplayer/client.ts';
import type { PublicGameState, PublicPlayerState } from '../multiplayer/types.ts';
import type { WareType } from '../engine/types.ts';
import { WARE_TYPES } from '../engine/types.ts';
import { MarketDisplay } from './MarketDisplay.tsx';
import { UtilityArea } from './UtilityArea.tsx';
import { GameLog } from './GameLog.tsx';
import { CardFace, WareToken } from './CardFace.tsx';
import { SpeechBubble } from './SpeechBubble.tsx';

interface TVScreenProps {
  ws: WebSocketGameState;
}

export function TVScreen({ ws }: TVScreenProps) {
  const pub = ws.publicState;
  const [showLog, setShowLog] = useState(true);
  useAudioEvents(ws.audioEvent, ws.clearAudioEvent);

  const handleAiMessageHide = useCallback(() => {
    // For TV screen, we don't need to clear the message as it's handled by the WebSocket state
  }, []);

  if (!pub) return null;

  return (
    <div style={{
      display: 'flex',
      gap: 16,
      padding: '16px 20px',
      minHeight: '100vh',
    }}>
      {/* Main board */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
      }}>
        {/* Player 2 area (top) */}
        <TVPlayerArea
          player={pub.players[1]}
          label="Player 2"
          isActive={pub.currentPlayer === 1}
          aiMessage={ws.aiMessage || undefined}
          onMessageHide={handleAiMessageHide}
        />

        {/* Center row */}
        <TVCenterRow pub={pub} />

        {/* Ware supply */}
        <TVWareSupply supply={pub.wareSupply} />

        {/* Waiting indicator */}
        <TVWaitingIndicator pub={pub} />

        {/* Player 1 area (bottom) */}
        <TVPlayerArea player={pub.players[0]} label="Player 1" isActive={pub.currentPlayer === 0} />
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
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 16,
                padding: '2px 6px',
              }}
            >
              x
            </button>
          </div>
          <GameLog log={pub.log} />
        </div>
      )}

      {/* Toggle log button */}
      {!showLog && (
        <button
          onClick={() => setShowLog(true)}
          style={{
            position: 'fixed',
            top: 12,
            right: 16,
            width: 42,
            height: 42,
            background: 'var(--surface-light)',
            border: '1px solid var(--border-light)',
            borderRadius: 8,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Log
        </button>
      )}

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
    </div>
  );
}

// --- Sub-components ---

function TVPlayerArea({ player, label, isActive, aiMessage, onMessageHide }: {
  player: PublicPlayerState;
  label: string;
  isActive: boolean;
  aiMessage?: string;
  onMessageHide?: () => void;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <SpeechBubble
        message={aiMessage || ''}
        visible={!!aiMessage}
        onHide={onMessageHide || (() => {})}
      />
      <div style={{
        background: isActive
          ? 'linear-gradient(180deg, rgba(90,64,48,0.5) 0%, rgba(30,18,8,0.8) 100%)'
          : 'linear-gradient(180deg, var(--surface) 0%, rgba(30,18,8,0.8) 100%)',
        borderRadius: 10,
        padding: 14,
        border: isActive ? '2px solid var(--gold)' : '1px solid var(--border)',
        transition: 'border-color 0.3s ease',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
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
            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>
              {player.gold}g
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              {player.handCount} cards
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <MarketDisplay market={player.market} label="Market" />
          <UtilityArea utilities={player.utilities} disabled label="Utilities" />
        </div>
      </div>
    </div>
  );
}

function TVCenterRow({ pub }: { pub: PublicGameState }) {
  const phaseLabel = pub.phase === 'DRAW'
    ? `Draw Phase (${pub.drawsThisPhase}/5)`
    : pub.phase === 'PLAY'
    ? 'Play Phase'
    : 'Game Over';

  const phaseColor = pub.phase === 'DRAW' ? '#5a9ab0' : pub.phase === 'PLAY' ? '#7a9a4a' : '#c04030';

  const topDiscard = pub.discardPile.length > 0
    ? pub.discardPile[0]
    : null;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 32,
      padding: '12px 0',
    }}>
      {/* Deck */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {pub.deckCount > 0 ? (
          <CardFace cardId="guard_1" faceDown small />
        ) : (
          <div style={{
            width: 96, height: 128, borderRadius: 10,
            border: '2px dashed var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: 13,
          }}>Empty</div>
        )}
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
          Deck ({pub.deckCount})
        </div>
      </div>

      {/* Phase indicator */}
      <div style={{
        background: phaseColor + '20',
        borderRadius: 10,
        padding: '10px 24px',
        border: `1px solid ${phaseColor}`,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Turn {pub.turn} &middot; Player {pub.currentPlayer + 1}
        </div>
        <div style={{ fontWeight: 700, fontSize: 17, color: phaseColor }}>
          {phaseLabel}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {pub.actionsLeft} actions left
        </div>
        {pub.endgame && (
          <div style={{ fontSize: 12, color: '#c04030', fontWeight: 700, marginTop: 2 }}>
            {pub.endgame.isFinalTurn ? 'FINAL TURN!' : 'Endgame triggered!'}
          </div>
        )}
      </div>

      {/* Discard */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {topDiscard ? (
          <CardFace cardId={topDiscard} small />
        ) : (
          <div style={{
            width: 96, height: 128, borderRadius: 10,
            border: '2px dashed var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: 13,
          }}>Empty</div>
        )}
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
          Discard ({pub.discardPile.length})
        </div>
      </div>
    </div>
  );
}

function TVWareSupply({ supply }: { supply: Record<WareType, number> }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: 16,
      padding: '8px 0',
    }}>
      {WARE_TYPES.map(w => (
        <div key={w} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--surface)',
          borderRadius: 8,
          padding: '4px 10px',
          border: '1px solid var(--border)',
        }}>
          <WareToken type={w} />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-muted)' }}>
            x{supply[w]}
          </span>
        </div>
      ))}
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
    <div style={{
      textAlign: 'center',
      padding: '8px 16px',
      background: 'rgba(90,154,176,0.15)',
      borderRadius: 8,
      border: '1px solid rgba(90,154,176,0.3)',
      color: '#5a9ab0',
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
