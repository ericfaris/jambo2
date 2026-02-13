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
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {utilities.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14, padding: 6 }}>
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
              <div className="overlay-fade" style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(20,10,5,0.7)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: '#a08060',
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
