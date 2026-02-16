import { useEffect, useMemo, useRef, useState } from 'react';
import { ResolveMegaView } from '../ResolveMegaView.tsx';

type PreGameMode = 'solo' | 'multiplayer';

interface PreGameSetupModalProps {
  mode: PreGameMode;
  onCancel: () => void;
  onStart: (options: { castMode: boolean; firstPlayer: 0 | 1 }) => void;
}

function getRandomFirstPlayer(): 0 | 1 {
  return Math.random() < 0.5 ? 0 : 1;
}

export function PreGameSetupModal({ mode, onCancel, onStart }: PreGameSetupModalProps) {
  const [castMode, setCastMode] = useState(mode === 'multiplayer');
  const [isFlipping, setIsFlipping] = useState(true);
  const [firstPlayer, setFirstPlayer] = useState<0 | 1 | null>(null);
  const flipTimerRef = useRef<number | null>(null);

  const triggerFlip = () => {
    if (flipTimerRef.current !== null) {
      window.clearTimeout(flipTimerRef.current);
    }

    setIsFlipping(true);
    setFirstPlayer(null);

    flipTimerRef.current = window.setTimeout(() => {
      setFirstPlayer(getRandomFirstPlayer());
      setIsFlipping(false);
      flipTimerRef.current = null;
    }, 850);
  };

  useEffect(() => {
    triggerFlip();
  }, [mode]);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current !== null) {
        window.clearTimeout(flipTimerRef.current);
      }
    };
  }, [mode]);

  const modeTitle = mode === 'solo' ? 'Solo Game Setup' : 'Multiplayer Setup';
  const modeSubtitle = mode === 'solo'
    ? 'Prepare your match against AI before entering the game.'
    : 'Prepare your multiplayer session and choose how you want to play.';

  const firstPlayerLabel = useMemo(() => {
    if (isFlipping || firstPlayer === null) {
      return 'Flipping for first player...';
    }
    return firstPlayer === 0 ? 'You go first' : 'Opponent goes first';
  }, [firstPlayer, isFlipping]);

  return (
    <ResolveMegaView verticalAlign="center">
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(640px, 96vw)',
          borderRadius: 14,
          padding: 18,
          background: 'rgba(20,10,5,0.72)',
          border: '2px solid var(--border-light)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          color: 'var(--text)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: 'var(--gold)' }}>
          {modeTitle}
        </div>
        <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>
          {modeSubtitle}
        </div>

        <div style={{
          border: '1px solid var(--border-light)',
          borderRadius: 10,
          padding: 12,
          background: 'rgba(20,10,5,0.38)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Cast Mode
          </div>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer' }}>
            <span style={{ fontSize: 15 }}>
              Use CAST mode for this game
            </span>
            <input
              type="checkbox"
              checked={castMode}
              onChange={() => setCastMode((previous) => !previous)}
              style={{ accentColor: 'var(--gold)', width: 16, height: 16, cursor: 'pointer' }}
            />
          </label>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            {castMode
              ? 'CAST mode selected. You will continue to the TV lobby setup.'
              : 'Local mode selected. You will start on this device.'}
          </div>
        </div>

        <div style={{
          border: '1px solid var(--border-light)',
          borderRadius: 10,
          padding: 12,
          background: 'rgba(20,10,5,0.38)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            First Player
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: isFlipping ? 'var(--text-muted)' : 'var(--gold)', marginBottom: 8 }}>
            {firstPlayerLabel}
          </div>
          <button
            onClick={triggerFlip}
            style={{
              background: 'var(--surface-light)',
              border: '1px solid var(--border-light)',
              color: 'var(--text)',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            Flip Again
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              background: 'var(--surface-light)',
              border: '1px solid var(--border-light)',
              color: 'var(--text)',
              borderRadius: 8,
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (firstPlayer === null) {
                return;
              }
              onStart({ castMode, firstPlayer });
            }}
            disabled={firstPlayer === null}
            style={{
              background: 'var(--surface-accent)',
              border: '1px solid var(--border-light)',
              color: 'var(--gold)',
              borderRadius: 8,
              padding: '10px 14px',
              cursor: firstPlayer === null ? 'default' : 'pointer',
              opacity: firstPlayer === null ? 0.6 : 1,
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </ResolveMegaView>
  );
}
