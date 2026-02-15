import { useEffect } from 'react';
import type { DeckCardId } from '../engine/types.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';

interface MegaViewProps {
  cardId: DeckCardId;
  onClose: () => void;
}

export function MegaView({ cardId, onClose }: MegaViewProps) {
  const card = getCard(cardId);
  const LINEN_BG = [
    'linear-gradient(0deg, rgba(180,170,155,0.08) 0.3px, transparent 0.3px)',
    'linear-gradient(90deg, rgba(180,170,155,0.08) 0.3px, transparent 0.3px)',
    'linear-gradient(135deg, rgba(200,190,175,0.04) 0.3px, transparent 0.3px)',
    'linear-gradient(45deg, rgba(200,190,175,0.04) 0.3px, transparent 0.3px)',
  ].join(', ');
  const LINEN_BG_SIZE = '1px 1px, 1px 1px, 1.5px 1.5px, 1.5px 1.5px';
  const LINEN_BASE = '#e8e4df';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="overlay-fade"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(20,10,5,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="dialog-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380,
          borderRadius: 14,
          padding: 8,
          backgroundImage: LINEN_BG,
          backgroundSize: LINEN_BG_SIZE,
          backgroundColor: LINEN_BASE,
          border: '2px solid #a89880',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <img
          src={`/assets/cards/${card.designId}.png`}
          alt={card.name}
          style={{
            width: '100%',
            borderRadius: 10,
            display: 'block',
          }}
          draggable={false}
        />
        <div style={{ padding: '0 6px 6px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1714', marginBottom: 6 }}>
            {card.name}
          </div>
          <div style={{ fontSize: 15, color: '#4a4540', lineHeight: 1.4 }}>
            {card.description}
          </div>
        </div>
      </div>
    </div>
  );
}
