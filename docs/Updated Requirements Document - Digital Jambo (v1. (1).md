> **DEPRECATED** — This document contains outdated card data (55 cards, wrong counts/effects).
> The authoritative source is **[CARD_REFERENCE.md](CARD_REFERENCE.md)** (110 cards, corrected effects).

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Updated Requirements Document - Digital Jambo (v1.5)

**Added: Section 2.8 Ware Trading Economy** - Complete gold conversion mechanics.[^1][^4]

***

## **2.8 WARE ECONOMY \& TRADING MECHANICS** ⭐ **CRITICAL**

### **2.8.1 Core Principle**

```
**Wares → NO direct gold.** Trading = "WARE UPGRADING" for optimal selling.
PRIMARY CYCLE: Buy Low-Value → Shaman Trade → Sell High-Value
```


### **2.8.2 SHAMAN Trading (Key Mechanic)**

```
CARD: Shaman (People)
EFFECT: "Choose ALL wares of 1 type → Take SAME # of different type from supply"
RULE: Must trade ALL of one type (3 Tea → 3 Silk)
STATE MODEL: WARE_TRADE
```

**Implementation**:

```json
{
  "pendingResolution": {
    "type": "WARE_TRADE",
    "giveType": "tea",        // Must give ALL tea
    "receiveType": "silk",    // Same count from supply
    "count": 3,
    "validation": {
      "playerHasAllTea": true,
      "supplyHasSilk": 3
    }
  }
}
```


### **2.8.3 Gold Generation Cycle** (3 actions → +5g profit)

| Step | Action | Cost | Wares | Gold | Actions |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **1** | Buy 3x Tea | -4g | +3 Tea | -4g | 1 |
| **2** | Shaman | 0g | -3 Tea +3 Silk | 0g | 1 |
| **3** | Sell 3x Silk | +9g | -3 Silk | +9g | 1 |
| **NET** |  | **+5g** |  | **+5g** | **3** |

### **2.8.4 Ware Value Matrix** (MANDATORY engine data)

| Ware Type | Buy Cost (typical) | Sell Value (typical) | **Profit Margin** | Priority |
| :-- | :-- | :-- | :-- | :-- |
| **Tea** | 4g (3x) | 6g (3x) | **+2g** | Low |
| **Silk** | 6g (3x) | **9g (3x)** | **+3g** | **High** |
| **Hides** | 5g (2x) | **8g (2x)** | **+3g** | **High** |
| **Salt** | 3g (4x) | 7g (4x) | **+4g** | **Medium** |

### **2.8.5 Trading → Gold Paths** (Complete)

| Method | Input Wares | Output | Gold | Actions | Card |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **Buy→Trade→Sell** | Tea → Silk | Sell Silk | **+5g** | 3 | Buy + Shaman + Sell |
| **Portuguese** | Any 4 wares | 2g each | **+8g** | 1 | Portuguese |
| **Dancer** | 3-ware card | Sell value | **Variable** | 1 | Dancer |
| **Wise Man + Sell** | Any wares | +2g bonus | **+2g** | 2 | Wise Man + Sell |

### **2.8.6 UI Requirements** (Exact prompts)

```
[SHAMAN Active - 1 Action]
"Trade ALL Tea (3) → ALL Silk (3)?"
[Tea ●●● → Silk ●●●] [Confirm Trade]

Validation Messages:
❌ "Must trade ALL of one type"
❌ "Supply needs 3 Silk"
✅ "Trade complete: +3 Silk to slots 4-6"
```


### **2.8.7 State Validation Rules** (Engine MUST enforce)

- ✅ **ALL or nothing**: Can't trade partial stacks
- ✅ **Exact count match**: 3 Tea → exactly 3 Silk
- ✅ **Supply availability**: Target wares must exist
- **Atomic execution**: Remove → Add in single transaction
- **First empty slots**: Auto-place received wares
- **No gold exchange**: Pure ware-for-ware


### **2.8.8 AI Heuristic** (Production-ready)

```typescript
AIExecuteShaman(playerWares, supplyWares): Trade {
  const giveType = minSellValue(playerWares.types);    // Dump Tea
  const receiveType = maxSellValue(supplyWares.types); // Want Silk/Hides
  const count = playerWares[giveType];
  
  if (supplyWares[receiveType] >= count) {
    return {give: giveType, receive: receiveType, count};
  }
  return null; // No profitable trade
}
```


### **2.8.9 Optimal Cycle** (4 turns → +9g)

```
T1: Buy Tea (-4g) + Action Bonus (+1g) = -3g net
T2: Shaman (Tea→Silk) = 0g  
T3: Wise Man (+2g) + Sell Silk (+11g) = +13g
T4: Action Bonus (+1g)  
**TOTAL: +11g** (2.75g/action)
```


***

## **📊 Updated Economy Summary** (Section 2 Complete)

| Gold Source | Typical Value | Actions | Strategy |
| :-- | :-- | :-- | :-- |
| **Ware Sell** | +6-9g | 1 | After trading |
| **Trading** | **+5g profit** | 3 | **Buy→Shaman→Sell** ⭐ |
| **Portuguese** | +8g | 1 | Emergency cash |
| **Action Bonus** | +1g | 0 | Always |
| **Weapons** | +2g | 1 | Card filtering |

**WARE TRADING = CORE ECONOMY ENGINE.** Enables 60g win condition through repeatable +5g cycles.[^4]

**Requirements v1.5 COMPLETE** - All mechanics now precisely specified for implementation.
<span style="display:none">[^10][^11][^12][^13][^2][^3][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: Jambo_v1.1-1.pdf

[^2]: Jambo_v1.1-1.pdf

[^3]: pasted-text.txt

[^4]: cards.pdf

[^5]: https://www.pickfu.com/blog/wp-content/uploads/2024/06/Detailed-Game-Design-Documentation-Template.pdf

[^6]: https://slite.com/learn/game-design-document

[^7]: https://www.nuclino.com/articles/game-design-document-template

[^8]: https://www.craft.do/templates/game-design-document-template

[^9]: https://connect-prd-cdn.unity.com/20201215/83f3733d-3146-42de-8a69-f461d6662eb1/Game-Design-Document-Template.pdf

[^10]: https://wwwx.cs.unc.edu/~pozefsky/seriousgames/NewDesignDocTemplate.pdf

[^11]: https://www.reddit.com/r/gamedesign/comments/po5n8m/preferred_game_design_document_template/

[^12]: https://indiegameacademy.com/free-game-design-document-template-how-to-guide/

[^13]: https://milanote.com/templates/game-design/game-design-document

