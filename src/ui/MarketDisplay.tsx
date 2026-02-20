import { memo } from 'react';
import type { WareType } from '../engine/types.ts';
import { WareToken } from './CardFace.tsx';

interface MarketDisplayProps {
  market: (WareType | null)[];
  onSlotClick?: (index: number) => void;
  selectedSlots?: number[];
  flashSlots?: number[];
  flashVariant?: 'soft' | 'normal' | 'strong';
  label?: string;
  /** Max slots per row — wraps to additional rows. Defaults to unlimited. */
  columns?: number;
}

function MarketDisplayComponent({ market, onSlotClick, selectedSlots, flashSlots, flashVariant = 'normal', label, columns }: MarketDisplayProps) {
  const isInteractive = !!onSlotClick;

  return (
    <div>
      {label && (
        <div className="panel-section-title">
          {label}
        </div>
      )}
      {isInteractive && (
        <div className="ui-helper-text" style={{ marginBottom: 4 }}>
          Tap a filled slot to select.
        </div>
      )}
      <div style={{
        display: columns ? 'grid' : 'flex',
        gridTemplateColumns: columns ? `repeat(${columns}, auto)` : undefined,
        gap: 6,
        flexWrap: columns ? undefined : 'wrap',
        background: 'transparent',
        borderRadius: 10,
        padding: 10,
        boxShadow: 'none',
      }}>
        {market.map((ware, i) => (
          <div key={i} className={flashSlots?.includes(i) ? `market-slot-flash market-slot-flash-${flashVariant}` : undefined} style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            border: `2px solid ${selectedSlots?.includes(i) ? 'var(--gold)' : 'var(--border)'}`,
            background: selectedSlots?.includes(i) ? 'rgba(212,168,80,0.15)' : 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: onSlotClick && ware ? 'pointer' : 'default',
          }}
          onClick={onSlotClick && ware ? () => onSlotClick(i) : undefined}
          >
            {ware ? (
              <WareToken type={ware} />
            ) : (
              <span style={{ color: 'var(--border)', fontSize: 20 }}>-</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const MarketDisplay = memo(MarketDisplayComponent);
