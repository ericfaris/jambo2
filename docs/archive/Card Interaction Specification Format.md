> **DEPRECATED** — This document references 55 cards. The correct total is **110 cards** (51 unique designs).
> See **[CARD_REFERENCE.md](CARD_REFERENCE.md)** for authoritative card data.

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Card Interaction Specification Format

**Standardized format for ALL 55 Jambo cards** in requirements. Each card gets **structured interaction template** for unambiguous engine implementation.[^2]

***

### **📋 Card Interaction Template** (MANDATORY for all cards)

```
CARD: [Name]
TYPE: [Utility/People/Animal/Ware/Stand]
PLAY COST: [1 action | 0 | special]
INTERACTION TYPE: [NONE | ACTIVE_SELECT | OPPONENT_SELECT | AUCTION | DRAFT | REACTION]
STATE MODEL: [pendingResolution type]
FLOW: [step-by-step numbered sequence]
VALIDATION: [pre-conditions]
UI PROMPTS: [exact player prompts]
AI HEURISTIC: [selection logic]
```


### **🎨 Example: Complete Card Specifications**

#### **CARD: Throne**[^2]

```
TYPE: Utility
PLAY COST: 1 action (use)
INTERACTION TYPE: ACTIVE_SELECT
STATE MODEL: WARE_THEFT_SWAP
FLOW:
  1. Validate: both players have ≥1 ware
  2. Active selects 1 from opponent.wareSlots (occupied)
  3. Active selects 1 from own.wareSlots (occupied)  
  4. Atomic swap → first empty slots each market
  5. Flip Throne face-down (used)
VALIDATION: 
  - opponent.wareSlots.occupied >= 1
  - player.wareSlots.occupied >= 1
UI PROMPTS:
  - Step 1: "Select opponent's ware ↓" [opp slots]
  - Step 2: "Select your ware to give ↓" [own slots]
  - Confirm: "Swap Tea ←→ Silk?"
AI HEURISTIC: maxMarketValue(opponent.wareSlots) → minMarketValue(own.wareSlots)
```


#### **CARD: Tribal Elder**[^2]

```
TYPE: People  
PLAY COST: 1 action
INTERACTION TYPE: OPPONENT_SELECT
STATE MODEL: OPPONENT_DISCARD
FLOW:
  1. Active chooses: self_draw OR opponent_discard
  2. If opponent_discard → suspend active turn
  3. Opponent selects cards → discard to 3 hand size
  4. Resume active turn
VALIDATION:
  - opponent.hand.size >= 5 (for discard option)
UI PROMPTS:
  - Active: "Draw to 5 OR Opp discards to 3?"
  - Opponent: "Discard down to 3 cards (2/5)" [hand cards]
AI HEURISTIC: opponent discards lowest value cards
```


#### **CARD: Traveling Merchant**[^2]

```
TYPE: People
PLAY COST: 1 action
INTERACTION TYPE: AUCTION
STATE MODEL: AUCTION
FLOW:
  1. Active selects 2 wares from own market
  2. Suspend turn → auction starts (1g, active bids first)
  3. Alternate bids until pass → winner pays/takes wares
  4. Resume active turn
VALIDATION: player.wareSlots.occupied >= 2
UI PROMPTS:
  - "Select 2 wares for auction"
  - "Current bid: 2g [Raise +1] [Pass]"
AI HEURISTIC: bidValue(wares) vs currentBid
```


***

### **🏗️ Requirements Section 3: Updated Card Format**

Replace previous card lists with this **compact matrix format**:


| CARD | TYPE | COST | INTERACTION | STATE | FLOW STEPS | AI |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **Throne** | Utility | 1a | ACTIVE_SELECT | `WARE_THEFT_SWAP` | 1.Steal 2.Give | Max→Min value |
| **Tribal Elder** | People | 1a | OPPONENT_SELECT | `OPPONENT_DISCARD` | 1.Choice 2.Discard | Low value discard |
| **Elephant** | Animal | 1a | DRAFT | `WARE_DRAFT` | 1.Pool wares 2.Alternate pick | High value first |
| **Well** | Utility | 1a | NONE | - | Pay1g→Draw1 | Always optimal |

### **🔧 Implementation Benefits**

1. **Unambiguous**: Exact state models, validation, UI text
2. **Complete**: Covers play cost → AI logic
3. **Scalable**: Template works for all 55 cards
4. **Testable**: Clear validation preconditions
5. **UI Ready**: Exact prompt copy

### **📊 Interaction Type Legend**

```
NONE: Auto-resolve (Well, Drums)
ACTIVE_SELECT: Active player chooses (Throne, Parrot)
OPPONENT_SELECT: Turn suspension (Tribal Elder, Snake)
AUCTION: Bid turns (Merchants)
DRAFT: Alternate picks (Elephant, Ape, Lion) 
REACTION: Guard/Rain Maker windows
```

**This format belongs in Section 3.3-3.6** replacing previous tables. Every card gets **exactly this specification**. Ready to generate full 55-card matrix?[^2]
<span style="display:none">[^1][^10][^11][^12][^3][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: pasted-text.txt

[^2]: cards.pdf

[^3]: Jambo_v1.1-1.pdf

[^4]: Jambo_v1.1-1.pdf

[^5]: https://qat.com/guide-writing-data-requirements/

[^6]: https://uxdesign.cc/8-best-practices-for-ui-card-design-898f45bb60cc

[^7]: http://inclusive-components.design/cards/

[^8]: https://www.nngroup.com/articles/card-sorting-definition/

[^9]: https://www.visual-paradigm.com/support/documents/vpuserguide/94/158/84414_recordanddoc.html

[^10]: https://open.larksuite.com/document/ukTMukTMukTM/uYjNwUjL2YDM14iN2ATN

[^11]: https://www.interaction-design.org/literature/article/the-pros-and-cons-of-card-sorting-in-ux-research

[^12]: https://m3.material.io/components/cards/guidelines

