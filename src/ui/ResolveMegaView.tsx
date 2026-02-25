import type { ReactNode } from 'react';
import type { DeckCardId } from '../engine/types.ts';
import { HandReferenceStrip } from './HandReferenceStrip.tsx';

interface ResolveMegaViewProps {
  children: ReactNode;
  verticalAlign?: 'top' | 'center';
  hand?: DeckCardId[];
  onMegaView?: (cardId: DeckCardId) => void;
  hideHandStrip?: boolean;
}

export function ResolveMegaView({ children, verticalAlign = 'top', hand, onMegaView, hideHandStrip }: ResolveMegaViewProps) {
  const showStrip = !hideHandStrip && hand && hand.length > 0;

  return (
    <div
      className="overlay-fade"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(20,10,5,0.85)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: verticalAlign === 'center' ? 'center' : 'flex-start',
        justifyContent: 'center',
        padding: 'clamp(8px, 3vw, 24px)',
        overflowY: 'auto',
      }}
    >
      <div
        className="dialog-pop"
        style={{
          width: 'min(980px, 100%)',
          maxHeight: 'calc(100vh - 16px)',
          overflowY: 'auto',
          border: 'none',
          background: 'transparent',
          boxShadow: 'none',
          margin: '0 auto',
          paddingBottom: showStrip ? 55 : undefined,
        }}
      >
        {children}
      </div>
      {showStrip && (
        <HandReferenceStrip hand={hand} onMegaView={onMegaView} />
      )}
    </div>
  );
}
