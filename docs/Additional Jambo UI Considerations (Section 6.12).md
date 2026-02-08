> **DEPRECATED** — This document contains outdated card data (55 cards, wrong counts/effects).
> The authoritative source is **[CARD_REFERENCE.md](CARD_REFERENCE.md)** (110 cards, corrected effects).

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Additional Jambo UI Considerations (Section 6.12)

Beyond core layout, these **advanced UX patterns** address Jambo's unique challenges: auctions, reactions, hidden info, and tactile feedback.[^4]

***

## **🎮 Accessibility \& Input**

### **Color Blind Modes**

```
Ware Colors → Patterns + Icons
Silk:   🟣 → Purple stripes  
Jewelry:   🔵 → Blue diamonds
Salt:   🟡 → Yellow checker
Hides:   🔴 → Red crosshatch
Fruit:  🟠 → Orange circles
Tea:    🟢 → Green dots
```

**High Contrast Toggle**: 7:1 ratio for all text/icons.

### **Keyboard Navigation**

```
Tab: Hand → Market → Utilities → End Turn
↑↓: Cycle hand cards
Enter: Play selected
Esc: Cancel/discard
Space: Quick draw (Draw phase only)
```

**Screen Reader**: Full ARIA labels for card states, turn order, action costs.

***

## **📱 Advanced Mobile Gestures**

### **Multi-Touch Patterns**

```
2-Finger Swipe: Fast-forward AI turn
Pinch: Zoom market detail view
3-Finger Tap: Undo last action
Long Press: Card rule popup + audio
```

**Haptic Roadmap**:


| Gesture | Intensity | Pattern |
| :-- | :-- | :-- |
| Card Drag | Light | Single pulse |
| Gold Earned | Medium | Double pulse |
| Guard Reaction | Heavy | Long vibration |
| Phase Change | Light | Triple pulse |


***

## **🤖 AI Opponent Transparency**

### **Progressive Reveal**

```
Turn 1: P2 Hand = [??? ??? ???]
Turn 5: P2 Hand = [🃏Ware 🃏Util 🃏Animal]  ← Category hints
Turn 10: P2 Hand = [3Tea? Elephant?]     ← Partial reveal
```

**AI Decision Log** (Toggleable sidebar):

```
🤖 AI Turn 12:
• Considered: Sell 2Silk (+6g)
• Rejected: Throne steal (P1 empty)
• Played: Elephant (P1: 4 wares exposed)
```


***

## **⚠️ Error Prevention \& Undo**

### **Smart Warnings** (Non-Blocking)

```
❌ "Can't buy 3Tea: Only 2 slots free"
❌ "Elephant blocked: P2 has Guard ready"
❌ "4th Utility: Discard Well or Kettle first?"
   [Well] [Kettle] [Cancel]
```

**Timed Undo Stack** (5 turns):

```
↶ Undo: "Elephant played"  ← 3s window
↶ Undo: "Drew 3Tea"        ← 8s window
↶ Undo: "Phase: DRAW→PLAY" ← 15s window
```


***

## **📚 Contextual Help System**

### **Dynamic Tooltips** (Learning Curve Adaptive)

```
New Player: Every card shows full rules on hover
Intermediate: Cost/effect summary only
Expert: Disabled (Settings toggle)
```

**Card Encyclopedia** (Searchable):

```
Search: "steal" → Throne, Rainmaker, Parrot, Crocodile
Tap → Full rules + strategy tips
```


***

## **🎨 Visual Polish**

### **Parallax Layers** (Subtle Depth)

```
Foreground: Cards + Tokens (z=0)
Market Stands: Wooden texture (z=-50px)
Background: African market scene (z=-200px)
Particles: Dust motes, coin sparkles (z=100px)
```

**Weather Effects** (Market Theme):

```
Dawn: Warm golden light
Midday: Bright harsh shadows
Dusk: Cool purple tones
Rain: Subtle water reflections on cards
```


***

## **📊 Information Density Controls**

### **Detail Sliders** (Player Preference)

```
Minimal: Gold + Actions + Phase only
Standard: + Markets + Hand count
Verbose: + Discard top3 + Ware supply + AI log
Debug: + Card IDs + State hash + FPS
```

**Auto-Hide** (Clutter Reduction):

```
- Hand: Collapses when >8 cards
- Discard: Shows top 3, "…+12" badge
- Log: 5 latest actions, scrollable history
```


***

## **🔄 Complex Interaction Flows**

### **Auction Resolver** (Traveling Merchant/Arabian)

```
1. "2 Wares Auctioned" ✨
2. P1: [1g] [2g] [Pass] 
3. P2: [3g] [4g] [Pass]
4. P1: [Pass] → P2 wins! ✨ -4g
```

**Reaction Window** (Guard vs Animals):

```
🦁 Elephant Played!  ← 2s reaction window
[Play Guard?]        ← Auto-dismiss if none
✓ Guard played → Both discarded
```


***

## **🎵 Audio Design**

| Event | Sound | Layer |
| :-- | :-- | :-- |
| **Draw** | Soft paper rustle | SFX |
| **Play Card** | Wooden thud | SFX |
| **Gold** | Coins clinking | SFX + Music swell |
| **Elephant** | Trumpet + stampede | Dramatic |
| **Endgame** | African drum crescendo | Music |

**Voice Prompts** (Optional):

- "Your turn!"
- "Phase: Draw Cards"
- "P1 reaches 62 gold - Final turn!"

***

## **📈 Performance Optimizations**

### **Virtualized Rendering**

```
Hand: 12 cards max → Always render all
Market: 9 slots → Virtual scroll if zoomed
History: 50+ turns → Infinite scroll
Animations: RAF throttled to 60fps
```

**LOD (Level of Detail)**:

```
Full: Desktop (164×224px cards)
Medium: Tablet (120×164px)
Icon: Mobile portrait (<90px)
```


***

## **🎯 Localization Ready**

```
Text: JSON strings (55 cards × 3 lines = 165 entries)
Currency: Gold icons (universal)
Actions: 1-5 finger counts (visual)
Wares: Color-coded globally
```

**Right-to-Left Support**:

```
Market flow: Right→Left for Arabic/Hebrew
Hand: RTL swipe gestures
Numbers: Localized formats
```


***

## **✅ Priority Implementation Order**

```
Phase 1 (MVP): Error prevention + Undo + Keyboard nav
Phase 2: Audio + Haptics + AI transparency  
Phase 3: Weather + Parallax + Detail sliders
Phase 4: Localization + Advanced gestures
```

**These polish touches transform "functional" into "unmissable."** Jambo players will feel the physical game's tactility while enjoying digital smoothness. Ready for asset integration![^4]
<span style="display:none">[^1][^10][^11][^12][^2][^3][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: Jambo_v1.1-1.pdf

[^2]: Jambo_v1.1-1.pdf

[^3]: pasted-text.txt

[^4]: cards.pdf

[^5]: https://gdkeys.com/the-card-games-ui-design-of-fairtravel-battle/

[^6]: https://blog.logrocket.com/ux-design/ui-card-design/

[^7]: https://www.reddit.com/r/gamedesign/comments/1c8h8sv/ui_design_for_a_card_game_how_can_i_fit_two/

[^8]: https://www.mockplus.com/blog/post/card-ui-design

[^9]: https://www.justinmind.com/ui-design/cards

[^10]: https://www.linkedin.com/pulse/how-make-card-game-from-perspective-ux-designer-reena-ngauv

[^11]: https://uxdesign.cc/ux-in-board-game-design-97bfcdb1d581

[^12]: https://stackoverflow.com/questions/4074514/what-is-a-good-ui-framework-for-a-card-game

