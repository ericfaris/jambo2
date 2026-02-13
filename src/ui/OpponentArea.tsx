import type { PlayerState } from '../engine/types.ts';
import { MarketDisplay } from './MarketDisplay.tsx';
import { UtilityArea } from './UtilityArea.tsx';

interface OpponentAreaProps {
  player: PlayerState;
}

export function OpponentArea({ player }: OpponentAreaProps) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, var(--surface) 0%, rgba(30,18,8,0.8) 100%)',
      borderRadius: 10,
      padding: 12,
      border: '1px solid var(--border)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15 }}>Opponent (AI)</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
            {player.gold}g
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {player.hand.length} cards
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <MarketDisplay market={player.market} label="Market" />
        <UtilityArea utilities={player.utilities} disabled label="Utilities" />
      </div>
    </div>
  );
}
