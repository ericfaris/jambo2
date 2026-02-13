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
      padding: '8px 16px',
      background: 'var(--surface)',
      borderRadius: 10,
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Actions:</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {dots.map((active, i) => (
            <div key={i} style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: active ? 'radial-gradient(circle, var(--gold) 30%, var(--gold-dim) 100%)' : 'rgba(90,64,48,0.5)',
              border: '1px solid var(--border-light)',
              transition: 'background 0.3s ease, transform 0.3s ease, opacity 0.3s ease',
              transform: active ? 'scale(1)' : 'scale(0.8)',
              opacity: active ? 1 : 0.5,
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold)', fontWeight: 700, fontSize: 22, textShadow: '0 0 6px rgba(212,168,80,0.3)' }}>
          {player.gold}g
        </span>
        {(state.turnModifiers.buyDiscount > 0 || state.turnModifiers.sellBonus > 0) && (
          <span style={{ fontSize: 13, color: '#6a8a40', fontWeight: 600 }}>
            {state.turnModifiers.buyDiscount > 0 && `Buy -${state.turnModifiers.buyDiscount}g `}
            {state.turnModifiers.sellBonus > 0 && `Sell +${state.turnModifiers.sellBonus}g`}
          </span>
        )}
      </div>
    </div>
  );
}
