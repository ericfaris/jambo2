> **DEPRECATED** — This document contains outdated card data (55 cards, wrong counts/effects).
> The authoritative source is **[CARD_REFERENCE.md](CARD_REFERENCE.md)** (110 cards, corrected effects).

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Jambo Digital UI Design (Section 6.0)

Digital adaptation preserves physical Jambo's tactile feel while adding smooth interactions. Responsive across devices with clear visual hierarchy.[^1][^3]

***

## **🎨 6.1 LAYOUT PHILOSOPHY**

```
┌─────────────────────────────┐
│  P2 Gold: 42g  🟡 Phase 2   │  ← Always visible status
├─────────┬───────────────────┤
│ Discard │  P1: 28g  🟢 4a  │  ← Central player focus
│  [D1]  │ Market: [T_S_H__] │
│  [D2]  │ Utils: [W_T_K_ ] │
├─────────┼──────────┼───────┤
│ Deck    │ Hand     │ Log   │  → Secondary info collapsible
│ [^55]    │ [C3 C7] │ +2g   │
└─────────┴──────────┴───────┘
```

**Key Principles**:

- **Physical fidelity** - Market stands as 3D cards
- **Touch-first** - Large tappable areas (48dp min)
- **AI transparency** - P2 hand shows ? for hidden cards[^3]

***

## **🏗️ 6.2 CORE COMPONENTS**

### **Market Stands** (Draggable 3D)

```
Large Stand (6 slots): [Tea○][Silk●][___][___][Hide○][___]
Small Stand (3 slots):  [___][___][___]  ← Glow when draggable
```

- **Visual states**: Empty(gray), Occupied(full color), Selected(glow+lift)
- **6th slot warning**: Red pulse + "-2g" badge
- **Drag-drop**: Ware → Stand slot (snap magnetic feedback)


### **Hand Cards** (Swipeable carousel)

```
[3Tea←→Well←→Elephant→]  ← Horizontal scroll
```

- **Fan layout** - Cards overlap naturally
- **Peek effect** - Drag reveals underneath cards
- **Discard pile** - Face-up vertical stack (top 3 visible)


### **Action Tracker** (Physical tokens)

```
█████  ← 5 gray tokens (physical feel)
██░░░  ← 3 used (dark), 2 available (bright)
```

- **Opponent tracks** - Click to consume (prevents cheating)
- **2+ remaining** - Auto +1g bonus notification

***

## **🎮 6.3 INTERACTION FLOWS**

### **Throne Utility** (2-step guided)

```
1. "Steal ↓" [Silk○ Salt○ Hide○]  ← Tap opponent's market
↓ Select Silk
2. "Give ↓"  [Tea○ __ ○]          ← Tap own market  
↓ Select Tea
✅ "Throne Complete! ✨"
```


### **Elephant Draft** (Turn-based highlight)

```
Pool: [Silk Tea Hide Salt]
P1: "Pick ↓ Silk"  ← Only P1 wares glow
P2: "Pick ↓ Salt"  ← Only P2 wares glow  
P1: "Pick ↓ Hide"
✅ "Draft Complete!"
```


### **Shaman Trade** (Visual confirmation)

```
"Trade ALL ↓ Tea(3)" → Silk(3) available
[3Tea → 3Silk] animation
✅ "Trade successful! +3 value"
```


***

## **📱 6.4 RESPONSIVE BREAKPOINTS**

| Device | Layout | Hand Display | Market Size |
| :-- | :-- | :-- | :-- |
| **Desktop** | Side-by-side | Full fan (8 cards) | Large 3D |
| **Tablet** | Vertical stack | Carousel scroll | Medium 2D |
| **Mobile** | Compact | Vertical stack | Icon-only |

**Mobile Priority**:

- Action buttons always bottom row
- Swipe hand left→discard, right→play
- Double-tap ware = quick sell

***

## **🎯 6.5 STATE INDICATORS**

| Element | Available | Used | Blocked |
| :-- | :-- | :-- | :-- |
| **Utility** | 🟢 Bright | 🔴 Dark | ⛔ Faded |
| **Action** | 🟡 Glow | 🟠 Dim | ❌ Gray |
| **Market** | ○ Empty | ● Full | 🔴 Full+penalty |

**Phase Banner** (Top center):

```
🟢 DRAW PHASE (3/5)  →  🟡 PLAY PHASE (2/5)
```


***

## **🤖 6.6 AI TRANSPARENCY**

### **Opponent Partial Info**

```
P2 Market: [Silk●][?○][?○][Hide●][___][Tea●]
P2 Hand: [??? ???? ??]  ← Face-down estimation
P2 Utils: [Well●][???][Kettle○]
```

**AI Thinking** (Optional toggle):

```
🤔 AI calculating... (0.2s) → Plays Shaman
```


***

## **📊 6.7 ANIMATIONS \& FEEDBACK**

| Action | Animation | Sound | Duration |
| :-- | :-- | :-- | :-- |
| **Play Card** | Slide+flip | Soft "thud" | 300ms |
| **Ware Place** | Drop+settle | "Clink" | 200ms |
| **Gold Gain** | Coins bounce | "Ching!" | 400ms |
| **Error** | Shake+red pulse | "Bzzzt" | 150ms |
| **Phase Change** | Wipe transition | Whoosh | 500ms |

**Haptic Feedback** (Mobile):

- Light tap: Card interactions
- Medium: Gold changes
- Heavy: Endgame trigger

***

## **🎨 6.8 VISUAL LANGUAGE**

```
Primary Colors:
🟤 Market Brown (#8B4513)  - Wooden stands
🟡 Gold (#FFD700)          - Currency
🟢 Tea (#90EE90)           - Wares by type
🟣 Silk (#DDA0DD)
🔴 Hide (#CD5C5C)

Typography:
• Card Names: Bold Serif (physical feel)
• Numbers: Sans Bold (instant readable) 
• Status: Clean Sans (modern digital)
```


***

## **🔧 6.9 IMPLEMENTATION RECOMMENDATIONS**

```
FRAMEWORK: React + Framer Motion (animations)
• Cards: CSS 3D transforms (true perspective)
• Draggables: react-beautiful-dnd (smooth)
• Responsive: Tailwind CSS (breakpoints)
• State: Zustand (performance)

PERF TARGETS:
• 60fps animations
• <16ms card renders  
• Touch latency <50ms
```


***

## **✅ 6.10 USABILITY METRICS**

| Metric | Target | Test Method |
| :-- | :-- | :-- |
| **Task Time** | <3s card play | User testing |
| **Error Rate** | <5% misclicks | Playtest logs |
| **Readability** | 99% card comprehension | A/B testing |
| **Intuitiveness** | <2min learn core flow | New player tests |


***

## **🚀 PRIORITY FEATURES** (v1.0 MVP)

```
✅ 1. Market stands (drag-drop wares)
✅ 2. Hand carousel (swipe/discard) 
✅ 3. Action tracker (opponent clicks)
✅ 4. Throne/Elephant guided flows
✅ 5. Phase transitions + feedback
✅ 6. Mobile-first responsive
✅ 7. AI transparency (partial info)
```

**Jambo UI captures physical board game tactility** while adding digital smoothness. Ready for prototype implementation.[^1][^3]
<span style="display:none">[^10][^11][^12][^2][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: Jambo_v1.1-1.pdf

[^2]: Jambo_v1.1-1.pdf

[^3]: cards.pdf

[^4]: pasted-text.txt

[^5]: https://www.tencentcloud.com/techpedia/113143

[^6]: https://starloopstudios.com/developers-guide-to-multi-platform-game-ui-design-best-practices/

[^7]: https://www.reddit.com/r/gamedesign/comments/1ft6qlp/how_to_go_about_designing_the_ui_for_your_game/

[^8]: https://www.nngroup.com/articles/usability-heuristics-board-games/

[^9]: https://uxdesign.cc/board-game-ux-help-and-documentation-74335da5ce20

[^10]: https://uxdesign.cc/ux-in-board-game-design-97bfcdb1d581

[^11]: https://uxplanet.org/game-design-ux-best-practices-the-ultimate-guide-4a3078c32099

[^12]: https://www.facebook.com/groups/132728896890594/posts/2566581936838599/

