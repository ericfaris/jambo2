import type { WareType } from '../engine/types.ts';
import { WareToken } from './CardFace.tsx';

interface MarketDisplayProps {
  market: (WareType | null)[];
  onSlotClick?: (index: number) => void;
  selectedSlots?: number[];
  label?: string;
}

export function MarketDisplay({ market, onSlotClick, selectedSlots, label }: MarketDisplayProps) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
          {label}
        </div>
      )}
      <div style={{
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
      }}>
        {market.map((ware, i) => (
          <div key={i} style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            border: `2px solid ${selectedSlots?.includes(i) ? 'var(--gold)' : '#3a4a6a'}`,
            background: selectedSlots?.includes(i) ? '#2a3a5a' : 'var(--surface)',
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
              <span style={{ color: '#3a4a6a', fontSize: 16 }}>-</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
