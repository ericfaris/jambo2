import type { PlayerState } from '../engine/types.ts';
import { MarketDisplay } from './MarketDisplay.tsx';
import { UtilityArea } from './UtilityArea.tsx';
import { SpeechBubble } from './SpeechBubble.tsx';

interface OpponentAreaProps {
  player: PlayerState;
  aiMessage?: string;
  onMessageHide?: () => void;
}

export function OpponentArea({ player, aiMessage, onMessageHide }: OpponentAreaProps) {
  return (
    <div style={{ position: 'relative' }}>
      <SpeechBubble
        message={aiMessage || ''}
        visible={!!aiMessage}
        onHide={onMessageHide || (() => {})}
      />
      <div style={{
        background: 'linear-gradient(180deg, var(--surface) 0%, rgba(30,18,8,0.8) 100%)',
        borderRadius: 10,
        padding: 16,
        border: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18 }}>Opponent (AI)</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>
              {player.gold}g
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              {player.hand.length} cards
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <MarketDisplay market={player.market} label="Market" />
          <UtilityArea utilities={player.utilities} disabled label="Utilities" />
        </div>
      </div>
    </div>
  );
}
