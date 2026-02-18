import { useState } from 'react';
import { ResolveMegaView } from '../ResolveMegaView.tsx';
import type { AIDifficulty } from '../../ai/difficulties/index.ts';

type PreGameMode = 'solo' | 'multiplayer';

interface PreGameSetupModalProps {
  mode: PreGameMode;
  aiDifficulty: AIDifficulty;
  onCancel: () => void;
  onStart: (options: { castMode: boolean; aiDifficulty: AIDifficulty }) => void;
  castStartError?: string | null;
}

const sectionStyle = {
  border: '1px solid var(--border-light)',
  borderRadius: 10,
  padding: 12,
  background: 'var(--surface-light)',
} as const;

const sectionLabelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
} as const;

export function PreGameSetupModal({ mode, aiDifficulty: initialDifficulty, onCancel, onStart, castStartError }: PreGameSetupModalProps) {
  const [castMode, setCastMode] = useState(false);
  const [difficulty, setDifficulty] = useState<AIDifficulty>(initialDifficulty);

  const title = mode === 'solo' ? 'New Game' : 'New Multiplayer Game';

  return (
    <ResolveMegaView verticalAlign="center">
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(520px, 96vw)',
          margin: '0 auto',
          borderRadius: 14,
          padding: 18,
          backgroundImage: [
            'linear-gradient(0deg, rgba(180,170,155,0.08) 0.3px, transparent 0.3px)',
            'linear-gradient(90deg, rgba(180,170,155,0.08) 0.3px, transparent 0.3px)',
            'linear-gradient(135deg, rgba(200,190,175,0.04) 0.3px, transparent 0.3px)',
            'linear-gradient(45deg, rgba(200,190,175,0.04) 0.3px, transparent 0.3px)',
          ].join(', '),
          backgroundSize: '1px 1px, 1px 1px, 1.5px 1.5px, 1.5px 1.5px',
          backgroundColor: 'var(--surface)',
          border: '2px solid var(--border-light)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          color: 'var(--text)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: 'var(--gold)' }}>
          {title}
        </div>

        {/* Display mode */}
        <div style={sectionStyle}>
          <div style={sectionLabelStyle}>Display</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <OptionButton
              selected={!castMode}
              onClick={() => setCastMode(false)}
              label="This Device"
              description="Play without Chromecast"
            />
            <OptionButton
              selected={castMode}
              onClick={() => setCastMode(true)}
              label="Chromecast TV"
              description="Board on TV, players on phones"
            />
          </div>
        </div>

        {/* AI difficulty (solo only) */}
        {mode === 'solo' && (
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>AI Difficulty</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <OptionButton
                selected={difficulty === 'easy'}
                onClick={() => setDifficulty('easy')}
                label="Easy"
                description="Simple decisions"
              />
              <OptionButton
                selected={difficulty === 'medium'}
                onClick={() => setDifficulty('medium')}
                label="Medium"
                description="Basic strategy"
              />
              <OptionButton
                selected={difficulty === 'hard'}
                onClick={() => setDifficulty('hard')}
                label="Hard"
                description="Deep evaluation"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {castStartError && (
          <div style={{ color: '#ff9977', fontSize: 13, textAlign: 'right' }}>
            {castStartError}
          </div>
        )}
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
            onClick={() => onStart({ castMode, aiDifficulty: difficulty })}
            style={{
              background: 'var(--surface-accent)',
              border: '1px solid var(--border-light)',
              color: 'var(--gold)',
              borderRadius: 8,
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            Start Game
          </button>
        </div>
      </div>
    </ResolveMegaView>
  );
}

function OptionButton({ selected, onClick, label, description }: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 8px',
        borderRadius: 8,
        border: selected ? '2px solid var(--gold)' : '2px solid var(--border-light)',
        background: selected ? 'var(--surface-accent)' : 'var(--surface)',
        color: selected ? 'var(--gold)' : 'var(--text)',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
    </button>
  );
}
