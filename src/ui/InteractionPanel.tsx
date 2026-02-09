import { useState } from 'react';
import type { GameState, PendingResolution, InteractionResponse, WareType, DeckCardId } from '../engine/types.ts';
import { WARE_TYPES } from '../engine/types.ts';
import { getCard } from '../engine/cards/CardDatabase.ts';
import { CardFace, WareToken, WARE_LABELS } from './CardFace.tsx';
import { MarketDisplay } from './MarketDisplay.tsx';

interface InteractionPanelProps {
  state: GameState;
  dispatch: (action: import('../engine/types.ts').GameAction) => void;
}

function resolve(dispatch: InteractionPanelProps['dispatch'], response: InteractionResponse) {
  dispatch({ type: 'RESOLVE_INTERACTION', response });
}

export function InteractionPanel({ state, dispatch }: InteractionPanelProps) {
  // Guard reaction
  if (state.pendingGuardReaction) {
    const animalCard = getCard(state.pendingGuardReaction.animalCard);
    const isMyReaction = state.pendingGuardReaction.targetPlayer === 0;
    if (!isMyReaction) return <PanelShell title="Waiting for opponent's Guard reaction..." />;
    return (
      <PanelShell title={`${animalCard.name} played! Play Guard to cancel?`}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary" onClick={() => dispatch({ type: 'GUARD_REACTION', play: true })}>
            Play Guard
          </button>
          <button onClick={() => dispatch({ type: 'GUARD_REACTION', play: false })}>
            Decline
          </button>
        </div>
      </PanelShell>
    );
  }

  // Ware card reaction
  if (state.pendingWareCardReaction) {
    const isMyReaction = state.pendingWareCardReaction.targetPlayer === 0;
    if (!isMyReaction) return <PanelShell title="Waiting for opponent's Rain Maker reaction..." />;
    return (
      <PanelShell title="Opponent used a ware card! Play Rain Maker to take it?">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary" onClick={() => dispatch({ type: 'WARE_CARD_REACTION', play: true })}>
            Play Rain Maker
          </button>
          <button onClick={() => dispatch({ type: 'WARE_CARD_REACTION', play: false })}>
            Decline
          </button>
        </div>
      </PanelShell>
    );
  }

  const pr = state.pendingResolution;
  if (!pr) return null;

  const source = getCard(pr.sourceCard);

  return (
    <PanelShell title={`${source.name} - Resolve`}>
      <ResolutionContent state={state} pr={pr} dispatch={dispatch} />
    </PanelShell>
  );
}

function PanelShell({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{
      background: '#1a2a4a',
      borderRadius: 10,
      padding: 14,
      border: '2px solid var(--gold)',
      margin: '8px 0',
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--gold)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ResolutionContent({ state, pr, dispatch }: { state: GameState; pr: PendingResolution; dispatch: InteractionPanelProps['dispatch'] }) {
  switch (pr.type) {
    case 'WARE_TRADE':
      return <WareTradePanel state={state} pr={pr} dispatch={dispatch} />;
    case 'WARE_SELECT_MULTIPLE':
    case 'CARRIER_WARE_SELECT':
      return <WareTypePicker prompt={pr.type === 'WARE_SELECT_MULTIPLE' ? `Pick a ware type (receive x${pr.count})` : 'Choose a ware type'} onPick={(wt) => resolve(dispatch, { type: 'SELECT_WARE_TYPE', wareType: wt })} />;
    case 'BINARY_CHOICE':
      return <BinaryChoicePanel options={pr.options} onChoice={(c) => resolve(dispatch, { type: 'BINARY_CHOICE', choice: c })} />;
    case 'OPPONENT_CHOICE':
      return <BinaryChoicePanel options={pr.options} onChoice={(c) => resolve(dispatch, { type: 'OPPONENT_CHOICE', choice: c })} />;
    case 'AUCTION':
      return <AuctionPanel pr={pr} state={state} dispatch={dispatch} />;
    case 'DECK_PEEK':
      return <DeckPeekPanel pr={pr} dispatch={dispatch} />;
    case 'DISCARD_PICK':
      return <DiscardPickPanel pr={pr} dispatch={dispatch} />;
    case 'WARE_CASH_CONVERSION':
      return <WareCashPanel state={state} pr={pr} dispatch={dispatch} />;
    case 'WARE_SELL_BULK':
      return <WareSellBulkPanel state={state} pr={pr} dispatch={dispatch} />;
    case 'WARE_RETURN':
      return <WareReturnPanel state={state} dispatch={dispatch} />;
    case 'WARE_THEFT_SINGLE':
      return <WareTheftSinglePanel state={state} dispatch={dispatch} />;
    case 'WARE_THEFT_SWAP':
      return <WareTheftSwapPanel state={state} pr={pr} dispatch={dispatch} />;
    case 'UTILITY_THEFT_SINGLE':
      return <UtilityTheftPanel state={state} dispatch={dispatch} />;
    case 'HAND_SWAP':
      return <HandSwapPanel state={state} pr={pr} dispatch={dispatch} />;
    case 'OPPONENT_DISCARD':
      return <OpponentDiscardPanel state={state} pr={pr} dispatch={dispatch} />;
    case 'DRAFT':
      return <DraftPanel state={state} pr={pr} dispatch={dispatch} />;
    case 'SUPPLIES_DISCARD':
      return <SuppliesDiscardPanel state={state} dispatch={dispatch} />;
    case 'UTILITY_KEEP':
      return <UtilityKeepPanel state={state} pr={pr} dispatch={dispatch} />;
    case 'CROCODILE_USE':
      return <CrocodilePanel state={state} pr={pr} dispatch={dispatch} />;
    case 'UTILITY_EFFECT':
      return <UtilityEffectPanel state={state} pr={pr} dispatch={dispatch} />;
    case 'DRAW_MODIFIER':
      return <DrawModifierPanel state={state} dispatch={dispatch} />;
    case 'TURN_MODIFIER':
      return <div style={{ color: 'var(--text-muted)' }}>Auto-resolving...</div>;
    default:
      return <div style={{ color: 'var(--text-muted)' }}>Unknown resolution type</div>;
  }
}

// --- Sub-components ---

function WareTypePicker({ prompt, onPick, exclude }: { prompt: string; onPick: (wt: WareType) => void; exclude?: WareType }) {
  const types = exclude ? WARE_TYPES.filter(w => w !== exclude) : WARE_TYPES;
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>{prompt}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {types.map(wt => (
          <button key={wt} onClick={() => onPick(wt)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <WareToken type={wt} /> {WARE_LABELS[wt]}
          </button>
        ))}
      </div>
    </div>
  );
}

function BinaryChoicePanel({ options, onChoice }: { options: [string, string]; onChoice: (c: 0 | 1) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="primary" onClick={() => onChoice(0)}>{options[0]}</button>
      <button className="primary" onClick={() => onChoice(1)}>{options[1]}</button>
    </div>
  );
}

function WareTradePanel({ pr, dispatch }: { state: GameState; pr: Extract<PendingResolution, { type: 'WARE_TRADE' }>; dispatch: InteractionPanelProps['dispatch'] }) {
  if (pr.step === 'SELECT_GIVE') {
    return <WareTypePicker prompt="Select ware type to give (all of that type)" onPick={(wt) => resolve(dispatch, { type: 'SELECT_WARE_TYPE', wareType: wt })} />;
  }
  return <WareTypePicker prompt="Select ware type to receive" onPick={(wt) => resolve(dispatch, { type: 'SELECT_WARE_TYPE', wareType: wt })} exclude={pr.giveType} />;
}

function AuctionPanel({ pr, dispatch }: { pr: Extract<PendingResolution, { type: 'AUCTION' }>; state: GameState; dispatch: InteractionPanelProps['dispatch'] }) {
  const isMyBid = pr.nextBidder === 0;
  if (!isMyBid) return <div style={{ color: 'var(--text-muted)' }}>Waiting for opponent to bid... (Current: {pr.currentBid}g)</div>;
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>
        Current bid: {pr.currentBid}g. Your turn to bid or pass.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="primary" onClick={() => resolve(dispatch, { type: 'AUCTION_BID', amount: pr.currentBid + 1 })}>
          Bid {pr.currentBid + 1}g
        </button>
        <button onClick={() => resolve(dispatch, { type: 'AUCTION_PASS' })}>Pass</button>
      </div>
    </div>
  );
}

function DeckPeekPanel({ pr, dispatch }: { pr: Extract<PendingResolution, { type: 'DECK_PEEK' }>; dispatch: InteractionPanelProps['dispatch'] }) {
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>
        Pick {pr.pickCount} card(s) from the revealed cards:
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {pr.revealedCards.map((cardId, i) => (
          <CardFace key={cardId} cardId={cardId} small onClick={() => resolve(dispatch, { type: 'DECK_PEEK_PICK', cardIndex: i })} />
        ))}
      </div>
    </div>
  );
}

function DiscardPickPanel({ pr, dispatch }: { pr: Extract<PendingResolution, { type: 'DISCARD_PICK' }>; dispatch: InteractionPanelProps['dispatch'] }) {
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Pick a card from the discard pile:</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {pr.eligibleCards.map((cardId) => (
          <CardFace key={cardId} cardId={cardId} small onClick={() => resolve(dispatch, { type: 'DISCARD_PICK', cardId })} />
        ))}
      </div>
    </div>
  );
}

function WareCashPanel({ state, pr, dispatch }: { state: GameState; pr: Extract<PendingResolution, { type: 'WARE_CASH_CONVERSION' }>; dispatch: InteractionPanelProps['dispatch'] }) {
  const [selectedWares, setSelectedWares] = useState<number[]>([]);
  const cp = state.currentPlayer;
  const player = state.players[cp];

  if (pr.step === 'SELECT_CARD') {
    const wareCards = player.hand.filter(id => getCard(id).type === 'ware');
    return (
      <div>
        <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Select a ware card from your hand:</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {wareCards.map((cardId) => (
            <CardFace key={cardId} cardId={cardId} small onClick={() => resolve(dispatch, { type: 'SELECT_CARD', cardId })} />
          ))}
        </div>
      </div>
    );
  }

  if (pr.step === 'SELECT_WARES') {
    const toggleSlot = (i: number) => {
      setSelectedWares(prev => prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 3 ? [...prev, i] : prev);
    };
    return (
      <div>
        <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>
          Select 3 wares to return ({selectedWares.length}/3):
        </div>
        <MarketDisplay market={player.market} onSlotClick={toggleSlot} selectedSlots={selectedWares} />
        <button className="primary" disabled={selectedWares.length !== 3} onClick={() => { resolve(dispatch, { type: 'SELECT_WARES', wareIndices: selectedWares }); setSelectedWares([]); }} style={{ marginTop: 8 }}>
          Confirm
        </button>
      </div>
    );
  }

  return <div style={{ color: 'var(--text-muted)' }}>Processing...</div>;
}

function WareSellBulkPanel({ state, pr, dispatch }: { state: GameState; pr: Extract<PendingResolution, { type: 'WARE_SELL_BULK' }>; dispatch: InteractionPanelProps['dispatch'] }) {
  const [selected, setSelected] = useState<number[]>([]);
  const cp = state.currentPlayer;
  const player = state.players[cp];

  const toggleSlot = (i: number) => {
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>
        Select wares to sell at {pr.pricePerWare}g each ({selected.length} selected = {selected.length * pr.pricePerWare}g):
      </div>
      <MarketDisplay market={player.market} onSlotClick={toggleSlot} selectedSlots={selected} />
      <button className="primary" disabled={selected.length === 0} onClick={() => { resolve(dispatch, { type: 'SELL_WARES', wareIndices: selected }); setSelected([]); }} style={{ marginTop: 8 }}>
        Sell ({selected.length * pr.pricePerWare}g)
      </button>
    </div>
  );
}

function WareReturnPanel({ state, dispatch }: { state: GameState; dispatch: InteractionPanelProps['dispatch'] }) {
  const cp = state.currentPlayer;
  const player = state.players[cp];
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Select a ware to return:</div>
      <MarketDisplay market={player.market} onSlotClick={(i) => resolve(dispatch, { type: 'RETURN_WARE', wareIndex: i })} />
    </div>
  );
}

function WareTheftSinglePanel({ state, dispatch }: { state: GameState; dispatch: InteractionPanelProps['dispatch'] }) {
  const cp = state.currentPlayer;
  const opponent: 0 | 1 = cp === 0 ? 1 : 0;
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Select a ware to steal from opponent:</div>
      <MarketDisplay market={state.players[opponent].market} onSlotClick={(i) => resolve(dispatch, { type: 'SELECT_WARE', wareIndex: i })} />
    </div>
  );
}

function WareTheftSwapPanel({ state, pr, dispatch }: { state: GameState; pr: Extract<PendingResolution, { type: 'WARE_THEFT_SWAP' }>; dispatch: InteractionPanelProps['dispatch'] }) {
  const cp = state.currentPlayer;
  const opponent: 0 | 1 = cp === 0 ? 1 : 0;

  if (pr.step === 'STEAL') {
    return (
      <div>
        <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Select a ware to steal from opponent:</div>
        <MarketDisplay market={state.players[opponent].market} onSlotClick={(i) => resolve(dispatch, { type: 'SELECT_WARE', wareIndex: i })} />
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Select a ware to give to opponent:</div>
      <MarketDisplay market={state.players[cp].market} onSlotClick={(i) => resolve(dispatch, { type: 'SELECT_WARE', wareIndex: i })} />
    </div>
  );
}

function UtilityTheftPanel({ state, dispatch }: { state: GameState; dispatch: InteractionPanelProps['dispatch'] }) {
  const cp = state.currentPlayer;
  const opponent: 0 | 1 = cp === 0 ? 1 : 0;
  const opUtils = state.players[opponent].utilities;
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Select opponent utility to steal:</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {opUtils.map((u, i) => (
          <CardFace key={u.cardId} cardId={u.cardId} small onClick={() => resolve(dispatch, { type: 'SELECT_UTILITY', utilityIndex: i })} />
        ))}
      </div>
    </div>
  );
}

function HandSwapPanel({ state, pr, dispatch }: { state: GameState; pr: Extract<PendingResolution, { type: 'HAND_SWAP' }>; dispatch: InteractionPanelProps['dispatch'] }) {
  const cp = state.currentPlayer;
  if (pr.step === 'TAKE') {
    return (
      <div>
        <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Select a card to take from opponent's hand:</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {pr.revealedHand.map((cardId) => (
            <CardFace key={cardId} cardId={cardId} small onClick={() => resolve(dispatch, { type: 'SELECT_CARD', cardId })} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Select a card to give to opponent:</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {state.players[cp].hand.map((cardId) => (
          <CardFace key={cardId} cardId={cardId} small onClick={() => resolve(dispatch, { type: 'SELECT_CARD', cardId })} />
        ))}
      </div>
    </div>
  );
}

function OpponentDiscardPanel({ state, pr, dispatch }: { state: GameState; pr: Extract<PendingResolution, { type: 'OPPONENT_DISCARD' }>; dispatch: InteractionPanelProps['dispatch'] }) {
  const [selected, setSelected] = useState<number[]>([]);
  const target = state.players[pr.targetPlayer];
  const discardCount = target.hand.length - pr.discardTo;

  if (pr.targetPlayer !== 0) {
    return <div style={{ color: 'var(--text-muted)' }}>Opponent is choosing cards to discard...</div>;
  }

  const toggleCard = (i: number) => {
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : prev.length < discardCount ? [...prev, i] : prev);
  };

  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>
        Select {discardCount} card(s) to discard ({selected.length}/{discardCount}):
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {target.hand.map((cardId, i) => (
          <CardFace key={cardId} cardId={cardId} small selected={selected.includes(i)} onClick={() => toggleCard(i)} />
        ))}
      </div>
      <button className="primary" disabled={selected.length !== discardCount} onClick={() => { resolve(dispatch, { type: 'OPPONENT_DISCARD_SELECTION', cardIndices: selected }); setSelected([]); }} style={{ marginTop: 8 }}>
        Confirm Discard
      </button>
    </div>
  );
}

function DraftPanel({ pr, dispatch }: { state: GameState; pr: Extract<PendingResolution, { type: 'DRAFT' }>; dispatch: InteractionPanelProps['dispatch'] }) {
  const isMyPick = pr.currentPicker === 0;

  if (!isMyPick) {
    return <div style={{ color: 'var(--text-muted)' }}>Waiting for opponent to pick...</div>;
  }

  if (pr.draftMode === 'wares') {
    return (
      <div>
        <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Draft a ware ({pr.availableWares.length} left):</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {pr.availableWares.map((wt, i) => (
            <button key={i} onClick={() => resolve(dispatch, { type: 'SELECT_WARE_TYPE', wareType: wt })} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <WareToken type={wt} /> {WARE_LABELS[wt]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const cards = pr.availableCards || [];
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Draft a {pr.draftMode === 'cards' ? 'card' : 'utility'} ({cards.length} left):</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {cards.map((cardId) => (
          <CardFace key={cardId} cardId={cardId} small onClick={() => resolve(dispatch, { type: 'SELECT_CARD', cardId })} />
        ))}
      </div>
    </div>
  );
}

function SuppliesDiscardPanel({ state, dispatch }: { state: GameState; dispatch: InteractionPanelProps['dispatch'] }) {
  const cp = state.currentPlayer;
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Select a card to discard:</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {state.players[cp].hand.map((cardId) => (
          <CardFace key={cardId} cardId={cardId} small onClick={() => resolve(dispatch, { type: 'SELECT_CARD', cardId })} />
        ))}
      </div>
    </div>
  );
}

function UtilityKeepPanel({ state, pr, dispatch }: { state: GameState; pr: Extract<PendingResolution, { type: 'UTILITY_KEEP' }>; dispatch: InteractionPanelProps['dispatch'] }) {
  const cp = state.currentPlayer;
  const responder = pr.step === 'ACTIVE_CHOOSE' ? cp : (cp === 0 ? 1 : 0);

  if (responder !== 0) {
    return <div style={{ color: 'var(--text-muted)' }}>Opponent choosing which utility to keep...</div>;
  }

  const utils = state.players[responder].utilities;
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Choose a utility to keep (others will be discarded):</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {utils.map((u, i) => (
          <CardFace key={u.cardId} cardId={u.cardId} small onClick={() => resolve(dispatch, { type: 'SELECT_UTILITY', utilityIndex: i })} />
        ))}
      </div>
    </div>
  );
}

function CrocodilePanel({ state, pr, dispatch }: { state: GameState; pr: Extract<PendingResolution, { type: 'CROCODILE_USE' }>; dispatch: InteractionPanelProps['dispatch'] }) {
  if (pr.step === 'SELECT_UTILITY') {
    const opUtils = state.players[pr.opponentPlayer].utilities;
    return (
      <div>
        <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Select opponent's utility to use and discard:</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {opUtils.map((u, i) => (
            <CardFace key={u.cardId} cardId={u.cardId} small onClick={() => resolve(dispatch, { type: 'SELECT_UTILITY', utilityIndex: i })} />
          ))}
        </div>
      </div>
    );
  }
  return <div style={{ color: 'var(--text-muted)' }}>Using opponent's utility...</div>;
}

function UtilityEffectPanel({ state, pr, dispatch }: { state: GameState; pr: Extract<PendingResolution, { type: 'UTILITY_EFFECT' }>; dispatch: InteractionPanelProps['dispatch'] }) {
  const [selectedCards, setSelectedCards] = useState<DeckCardId[]>([]);
  const cp = state.currentPlayer;
  const player = state.players[cp];

  if (pr.step === 'SELECT_CARD') {
    // For kettle: select 1-2 cards; for boat/weapons: select 1 card
    const maxCards = pr.utilityDesign === 'kettle' ? 2 : 1;
    const toggleCard = (cardId: DeckCardId) => {
      setSelectedCards(prev => prev.includes(cardId) ? prev.filter(c => c !== cardId) : prev.length < maxCards ? [...prev, cardId] : prev);
    };

    return (
      <div>
        <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>
          Select {maxCards === 1 ? 'a card' : '1-2 cards'} from your hand ({selectedCards.length} selected):
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {player.hand.map((cardId) => (
            <CardFace key={cardId} cardId={cardId} small selected={selectedCards.includes(cardId)} onClick={() => toggleCard(cardId)} />
          ))}
        </div>
        <button className="primary" disabled={selectedCards.length === 0} onClick={() => { resolve(dispatch, { type: 'SELECT_CARDS', cardIds: selectedCards }); setSelectedCards([]); }} style={{ marginTop: 8 }}>
          Confirm
        </button>
      </div>
    );
  }

  if (pr.step === 'SELECT_WARE_TYPE') {
    return <WareTypePicker prompt="Choose a ware type to receive" onPick={(wt) => resolve(dispatch, { type: 'SELECT_WARE_TYPE', wareType: wt })} />;
  }

  return <div style={{ color: 'var(--text-muted)' }}>Processing...</div>;
}

function DrawModifierPanel({ state, dispatch }: { state: GameState; dispatch: InteractionPanelProps['dispatch'] }) {
  const cp = state.currentPlayer;
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>
        Mask of Transformation: Select a card from your hand to trade for top of discard pile:
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {state.players[cp].hand.map((cardId) => (
          <CardFace key={cardId} cardId={cardId} small onClick={() => resolve(dispatch, { type: 'SELECT_CARD', cardId })} />
        ))}
      </div>
    </div>
  );
}
