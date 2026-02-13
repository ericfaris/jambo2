import type { GameState } from '../engine/types.ts';
import { CardFace } from './CardFace.tsx';

interface CenterRowProps {
  state: GameState;
}

export function CenterRow({ state }: CenterRowProps) {
  const phaseLabel = state.phase === 'DRAW'
    ? `Draw Phase (${state.drawsThisPhase}/5)`
    : state.phase === 'PLAY'
    ? `Play Phase`
    : 'Game Over';

  const phaseColor = state.phase === 'DRAW' ? '#5a9ab0' : state.phase === 'PLAY' ? '#7a9a4a' : '#c04030';

  const topDiscard = state.discardPile.length > 0
    ? state.discardPile[state.discardPile.length - 1]
    : null;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 24,
      padding: '10px 0',
    }}>
      {/* Deck */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {state.deck.length > 0 ? (
          <CardFace cardId={state.deck[0]} faceDown small />
        ) : (
          <div style={{
            width: 72,
            height: 96,
            borderRadius: 8,
            border: '2px dashed var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 11,
          }}>
            Empty
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          Deck ({state.deck.length})
        </div>
      </div>

      {/* Phase indicator */}
      <div style={{
        background: phaseColor + '20',
        borderRadius: 8,
        padding: '8px 20px',
        border: `1px solid ${phaseColor}`,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Turn {state.turn} &middot; Player {state.currentPlayer + 1}
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, color: phaseColor }}>
          {phaseLabel}
        </div>
        {state.endgame && (
          <div style={{ fontSize: 10, color: '#c04030', fontWeight: 700, marginTop: 2 }}>
            {state.endgame.isFinalTurn ? 'FINAL TURN!' : 'Endgame triggered!'}
          </div>
        )}
      </div>

      {/* Discard */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {topDiscard ? (
          <CardFace cardId={topDiscard} small />
        ) : (
          <div style={{
            width: 72,
            height: 96,
            borderRadius: 8,
            border: '2px dashed var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 11,
          }}>
            Empty
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          Discard ({state.discardPile.length})
        </div>
      </div>
    </div>
  );
}
