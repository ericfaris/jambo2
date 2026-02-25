import type { GameState } from '../engine/types.ts';
import { getWinner, getFinalScores } from '../engine/endgame/EndgameManager.ts';

interface EndgameOverlayProps {
  state: GameState;
  onNewGame: () => void;
  onMainMenu?: () => void;
}

export function EndgameOverlay({ state, onNewGame, onMainMenu }: EndgameOverlayProps) {
  if (state.phase !== 'GAME_OVER') return null;

  const winner = getWinner(state);
  const scores = getFinalScores(state);
  const isHumanWinner = winner === 0;

  return (
    <div className="overlay-fade" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(20,10,5,0.92)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
    }}>
      <div className="dialog-pop" style={{
        background: 'rgba(20,10,5,0.92)',
        borderRadius: 16,
        padding: 40,
        border: `2px solid ${isHumanWinner ? 'var(--gold)' : 'var(--accent-red)'}`,
        textAlign: 'center',
        maxWidth: 420,
        boxShadow: isHumanWinner ? '0 0 40px rgba(212,168,80,0.3)' : '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: 'var(--text-muted)',
          marginBottom: 6,
        }}>
          Game Over
        </div>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(32px, 7vw, 44px)',
          fontWeight: 700,
          color: isHumanWinner ? 'var(--gold)' : 'var(--accent-red)',
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          marginBottom: 6,
        }}>
          {isHumanWinner ? 'You Win!' : 'AI Wins!'}
        </div>
        <div style={{ width: 60, height: 3, borderRadius: 2, background: isHumanWinner ? 'var(--gold)' : 'var(--accent-red)', opacity: 0.5, margin: '0 auto 14px' }} />
        <div style={{
          fontSize: 18,
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>You</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--gold)', fontSize: 28, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{scores.player0}g</div>
          </div>
          <div style={{ color: 'var(--text-muted)', alignSelf: 'center', fontSize: 16 }}>vs</div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>AI</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#D4A574', fontSize: 28, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{scores.player1}g</div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
          Turns played: {state.turn}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="primary" onClick={onNewGame} style={{ fontSize: 18, padding: '12px 32px' }}>
            New Game
          </button>
          {onMainMenu && (
            <button onClick={onMainMenu} style={{
              fontSize: 18,
              padding: '12px 32px',
            }}>
              Main Menu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
