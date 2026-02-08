> **DEPRECATED** — This document contains outdated card data (55 cards, wrong counts/effects).
> The authoritative source is **[CARD_REFERENCE.md](CARD_REFERENCE.md)** (110 cards, corrected effects).

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Jambo AI Decision Engine (Section 15.3) 🧠

**Heuristic decision tree** for all 55 cards. Scores every legal move, picks highest value. **150 lines**, **<2.5s/turn**. Week 2 MVP critical path.[^4]

***

## **🎯 CORE ALGORITHM** (Monte Carlo + Heuristics)

```
1. Generate all LEGAL MOVES (hand + utilities)
2. Score each: immediateGold + futurePotential - risk
3. Simulate 3 turns ahead (pruned)
4. Pick highest score
5. Execute with 100-500ms think time
```

**Implementation** (Week 1 Day 7):

```typescript
const aiTurn = (state: GameState, diff: Difficulty): Action[] => {
  const moves = generateLegalMoves(state.aiPlayer);
  const bestMoves = moves
    .map(move => ({ move, score: evaluateMove(move, state, diff) }))
    .sort((a,b) => b.score - a.score)
    .slice(0, 3);  // Top 3 candidates
  
  return simulateBestSequence(bestMoves, state, diff);
};
```


***

## **📊 SCORING SYSTEM** (12 Heuristics, 0-100)

### **1. PRIMARY: Gold Efficiency** (40pts)

| Card Type | Score Formula |
| :-- | :-- |
| **Ware Sell** | `(sellPrice - buyPrice) * waresAvailable` |
| **Weapons** | `2 gold / 1 action = +25` |
| **Portuguese** | `2g per ware * marketSize` |
| **Small Stand** | `+15 if <3 stands` |

### **2. MARKET HEALTH** (25pts)

```
+20: Empty slots available (buy opportunity)
-15: 6th slot filled (-2g penalty imminent)  
+10: Balanced wares (sell variety)
-30: Market stalled (no sell cards)
```


### **3. OPPONENT PRESSURE** (20pts)

```
+25: Elephant when opp has 8+ wares
+18: Parrot when opp has rare wares  
+15: Crocodile vs opp 3+ utils
-10: Animal without Guard backup
```


### **4. HAND HEALTH** (15pts)

```
+12: Draw enablers (Well, Kettle, Drums)
-8:  Too many wares in hand
+10: Utility synergy (Boat + Leopard Statue)
```


***

## **🎴 CARD-SPECIFIC DECISIONS** (Top Priority)

| Card | Easy AI | Medium AI | Hard AI | Rationale |
| :-- | :-- | :-- | :-- | :-- |
| **3Tea** | Always | Always | Always | +6g profit |
| **Elephant** | Random | Opp>6 wares | Opp>6 AND you have Guards | Market reset |
| **Well** | Always | Always | Always | Guaranteed draw |
| **Guard** | Hold | Hold | Play vs opp animals | Reaction only |
| **Throne** | Random | 1:1 trades | Steal expensive wares | Market theft |
| **Scale** | Never | Draw phase | Never (give opp card) | Bad deal |

**Auction Cards** (Traveling Merchant, Arabian):

```
Medium+: Bid aggressively if high-value wares
Hard:   Perfect Nash equilibrium bidding
```


***

## **🔄 TURN STRUCTURE** (Phase Optimization)

### **DRAW PHASE** (0-5 cards)

```
Easy:   Draw 1-2 (greedy)
Medium: Draw until Ware/Utility (max 3)
Hard:   Probabalistic: P(wareCard) > 0.4
```


### **PLAY PHASE** (5 actions max)

```
1. Play highest scoring card
2. Repeat until actions exhausted OR no good plays
3. Fill with draws if 2+ actions left (+1g bonus)
```

**Endgame** (opp <10g): **Force animals + rush**.

***

## **🎮 DIFFICULTY TUNING** (3 Levels)

| Parameter | Easy (30% WR) | Medium (55%) | Hard (75%) |
| :-- | :-- | :-- | :-- |
| **Lookahead** | 0 turns | 1 turn | **3 turns** |
| **Heuristic Weights** | Basic | Balanced | **Optimized** |
| **Think Time** | **100ms** | 800ms | **2.5s** |
| **Mistake %** | 40% suboptimal | 15% | **0%** |
| **Endgame Aggro** | None | Medium | **Maximum** |


***

## **🧪 SIMULATION ENGINE** (Hard AI Only)

```
function simulateMove(move: Action, state: GameState, depth: number): number {
  const nextState = applyMove(state, move);
  if (depth === 0) return evaluateBoard(nextState);
  
  const oppMoves = generateLegalMoves(nextState.opponent);
  const avgOppScore = oppMoves.reduce((sum, m) => 
    sum + simulateMove(m, nextState, depth-1), 0
  ) / oppMoves.length;
  
  return evaluateBoard(nextState) - avgOppScore * 0.7;
}
```

**Pruning**: Skip moves scoring < 20pts.

***

## **⚙️ IMPLEMENTATION** (~150 lines)

### **1. Card Evaluator** (80 lines)

```typescript
const evaluateWareCard = (card: WareCard, state: GameState): number => {
  const canBuy = hasSpaceForWares(state.market, card.wares);
  const profitPotential = card.sellPrice * wareSellValue(card.wares);
  return canBuy ? profitPotential - card.buyPrice : -50;
};

const evaluateElephant = (state: GameState): number => {
  const oppWares = countWares(state.opponent.market);
  return oppWares > 6 ? 35 : oppWares > 3 ? 15 : -10;
};
```


### **2. Difficulty Profiles**

```typescript
const DIFFICULTY = {
  easy:   { lookahead: 0,  mistakeRate: 0.4, weights: {gold:1.0} },
  medium: { lookahead: 1,  mistakeRate: 0.15, weights: {gold:1.2, market:0.8} },
  hard:   { lookahead: 3,  mistakeRate: 0, weights: {gold:1.5, market:1.2, opp:1.0} }
};
```


***

## **📈 PERFORMANCE TARGETS**

| Difficulty | Think Time | Branching Factor | Win Rate |
| :-- | :-- | :-- | :-- |
| **Easy** | **100ms** | 5 moves | 30% |
| **Medium** | **800ms** | 12 moves | 55% |
| **Hard** | **2.5s** | **25 moves** | 75% |

**Mobile**: `<150ms` total turn time (including animations).

***

## **🧪 TESTING PLAN** (Week 2)

```
1000 games per difficulty vs rulebook
Easy:   Players win 65-75%  
Medium: Players win 40-50%
Hard:   Players win 20-30%
All:    100% legal moves, no crashes
```


***

## **✅ AI MVP READY** (Feb 21)

```
✅ 55 cards fully implemented
✅ 3 difficulty levels tuned
✅ <2.5s turns (Hard mode)
✅ Perfect rules fidelity
✅ Human-like mistakes (Easy/Medium)
✅ Endgame aggression (Hard)
✅ Mobile optimized (<150ms total)
```

**Week 2 delivers compelling singleplayer.** AI feels smart but beatable. Multiplayer unlocks Week 4.[^1][^4]
<span style="display:none">[^10][^11][^12][^2][^3][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: pasted-text.txt

[^2]: Jambo_v1.1-1.pdf

[^3]: Jambo_v1.1-1.pdf

[^4]: cards.pdf

[^5]: https://www.whisthub.com/blog/how-to-write-an-ai-for-a-card-game

[^6]: https://www.reddit.com/r/unrealengine/comments/185dx0p/ways_to_create_ai_for_a_card_game/

[^7]: https://bennycheung.github.io/game-architecture-card-ai-3

[^8]: https://accessibleai.dev/post/teaching_ai_to_lie/

[^9]: https://templates.roboflow.com/playing-card-detection

[^10]: https://devblogs.microsoft.com/all-things-azure/turning-ai-prompts-into-playing-cards-a-platform-engineering-experiment/

[^11]: https://www.figma.com/solutions/ai-card-game-generator/

[^12]: https://www.thoughtworks.com/content/dam/thoughtworks/documents/blog/machine-learning-and-ai/tw_blog_singularity_card_game.pdf

