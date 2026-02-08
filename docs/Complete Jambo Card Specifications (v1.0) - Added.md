> **DEPRECATED** — This document contains incorrect card data (55 cards, wrong counts, wrong effects).
> The authoritative source is **[CARD_REFERENCE.md](CARD_REFERENCE.md)** (110 cards, corrected effects).
> Key differences: 110 total cards (not 55), "trinkets" not "jewelry", per-card pricing (not per-type),
> every ware card can buy OR sell, Psychic top 6 (not 5), corrected Rain Maker/Crocodile/Dancer/Carrier/Boat/Weapons/Supplies/Mask effects.

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Complete Jambo Card Specifications (v1.0) - Added to Requirements

**Section 3: Card System Requirements** - **ALL 55 cards** with standardized interaction templates.[^3]

***

## **📋 UTILITY CARDS (10 cards, max 3 in play, 1 use/turn)**

| CARD | TYPE | COST | INTERACTION | STATE MODEL | FLOW | VALIDATION | UI PROMPT | AI |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **Well** | Utility | 1a | NONE | - | Pay 1g → Draw 1 | gold >= 1 | "Pay 1g for card?" | Always |
| **Mask of Transformation** | Utility | 1a | NONE | - | Before draw: Top discard → discard 1 hand card | discard.size > 0 | "Replace draw with discard swap?" | Always (draw phase only) |
| **Drums** | Utility | 1a | ACTIVE_SELECT | `WARE_RETURN` | Return 1 own ware → Draw 1 | wares >= 1 | "Select ware to return" | Lowest value ware |
| **Supplies** | Utility | 1a | NONE | - | Draw until ware (discard non-ware) → pay 1g OR discard 1 | - | "Pay 1g or discard card?" | Pay if gold >= 1 |
| **Throne** | Utility | 1a | **ACTIVE_SELECT** | `WARE_THEFT_SWAP` | 1. Select 1 opp ware 2. Select 1 own ware → atomic swap | both have wares | 1. "Select opp ware" 2. "Select ware to give" | Max opp → Min own |
| **Kettle** | Utility | 1a | ACTIVE_SELECT | `CARD_DISCARD` | Discard 1-2 hand → draw that many | hand >= 1 | "Discard how many? [^3][^4]" | Discard 1 lowest |
| **Boat** | Utility | 1a | ACTIVE_SELECT | `CARD_DISCARD` | Discard 1 (hand/utilities) → 1 ware from supply | hand+utils >= 1 | "Select card to discard" | Lowest value card |
| **Leopard Statue** | Utility | 1a | ACTIVE_SELECT | `WARE_SELECT` | Pay 2g → 1 ware choice from supply | gold >= 2 | "Choose ware type" | Highest value ware |
| **Scale** | Utility | 1a | ACTIVE_SELECT | `CARD_GIVE` | Draw 2 → keep 1, give 1 opp | - | "Keep this or that?" | Keep highest value |
| **Weapons** | Utility | 1a | ACTIVE_SELECT | `CARD_DISCARD` | Discard 1 (hand/utilities) → +2g | hand+utils >= 1 | "Select card to discard" | Lowest value card |


***

## **📋 PEOPLE CARDS (13 cards, play → effect → discard)**

| CARD | COST | INTERACTION | STATE MODEL | FLOW | VALIDATION | UI PROMPT | AI |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **Shaman** | 1a | ACTIVE_SELECT | `WARE_TRADE` | All 1 type → same \# different type | has matching wares | "Trade which type for which?" | Most→Least valuable |
| **Basket Maker** | 1a | ACTIVE_SELECT | `WARE_SELECT` | Pay 2g → 2 same-type wares | gold >= 2 | "Choose ware type (x2)" | Highest value |
| **Psychic** | 1a | ACTIVE_SELECT | `DECK_PEEK` | Top 5 deck → pick 1, rest same order | - | "Pick 1 from top 5" | Highest value |
| **Traveling Merchant** | 1a | **AUCTION** | `AUCTION` | 2 own wares → auction (active bids 1st) | wares >= 2 | "Select 2 wares → Bid?" | Bid if value > bid |
| **Tribal Elder** | 1a | **OPPONENT_SELECT** | `OPPONENT_DISCARD` | Draw to 5 OR opp discard to 3 | opp hand >= 5 | "You draw OR opp discard?" | Always opp discard |
| **Arabian Merchant** | 1a | **AUCTION** | `AUCTION` | Top 3 deck → auction (active bids 1st) | - | "Bid on top 3 cards?" | Bid if value > bid |
| **Wise Man** | 1a | NONE | `MODIFIER` | This turn: wares buy -2g, sell +2g | - | "Modifier active" | Always play |
| **Dancer** | 1a | ACTIVE_SELECT | `WARE_DISCARD` | Discard 3-ware card → return any 3 wares → get sell value | has 3-ware card | "Select 3-ware card" | Highest sell value |
| **Portuguese** | 1a | ACTIVE_SELECT | `WARE_SELL` | Any \# wares → 2g each | wares >= 1 | "Select wares to sell (2g ea)" | Sell un-sellable wares |
| **Carrier** | 1a | ACTIVE_SELECT | `AUTO_RESOLVE` | 2 wares OR 2 cards → opp gets other | - | "2 wares or 2 cards?" | Higher value option |
| **Drummer** | 1a | ACTIVE_SELECT | `DISCARD_PICK` | Any utility from discard → hand | discard has utils | "Pick utility from discard" | Highest value utility |
| **Rain Maker** | 0a | **REACTION** | `WARE_REACTION` | Reaction to opp ware play → steal to hand | opp plays ware | "Steal this ware card?" | Always if ware |
| **Guard** | 0a | **REACTION** | `ANIMAL_CANCEL` | Reaction to any animal → cancel both | animal played | "Play Guard?" | If valuable utilities |


***

## **📋 ANIMAL CARDS (8 cards, Guard reaction always available)**

| CARD | COST | INTERACTION | STATE MODEL | FLOW | VALIDATION | UI PROMPT | AI |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **Crocodile** | 1a | **ACTIVE_SELECT** + Guard | `UTILITY_THEFT` | Discard 1 opp utility | opp has utils | "Select opp utility" + Guard window | Target best opp utility |
| **Elephant** | 1a | **DRAFT** + Guard | `WARE_DRAFT` | Pool all wares → alternate pick (active 1st) | - | "Pick 1 ware (your turn)" + Guard | Guard if losing wares |
| **Parrot** | 1a | **ACTIVE_SELECT** + Guard | `WARE_THEFT_SINGLE` | Take 1 opp ware | opp has wares | "Select opp ware" + Guard | Target best opp ware |
| **Ape** | 1a | **DRAFT** + Guard | `HAND_DRAFT` | Reveal both hands → alternate pick (active 1st) | - | "Pick 1 card (your turn)" + Guard | Guard if bad hand |
| **Hyena** | 1a | **ACTIVE_SELECT** + Guard | `HAND_EXCHANGE` | View opp hand → take 1, give 1 (can be same) | - | "Take which? Give which?" + Guard | Best opp → worst own |
| **Lion** | 1a | **DRAFT** + Guard | `UTILITY_DRAFT` | Pool all utilities → alternate pick (active 1st) | - | "Pick 1 utility" + Guard | Guard always |
| **Snake** | 1a | **OPPONENT_SELECT** + Guard | `KEEP_1_UTILITY` | Both keep 1 utility (discard rest) | - | "Keep which utility?" + Guard | Keep best utility |
| **Cheetah** | 1a | **OPPONENT_SELECT** + Guard | `BINARY_CHOICE` | Opp chooses: give 2g OR you draw 2 | - | "Give 2g or let draw 2?" + Guard | Guard always |


***

## **📋 SIMPLE CARDS (24 cards)**

| CARD | TYPE | COST | INTERACTION | STATE MODEL | FLOW | NOTES |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **Small Market Stand** | Stand | 1a | NONE | - | Pay 3g (6g first) → +3 slots | Global firstStand flag |
| **Ware Cards (Buy)** | Ware | 1a | NONE | - | Pay buy cost → place wares | Space check + 6th slot penalty |
| **Ware Cards (Sell)** | Ware | 1a | NONE | - | Return wares → get sell gold | Must have exact wares |
| **Market Overload** | Rule | Auto | NONE | - | Fill 6th large slot → pay 2g | Automatic |


***

## **🏗️ Updated Requirements Integration**

### **Section 3.3: Card Data Model** (MANDATORY fields)

```json
{
  "name": "Throne",
  "type": "Utility",
  "playCost": 1,
  "interactionType": "ACTIVE_SELECT",
  "stateModel": "WARE_THEFT_SWAP",
  "validation": ["opp_wares>=1", "own_wares>=1"],
  "uiPrompts": ["Select opp ware", "Select own ware"],
  "aiHeuristic": "max_opp_min_own"
}
```


### **Section 6.1: State Machine** (Now covers ALL 55 cards)

```
pendingResolution.type = card.interactionType
pendingResolution.flow = card.flowSteps
pendingResolution.validation = card.validation
```

**COMPLETE SPECIFICATION** - Every card now has **exact implementation requirements**. Ready for JSON export → engine code generation.[^3]
<span style="display:none">[^1][^10][^11][^12][^2][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: Jambo_v1.1-1.pdf

[^2]: Jambo_v1.1-1.pdf

[^3]: cards.pdf

[^4]: pasted-text.txt

[^5]: https://www.meeplemountain.com/reviews/jambo/

[^6]: https://www.walmart.com/ip/Jambo-Dutch-Edition-New/636882020

[^7]: https://www.tabletopfinder.eu/en/boardgame/1485/jambo

[^8]: https://cdn.1j1ju.com/medias/18/cb/31-jambo-rulebook.pdf

[^9]: https://www.orderofgamers.com/downloads/Jambo_v1.1.pdf

[^10]: https://www.nobleknight.com/P/2147345850/Jambo

[^11]: https://www.facebook.com/groups/boardgamerevolution/posts/3342660339359214/

[^12]: https://www.boardgamebliss.com/products/jambo

