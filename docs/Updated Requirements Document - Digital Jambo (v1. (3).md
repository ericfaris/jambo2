> **DEPRECATED** — This document contains outdated card data (55 cards, wrong counts/effects).
> The authoritative source is **[CARD_REFERENCE.md](CARD_REFERENCE.md)** (110 cards, corrected effects).

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Updated Requirements Document - Digital Jambo (v1.7) **AI COMPLETE**

**Added: Section 4.1 Opponent AI Architecture** - Production-ready tiered AI system.[^4]

***

## **4.1 OPPONENT AI ARCHITECTURE** ⭐ **PRODUCTION READY**

### **🎮 4.1.0 SYSTEM OVERVIEW**

```
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Game Engine       │◄──►│  AI Decision     │◄──►│   Card Specs    │
│ (Immutable State)   │    │     Pipeline     │    │   (JSON v1.6)   │
└──────────┬──────────┘    └──────┬───────────┘    └──────┬──────────┘
           │                       │                       │
           ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Player State     │    │ 4 Difficulty     │    │ Heuristic Table  │
│ (Partial Info)   │    │  Personalities   │    │  (15 State Models)│
└──────────────────┘    └──────────────────┘    └──────────────────┘
```


***

## **🧠 4.1.1 CORE AI ENGINE** (MANDATORY Implementation)

### **GameStateScore Interface**

```typescript
interface GameStateScore {
  goldLead: number;           // myGold - oppGold
  endgameRisk: number;        // Distance to 60g trigger (0-1)
  wareProfit: number;         // unrealized market value
  actionEfficiency: number;   // gold/actions ratio
  disruptionPotential: number;// opp utility denial value
  total: number;              // Weighted sum
}
```


### **Difficulty Weight Matrix** (Exact values)

| Difficulty | Gold | Endgame | Wares | Actions | Disruption |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **Easy** | 1.0 | 0.0 | 0.2 | 0.5 | 0.1 |
| **Normal** | 0.8 | 0.4 | 0.6 | 0.8 | 0.3 |
| **Hard** | 0.6 | 0.9 | 1.0 | 1.0 | 0.7 |
| **Expert** | 0.5 | 1.0 | 1.0 | 1.0 | 1.0 |


***

## **🎯 4.1.2 DECISION PIPELINE** (Per Turn - 50ms max)

```
STEP 1: EVALUATE (5ms)
  scoreCurrentState() → baselineScore

STEP 2: SIMULATE (30ms) 
  generateActions(3-ply) → [50 action paths]
  
STEP 3: FORECAST (10ms)
  for each path: expectedGold × (1-risk)

STEP 4: SELECT (5ms)
  max(score × personalityBias) → bestAction

STEP 5: EXECUTE (cached)
  resolveCardInteraction(bestAction)
```

**Monte Carlo Tree Search** (3-ply, 50 simulations):

```
Root ─┬─ Action1 (Shaman) [EV: +5.2, Risk: 0.2]
      ├─ Action2 (Elephant) [EV: +3.1, Risk: 0.8] 
      └─ Action3 (Draw) [EV: +2.1, Risk: 0.1]
SELECT: Action1 (5.2 × 0.8 = 4.16)
```


***

## **🤖 4.1.3 PERSONALITY SYSTEM** (4 Variants)

### **AIPersonalityConfig Interface**

```typescript
interface AIPersonalityConfig {
  name: "Cautious" | "Trader" | "Raider" | "Expert";
  drawBias: number;           // 0.2-0.8 (draw vs play)
  aggression: number;         // 0.1-0.9 (animal play chance)
  tradeThreshold: number;     // Min profit for Shaman (g)
  endgameTarget: number;      // Trigger gold (55-62)
}
```

| Personality | Draw | Aggression | Trade | Endgame | Playstyle |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **Cautious** | 0.8 | 0.1 | 3g | 55g | Safe builder |
| **Trader** | 0.5 | 0.2 | **1g** | 58g | Economy focus |
| **Raider** | 0.3 | **0.8** | 2g | 60g | Disruptive |
| **Expert** | 0.4 | 0.6 | 1g | **60g** | Perfect |


***

## **⚙️ 4.1.4 STATE MODELS** (15 Handlers - v1.6 Integration)

```typescript
const AI_RESOLVERS = {
  "WARE_CASH_CONVERSION": (state) => maxSell3Ware(state.hand, state.market),
  "BINARY_CHOICE": (state) => waresValue(state.market) > 2.5 ? "WARES" : "CARDS",
  "DISCARD_PICK": (state) => maxUtilityValue(state.discardPile),
  "WARE_SELECT_MULTIPLE": (state) => maxWareValueType(state.supply),
  "DECK_PEEK": (state) => maxCardValue(state.top5Deck),
  "WARE_SELL_BULK": (state) => unsellableWares(state.market),
  // ... all 15 from Section 3.7
};
```


***

## **🧮 4.1.5 PARTIAL INFORMATION MODELING**

```typescript
interface AIStateView {
  myGold: number;
  oppGold: number;                    // Observed
  myMarket: WareCount[];              // Full access
  oppMarketVisible: WareCount[];      // Only filled slots
  oppMarketEst: WareProbabilities;    // Hidden slot estimates
  myHandValue: number;                // Exact
  oppHandEst: number;                 // avgHandValue + observed
  deckProbabilities: CardTypeProb[];  // Markov chain
}
```

**Hidden Info Estimation**:

```
oppMarketHidden = totalSlots - visibleWares
oppHandValue = observedDiscards + 2.1 * handSize  
deckProbs = markovChain(cardHistory, 20)
```


***

## **🎮 4.1.6 PHASE-BASED STRATEGY** (Gold Thresholds)

| Phase | Gold Range | Primary | Secondary | AI Bias |
| :-- | :-- | :-- | :-- | :-- |
| **Early** | 0-20g | Utilities (3 slots) | Cheap wares | DrawHeavy |
| **Mid** | 21-45g | **Trade Cycle** | Small stands | TradeHeavy |
| **Late** | 46-59g | 60g positioning | Portuguese | EndgameHeavy |
| **Final** | 60g+ | Max final turn | Block opp | AggressionMax |


***

## **📈 4.1.7 PERFORMANCE SPECIFICATIONS**

| Difficulty | Win Rate | Gold/Turn | Latency | Simulations |
| :-- | :-- | :-- | :-- | :-- |
| **Easy** | 35% | 1.8g | **20ms** | 10 |
| **Normal** | 50% | 2.4g | **50ms** | 50 |
| **Hard** | 65% | 3.1g | 100ms | 150 |
| **Expert** | **80%** | **3.8g** | 200ms | **300** |


***

## **🔬 4.1.8 ADAPTIVE LEARNING** (Player Profiling)

```typescript
interface PlayerProfile {
  avgGoldPerTurn: number;
  preferredCards: CardTypeCount;
  riskTolerance: number;  // 0-1
  reactionTime: number;   // ms
}

AIAdaptation(playerProfile): void {
  if (playerProfile.avgGoldPerTurn > ai.avg) {
    this.aggression += 0.1;
    this.drawBias -= 0.1;
  }
}
```


***

## **🏗️ 4.1.9 IMPLEMENTATION REQUIREMENTS**

```
✅ TECH STACK:
  - TypeScript + immutable.js (state)
  - Custom MCTS (no ML deps)
  - LRU-cache (positions)
  - JSON card specs (v1.6)

✅ ARCHITECTURE:
  - Immutable state (thread safe)
  - Modular heuristics (tunable)
  - Personality variants (4x replayability)
  - Phase awareness (strategic depth)

✅ INTEGRATION:
  - Hooks into GameEngine.pendingResolution
  - Full 55-card coverage (v1.6)
  - Partial info modeling
  - Real-time performance (<200ms)
```


***

## **✅ REQUIREMENTS CHECKLIST** (v1.7 Status)

```
✅ 2.0 Game Flow: Endgame + Economy
✅ 3.7 Cards: 55/55 complete specs
✅ 4.1 AI: 4 difficulties + personalities
✅ 4.2 UI: Card interaction templates
✅ 4.3 State: 15 interaction models
```

**Digital Jambo v1.7 COMPLETE** - Full production specification. Ready for JSON export → prototype → implementation.[^4]
<span style="display:none">[^1][^10][^11][^12][^2][^3][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: pasted-text.txt

[^2]: Jambo_v1.1-1.pdf

[^3]: Jambo_v1.1-1.pdf

[^4]: cards.pdf

[^5]: https://www.oreateai.com/blog/a-comprehensive-guide-to-the-full-process-of-developing-board-games-and-technical-implementation/38a036ae26634cbeaa4cd0ae7bb28a05

[^6]: https://xebia.com/blog/writing-board-game-ai-bots-the-good-the-bad-and-the-ugly/

[^7]: https://www.umu.com/ask/q11122301573854320511

[^8]: https://sealos.io/blog/the-ultimate-guide-to-making-ai-games

[^9]: https://www.reddit.com/r/compsci/comments/dak9np/where_can_i_learn_to_build_ai_to_play_board_games/

[^10]: https://tabletop-creator.com/ai-in-game-design-its-place-in-board-games/

[^11]: https://www.facebook.com/groups/christianboardgamers/posts/1363065891376075/

[^12]: https://vocal.media/gamers/how-to-develop-a-digital-board-game-step-by-step-guide

