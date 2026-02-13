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
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
          {label}
        </div>
      )}
      <div style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        background: 'linear-gradient(180deg, #3d2a1a 0%, #2d1c12 100%)',
        borderRadius: 10,
        padding: 10,
        border: '1px solid var(--border)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
      }}>
        {market.map((ware, i) => (
          <div key={i} style={{
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
