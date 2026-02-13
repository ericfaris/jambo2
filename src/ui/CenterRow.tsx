import type { GameState, GameAction } from '../engine/types.ts';
import { CONSTANTS } from '../engine/types.ts';
import { CardFace } from './CardFace.tsx';

interface CenterRowProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
  isLocalMode?: boolean;
  showGlow?: boolean;
}

export function CenterRow({ state, dispatch, isLocalMode = true, showGlow = false }: CenterRowProps) {
  const phaseLabel = state.phase === 'DRAW'
    ? `Draw Phase (${state.drawsThisPhase}/5)`
    : state.phase === 'PLAY'
    ? `Play Phase`
    : 'Game Over';

  const phaseColor = state.phase === 'DRAW' ? '#5a9ab0' : state.phase === 'PLAY' ? '#7a9a4a' : '#c04030';

  const topDiscard = state.discardPile.length > 0
    ? state.discardPile[0]
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
        {state.deck.length > 0 ? (
          <CardFace cardId={state.deck[0]} faceDown small />
        ) : (
          <div style={{
            width: 96,
            height: 128,
            borderRadius: 10,
            border: '2px dashed var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}>
            Empty
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
          Deck ({state.deck.length})
        </div>
      </div>

      {/* Phase indicator */}
      <div style={{
        background: phaseColor + '20',
        borderRadius: 10,
        padding: '10px 24px',
        border: `1px solid ${phaseColor}`,
        textAlign: 'center',
        transition: 'background 0.4s ease, border-color 0.4s ease',
        ...(showGlow && {
          boxShadow: '0 0 20px rgba(212, 168, 80, 0.4), inset 0 0 20px rgba(212, 168, 80, 0.1)',
          borderRadius: 12,
        })
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Turn {state.turn} &middot; Player {state.currentPlayer + 1}
        </div>
        <div style={{ fontWeight: 700, fontSize: 17, color: phaseColor, transition: 'color 0.4s ease' }}>
          {phaseLabel}
        </div>
        {state.endgame && (
          <div style={{ fontSize: 12, color: '#c04030', fontWeight: 700, marginTop: 2 }}>
            {state.endgame.isFinalTurn ? 'FINAL TURN!' : 'Endgame triggered!'}
          </div>
        )}
        {/* Action tokens */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Actions:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: CONSTANTS.MAX_ACTIONS }, (_, i) => i < state.actionsLeft).map((active, i) => (
              <div key={i} style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: active ? 'radial-gradient(circle, var(--gold) 30%, var(--gold-dim) 100%)' : 'rgba(90,64,48,0.5)',
                border: '1px solid var(--border-light)',
                transition: 'background 0.3s ease, transform 0.3s ease, opacity 0.3s ease',
                transform: active ? 'scale(1)' : 'scale(0.8)',
                opacity: active ? 1 : 0.5,
              }} />
            ))}
          </div>
        </div>
        {/* End Turn button */}
        {false && isLocalMode && state.phase === 'PLAY' && state.currentPlayer === 0 && (
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => dispatch({ type: 'END_TURN' })}
              style={{
                background: 'linear-gradient(135deg, #c04030 0%, #a03020 50%, #c04030 100%)',
                border: '2px solid #ff6b5a',
                borderRadius: 8,
                padding: '8px 16px',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
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
              End Turn
            </button>
          </div>
        )}
      </div>

      {/* Discard */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        ...(showGlow && {
          boxShadow: '0 0 20px rgba(212, 168, 80, 0.4), inset 0 0 20px rgba(212, 168, 80, 0.1)',
          borderRadius: 12,
          padding: '8px',
          background: 'rgba(90,64,48,0.1)',
        })
      }}>
        {topDiscard ? (
          <CardFace cardId={topDiscard} small />
        ) : (
          <div style={{
            width: 96,
            height: 128,
            borderRadius: 10,
            border: '2px dashed var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}>
            Empty
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
          Discard ({state.discardPile.length})
        </div>
      </div>
    </div>
  );
}
