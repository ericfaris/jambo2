import type { GameState, DeckCardId } from '../engine/types.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';
import { CardFace } from './CardFace.tsx';

interface ActionButtonsProps {
  state: GameState;
  dispatch: (action: import('../engine/types.ts').GameAction) => void;
  disabled: boolean;
}

export function ActionButtons({ state, dispatch, disabled }: ActionButtonsProps) {
  const isMyTurn = state.currentPlayer === 0;
  const canAct = isMyTurn && !disabled;

  // Draw phase buttons
  if (state.phase === 'DRAW' && isMyTurn) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '8px 0',
      }}>
        {state.drawnCard ? (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              You drew:
            </div>
            <CardFace cardId={state.drawnCard} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                className="primary"
                disabled={!canAct}
                onClick={() => dispatch({ type: 'KEEP_CARD' })}
              >
                Keep Card
              </button>
              <button
                className="danger"
                disabled={!canAct}
                onClick={() => dispatch({ type: 'DISCARD_DRAWN' })}
              >
                Discard
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="primary"
              disabled={!canAct || state.keptCardThisDrawPhase || state.actionsLeft <= 0}
              onClick={() => dispatch({ type: 'DRAW_CARD' })}
            >
              Draw Card ({state.actionsLeft} actions left)
            </button>
            <button
              disabled={!canAct}
              onClick={() => dispatch({ type: 'SKIP_DRAW' })}
            >
              Skip Draw Phase
            </button>
          </div>
        )}
      </div>
    );
  }

  // Play phase buttons
  if (state.phase === 'PLAY' && isMyTurn) {
    return (
      <div style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'center',
        padding: '8px 0',
        flexWrap: 'wrap',
      }}>
        <button
          className="danger"
          disabled={!canAct}
          onClick={() => dispatch({ type: 'END_TURN' })}
        >
          End Turn
        </button>
      </div>
    );
  }

  return null;
}

interface CardPlayDialogProps {
  cardId: DeckCardId;
  onBuy: () => void;
  onSell: () => void;
  onCancel: () => void;
}

export function CardPlayDialog({ cardId, onBuy, onSell, onCancel }: CardPlayDialogProps) {
  const card = getCard(cardId);
  if (!card.wares) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0008',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}
    onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 12,
          padding: 20,
          border: '2px solid var(--gold)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardFace cardId={cardId} />
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Choose action:
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary" onClick={onBuy}>
            Buy ({card.wares.buyPrice}g)
          </button>
          <button className="primary" onClick={onSell}>
            Sell ({card.wares.sellPrice}g)
          </button>
        </div>
        <button onClick={onCancel} style={{ fontSize: 11 }}>Cancel</button>
      </div>
    </div>
  );
}
