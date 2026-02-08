> **DEPRECATED** — This document contains outdated card data (55 cards, wrong counts/effects).
> The authoritative source is **[CARD_REFERENCE.md](CARD_REFERENCE.md)** (110 cards, corrected effects).

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Trading Wares → Gold Conversion Strategy

**Wares do NOT directly generate gold.** Trading repositions wares for **optimal selling**. Core economy: **Buy Low → Trade → Sell High**.[^1][^2]

***

## **🔄 2.8 WARE ECONOMY MODEL** (Added to Requirements)

### **Core Trading Mechanic: SHAMAN**

```
**SHAMAN (People Card)**: "Choose all wares of 1 type → Take same # of different type"
✅ SAME TYPE TRADE: 3 Tea → 3 Silk (trading must be same type)
✅ Example: Trade low-sell-value Tea for high-sell-value Silk
```


### **💰 Gold Generation Cycle**

```
1. BUY: 3x Tea (low buy cost: ~4g) → Place on market [1 action]
2. SHAMAN: 3x Tea → 3x Silk (high sell value: ~9g) [1 action]  
3. SELL: 3x Silk → +9g [1 action]
NET: -4g → +9g = **+5g profit** (3 actions)
```


### **📊 Ware Value Matrix** (Sell values from cards)

| Ware | Typical Buy Cost | Typical Sell Value | **Profit Margin** |
| :-- | :-- | :-- | :-- |
| **Silk** | 6g (3x) | 9g (3x) | **+3g** |
| **Jewelry** | 6g (3x) | 9g (3x) | **+3g** |
| **Salt** | 3g (4x) | 7g (4x) | **+4g** |
| **Hides** | 5g (2x) | 8g (2x) | **+3g** |
| **Fruit** | 4g (3x) | 6g (3x) | **+2g** |
| **Tea** | 4g (3x) | 6g (3x) | **+2g** |

**Strategy**: Buy cheap Tea/Salt/Fruit → Shaman to Silk/Hides/Jewelry → Sell for profit.

***

## **🎯 Trading → Gold Paths** (Complete list)

| Method | Input | Output | Gold Impact | Actions |
| :-- | :-- | :-- | :-- | :-- |
| **1. Buy→Trade→Sell** | Tea (4g buy) | Silk → Sell 9g | **+5g** | 3 |
| **2. Portuguese** | Any 4 wares | 2g each = 8g | **+8g** | 1 |
| **3. Dancer** | 3-ware card + 3 wares | Sell value of card | **Variable** | 1 |
| **4. Wise Man** | Any sell | +2g bonus | **+2g** | 1 (modifier) |

### **🏗️ State Implementation**

```json
{
  "shamanTrade": {
    "giveType": "tea",     // All tea from market
    "receiveType": "silk", // Same count silk from supply
    "count": 3,
    "validation": "hasAllTea && supplyHasSilk"
  }
}
```

**UI Flow**:

```
[SHAMAN Active]
"Trade all Tea (3) for Silk (3)?" 
[Tea ●●● → Silk ●●●] [Confirm]
→ Remove 3 Tea → Add 3 Silk to first empty slots
```


***

## **🤖 AI Trading Heuristic**

```typescript
AIExecuteShaman(playerWares, supplyWares): {give: string, receive: string} {
  const giveType = minSellValue(playerWares.types);  // Dump Tea
  const receiveType = maxSellValue(supplyWares.types); // Want Silk
  return {give: giveType, receive: receiveType};
}
```


### **📈 Profit Optimization**

```
Optimal Cycle (4 turns):
T1: Buy Tea (4g) → 3 Tea
T2: Shaman → 3 Silk  
T3: Wise Man (+2g sell) → Sell Silk (11g)
T4: Action Bonus (+1g)
NET: **+9g** (4 actions, ~2.25g/action)
```

**Trading = WARE UPGRADING.** No direct gold, but **enables highest sell margins**. Must track **wareMarketValues[]** for engine/AI.[^1]

**Added to Section 2.8.** Complete economy model now specified.
<span style="display:none">[^10][^11][^12][^13][^3][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: cards.pdf

[^2]: Jambo_v1.1-1.pdf

[^3]: Jambo_v1.1-1.pdf

[^4]: pasted-text.txt

[^5]: https://www.fxstreet.com/education/guides/gold/all-gold-trading-strategies-you-need-to-know

[^6]: https://www.mitrade.com/insights/beginner/commodities-course/gold-trading-investments

[^7]: https://www.elibrary.imf.org/view/journals/001/1991/120/article-A001-en.xml

[^8]: https://www.youtube.com/watch?v=kDLFtkmh5Hc\&vl=en

[^9]: https://www.investopedia.com/articles/investing/100915/learn-how-trade-gold-4-steps.asp

[^10]: https://www.reddit.com/r/BaldursGate3/comments/1dwyf8f/how_do_people_seriously_have_that_much_gold/

[^11]: https://kinesis.money/blog/gold/how-profit-gold-silver-spot-trading/

[^12]: https://www.forexfactory.com/thread/1350216-gold-trading-an-institutional-way

[^13]: https://www.businessinsider.com/gold-prices-soar-expert-tips-2024-11

