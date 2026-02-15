import { memo } from 'react';
import type { PlayerState } from '../engine/types.ts';
import { MarketDisplay } from './MarketDisplay.tsx';
import { UtilityArea } from './UtilityArea.tsx';
import { SpeechBubble } from './SpeechBubble.tsx';

interface OpponentAreaProps {
  player: PlayerState;
  aiMessage?: string;
  onMessageHide?: () => void;
  goldDelta?: number;
  marketFlashSlots?: number[];
}

function OpponentAreaComponent({ player, aiMessage, onMessageHide, goldDelta = 0, marketFlashSlots }: OpponentAreaProps) {
  return (
    <div style={{ position: 'relative' }}>
      <SpeechBubble
        message={aiMessage || ''}
        visible={!!aiMessage}
        onHide={onMessageHide || (() => {})}
      />
      <div className="etched-wood-border" style={{
        background: 'rgba(20,10,5,0.3)',
        borderRadius: 10,
        padding: 16,
      }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
      }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18 }}>Opponent (AI)</span>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span key={`opp-gold-${goldDelta}`} className={goldDelta !== 0 ? 'gold-pop gold-pop-strong' : undefined} style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16, position: 'relative' }}>
            {player.gold}g
            {goldDelta !== 0 && (
              <span className="gold-delta-text gold-delta-text-strong" style={{
                position: 'absolute',
                top: -18,
                right: -20,
                color: goldDelta > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                fontSize: 12,
                fontWeight: 700,
              }}>
                {goldDelta > 0 ? `+${goldDelta}g` : `${goldDelta}g`}
              </span>
            )}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            {player.hand.length} cards
          </span>
        </div>
      </div>
      <div style={{
        display: 'flex',
        gap: 20,
        flexWrap: 'wrap',
        background: 'rgba(20,10,5,0.24)',
        borderRadius: 10,
        padding: 10,
      }}>
        <MarketDisplay market={player.market} flashSlots={marketFlashSlots} flashVariant="strong" label="Market" />
        <UtilityArea utilities={player.utilities} disabled label="Utilities" />
      </div>
    </div>
    </div>
  );
}

export const OpponentArea = memo(OpponentAreaComponent);
