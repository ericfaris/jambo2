import { useState } from 'react';
import { ResolveMegaView } from '../ResolveMegaView.tsx';
import type { AIDifficulty } from '../../ai/difficulties/index.ts';

type PreGameMode = 'solo' | 'multiplayer';

interface PreGameSetupModalProps {
  mode: PreGameMode;
  aiDifficulty: AIDifficulty;
  onCancel: () => void;
  onStart: (options: { castMode: boolean; aiDifficulty: AIDifficulty }) => void;
}

export function PreGameSetupModal({ mode, aiDifficulty: initialDifficulty, onCancel, onStart }: PreGameSetupModalProps) {
  const [castMode, setCastMode] = useState(mode === 'multiplayer');
  const [difficulty, setDifficulty] = useState<AIDifficulty>(initialDifficulty);

  const modeTitle = mode === 'solo' ? 'Solo Game Setup' : 'Multiplayer Setup';
  const modeSubtitle = mode === 'solo'
    ? 'Prepare your match against AI before entering the game.'
    : 'Prepare your multiplayer session and choose how you want to play.';

  return (
    <ResolveMegaView verticalAlign="center">
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(640px, 96vw)',
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
          {modeTitle}
        </div>
        <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>
          {modeSubtitle}
        </div>

        <div style={{
          border: '1px solid var(--border-light)',
          borderRadius: 10,
          padding: 12,
          background: 'var(--surface-light)',
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

        {mode === 'solo' && (
          <div style={{
            border: '1px solid var(--border-light)',
            borderRadius: 10,
            padding: 12,
            background: 'var(--surface-light)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              AI Difficulty
            </div>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as AIDifficulty)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-light)',
                color: 'var(--text)',
                borderRadius: 8,
                padding: '8px 10px',
                cursor: 'pointer',
                fontSize: 15,
                width: '100%',
              }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {difficulty === 'easy' && 'Relaxed play — AI makes simple decisions.'}
              {difficulty === 'medium' && 'Balanced challenge — AI uses basic strategy.'}
              {difficulty === 'hard' && 'Tough opponent — AI evaluates board state deeply.'}
            </div>
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
            Continue
          </button>
        </div>
      </div>
    </ResolveMegaView>
  );
}
