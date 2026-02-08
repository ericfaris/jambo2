> **DEPRECATED** — This document contains outdated card data (55 cards, wrong counts/effects).
> The authoritative source is **[CARD_REFERENCE.md](CARD_REFERENCE.md)** (110 cards, corrected effects).

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## GAP ANALYSIS: Missing Jambo Card Interactions

**Current Coverage**: ~35/55 cards detailed. **20 cards need interaction specs**. Here's the complete gap list with priority templates.[^3]

***

## **🔴 HIGH PRIORITY (Need State Machines)**

### **1. DANCER** (People Card)

```
CARD: Dancer
TYPE: People | COST: 1a | INTERACTION: ACTIVE_SELECT
STATE MODEL: WARE_CASH_CONVERSION
FLOW:
  1. Select 1 ware card from hand with exactly 3 wares depicted
  2. Return ANY 3 wares from market to supply  
  3. Receive gold = sell value of discarded ware card
VALIDATION: hand has 3-ware card AND market has 3 wares
UI: "Select 3-ware card → Select 3 wares to return → +9g"
AI: Highest sell value 3-ware card
```


### **2. CARRIER** (People Card)

```
CARD: Carrier
TYPE: People | COST: 1a | INTERACTION: ACTIVE_SELECT
STATE MODEL: BINARY_CHOICE
FLOW:
  1. Active chooses: "2 wares from market" OR "2 cards from deck"
  2. Opponent receives the OTHER option automatically
VALIDATION: None
UI: "[2 Wares] OR [2 Cards]? → Opponent gets other"
AI: Choose higher value option (ware values > card draw avg)
```


### **3. DRUMMER** (People Card)

```
CARD: Drummer  
TYPE: People | COST: 1a | INTERACTION: ACTIVE_SELECT
STATE MODEL: DISCARD_PICK
FLOW: Select any 1 utility card from discard pile → hand
VALIDATION: discard contains utilities
UI: "Pick utility from discard ↓ [Well][Throne][Kettle]"
AI: Highest value utility available
```


### **4. BASKET MAKER** (People Card)

```
CARD: Basket Maker
TYPE: People | COST: 1a | INTERACTION: ACTIVE_SELECT  
STATE MODEL: WARE_SELECT_MULTIPLE
FLOW: Pay 2g → Select 1 ware type → Take 2 from supply
VALIDATION: gold >= 2
UI: "Pay 2g → Choose type: [Silk x2][Hide x2][Tea x2]"
AI: Highest value ware type
```


***

## **🟡 MEDIUM PRIORITY (Simple Selection)**

| CARD | TYPE | INTERACTION | STATE MODEL | FLOW SUMMARY | AI |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **PSYCHIC** | People | ACTIVE_SELECT | `DECK_PEEK` | Top 5 deck → pick 1 | Highest value |
| **PORTUGUESE** | People | ACTIVE_SELECT | `WARE_SELL_BULK` | Any wares → 2g each | Un-sellable wares |
| **DRUMS** | Utility | ACTIVE_SELECT | `WARE_RETURN` | 1 ware → 1 card | Lowest value ware |


***

## **🟢 LOW PRIORITY (Auto-resolve w/ validation)**

| CARD | TYPE | INTERACTION | NOTES |
| :-- | :-- | :-- | :-- |
| **WISE MAN** | People | `MODIFIER` | Turn-long buy/sell bonus (+2g) |
| **MASK TRANSFORMATION** | Utility | `DRAW_REPLACE` | Draw phase only: top discard → discard 1 |
| **SUPPLIES** | Utility | `BINARY_CHOICE` | First ware OR pay 1g/discard |


***

## **⚠️ CRITICAL MISSING STATE MODELS**

```
1. WARE_CASH_CONVERSION  (Dancer)
2. BINARY_CHOICE         (Carrier, Supplies)  
3. DISCARD_PICK          (Drummer)
4. WARE_SELECT_MULTIPLE  (Basket Maker)
5. DECK_PEEK             (Psychic)
6. WARE_SELL_BULK        (Portuguese)
7. WARE_RETURN           (Drums)
```


## **📋 Updated Requirements Matrix**

```
COMPLETE (35 cards): Throne, Tribal Elder, Snake, Elephant, etc.
**MISSING (20 cards)**: Dancer, Carrier, Drummer, Basket Maker, Psychic, Portuguese, Drums, Wise Man, etc.
```

**PRIORITY**: Detail **Dancer + Carrier + Drummer** first - these have complex validation requiring `pendingResolution` states. Then fill medium/low priority.

**Next step**: Generate full specs for top 4 missing cards? Or jump to JSON card database export?[^3]
<span style="display:none">[^1][^10][^11][^12][^13][^2][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: Jambo_v1.1-1.pdf

[^2]: Jambo_v1.1-1.pdf

[^3]: cards.pdf

[^4]: pasted-text.txt

[^5]: https://cdn.1j1ju.com/medias/18/cb/31-jambo-rulebook.pdf

[^6]: https://www.meeplemountain.com/reviews/jambo/

[^7]: https://blog.jambo.cloud/3-ways-jambo-improves-contact-management

[^8]: https://www.pagat.com/invented/jambo.html

[^9]: https://www.reddit.com/r/boardgames/comments/2ov9i2/game_of_the_week_jambo/

[^10]: https://forums.geniimagazine.com/viewtopic.php?t=6301

[^11]: https://hansengeorge.blogspot.com/2021/11/jumbo-hexagonal-cards.html

[^12]: https://www.facebook.com/groups/2799735100241628/posts/4097899690425156/

[^13]: https://www.youtube.com/watch?v=alpGQRg4cPs

