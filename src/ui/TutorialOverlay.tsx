import { useState, useEffect, useCallback } from 'react';

interface TutorialOverlayProps {
  onClose: () => void;
}

const TOTAL_SLIDES = 8;

function SlideWelcome() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--gold)', marginBottom: 12 }}>
        Welcome to the Market
      </div>
      <img
        src="/assets/menu/main_menu.png"
        alt="African marketplace"
        style={{ width: '100%', maxWidth: 400, borderRadius: 12, marginBottom: 16, opacity: 0.85 }}
      />
      <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)', marginBottom: 8 }}>
        You are a trader in a bustling African marketplace. Buy and sell exotic wares — trinkets, hides, tea, silk, fruit, and salt — to grow your fortune.
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)' }}>
        Play cards to hire helpers, unleash animals on your rival, and use powerful utilities. The first trader to reach{' '}
        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>60 gold</span> triggers the final round. Whoever has the most gold at the end wins!
      </p>
    </div>
  );
}

function SlideTurnOverview() {
  return (
    <div>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--gold)', marginBottom: 12, textAlign: 'center' }}>
        Your Turn at a Glance
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)', marginBottom: 16, textAlign: 'center' }}>
        Each turn you get <span style={{ color: 'var(--gold)', fontWeight: 700 }}>5 actions</span>, split across two phases:
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ flex: '1 1 200px', background: 'rgba(212,168,80,0.1)', borderRadius: 10, padding: 14, border: '1px solid rgba(212,168,80,0.25)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold)', fontSize: 16, marginBottom: 6 }}>
            Phase 1 — Draw
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>
            Draw the top card of the deck. You can <strong style={{ color: 'var(--text)' }}>keep it</strong> (ends the phase) or{' '}
            <strong style={{ color: 'var(--text)' }}>discard it</strong> and try again. Each draw attempt costs 1 action.
          </p>
        </div>
        <div style={{ flex: '1 1 200px', background: 'rgba(212,168,80,0.1)', borderRadius: 10, padding: 14, border: '1px solid rgba(212,168,80,0.25)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold)', fontSize: 16, marginBottom: 6 }}>
            Phase 2 — Play
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>
            Play cards from your hand. Each card costs 1 action. Play wares to buy or sell, people for effects, animals to attack, or utilities to place.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', background: 'rgba(106,138,64,0.15)', borderRadius: 8, padding: 10, border: '1px solid rgba(106,138,64,0.3)' }}>
        <span style={{ fontSize: 14, color: '#6a8a40', fontWeight: 600 }}>
          Bonus: If you have 2+ actions left when you end your turn, you earn +1 gold!
        </span>
      </div>
    </div>
  );
}

function SlideCardTypes() {
  const types = [
    { name: 'Ware', color: '#a08050', desc: 'Buy or sell goods', example: 'ware_3k' },
    { name: 'Stand', color: '#8B7355', desc: 'Expand your market', example: 'small_market_stand' },
    { name: 'People', color: 'var(--card-people, #4a7a9b)', desc: 'One-time helpers', example: 'guard' },
    { name: 'Animal', color: 'var(--card-animal, #c04030)', desc: 'Attack your rival', example: 'crocodile' },
    { name: 'Utility', color: 'var(--card-utility, #6a8a40)', desc: 'Reusable each turn', example: 'well' },
  ];

  return (
    <div>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--gold)', marginBottom: 12, textAlign: 'center' }}>
        Five Kinds of Cards
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16 }}>
        The 110-card deck has five types. Each costs 1 action to play.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {types.map((t) => (
          <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(20,10,5,0.3)', borderRadius: 8, padding: '8px 12px' }}>
            <img src={`/assets/cards/${t.example}.png`} alt={t.name} style={{ width: 44, height: 64, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{
                display: 'inline-block',
                background: t.color,
                color: '#fff',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 2,
              }}>
                {t.name}
              </span>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{t.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideBuyingSelling() {
  return (
    <div>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--gold)', marginBottom: 12, textAlign: 'center' }}>
        Buying &amp; Selling Wares
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
        <img src="/assets/cards/ware_3k.png" alt="Ware card example" style={{ width: 110, borderRadius: 8, flexShrink: 0 }} />
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)', marginBottom: 10 }}>
            Every ware card can <strong>buy</strong> or <strong>sell</strong> — you choose when you play it.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1, background: 'rgba(106,138,64,0.15)', borderRadius: 8, padding: 10, border: '1px solid rgba(106,138,64,0.3)' }}>
              <div style={{ fontWeight: 700, color: '#6a8a40', fontSize: 13, marginBottom: 4 }}>Buy</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Pay gold, receive wares from the supply into your market.</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(212,168,80,0.15)', borderRadius: 8, padding: 10, border: '1px solid rgba(212,168,80,0.3)' }}>
              <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 13, marginBottom: 4 }}>Sell</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Return wares from your market to supply, receive gold.</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {(['trinkets', 'hides', 'tea', 'silk', 'fruit', 'salt'] as const).map((w) => (
          <div key={w} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <img src={`/assets/wares/${w}.png`} alt={w} style={{ width: 36, height: 36, borderRadius: 4 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{w}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideMarketUtilities() {
  return (
    <div>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--gold)', marginBottom: 12, textAlign: 'center' }}>
        Your Market &amp; Utilities
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ flex: '1 1 200px', background: 'rgba(212,168,80,0.1)', borderRadius: 10, padding: 14, border: '1px solid rgba(212,168,80,0.25)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold)', fontSize: 16, marginBottom: 6 }}>
            Market (6 slots)
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>
            Your market holds the wares you've bought. You start with 6 slots — play a <strong style={{ color: 'var(--text)' }}>Small Market Stand</strong> card to add 3 more.
            Fill your market with wares, then sell them for profit!
          </p>
        </div>
        <div style={{ flex: '1 1 200px', background: 'rgba(106,138,64,0.12)', borderRadius: 10, padding: 14, border: '1px solid rgba(106,138,64,0.25)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#6a8a40', fontSize: 16, marginBottom: 6 }}>
            Utilities (max 3)
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>
            Play utility cards face-up. You can <strong style={{ color: 'var(--text)' }}>activate</strong> each one once per turn for 1 action.
            Utilities stay in play until replaced or discarded.
          </p>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <img src="/assets/cards/well.png" alt="Well" style={{ width: 36, height: 52, objectFit: 'cover', borderRadius: 4 }} />
            <img src="/assets/cards/drums.png" alt="Drums" style={{ width: 36, height: 52, objectFit: 'cover', borderRadius: 4 }} />
            <img src="/assets/cards/boat.png" alt="Boat" style={{ width: 36, height: 52, objectFit: 'cover', borderRadius: 4 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideHelpersAttackers() {
  return (
    <div>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--gold)', marginBottom: 12, textAlign: 'center' }}>
        Helpers &amp; Attackers
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
        <img src="/assets/cards/basket_maker.png" alt="People card" style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--card-people, #4a7a9b)', marginBottom: 4 }}>People Cards</div>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>
            One-time effects — hire a Basket Maker for cheap wares, a Dancer to sell at premium prices, or a Psychic to peek at the deck.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
        <img src="/assets/cards/crocodile.png" alt="Animal card" style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--card-animal, #c04030)', marginBottom: 4 }}>Animal Cards</div>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>
            Attack your opponent! Steal wares with a Parrot, swap hands with a Hyena, or use their utility with a Crocodile.
          </p>
        </div>
      </div>

      <div style={{ background: 'rgba(212,168,80,0.1)', borderRadius: 8, padding: 12, border: '1px solid rgba(212,168,80,0.25)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)', marginBottom: 6 }}>Reactions (free!)</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <img src="/assets/cards/guard.png" alt="Guard" style={{ width: 40, height: 58, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
          <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>
            <strong style={{ color: 'var(--text)' }}>Guard</strong> — cancel any animal attack.{' '}
            <strong style={{ color: 'var(--text)' }}>Rain Maker</strong> — steal an opponent's ware card after they buy or sell.
            Reactions are played on your opponent's turn and cost 0 actions.
          </p>
        </div>
      </div>
    </div>
  );
}

function SlideMegaView() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--gold)', marginBottom: 12 }}>
        Need a Closer Look?
      </div>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)', marginBottom: 12 }}>
        Click the <strong>magnifying glass</strong> icon on any card in your hand to open <strong>Mega View</strong> — a full-size display of the card art and details.
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-muted)', marginBottom: 0 }}>
        When resolving interactions (buying, selling, drafting, etc.), the resolution panel appears front and center so you never miss an important choice.
      </p>
    </div>
  );
}

function SlideTips({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--gold)', marginBottom: 12, textAlign: 'center' }}>
        Beginner Tips
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(212,168,80,0.08)', borderRadius: 8, padding: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>1.</span>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)', margin: 0 }}>
            <strong>Buy low, sell high.</strong> Fill your market with cheap 3-ware cards, then sell everything with an expensive 6-ware card for big profit.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(212,168,80,0.08)', borderRadius: 8, padding: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>2.</span>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)', margin: 0 }}>
            <strong>Keep a Guard handy.</strong> Animal attacks can be devastating — a Guard in hand protects you from Elephants, Crocodiles, and other threats.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(212,168,80,0.08)', borderRadius: 8, padding: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>3.</span>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)', margin: 0 }}>
            <strong>Don't waste actions.</strong> End your turn early with 2+ unused actions to earn a +1 gold bonus. Sometimes patience pays!
          </p>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #6a8a40 0%, #4a6a28 100%)',
            border: '2px solid #8aaa50',
            borderRadius: 10,
            padding: '14px 32px',
            color: 'white',
            fontWeight: 700,
            fontSize: 18,
            fontFamily: 'var(--font-heading)',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(106,138,64,0.4)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(106,138,64,0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(106,138,64,0.4)';
          }}
        >
          Start Playing!
        </button>
      </div>
    </div>
  );
}

export function TutorialOverlay({ onClose }: TutorialOverlayProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  const handleNext = useCallback(() => {
    setSlideIndex((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1));
  }, []);

  const handleBack = useCallback(() => {
    setSlideIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (slideIndex < TOTAL_SLIDES - 1) handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, slideIndex, handleNext, handleBack]);

  const slides = [
    <SlideWelcome key="welcome" />,
    <SlideTurnOverview key="turn" />,
    <SlideCardTypes key="cards" />,
    <SlideBuyingSelling key="wares" />,
    <SlideMarketUtilities key="market" />,
    <SlideHelpersAttackers key="helpers" />,
    <SlideMegaView key="mega" />,
    <SlideTips key="tips" onClose={onClose} />,
  ];

  return (
    <div
      className="overlay-fade"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,10,5,0.90)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        className="dialog-pop etched-wood-border"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #3d2a1a 0%, #2d1c12 100%)',
          borderRadius: 16,
          padding: '32px 28px 24px',
          border: '3px solid var(--gold)',
          maxWidth: 720,
          width: '94vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 0 40px rgba(212,168,80,0.2)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 14,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 22,
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1,
          }}
          title="Close (Esc)"
        >
          ✕
        </button>

        {/* Slide content */}
        <div style={{ minHeight: 240 }}>
          {slides[slideIndex]}
        </div>

        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, marginBottom: 12 }}>
          {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              style={{
                width: i === slideIndex ? 24 : 10,
                height: 10,
                borderRadius: 5,
                border: 'none',
                background: i === slideIndex ? 'var(--gold)' : 'rgba(212,168,80,0.3)',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleBack}
            disabled={slideIndex === 0}
            style={{
              background: slideIndex === 0 ? 'rgba(212,168,80,0.1)' : 'rgba(212,168,80,0.2)',
              border: '1px solid rgba(212,168,80,0.3)',
              color: slideIndex === 0 ? 'rgba(212,168,80,0.3)' : 'var(--gold)',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: slideIndex === 0 ? 'default' : 'pointer',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Back
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {slideIndex + 1} / {TOTAL_SLIDES}
          </span>
          {slideIndex < TOTAL_SLIDES - 1 ? (
            <button
              onClick={handleNext}
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,80,0.3) 0%, rgba(212,168,80,0.2) 100%)',
                border: '1px solid var(--gold)',
                color: 'var(--gold)',
                borderRadius: 8,
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Next
            </button>
          ) : (
            <div style={{ width: 80 }} />
          )}
        </div>
      </div>
    </div>
  );
}
