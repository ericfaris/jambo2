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
    <div className="overlay-fade" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(20,10,5,0.88)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
    }}>
      <div className="dialog-pop" style={{
        background: 'linear-gradient(135deg, #3d2a1a 0%, #2d1c12 100%)',
        borderRadius: 16,
        padding: 40,
        border: `3px solid ${isHumanWinner ? 'var(--gold)' : 'var(--accent-red)'}`,
        textAlign: 'center',
        maxWidth: 420,
        boxShadow: isHumanWinner ? '0 0 40px rgba(212,168,80,0.3)' : '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 34,
          fontWeight: 700,
          color: isHumanWinner ? 'var(--gold)' : 'var(--accent-red)',
          marginBottom: 14,
        }}>
          {isHumanWinner ? 'You Win!' : 'AI Wins!'}
        </div>
        <div style={{
          fontSize: 18,
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontSize: 14 }}>You</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--gold)', fontSize: 28 }}>{scores.player0}g</div>
          </div>
          <div style={{ color: 'var(--border-light)', alignSelf: 'center' }}>vs</div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontSize: 14 }}>AI</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#D4A574', fontSize: 28 }}>{scores.player1}g</div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
          Turns played: {state.turn}
        </div>
        <button className="primary" onClick={onNewGame} style={{ fontSize: 18, padding: '12px 32px' }}>
          New Game
        </button>
      </div>
    </div>
  );
}
