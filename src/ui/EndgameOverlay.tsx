import type { GameState } from '../engine/types.ts';
import { getWinner, getFinalScores } from '../engine/endgame/EndgameManager.ts';

interface EndgameOverlayProps {
  state: GameState;
  onNewGame: () => void;
}

export function EndgameOverlay({ state, onNewGame }: EndgameOverlayProps) {
  if (state.phase !== 'GAME_OVER') return null;

  const winner = getWinner(state);
  const scores = getFinalScores(state);
  const isHumanWinner = winner === 0;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 32,
        border: `3px solid ${isHumanWinner ? 'var(--gold)' : '#CD5C5C'}`,
        textAlign: 'center',
        maxWidth: 360,
      }}>
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: isHumanWinner ? 'var(--gold)' : '#CD5C5C',
          marginBottom: 12,
        }}>
          {isHumanWinner ? 'You Win!' : 'AI Wins!'}
        </div>
        <div style={{
          fontSize: 16,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>You</div>
            <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 22 }}>{scores.player0}g</div>
          </div>
          <div style={{ color: '#3a4a6a', alignSelf: 'center' }}>vs</div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>AI</div>
            <div style={{ fontWeight: 700, color: '#D4A574', fontSize: 22 }}>{scores.player1}g</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Turns played: {state.turn}
        </div>
        <button className="primary" onClick={onNewGame} style={{ fontSize: 16, padding: '10px 28px' }}>
          New Game
        </button>
      </div>
    </div>
  );
}
