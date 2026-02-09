import type { GameState } from '../engine/types.ts';

interface CenterRowProps {
  state: GameState;
}

export function CenterRow({ state }: CenterRowProps) {
  const phaseLabel = state.phase === 'DRAW'
    ? `Draw Phase (${state.drawsThisPhase}/5)`
    : state.phase === 'PLAY'
    ? `Play Phase`
    : 'Game Over';

  const phaseColor = state.phase === 'DRAW' ? '#4A90D9' : state.phase === 'PLAY' ? '#7BC47F' : '#CD5C5C';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 24,
      padding: '10px 0',
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 8,
        padding: '6px 14px',
        border: '1px solid #3a4a6a',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Deck</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{state.deck.length}</div>
      </div>

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
          <div style={{ fontSize: 10, color: '#CD5C5C', fontWeight: 700, marginTop: 2 }}>
            {state.endgame.isFinalTurn ? 'FINAL TURN!' : 'Endgame triggered!'}
          </div>
        )}
      </div>

      <div style={{
        background: 'var(--surface)',
        borderRadius: 8,
        padding: '6px 14px',
        border: '1px solid #3a4a6a',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Discard</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{state.discardPile.length}</div>
      </div>
    </div>
  );
}
