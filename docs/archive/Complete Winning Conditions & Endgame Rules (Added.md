> **DEPRECATED** — This document contains outdated card data (55 cards, wrong counts/effects).
> The authoritative source is **[CARD_REFERENCE.md](CARD_REFERENCE.md)** (110 cards, corrected effects).

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Complete Winning Conditions \& Endgame Rules (Added to Requirements v1.4)

**Section 2: Game Flow \& Endgame** - **Detailed state machine** for precise implementation.[^1][^5]

***

## **🎯 2.1 PRIMARY WIN CONDITION**

```
**WINNER = Player with MOST GOLD after FINAL TURN**

Trigger: Player A ends turn with ≥60 gold
→ Opponent (Player B) gets 1 FINAL TURN (5 actions)
→ Compare FINAL gold totals
  → Player B ≥ Player A → Player B wins
  → Player A > Player B → Player A wins
```


### **🏗️ State Machine Implementation**

```json
{
  "gameState": {
    "endgameActive": false,
    "endgameTriggerPlayer": null,
    "endgameFinalTurn": false,
    "playerGold": {
      "player1": 62,    // Triggered endgame
      "player2": 58
    }
  },
  "turn": {
    "activePlayer": "player2",  // Final turn
    "endgameFinalTurn": true,   // Special rules apply
    "actionsLeft": 5
  }
}
```


***

## **🔄 2.2 ENDGAME FLOW** (MANDATORY sequence)

```
TURN N: Player1 ends turn
↓ Check: player1.gold >= 60?
↓ YES → SET endgameActive = true
↓ SET endgameTriggerPlayer = "player1"
↓ Player2 takes FINAL TURN (5 actions, NO endgame check)
↓ Player2 turn ends
↓ EXECUTE FINAL SCORING:
  if (player2.gold >= player1.gold) {
    winner = "player2"
  } else {
    winner = "player1"  // Trigger player
  }
↓ SHOW: "Player1: 62g vs Player2: 59g → Player1 Wins!"
```


### **⚠️ 2.2.1 CRITICAL EDGE CASES**

| Scenario | Trigger Player | Final Turn Player | Outcome |
| :-- | :-- | :-- | :-- |
| **P1:65 → P2:68** | P1 (65g) | P2 final turn | **P2 wins** (68≥65) |
| **P1:62 → P2:61** | P1 (62g) | P2 final turn | **P1 wins** (62>61) |
| **P1:60 → P2:60** | P1 (60g) | P2 final turn | **P2 wins** (60=60) |
| **P1:75 → P2:45** | P1 (75g) | P2 final turn | **P1 wins** (75>45) |

**TIE = Final turn player wins** (≥ includes equality)

***

## **💰 2.3 SCORING SOURCES** (All gold tracking)

| Source | Amount | Implementation |
| :-- | :-- | :-- |
| **Ware Sell Cards** | Bottom-right value | `wareCard.sellValue` |
| **Portuguese** | 2g per ware sold | `waresReturned * 2` |
| **Weapons** | +2g | Fixed |
| **Action Bonus** | +1g | `actionsLeft >= 2` at turn end |
| **Small Stand 1st** | -6g | `!firstStandBuilt` |
| **Small Stand** | -3g | `firstStandBuilt` |
| **6th Slot Penalty** | -2g | `largeStand.occupied == 6` |
| **Leopard Statue** | -2g | Fixed |

### **📊 2.3.1 Gold State Model**

```json
{
  "bank": {
    "totalGold": 52,
    "player1": 62,
    "player2": 41
  },
  "endgameCheck": {
    "triggered": true,
    "triggerPlayer": "player1",
    "triggerGold": 62,
    "finalTurnComplete": false
  }
}
```


***

## **🛡️ 2.4 ENDGAME DURING INTERACTIONS**

```
❌ TRIGGERS ENDGAME DURING:
  - Tribal Elder (opp still selecting)
  - Auction (bidding in progress)
  - Elephant draft (mid-pick)

✅ ENDGAME PAUSED until:
  - pendingResolution completes
  - THEN opponent final turn
```

**Implementation**: `endgameActive` flag defers until `pendingResolution == null`

***

## **🎮 2.5 UI REQUIREMENTS**

```
**Normal Turn End (65g):**
[⚠️ GAME ENDING SOON!]
Player1: 65g → Player2 final turn → HIGHEST GOLD WINS

**During Final Turn:**
Player2 Final Turn | Actions: 5/5 | P1:65g | P2:58g
[No endgame check this turn]

**Final Results:**
🏆 PLAYER1 WINS! 65g > 58g
[New Game] [Stats]
```


***

## **🤖 2.6 AI STRATEGY** (Endgame Phase)

```typescript
endgameAI(player, opponentGold): Strategy {
  if (player.gold >= 60 && !endgameFinalTurn) {
    // Trigger endgame if can't be caught
    return maximizeGold();
  }
  if (endgameFinalTurn) {
    // Desperate final turn - all-in
    return ultraAggressive();
  }
}
```


***

## **✅ 2.7 VALIDATION RULES** (Engine MUST enforce)

- ✅ **End turn ONLY** (never mid-action)
- ✅ **Opponent ALWAYS final turn** (even if 0g)
- ✅ **No recursive triggers** (final turn ignores ≥60)
- ✅ **≥ comparison** (ties go to final turn player)
- ✅ **Atomic state** (no interruptions during final turn)
- ✅ **Gold includes ALL sources** (no ware conversion)

***

## **📋 Updated Requirements Section 2**

```
2.1 WIN CONDITION: Most gold after final turn
2.2 TRIGGER: ≥60g at own turn END → opponent 5-action turn
2.3 SCORING: Track ALL gold sources precisely
2.4 STATE: endgameActive, endgameTriggerPlayer, endgameFinalTurn
2.5 UI: Clear "final turn" + "highest gold wins" messaging
```

**Now PRODUCTION-READY endgame.** Handles all edge cases, races, and interaction interruptions.[^5][^1]
<span style="display:none">[^10][^11][^12][^13][^2][^3][^4][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: Jambo_v1.1-1.pdf

[^2]: Jambo_v1.1-1.pdf

[^3]: pasted-text.txt

[^4]: cards.pdf

[^5]: https://www.orderofgamers.com/downloads/Jambo_v1.1.pdf

[^6]: https://www.ultraboardgames.com/jambo/game-rules.php

[^7]: https://cdn.1j1ju.com/medias/18/cb/31-jambo-rulebook.pdf

[^8]: https://www.pagat.com/invented/jambo.html

[^9]: https://www.nobleknight.com/P/2147345850/Jambo

[^10]: https://meadowparty.com/blog/2010/11/15/jambo-board-game/

[^11]: https://www.reddit.com/r/boardgames/comments/2ov9i2/game_of_the_week_jambo/

[^12]: https://www.play-board-games.com/jambo-review/

[^13]: https://www.dicetower.com/board-game/12002

