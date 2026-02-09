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
      border: '1px solid #3a4a6a',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Actions:</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {dots.map((active, i) => (
            <div key={i} style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: active ? '#7BC47F' : '#3a4a6a',
              border: '1px solid #5a6a8a',
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>
          {player.gold}g
        </span>
        {(state.turnModifiers.buyDiscount > 0 || state.turnModifiers.sellBonus > 0) && (
          <span style={{ fontSize: 11, color: '#7BC47F', fontWeight: 600 }}>
            {state.turnModifiers.buyDiscount > 0 && `Buy -${state.turnModifiers.buyDiscount}g `}
            {state.turnModifiers.sellBonus > 0 && `Sell +${state.turnModifiers.sellBonus}g`}
          </span>
        )}
      </div>
    </div>
  );
}
