import { useState, useEffect } from 'react';
import type { DeckCardId } from '../engine/types.ts';
import { CardFace } from './CardFace.tsx';

interface HandDisplayProps {
  hand: DeckCardId[];
  onPlayCard?: (cardId: DeckCardId) => void;
  disabled?: boolean;
  cardError?: {cardId: DeckCardId, message: string} | null;
  onMegaView?: (cardId: DeckCardId) => void;
}

export function HandDisplay({ hand, onPlayCard, disabled, cardError, onMegaView }: HandDisplayProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cardWidth = 140; // Card width
  const minGap = hand.length <= 8 ? 20 : 10; // More space for 1-8 cards, tighter for 9+
  const containerWidth = 600; // Approximate container width

  // Smooth overlap calculation starting from 9 cards
  let overlapAmount = 0;
  if (isMobile) {
    // On mobile, overlap all cards by 40px
    overlapAmount = 40;
  } else if (hand.length >= 9) {
    const cardsOverBase = hand.length - 9; // Start counting from 9 cards
    
    // Different algorithms for different ranges
    let baseOverlap = 0;
    if (hand.length <= 11) {
      // 9-11 cards: specific values
      baseOverlap = hand.length === 9 ? 4 : hand.length === 10 ? 14.5 : 25;
    } else {
      // 12+ cards: gentler increase from 25px base
      baseOverlap = 25 + (cardsOverBase - 2) * 8; // 8px per additional card beyond 11
    }

    // Calculate space-aware overlap
    const totalCardWidth = hand.length * cardWidth;
    const totalGapSpace = (hand.length - 1) * minGap;
    const totalNeededSpace = totalCardWidth + totalGapSpace;

    let spaceBasedOverlap = 0;
    if (totalNeededSpace > containerWidth) {
      const excessSpace = totalNeededSpace - containerWidth;
      spaceBasedOverlap = excessSpace / (hand.length - 1);
    }

    // Use the larger of base overlap or space-based overlap, but cap at reasonable limits
    overlapAmount = Math.min(baseOverlap, spaceBasedOverlap); // Prefer minimal overlap
    overlapAmount = Math.min(overlapAmount, cardWidth * 0.6); // Max 60% overlap
    overlapAmount = Math.max(overlapAmount, 0); // Ensure non-negative
  }

  // Calculate spacing between cards
  const spacing = overlapAmount > 0 ? -overlapAmount : minGap;

  return (
    <div 
      style={{
        position: 'relative',
        padding: 14,
        background: 'rgba(90,64,48,0.15)',
        border: '1px dashed var(--border)',
        borderRadius: 10,
        minHeight: 200, // Increased to accommodate card height (187px) + padding
        overflowX: isMobile ? 'auto' : 'hidden', // Horizontal scroll on mobile
        overflowY: 'hidden', // Never vertical scroll
        display: 'flex',
        justifyContent: isMobile ? 'flex-start' : 'center', // Left-align on mobile for scrolling
        alignItems: 'flex-start',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(90,64,48,0.3) transparent',
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        touchAction: 'pan-x',
      } as any}
    >
      {hand.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 12, fontSize: 14 }}>
          No cards in hand
        </div>
      )}
      {hand.map((cardId, index) => (
        <div
          key={cardId}
          style={{
            marginLeft: index === 0 ? 0 : spacing,
            flexShrink: 0,
            zIndex: index,
            position: 'relative',
          }}
        >
          <CardFace
            cardId={cardId}
            onClick={!disabled && onPlayCard ? () => onPlayCard(cardId) : undefined}
            onMegaView={onMegaView}
          />
          {cardError && cardError.cardId === cardId && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              textAlign: 'center',
              padding: 8,
              borderRadius: 8,
              zIndex: 1000,
              animation: 'cardErrorFadeOut 5s linear forwards',
            }}>
              {cardError.message}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
