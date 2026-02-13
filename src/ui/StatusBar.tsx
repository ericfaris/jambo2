import type { GameState } from '../engine/types.ts';
import { CONSTANTS } from '../engine/types.ts';

interface StatusBarProps {
  state: GameState;
}

export function StatusBar({ state }: StatusBarProps) {
  const player = state.players[0]; // Human is always player 0
  const dots = Array.from({ length: CONSTANTS.MAX_ACTIONS }, (_, i) => i < state.actionsLeft);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 12px',
      background: 'var(--surface)',
      borderRadius: 8,
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Actions:</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {dots.map((active, i) => (
            <div key={i} style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: active ? 'radial-gradient(circle, var(--gold) 30%, var(--gold-dim) 100%)' : 'rgba(90,64,48,0.5)',
              border: '1px solid var(--border-light)',
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold)', fontWeight: 700, fontSize: 18, textShadow: '0 0 6px rgba(212,168,80,0.3)' }}>
          {player.gold}g
        </span>
        {(state.turnModifiers.buyDiscount > 0 || state.turnModifiers.sellBonus > 0) && (
          <span style={{ fontSize: 11, color: '#6a8a40', fontWeight: 600 }}>
            {state.turnModifiers.buyDiscount > 0 && `Buy -${state.turnModifiers.buyDiscount}g `}
            {state.turnModifiers.sellBonus > 0 && `Sell +${state.turnModifiers.sellBonus}g`}
          </span>
        )}
      </div>
    </div>
  );
}
