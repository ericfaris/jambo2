import type { UtilityState } from '../engine/types.ts';
import { CardFace } from './CardFace.tsx';

interface UtilityAreaProps {
  utilities: UtilityState[];
  onActivate?: (index: number) => void;
  disabled?: boolean;
  label?: string;
}

export function UtilityArea({ utilities, onActivate, disabled, label }: UtilityAreaProps) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {utilities.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12, padding: 4 }}>
            No utilities
          </div>
        )}
        {utilities.map((u, i) => (
          <div key={u.cardId} style={{ position: 'relative' }}>
            <CardFace
              cardId={u.cardId}
              small
              onClick={!disabled && onActivate && !u.usedThisTurn ? () => onActivate(i) : undefined}
            />
            {u.usedThisTurn && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: '#0008',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: '#aaa',
              }}>
                USED
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
