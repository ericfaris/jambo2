import { memo, useEffect, useState } from 'react';
import type { UtilityState } from '../engine/types.ts';
import { CardFace } from './CardFace.tsx';

interface UtilityAreaProps {
  utilities: UtilityState[];
  onActivate?: (index: number) => void;
  disabled?: boolean;
  cardError?: {cardId: string, message: string} | null;
  label?: string;
  cardSize?: 'small' | 'default' | 'large';
}

function UtilityAreaComponent({ utilities, onActivate, disabled, cardError, label, cardSize = 'small' }: UtilityAreaProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth <= 768);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  const overlapAmount = 42;
  const hasUnusedUtility = utilities.some((utility) => !utility.usedThisTurn);
  const showInteractionHint = !!onActivate && !disabled && hasUnusedUtility;

  return (
    <div>
      {label && (
        <div className="panel-section-title">
          {label}
        </div>
      )}
      {showInteractionHint && (
        <div className="ui-helper-text" style={{ marginBottom: 4 }}>
          Tap an unused utility to activate.
        </div>
      )}
      <div style={{
        display: 'flex',
        gap: isMobile ? 0 : 8,
        flexWrap: isMobile ? 'nowrap' : 'wrap',
        overflowX: isMobile ? 'auto' : 'visible',
        overflowY: 'visible',
        paddingBottom: isMobile ? 4 : 0,
        WebkitOverflowScrolling: 'touch',
        touchAction: isMobile ? 'pan-x' : 'auto',
      }}>
        {utilities.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14, padding: 6 }}>
            No utilities
          </div>
        )}
        {utilities.map((u, i) => (
          <div
            key={u.cardId}
            style={{
              position: 'relative',
              flexShrink: 0,
              zIndex: i,
              marginLeft: isMobile && i > 0 ? -overlapAmount : 0,
            }}
          >
            <CardFace
              cardId={u.cardId}
              small={cardSize === 'small'}
              large={cardSize === 'large'}
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
            {cardError && cardError.cardId === u.cardId && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'center',
                padding: 4,
                borderRadius: 8,
                zIndex: 1000,
                animation: 'cardErrorFadeOut 5s linear forwards',
              }}>
                {cardError.message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const UtilityArea = memo(UtilityAreaComponent);
