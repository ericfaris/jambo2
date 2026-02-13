import type { DeckCardId } from '../engine/types.ts';
import { CardFace } from './CardFace.tsx';

interface HandDisplayProps {
  hand: DeckCardId[];
  onPlayCard?: (cardId: DeckCardId) => void;
  disabled?: boolean;
}

export function HandDisplay({ hand, onPlayCard, disabled }: HandDisplayProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      justifyContent: 'center',
      padding: 10,
      background: 'rgba(90,64,48,0.15)',
      border: '1px dashed var(--border)',
      borderRadius: 10,
    }}>
      {hand.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 8 }}>
          No cards in hand
        </div>
      )}
      {hand.map((cardId) => (
        <CardFace
          key={cardId}
          cardId={cardId}
          onClick={!disabled && onPlayCard ? () => onPlayCard(cardId) : undefined}
        />
      ))}
    </div>
  );
}
