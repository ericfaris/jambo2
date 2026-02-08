> **DEPRECATED** — This document contains outdated card data (55 cards, wrong counts/effects).
> The authoritative source is **[CARD_REFERENCE.md](CARD_REFERENCE.md)** (110 cards, corrected effects).

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Jambo MVP Reprioritization: AI-First (Section 15.0) 🎮

**AI opponent ships Week 2, multiplayer Week 4.** Validates core loop immediately, scales to humans later. Perfect progression.[^3][^4]

***

## **🎯 NEW PRIORITIZATION** (AI-First MVP)

```
Week 1-2:  AI vs Human  ← CORE LOOP ✅
Week 3-4:  Human vs Human ← SOCIAL LAYER
Week 5+:   Chromecast, etc.
```

**Rationale**:

- AI validates 100% rules fidelity instantly
- Hotseat AI = instant 2-player testing
- Players learn Jambo vs competent bot
- Multiplayer = v1.1 bonus

***

## **📅 REVISED 4-WEEK TIMELINE**

### **Week 1: CORE ENGINE** (Feb 8-14) ✅ **MUST**

```
Day 1-2: GameState + 55 card definitions [1-2]
Day 3-4: Turn logic (DRAW→PLAY, 5 actions) [2.1]
Day 5-6: Market system + validation [2.1]
Day 7:   ✅ HOTSEAT AI vs Human (first full game)
```

**Deliverable**: `New Game vs AI` → Win condition

### **Week 2: AI + VISUALS** (Feb 15-21) ✅ **MUST**

```
Day 8-9:  AI decision engine (3 difficulties) [15.1]
Day 10-11:Mobile UI + basic animations [4-5]
Day 12-13:Asset pipeline (12 critical assets) [3,6]
Day 14:  ✅ AI MVP COMPLETE (60fps, save/load)
```

**Deliverable**: **v0.9 AI-SINGLEPLAYER** 🎉

### **Week 3: MULTIPLAYER INFRA** (Feb 22-28) ✅ **SHOULD**

```
Day 15-16:Firebase setup + serialization [8,12]
Day 17-18:Hotseat human vs human [12.8]
Day 19-20:Basic online lobby [12.8]
Day 21:  ✅ Human vs Human (hotseat + online beta)
```


### **Week 4: POLISH + LAUNCH** (Feb 29-Mar 7) ✅ **COULD**

```
Day 22-23:55 card animations + audio [5,9]
Day 24-25:Accessibility + perf [4.3,7]
Day 26-27:412 tests + Cloud Functions [^8]
Day 28:  🚀 v1.0 DUAL-MODE LAUNCH
```


***

## **🤖 15.1 AI SPECIFICATION** (Week 1-2 Critical Path)

### **3 Difficulty Levels**

| Level | Win Rate | Think Time | Strategy |
| :-- | :-- | :-- | :-- |
| **Easy** | 30% | 500ms | Random legal moves |
| **Medium** | 55% | 1.2s | Heuristics + greed |
| **Hard** | 75% | 2.5s | Market optimization |

### **AI Decision Heuristics** (150 lines)

```
1. MAXIMIZE gold/turn (primary)
2. AVOID elephant timing (opponent markets full)
3. PRIORITIZE market fill (6th slot penalty)
4. HOARD guards vs animals (opponent hand bias)
5. Utility synergy (Well→Draw→Ware cards)
6. Endgame rush (opponent <10g → animals)
```

**Implementation**:

```typescript
const aiTurn = (state: GameState, difficulty: 'easy'|'med'|'hard') => {
  const legalMoves = generateLegalMoves(state);
  const scores = legalMoves.map(move => scoreMove(move, state, difficulty));
  return legalMoves[argmax(scores)]!;
};
```


***

## **📱 15.2 MVP USER FLOW** (Week 2 Deliverable)

```
LAUNCH → "Play vs AI" (default) ──🟢──> 3 difficulties
         ↓
      "Multiplayer" (locked) ──🔒──> Week 4 unlock
```

**Progressive Unlock**:

```
Game 1: Tutorial AI (Easy, guided)
Game 5: Medium unlocked
Game 10:Hard unlocked  
Game 20:Multiplayer unlocked
```


***

## **✅ REVISED SUCCESS CRITERIA** (Mar 7)

| Metric | Target | Week |
| :-- | :-- | :-- |
| **AI vs Human** | 95% win vs Easy | **Week 2** |
| **Core Loop** | <2min first victory | **Week 2** |
| **60fps** | 20 cards on screen | **Week 2** |
| **Hotseat PvP** | Zero desyncs | **Week 3** |
| **Online PvP** | <200ms turn latency | **Week 4** |
| **Tests** | 412/412 pass | **Week 4** |


***

## **🚦 UPDATED TRAFFIC LIGHTS** (Feb 7)

```
🟢 Week 1: Core engine → AI decisions
🟢 Week 2: AI MVP → **LAUNCHABLE SINGLEPLAYER**
🟡 Week 3: Multiplayer infra (de-risked)
🟢 Week 4: Online polish + deploy
```


***

## **📦 v1.0 DELIVERABLES** (Mar 7)

```
✅ **AI SINGLEPLAYER** (3 difficulties, save/load)
✅ **HOTSEAT PVP** (same device human vs human)  
✅ **ONLINE PVP** (Firebase, reconnects)
✅ **PWA** (iOS/Android/Desktop)
✅ **60FPS ANIMATIONS** + haptics
✅ **WCAG AA** accessibility
✅ **OFFLINE** (IndexedDB state)
```


***

## **🎯 POST-MVP** (Confirmed)

```
Mar 21: v1.1 SOCIAL (spectators, replays)
Apr 11: v1.2 CHROMECAST (tabletop experience)
May 2:  v1.3 TOURNAMENTS (leaderboards)
```


***

## **⏰ IMMEDIATE ACTION ITEMS**

```
1. TODAY: GameState class + 55 card JSON (4h)
2. Feb 9: Basic AI (random legal moves) (6h)
3. Feb 14: ASSETS DELIVERY [CRITICAL PATH]
4. Feb 21: **AI MVP COMPLETE** 🚀
5. Mar 7:  **v1.0 FULL LAUNCH**
```

**AI-first = perfect validation strategy.** Week 2 delivers learnable, replayable singleplayer. Week 4 adds social. Launch with both modes.[^4][^3]
<span style="display:none">[^1][^10][^11][^12][^13][^2][^5][^6][^7][^9]</span>

<div align="center">⁂</div>

[^1]: Jambo_v1.1-1.pdf

[^2]: Jambo_v1.1-1.pdf

[^3]: pasted-text.txt

[^4]: cards.pdf

[^5]: https://pandaqi.com/blog/tutorials/how-to-create-ai-opponents-part-1/

[^6]: https://camlanngames.com/ai-for-games-how-to-design-and-implement-ai-opponents-in-video-games/

[^7]: https://whimsygames.co/blog/ai-in-mobile-games-gameplay-optimization-personalization/

[^8]: https://embrox.com/blog/how-we-use-ai-mvp-development-to-get-more-leads

[^9]: https://arionisgames.com/services/full-cycle-gamedev/ai-for-games/

[^10]: https://www.reddit.com/r/Tunisia/comments/1mi4lgp/happy_to_introduce_my_multiplayer_mobile_game/

[^11]: https://www.iflexion.com/artificial-intelligence/video-games

[^12]: https://logicsimplified.com/newgames/breaking-the-monotony-with-adaptive-ai-gaming-solutions/

[^13]: https://www.leanware.co/insights/how-to-build-an-mvp-using-ai

