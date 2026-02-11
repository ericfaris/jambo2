import { useState } from 'react';
import type { DeckCardId, WareType } from '../engine/types.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';

const CARD_TYPE_COLORS: Record<string, string> = {
  people: 'var(--card-people)',
  animal: 'var(--card-animal)',
  utility: 'var(--card-utility)',
  ware: 'var(--card-ware)',
  stand: 'var(--card-stand)',
};

// CSS linen finish — fine crosshatch over off-white base
const LINEN_BG = [
  'linear-gradient(0deg, rgba(180,170,155,0.08) 0.3px, transparent 0.3px)',
  'linear-gradient(90deg, rgba(180,170,155,0.08) 0.3px, transparent 0.3px)',
  'linear-gradient(135deg, rgba(200,190,175,0.04) 0.3px, transparent 0.3px)',
  'linear-gradient(45deg, rgba(200,190,175,0.04) 0.3px, transparent 0.3px)',
].join(', ');
const LINEN_BG_SIZE = '1px 1px, 1px 1px, 1.5px 1.5px, 1.5px 1.5px';
const LINEN_BASE = '#e8e4df';

// Cards that have artwork in public/assets/cards/
const CARDS_WITH_IMAGES = new Set([
  'guard', 'rain_maker', 'shaman', 'psychic', 'tribal_elder',
  'wise_man', 'portuguese', 'basket_maker', 'traveling_merchant',
  'arabian_merchant', 'dancer', 'carrier', 'drummer',
  'crocodile', 'parrot', 'hyena', 'snake', 'elephant', 'ape', 'lion', 'cheetah',
  'well', 'drums', 'throne', 'boat', 'scale',
  'mask_of_transformation', 'supplies', 'kettle', 'leopard_statue', 'weapons',
]);

const WARE_COLORS: Record<WareType, string> = {
  trinkets: 'var(--ware-trinkets)',
  hides: 'var(--ware-hides)',
  tea: 'var(--ware-tea)',
  silk: 'var(--ware-silk)',
  fruit: 'var(--ware-fruit)',
  salt: 'var(--ware-salt)',
};

const WARE_LABELS: Record<WareType, string> = {
  trinkets: 'K',
  hides: 'H',
  tea: 'T',
  silk: 'L',
  fruit: 'F',
  salt: 'S',
};

interface CardFaceProps {
  cardId: DeckCardId;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
  faceDown?: boolean;
}

export function CardFace({ cardId, onClick, selected, small, faceDown }: CardFaceProps) {
  const [imgError, setImgError] = useState(false);
  const [showMega, setShowMega] = useState(false);

  if (faceDown) {
    return (
      <div
        style={{
          width: small ? 60 : 90,
          height: small ? 80 : 120,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #2a3a5a 25%, #1a2a4a 75%)',
          border: '2px solid #3a4a6a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: small ? 16 : 24,
          flexShrink: 0,
        }}
      >
        ?
      </div>
    );
  }

  const card = getCard(cardId);
  const hasImage = CARDS_WITH_IMAGES.has(card.designId) && !imgError;
  const headerColor = CARD_TYPE_COLORS[card.type] || '#666';
  const tooltip = `${card.name} — ${card.description}`;

  if (hasImage) {
    const pad = small ? 1 : 2;
    return (<>
      <div
        title={tooltip}
        onClick={onClick}
        style={{
          width: small ? 60 : 90,
          height: small ? 80 : 120,
          borderRadius: 8,
          padding: pad,
          boxSizing: 'border-box',
          backgroundImage: LINEN_BG,
          backgroundSize: LINEN_BG_SIZE,
          backgroundColor: LINEN_BASE,
          border: `1px solid ${selected ? 'var(--gold)' : '#c8c2b8'}`,
          boxShadow: selected ? '0 0 0 2px var(--gold)' : 'inset 0 1px 2px rgba(0,0,0,0.08)',
          cursor: onClick ? 'pointer' : 'default',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
        }}
        onMouseEnter={(e) => {
          if (onClick) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = '';
        }}
      >
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
        }}>
          <img
            src={`/assets/cards/${card.designId}.png`}
            alt={card.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            draggable={false}
            onError={() => setImgError(true)}
          />
          <div
            onClick={(e) => { e.stopPropagation(); setShowMega(true); }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(255,255,255,0.85)',
              padding: small ? '1px 2px' : '2px 3px',
              cursor: 'pointer',
            }}
          >
            <div style={{
              fontSize: small ? 5 : 6,
              fontWeight: 700,
              color: '#1a1714',
              lineHeight: 1,
              textAlign: 'center',
            }}>
              {card.name}
            </div>
            {!small && (
              <div style={{
                fontSize: 5,
                color: '#4a4540',
                lineHeight: 1.1,
                textAlign: 'center',
              }}>
                {card.description}
              </div>
            )}
          </div>
        </div>
      </div>
      {showMega && (
        <div
          onClick={() => setShowMega(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
            background: '#000c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 300,
              borderRadius: 12,
              padding: 6,
              backgroundImage: LINEN_BG,
              backgroundSize: LINEN_BG_SIZE,
              backgroundColor: LINEN_BASE,
              border: '2px solid #c8c2b8',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <img
              src={`/assets/cards/${card.designId}.png`}
              alt={card.name}
              style={{
                width: '100%',
                borderRadius: 8,
                display: 'block',
              }}
              draggable={false}
            />
            <div style={{ padding: '0 4px 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  background: headerColor,
                  color: '#000',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '1px 6px',
                  borderRadius: 4,
                  letterSpacing: '0.5px',
                }}>
                  {card.type}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1714' }}>
                  {card.name}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#4a4540', lineHeight: 1.4 }}>
                {card.description}
              </div>
            </div>
          </div>
        </div>
      )}
    </>);
  }

  return (
    <div
      title={tooltip}
      onClick={onClick}
      style={{
        width: small ? 60 : 90,
        height: small ? 80 : 120,
        borderRadius: 8,
        border: `2px solid ${selected ? 'var(--gold)' : '#3a4a6a'}`,
        background: selected ? '#2a3a5a' : 'var(--surface)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = '';
      }}
    >
      {/* Header bar with type color — only for ware/stand cards */}
      <div style={{
        background: headerColor,
        padding: small ? '2px 4px' : '3px 6px',
        fontSize: small ? 8 : 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        color: '#000',
        letterSpacing: '0.5px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>{card.type}</span>
      </div>

      {/* Card name */}
      <div style={{
        flex: 1,
        padding: small ? 3 : 5,
        fontSize: small ? 8 : 11,
        fontWeight: 600,
        lineHeight: 1.2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        {card.name}
      </div>

      {/* Wares section for ware cards */}
      {card.wares && (
        <div style={{
          padding: small ? '2px 3px' : '3px 5px',
          borderTop: '1px solid #3a4a6a',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          fontSize: small ? 7 : 9,
        }}>
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            {card.wares.types.map((w, i) => (
              <span key={i} style={{
                background: WARE_COLORS[w],
                color: '#000',
                borderRadius: 3,
                padding: '0 3px',
                fontWeight: 700,
                fontSize: small ? 7 : 9,
              }}>
                {WARE_LABELS[w]}
              </span>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            {card.wares.buyPrice}g / {card.wares.sellPrice}g
          </div>
        </div>
      )}
    </div>
  );
}

export function WareToken({ type, onClick, selected }: { type: WareType; onClick?: () => void; selected?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        background: WARE_COLORS[type],
        border: `2px solid ${selected ? 'var(--gold)' : '#0003'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 14,
        color: '#000',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
      }}
    >
      {WARE_LABELS[type]}
    </div>
  );
}

export { WARE_COLORS, WARE_LABELS };
