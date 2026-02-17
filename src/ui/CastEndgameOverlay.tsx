import type { PublicGameState } from '../multiplayer/types.ts';

interface CastEndgameOverlayProps {
  pub: PublicGameState;
  viewerSlot?: 0 | 1;
  onRematch?: () => void;
  onMainMenu?: () => void;
  rematchDisabled?: boolean;
  rematchLabel?: string;
  rematchStatusMessage?: string;
}

export function CastEndgameOverlay({
  pub,
  viewerSlot,
  onRematch,
  onMainMenu,
  rematchDisabled = false,
  rematchLabel = 'Rematch',
  rematchStatusMessage,
}: CastEndgameOverlayProps) {
  if (pub.phase !== 'GAME_OVER') return null;

  const p1Gold = pub.players[0].gold;
  const p2Gold = pub.players[1].gold;
  const winner = p1Gold > p2Gold ? 0
    : p2Gold > p1Gold ? 1
    : pub.endgame?.finalTurnPlayer ?? 1;

  const winnerLabel = viewerSlot === undefined
    ? `Player ${winner + 1} Wins!`
    : winner === viewerSlot ? 'You Win!' : 'Opponent Wins!';

  const leftLabel = viewerSlot === undefined ? 'Player 1' : viewerSlot === 0 ? 'You' : 'Opponent';
  const rightLabel = viewerSlot === undefined ? 'Player 2' : viewerSlot === 1 ? 'You' : 'Opponent';

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
          {winnerLabel}
        </div>
        <div style={{
          fontSize: 22,
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontSize: 16 }}>{leftLabel}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--gold)', fontSize: 36 }}>{p1Gold}g</div>
          </div>
          <div style={{ color: 'var(--border-light)', alignSelf: 'center', fontSize: 18 }}>vs</div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontSize: 16 }}>{rightLabel}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#D4A574', fontSize: 36 }}>{p2Gold}g</div>
          </div>
        </div>
        <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>
          Turns played: {pub.turn}
        </div>
        {(onRematch || onMainMenu) && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            {onRematch && (
              <button
                className="primary"
                onClick={onRematch}
                disabled={rematchDisabled}
                style={{ fontSize: 18, padding: '12px 32px' }}
              >
                {rematchLabel}
              </button>
            )}
            {onMainMenu && (
              <button
                onClick={onMainMenu}
                style={{
                  fontSize: 18,
                  padding: '12px 32px',
                  background: 'var(--surface-accent)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--gold)',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Main Menu
              </button>
            )}
          </div>
        )}
        {rematchStatusMessage && (
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 10 }}>
            {rematchStatusMessage}
          </div>
        )}
      </div>
    </div>
  );
}
