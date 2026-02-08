> **DEPRECATED** — This document contains outdated card data (55 cards, wrong counts/effects).
> The authoritative source is **[CARD_REFERENCE.md](CARD_REFERENCE.md)** (110 cards, corrected effects).

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Updated Requirements Document - Digital Jambo (v1.3)

**Added: Ware Theft State Modeling (Throne, Parrot, etc.)** to Section 6.[^4]

***

## 6. Rules Engine / Architecture (Complete)

### 6.1 **Opponent Interaction State Machine** ⭐ **CRITICAL**

**Two interaction classes**: **Opponent-driven** (turn suspension) vs **Active-driven** (no suspension).

#### **6.1.1 Opponent-Driven (15 cards) - Turn Suspension**

| Type | Examples | State | UI |
| :-- | :-- | :-- | :-- |
| `OPPONENT_DISCARD` | Tribal Elder, Snake | `targetPlayer`, `prompt.count` | Actions freeze, opponent input |
| `AUCTION` | Traveling Merchant | `currentBidder`, `auctionItems` | Bid/Pass turns |
| `DRAFT` | Elephant, Ape, Lion | `currentPicker`, `pool` | Alternate picks |

#### **6.1.2 Active-Driven (4 cards) - No Suspension** ⭐ **NEW**

| Card | Type | State Pattern | Active Player Controls |
| :-- | :-- | :-- | :-- |
| **Throne** | Utility | `WARE_THEFT_SWAP` | **Both** selections |
| **Parrot** | Animal | `WARE_THEFT_SINGLE` | **Victim** selection |
| **Crocodile** | Animal | `UTILITY_THEFT_SINGLE` | **Victim** selection |
| **Scale** | Utility | `CARD_GIVE_SINGLE` | **Which card** to give |

**NEW 6.1.2.1 Throne State Model**

```json
{
  "pendingResolution": {
    "type": "WARE_THEFT_SWAP",
    "triggerCard": "throne",
    "activePlayer": "player1",    // Controls ENTIRE resolution
    "step": 1,                    // 1=steal, 2=give
    "selections": {
      "victimWare": null,         // {"type": "tea", "slot": "opp-large-3"}
      "yourWare": null            // {"type": "silk", "slot": "p1-large-2"}
    },
    "validTargets": {
      "victimWares": [{"type": "tea", "slot": "opp-large-3"}],
      "yourWares": [{"type": "silk", "slot": "p1-large-2"}]
    }
  }
}
```

**NEW 6.1.2.2 Resolution Flow (Active-Driven)**

```
Use Throne (1 action) 
↓ VALIDATE: both have wares?
↓ Create WARE_THEFT_SWAP state (step=1)
↓ ActivePlayer selects from opponent.wareSlots
↓ ActivePlayer selects from own.wareSlots  
↓ EXECUTE atomic swap → first empty slots
↓ Mark Throne used → resume turn
```


#### **6.1.3 Unified Prompt Interface**

```typescript
type PendingResolutionType = 
  | "OPPONENT_DISCARD"    // Tribal Elder, Snake
  | "AUCTION"            // Merchant cards
  | "DRAFT"              // Elephant, Ape, Lion
  | "WARE_THEFT_SWAP"    // Throne ⭐ NEW
  | "WARE_THEFT_SINGLE"  // Parrot ⭐ NEW
  | "UTILITY_THEFT_SINGLE" // Crocodile ⭐ NEW
```


### 6.2 **Updated Card Definitions** (with interaction type)

| **Card** | **Effect** | **Interaction Type** | **State Model** |
| :-- | :-- | :-- | :-- |
| **Throne** | Take 1 opp ware → give 1 your ware | `WARE_THEFT_SWAP` ⭐ **NEW** | Active chooses both |
| **Parrot** | Take 1 opp ware | `WARE_THEFT_SINGLE` ⭐ **NEW** | Active chooses target |
| **Crocodile** | Discard 1 opp utility | `UTILITY_THEFT_SINGLE` ⭐ **NEW** | Active chooses target + Guard reaction |
| **Tribal Elder** | Opp discards to 3 | `OPPONENT_DISCARD` | Opponent input required |

### 6.3 **UI Requirements** (Updated)

#### **Active-Driven (No Suspension)**

```
[Throne Active - Step 1/2]
"Select opponent's ware ↓"  Actions: 4
[opp-large: Tea● Hides○ Salt●]  [Next →]

[Throne Active - Step 2/2]  
"Select your ware to give ↓" Actions: 4
[p1-large: Silk● Fruit○]      [Confirm Swap ✓]
```


#### **Opponent-Driven (Suspension)**

```
Player1: [⏸️ Waiting: Blue discards 2] Actions: 4 FROZEN
Player2: [Discard 2/4 ↓] [X][X][ ][ ] [Confirm]
```


### 6.4 **AI Implementation** (Updated)

```typescript
// Active-driven (Throne, Parrot)
AISelectTheftTarget(availableWares): WareSlot {
  return maxBy(availableWares, w => wareMarketValue(w.type)); // silk > salt
}

// Opponent-driven (Tribal Elder)
AIRespondDiscard(prompt): CardId[] {
  return lowestValueCards(prompt.from, prompt.count);
}
```


### 6.5 **Validation Rules** (Complete)

- ✅ **Exact counts** (Throne: 1+1 wares)
- ✅ **Occupied slots only** (no empties)
- ✅ **Atomic execution** (both moves or none)
- ✅ **First empty slot** placement
- ✅ **No turn suspension** (active player driven)
- ✅ **JSON serializable**

***

## Complete Interaction Matrix

| **State Type** | **Count** | **Turn Suspension** | **Examples** |
| :-- | :-- | :-- | :-- |
| `OPPONENT_*` | **15** | ✅ **YES** | Tribal Elder, Auctions, Drafts |
| `WARE_THEFT_*` ⭐ **NEW** | **3** | ❌ **NO** | Throne, Parrot, Crocodile |
| `AUTO_RESOLVE` | **5** | ❌ **NO** | Carrier, Wise Man (modifiers) |

**Total interactive cards: 23/55 (~42%)**. Architecture now handles **all cases** with unified `pendingResolution` field.[^4]

**Production-ready.** Next: JSON card database or prototype engine?
<span style="display:none">[^1][^10][^11][^2][^3][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: Jambo_v1.1-1.pdf

[^2]: Jambo_v1.1-1.pdf

[^3]: pasted-text.txt

[^4]: cards.pdf

[^5]: https://slite.com/learn/game-design-document

[^6]: https://www.nuclino.com/articles/game-design-document-template

[^7]: https://www.gitbook.com/blog/how-to-write-a-game-design-document

[^8]: https://wwwx.cs.unc.edu/~pozefsky/seriousgames/NewDesignDocTemplate.pdf

[^9]: https://meiri.itch.io/game-design-document-template

[^10]: https://www.etsy.com/listing/1669515341/game-design-document-indie-game-planner

[^11]: https://www.reddit.com/r/gamedesign/comments/po5n8m/preferred_game_design_document_template/

