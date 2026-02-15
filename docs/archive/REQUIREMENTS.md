# Digital Jambo - High-Level Requirements Document

*Version 1.0 | February 7, 2026*

---

## 1. Product Vision

**Digital Jambo** is a faithful, polished digital adaptation of Rudiger Dorn's acclaimed 2-player card game *Jambo* (Kosmos/Rio Grande Games, 2004). Players take on the roles of rival merchants in an African marketplace, buying and selling wares to accumulate gold. The digital version delivers the full strategic depth of the tabletop experience with AI opponents, online multiplayer, and beautiful animations -- all accessible as a Progressive Web App on any device.

### 1.1 Target Audience
- Fans of the physical Jambo card game
- Strategy card game enthusiasts (2-player games)
- Board game community (BoardGameGeek audience)
- Casual mobile gamers who enjoy trading/economic games

### 1.2 Core Value Proposition
- Play Jambo anytime against a challenging AI opponent (3 difficulty levels)
- Play online with friends or locally via hotseat
- Faithful adaptation: every one of the 110 cards implemented with full rules fidelity
- Beautiful, tactile UI that evokes the physical board game experience
- Offline-capable, works on phone, tablet, and desktop

---

## 2. Game Rules Summary

### 2.1 Overview
- **Players**: Exactly 2 (Human vs AI, Human vs Human local, or Human vs Human online)
- **Objective**: Accumulate gold through buying, trading, and selling wares
- **Starting Gold**: 20g per player
- **Marketplace**: Each player has 6 ware slots on their market stand
- **Hand Limit**: 5 cards (end of turn)
- **Utility Limit**: 3 utility cards in play per player
- **Game Length**: ~30-45 minutes

### 2.2 Turn Structure
Each turn has two sequential phases:

**Phase 1 - Draw Phase**:
- Draw the top card of the deck and look at it
- **Keep it** (add to hand, draw phase ends) OR **Discard it** (place face-up on discard pile, draw again)
- Continue until you keep a card or exhaust your draw attempts (up to 5)
- Some utility cards modify draw behavior (e.g., Mask of Transformation)

**Phase 2 - Action Phase (5 Actions Max)**:
- Each action costs 1 of your 5 action points:
  - Draw a card (must keep, no look/discard)
  - Play a Ware card (buy or sell)
  - Play a People card (one-time effect)
  - Play an Animal card (attack opponent)
  - Play a Utility card (place in play, max 3)
  - Activate a Utility card (use one already in play)
- **Action Bonus**: If 2+ actions remain unused at turn end, earn +1g

### 2.3 Card Types (110 Total)
| Type | Unique Designs | Copies in Deck | Description |
|------|----------------|----------------|-------------|
| **Ware Cards** | 19 | 40 | Buy or sell wares (3 or 6 wares per card, fixed per-card pricing) |
| **Small Market Stand** | 1 | 5 | Pay 6g/3g, adds 3 ware slots |
| **People Cards** | 13 | 29 | One-time effects (6x Guard, 3x Rain Maker, 2x most others, 1x Carrier, 1x Drummer) |
| **Animal Cards** | 8 | 14 | Attack cards (5x Crocodile, 2x Parrot, 2x Hyena, 1x each of 5 others) -- can be blocked by Guard |
| **Utility Cards** | 10 | 22 | Persistent cards (max 3 in play, 1 use/turn). 3x Well, 3x Drums, 2x each of 8 others |

### 2.4 Six Ware Types
| Code | Ware | Notes |
|------|------|-------|
| K | Trinkets | |
| H | Hides | |
| T | Tea | |
| L | Silk | |
| F | Fruit | |
| S | Salt | |

All ware tokens are equal -- they have no inherent per-type value. Prices are set per card:

| Category | Wares | Buy | Sell | Margin | Copies |
|----------|-------|-----|------|--------|--------|
| All six types | 6 (KHTLFS) | 10g | 18g | +8g | 4 |
| Three of a kind | 3 | 3g | 10g | +7g | 12 (2 per type) |
| Pair + one | 3 | 4g | 11g | +7g | 12 (2 per combo) |
| Three different | 3 | 5g | 12g | +7g | 12 (2 per combo) |

Every ware card can be used to **buy** (pay gold, receive wares) **or sell** (return wares, receive gold). The player chooses when playing.

### 2.5 Core Economic Loop
```
Buy Wares (spend gold) → Trade via Shaman (reposition) → Sell Wares (earn gold)
```
The Shaman card is the key trading mechanic: trade ALL wares of one type for the same number of a different type from supply. Combined with buy/sell, this is the primary gold generation engine.

### 2.6 Winning Conditions & Endgame
- **Trigger**: When a player ends their turn with >= 60 gold, endgame activates
- **Final Turn**: The opponent gets exactly 1 final turn with 5 actions
- **Winner**: Player with the most gold after the final turn
- **Tie-breaking**: Ties go to the final-turn player (not the trigger player)
- Endgame checks are paused during pending interactions (auctions, drafts, etc.)
- The final-turn player does NOT trigger a recursive endgame even if they exceed 60g

### 2.7 Deck Exhaustion
- When the draw deck is empty and the discard pile has cards, shuffle the discard pile to form a new deck
- If both deck and discard are empty, a deadlock state is reached (rare edge case)
- Reshuffle resets AI deck probability estimates

### 2.8 Key Card Interactions
- **Guard** (People, Reaction, x6): Cancel any animal card -- both cards discarded.
- **Rain Maker** (People, Reaction, x3): After opponent buys/sells, take that ware card from the discard pile to your hand.
- **Shaman** (People, x2): Trade ALL of one ware type for same count of different type from supply.
- **Elephant** (Animal, x1): Both players pool all wares, then draft alternating picks (active player first).
- **Crocodile** (Animal, x5): Use 1 of opponent's utility once for free, then discard it.
- **Throne** (Utility, x2): Swap 1 ware from your market with 1 from opponent's.
- **Traveling Merchant** (People, x2): Auction 2 of your wares between both players.
- **Tribal Elder** (People, x2): Choose "draw to 5 cards" OR "opponent discards to 3 cards".
- **Psychic** (People, x2): Look at top 6 deck cards, take 1, replace rest in order.
- **Dancer** (People, x2): Select any ware card from hand, sell any 3 wares at that card's sell price.

See `docs/CARD_REFERENCE.md` for the complete card reference (110 cards).

---

## 3. Functional Requirements

### 3.1 Game Modes
| Mode | Priority | Description |
|------|----------|-------------|
| **Single Player vs AI** | P0 (MVP) | Play against AI with 3 difficulty levels |
| **Hotseat (Local 2P)** | P1 | Two players share one device, take turns |
| **Online Multiplayer** | P2 | Real-time online play via Firebase |

### 3.2 AI Opponent
- **3 Difficulty Levels**:
  - **Easy**: ~30% win rate, random legal moves with basic heuristics, 500ms think time
  - **Medium**: ~55% win rate, heuristic scoring + 1-turn lookahead, 1.2s think time
  - **Hard**: ~75% win rate, Monte Carlo Tree Search (3-ply), market optimization, 2.5s think time
- AI handles all 110 cards (51 unique designs) via 15 specialized resolver handlers
- Phase-based strategy: Early game (build), Mid game (trade), Late game (endgame positioning)
- AI decision scoring: Gold Efficiency (40%), Market Health (25%), Opponent Pressure (20%), Hand Health (15%)
- Progressive difficulty unlock: Easy from game 1, Medium at game 5, Hard at game 10

### 3.3 Card Engine (110 Cards / 51 Unique Designs, 15 State Models)
Every card must be fully implemented with:
- **State Model**: One of 15 defined interaction types (NONE, ACTIVE_SELECT, OPPONENT_SELECT, AUCTION, DRAFT, REACTION, WARE_TRADE, BINARY_CHOICE, DECK_PEEK, etc.)
- **Flow Steps**: Defined step-by-step resolution sequence
- **Validation Rules**: Pre-conditions checked before play (gold, slots, wares, etc.)
- **UI Prompts**: Exact prompt text for player interactions
- **AI Heuristic**: Decision logic for the AI opponent
- Cards use a `pendingResolution` system for multi-step interactions

### 3.4 Marketplace & Ware System
- 6 ware slots per player, each holding one ware token
- 6th slot incurs -2g penalty when filled
- Ware supply tracking (finite supply pool)
- Visual representation of market stands with drag-drop interaction
- Buy, sell, trade, steal, and draft operations on wares

### 3.5 Save/Load System
- Auto-save game state to IndexedDB
- Manual save/load slots
- Game state serialized as ~2.1KB JSON (logical IDs only, no asset paths)
- 7-layer deserialization validation pipeline (JSON parse, Zod schema, version migration, HMAC integrity, 27 game rule invariants, normalization, asset prefetch)
- Corrupt saves gracefully degrade to fresh game state

### 3.6 Game State Integrity
- 27 invariant checks: actions <= 5, hand <= 12, utilities <= 3, market <= 9 slots, total cards = 110, ware supply <= 180, gold 0-200, etc.
- Immutable state updates (no mutation)
- Seeded RNG for reproducible shuffles

---

## 4. Non-Functional Requirements

### 4.1 Platform & Deployment
- **PWA** (Progressive Web App): iOS, Android, Desktop via browser
- Offline-capable after first load (Service Worker caching)
- No app store requirement (installable from browser)
- Target: modern browsers (Chrome, Safari, Firefox, Edge)

### 4.2 Performance
| Metric | Target |
|--------|--------|
| First Playable | < 2 seconds |
| Full Load | < 6 seconds |
| Card Render | < 16ms |
| Touch Latency | < 50ms |
| Animation FPS | 60fps |
| AI Turn Time | < 2.5s (Hard), < 500ms (Easy) |
| State Serialize | < 2ms |
| State Deserialize | < 2ms |
| Memory Usage | < 128MB |
| Online Turn Latency | < 200ms |

### 4.3 Responsive Design
| Breakpoint | Layout |
|-----------|--------|
| Desktop (>1024px) | Side-by-side markets, full card fan |
| Tablet (768-1024px) | Vertical stack, card carousel |
| Mobile (<768px) | Compact layout, icon-only market, swipe gestures |

### 4.4 Accessibility (WCAG AA Target)
- Color-blind mode: distinct patterns + icons for each ware type
- Keyboard navigation for all interactions
- Screen reader ARIA labels (165 text entries)
- Minimum 48dp touch targets
- Information density slider (Minimal / Standard / Verbose / Debug)
- Adaptive tooltips based on player skill level

### 4.5 Offline Support
- 100% offline play after first load
- 5-tier asset caching: Memory (WeakMap) → Canvas Atlas (GPU) → IndexedDB → Service Worker → CDN
- Missing assets fall back to SVG text rendering

### 4.6 Localization (Post-MVP)
- 153+ translatable text entries (51 unique card designs x 3 lines)
- RTL support for Arabic/Hebrew
- Date/number formatting

---

## 5. Assets & Visual Design

### 5.1 Required Assets
| Category | Count | Size |
|----------|-------|------|
| Card PNGs (@2x) | 51 unique designs | 825x1125px each |
| Ware Tokens | 6 | 120x120px each |
| Gold Tokens | 2 | Various |
| Market Stands | 7 | 2 large + 5 small |
| Action Markers | 5 | Various |
| Backgrounds | 4 | Scene art |
| Card Back | 1 | 825x1125px |

### 5.2 Visual States (Auto-Generated)
Each card has 5 states: Normal, Hover (+glow +scale), Selected (+lift +shadow), Disabled (-30% opacity +grayscale), Used (flip 180deg). Total: 275 state variants.

### 5.3 Color Palette
- Market Brown: #8B4513
- Gold: #FFD700
- Tea Green: #90EE90
- Silk Purple: #DDA0DD
- Hide Red: #CD5C5C

### 5.4 Animation System
- Physics-based animations (spring easing, bounce curves)
- 200-800ms durations, 50ms stagger delays
- Audio synced to animation keyframes
- 4 speed modes: Casual (100%), Expert (50%), Turbo (25%), Cinematic (150%)
- All animations skippable (spacebar / double-tap)
- Haptic feedback: light (card snap), medium (gold earn), heavy (Elephant), sharp (Guard)

---

## 6. Testing Requirements

### 6.1 Test Coverage
| Category | Test Cases |
|----------|-----------|
| Card Tests (110 cards / 51 designs) | 275+ |
| Edge Case Tests | 412 |
| Ware Theft Tests | 35 |
| Opponent Discard Tests | 28 |
| Reshuffle Tests | 22 |
| Deserialization Tests | 187 |
| **Total** | **~960** |

### 6.2 Quality Gates
- 100% pass rate required (any failure is blocking)
- < 10ms per test average
- Full suite runs in < 10 seconds
- AI: 100% legal move compliance across 1000 test games per difficulty
- AI win rate targets verified statistically

---

## 7. Post-MVP Roadmap
| Version | Target | Features |
|---------|--------|----------|
| v1.0 | Mar 7 | AI singleplayer (3 difficulties) + Hotseat PvP + Online PvP |
| v1.1 | Mar 21 | Social features (friends, match history) |
| v1.2 | Apr 11 | Chromecast tabletop experience |
| v1.3 | May 2 | Tournaments & leaderboards |
| v2.0 | TBD | Expansion 1 cards (40 new cards) |
| v2.1 | TBD | Expansion 2 cards (40 new cards) |

---

## 8. Success Criteria
- 95% player win rate vs Easy AI
- < 2 minutes to first victory (Easy AI)
- 60fps with 20 cards visible on screen
- Zero hotseat desyncs
- < 200ms online turn latency
- 960/960 tests passing
- Full offline play capability
- Sub-2-second first playable load time
