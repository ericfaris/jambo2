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
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
          {label}
        </div>
      )}
      <div style={{
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
        background: 'linear-gradient(180deg, #3d2a1a 0%, #2d1c12 100%)',
        borderRadius: 8,
        padding: 6,
        border: '1px solid var(--border)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
      }}>
        {market.map((ware, i) => (
          <div key={i} style={{
            width: 36,
            height: 36,
            borderRadius: 6,
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
              <span style={{ color: 'var(--border)', fontSize: 16 }}>-</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
