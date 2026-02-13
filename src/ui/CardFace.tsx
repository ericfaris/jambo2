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
  'ware_slk', 'ware_khl', 'ware_skf', 'ware_fht', 'ware_tsf', 'ware_lht',
  'ware_2k1f', 'ware_2l1s', 'ware_2t1l', 'ware_2s1k', 'ware_2f1h', 'ware_2h1t',
  'ware_3k', 'ware_3h', 'ware_3t', 'ware_3l', 'ware_3f', 'ware_3s',
  'ware_6all',
  'small_market_stand',
]);

const WARE_COLORS: Record<WareType, string> = {
  trinkets: 'var(--ware-trinkets)',
  hides: 'var(--ware-hides)',
  tea: 'var(--ware-tea)',
  silk: 'var(--ware-silk)',
  fruit: 'var(--ware-fruit)',
  salt: 'var(--ware-salt)',
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
          width: small ? 72 : 108,
          height: small ? 96 : 144,
          borderRadius: 8,
          backgroundImage: 'url(/assets/cards/card_back.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '2px solid var(--border)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          flexShrink: 0,
        }}
      />
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
          width: small ? 72 : 108,
          height: small ? 96 : 144,
          borderRadius: 8,
          padding: pad,
          boxSizing: 'border-box',
          backgroundImage: LINEN_BG,
          backgroundSize: LINEN_BG_SIZE,
          backgroundColor: LINEN_BASE,
          border: `1px solid ${selected ? 'var(--gold)' : '#a89880'}`,
          boxShadow: selected ? '0 0 0 2px var(--gold)' : '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(0,0,0,0.08)',
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
          {card.wares ? (
            card.wares.types.length > 3 ? (
            /* 6-ware layout: top row of 3 pips, bottom row with coins + 3 pips */
            <div
              onClick={(e) => { e.stopPropagation(); setShowMega(true); }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: small ? 1 : 2,
                padding: small ? 2 : 3,
                background: 'rgba(0,0,0,0.35)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', gap: small ? 2 : 3, justifyContent: 'center' }}>
                {card.wares.types.slice(0, 3).map((w, i) => (
                  <div key={i} style={{
                    width: small ? 12 : 16,
                    height: small ? 12 : 16,
                    borderRadius: small ? 3 : 4,
                    background: WARE_COLORS[w],
                    border: '1.5px solid rgba(0,0,0,0.6)',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <img
                  src={`/assets/coins/coin_${card.wares.buyPrice}.png`}
                  alt={`${card.wares.buyPrice}g`}
                  style={{ width: small ? 14 : 20, height: small ? 14 : 20 }}
                  draggable={false}
                />
                <div style={{ display: 'flex', gap: small ? 2 : 3 }}>
                  {card.wares.types.slice(3).map((w, i) => (
                    <div key={i} style={{
                      width: small ? 12 : 16,
                      height: small ? 12 : 16,
                      borderRadius: small ? 3 : 4,
                      background: WARE_COLORS[w],
                      border: '1.5px solid rgba(0,0,0,0.6)',
                    }} />
                  ))}
                </div>
                <img
                  src={`/assets/coins/coin_${card.wares.sellPrice}.png`}
                  alt={`${card.wares.sellPrice}g`}
                  style={{ width: small ? 14 : 20, height: small ? 14 : 20 }}
                  draggable={false}
                />
              </div>
            </div>
            ) : (
            <div
              onClick={(e) => { e.stopPropagation(); setShowMega(true); }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: small ? 2 : 3,
                background: 'rgba(0,0,0,0.35)',
                cursor: 'pointer',
              }}
            >
              <img
                src={`/assets/coins/coin_${card.wares.buyPrice}.png`}
                alt={`${card.wares.buyPrice}g`}
                style={{ width: small ? 14 : 20, height: small ? 14 : 20 }}
                draggable={false}
              />
              <div style={{ display: 'flex', gap: small ? 2 : 3 }}>
                {card.wares.types.map((w, i) => (
                  <div key={i} style={{
                    width: small ? 12 : 16,
                    height: small ? 12 : 16,
                    borderRadius: small ? 3 : 4,
                    background: WARE_COLORS[w],
                    border: '1.5px solid rgba(0,0,0,0.6)',
                  }} />
                ))}
              </div>
              <img
                src={`/assets/coins/coin_${card.wares.sellPrice}.png`}
                alt={`${card.wares.sellPrice}g`}
                style={{ width: small ? 14 : 20, height: small ? 14 : 20 }}
                draggable={false}
              />
            </div>
            )
          ) : (
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
          )}
        </div>
      </div>
      {showMega && (
        <div
          onClick={() => setShowMega(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
            background: 'rgba(20,10,5,0.85)',
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
              border: '2px solid #a89880',
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
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1714', marginBottom: 4 }}>
                {card.name}
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
        border: `2px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
        background: selected ? 'var(--surface-accent)' : 'var(--surface)',
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
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          fontSize: small ? 7 : 9,
        }}>
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            {card.wares.types.map((w, i) => (
              <span key={i} style={{
                background: WARE_COLORS[w],
                borderRadius: 3,
                width: small ? 10 : 14,
                height: small ? 10 : 14,
                display: 'inline-block',
              }} />
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
    <img
      src={`/assets/tokens/${type}.png`}
      alt={type}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        outline: selected ? '2px solid var(--gold)' : 'none',
        borderRadius: 4,
      }}
      draggable={false}
    />
  );
}

export { WARE_COLORS };
