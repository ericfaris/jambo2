import type { DeckCardId, WareType } from '../engine/types.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';

const CARD_TYPE_COLORS: Record<string, string> = {
  people: 'var(--card-people)',
  animal: 'var(--card-animal)',
  utility: 'var(--card-utility)',
  ware: 'var(--card-ware)',
  stand: 'var(--card-stand)',
};

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
  const headerColor = CARD_TYPE_COLORS[card.type] || '#666';

  return (
    <div
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
        transform: onClick ? undefined : undefined,
      }}
      onMouseEnter={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = '';
      }}
    >
      {/* Header bar with type color */}
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
