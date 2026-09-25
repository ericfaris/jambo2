# Jambo — Design System

**Live showcase**: run `npm run dev` and open `/design-system.html` — every
token/component on that page is read from `src/index.css` and the app's real
classes at runtime, not re-typed.

## Direction

**"African Market" — warm wood, hand-tooled leather, market gold.** The
palette is drawn from a market stall at late afternoon: dark cocoa-wood
backgrounds, aged brass/gold accents, cream linen card stock, and the six
saturated ware colors (trinkets/hides/tea/silk/fruit/salt) that carry the
game's core resource identity. Type is a single serif (Judson) used for both
display and body, giving the whole app the feel of a hand-lettered market
ledger rather than a modern app UI.

The direction was already established in the codebase before this pass
(illustrated card art for all 51 unique designs, a full wood/gold token set,
five looping background-music tracks, an etched-wood-border motif, and an
extensive animation-timing system for market/gold/pile feedback). This pass
**documents that system for the first time**, makes it visible via a live
showcase page, fixes one real inconsistency (see Changelog), and flags one
functional gap that needs a follow-up (missing SFX files — see Sound).

Key moments the system already leans into:
- **Game start** — the "Welcome to the Market" / "You go first" reveal
  screens, using the full-bleed Jambo title illustration.
- **A ware trade** — the buy/sell dialog, card art + coin art + ware-color
  pips on linen card stock.
- **A gold change** — `gold-pop` / `gold-delta` float animations on the
  player's gold total.
- **An animal attack** — `attack` audio event + market/pile flash animations
  (Guard can cancel it).
- **Turn end** — `turn-end` audio event + phase pulse.

## Color

All tokens live in `src/index.css` under `:root`. Values below are the
default theme; `:root[data-contrast='high']` overrides a subset for a
higher-contrast mode (see Accessibility).

| Token | Value | Role |
|---|---|---|
| `--bg` | `#1e1208` | Page background (near-black cocoa) |
| `--surface` | `#2d1c12` | Panel/card surfaces |
| `--surface-light` | `#3d2a1a` | Raised surface variant |
| `--surface-accent` | `#4a3522` | Highlighted surface variant |
| `--text` | `#e8dcc8` | Primary text (warm cream) |
| `--text-muted` | `#a89070` | Secondary/label text |
| `--gold` | `#d4a850` | Primary accent — CTAs, focus rings, emphasis glow |
| `--gold-dim` | `#b88a38` | Recessed gold (borders, dim accents) |
| `--border` | `#5a4030` | Default hairline border |
| `--border-light` | `#7a5a3e` | Lighter hairline (hover, scrollbar thumb) |
| `--teal` | `#4a90a0` | Secondary interactive accent |
| `--teal-hover` | `#5aa0b0` | Teal hover state |
| `--accent-red` | `#c04030` | Danger/negative accent |
| `--accent-green` | `#6a8a40` | Positive accent |

**Ware colors** (map 1:1 to the 6 physical ware tokens in
`public/assets/tokens/`):

| Token | Value | Ware |
|---|---|---|
| `--ware-trinkets` | `#c2a8e0` | Trinkets (lavender) |
| `--ware-hides` | `#c29f7a` | Hides (tan) |
| `--ware-tea` | `#b1a64b` | Tea (olive) |
| `--ware-silk` | `#d45a4d` | Silk (red) |
| `--ware-fruit` | `#f3c35b` | Fruit (amber) |
| `--ware-salt` | `#fafafa` | Salt (white) |

**Card-type colors** (header accent per card type in `CardFace.tsx`):

| Token | Value | Card type |
|---|---|---|
| `--card-people` | `#5a8ab0` | People |
| `--card-animal` | `#D4A574` | Animal |
| `--card-utility` | `#6a9a50` | Utility |
| `--card-ware` | `#C9A84C` | Ware |
| `--card-stand` | `#8B7355` | Small Market Stand |

**High-contrast mode** (`data-contrast="high"`) brightens `--text`,
`--text-muted`, `--border`, `--border-light`, `--gold` and darkens
`--surface*` slightly, for better legibility without changing the palette's
character.

Contrast: `--text` (`#e8dcc8`) on `--bg` (`#1e1208`) is ~13.7:1 — comfortably
AA/AAA for body text. `--text-muted` on `--bg` is ~6.2:1 — AA for normal text.
`--gold` on `--bg` is ~7.9:1.

## Type

Single family for both display and body — **Judson** (serif), self-hosted:

```css
--font-heading: 'Judson', Georgia, serif;
--font-body: 'Judson', Georgia, serif;
```

Files (in `public/assets/fonts/`, loaded via `@font-face` in `src/index.css`):
- `Judson-Regular.ttf` — weight 400, normal
- `Judson-Italic.ttf` — weight 400, italic
- `Judson-Bold.ttf` — weight 700, normal

All three declare `font-display: swap`. Fallback stack is `Georgia, serif` —
a metrically-similar serif so layout doesn't jump before Judson loads.

There is no formal numeric type scale (no `--font-size-*` tokens) — sizes are
set per-component in px, in a narrow practical range:

| Size | Used for |
|---|---|
| 12px | `.ui-helper-text`, `.disabled-hint` — smallest supporting text |
| 13px | `.center-row-recap` — center-row action recap |
| 14px | `.panel-section-title`, `.ui-prompt-text` — section labels, prompts |
| 1rem (16px) | Default body text, buttons |
| Larger (component-set) | Headings (`h1`–`h6`), inherit `--font-heading` at whatever size the component sets |

`h1`–`h6` share `line-height: 1.2` and `letter-spacing: 0.012em`. Body text
uses `line-height: 1.45` and `letter-spacing: 0.01em` (set on `:root`/body).

## Spacing & Radius

No formal spacing scale token set — components use literal px values
(4/6/8/10px small gaps, 12–18px section gaps). The two radius values that
recur as the system's actual "scale":

| Radius | Used for |
|---|---|
| `4px` | Scrollbar thumb/track |
| `7px` | `.center-row-recap` |
| `8px` | Card art / mega-view art corners |
| `10px` | Cards, dialogs (small), panels |
| `14px` | Dialogs (large) — `CardPlayDialog`, draw dialog, `PanelShell` |
| `999px` (pill) | `.center-row-action-tag` |

## Shadow

No token set — shadows are composed inline per component from a consistent
palette of black-alpha values:
- Small lift: `0 2px 6px rgba(0,0,0,0.3)` – `0 2px 8px rgba(0,0,0,0.3)`
- Card/panel: `0 4px 12px–16px rgba(0,0,0,0.24–0.3)`
- Dialog (large): `0 8px 32px rgba(0,0,0,0.45–0.5)`
- Gold emphasis glow: `0 0 24px rgba(212,168,80,0.35)` (`.turn-emphasis-active`)
- Inset "etched" bevel: `inset 0 1px 0 rgba(232,220,200,0.08), inset 0 -1px 0 rgba(15,8,4,0.4)` (`.etched-wood-border`)

## Motion

All duration/easing tokens live in `:root` and are overridden wholesale under
`:root[data-anim-speed='fast']` (roughly 65–75% of default duration). Every
animation respects `prefers-reduced-motion: reduce`, which disables all of
the decorative pulse/flash/float/trail animations outright (see the
`@media` block at the bottom of `index.css`).

**Easings:**
| Token | Curve | Use |
|---|---|---|
| `--anim-ease-standard` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Default for most transitions/animations |
| `--anim-ease-emphasis` | `cubic-bezier(0.18, 0.89, 0.32, 1.12)` | Overshoot — pulses/pops that need a "snap" |

**Base durations:**
| Token | Default | Fast mode | Use |
|---|---|---|---|
| `--motion-fast` | 150ms | 110ms | Micro-interactions (button hover, border-color) |
| `--motion-base` | 220ms | 160ms | Standard transitions (turn-emphasis glow) |
| `--motion-slow` | 320ms | 220ms | Slower/larger transitions |

**Named event durations** (each has a `-soft`/base/`-strong` trio, tuned per
how big the underlying event is):
| Token family | Default range | Fires on |
|---|---|---|
| `--anim-trail-duration` | 920ms | Card draw/discard trail across the center row |
| `--anim-discard-reveal-delay` | 920ms | Discard pile reveal |
| `--anim-action-tag-duration` | 1100ms | "Played X" tag over the center row |
| `--anim-pile-pulse(-soft/-strong)` | 450–720ms | Deck/discard pile pulse on draw/discard |
| `--anim-phase-pulse` | 450ms | Phase indicator pulse on phase change |
| `--anim-market-flash(-soft/-strong)` | 850–1000ms | Market slot flash on ware add/remove |
| `--anim-gold-pop(-soft/-strong)` | 320–550ms | Gold total "pop" scale on change |
| `--anim-gold-delta(-soft/-strong)` | 950–4500ms | Floating +/-Ng delta text/arrow |

Keyframes are named descriptively (`pilePulse`, `marketSlotFlash`,
`goldDeltaArrowUp/Down`, `trailDrawTop/Bottom`, `trailDiscardTop/Bottom`,
`tvActionTagFade`, etc.) — see `src/index.css` for the full set.

## Components

- **Buttons** — base style: `--font-heading`, 10px radius, subtle white-alpha
  fill, gold border+tint on hover, 0.4 opacity when disabled.
  - `.primary` — green outline/fill, for the affirmative action (Buy, confirm).
  - `.danger` — red outline/fill, for negative/destructive actions.
  - `.brown` — warm-brown outline/fill, tertiary action.
  - Focus-visible on all interactive elements: 2px gold outline, 2px offset.
- **Cards (`CardFace.tsx`)** — art-backed where available (53 of 51 unique
  designs have art in `public/assets/cards/`, ware variants share a few
  images), linen-textured fallback face otherwise; type-colored header
  accent bar; four size variants (`small`/`medium`/default/`large`/
  `extraLarge`); lift-on-hover when clickable; gold ring when `selected`.
- **Card back** — dedicated `card_back.png` art (woven-basket motif), used
  for the deck and any face-down card.
- **Dialogs** (`CardPlayDialog`, draw-card dialog, `MegaView`, `PanelShell`)
  — consistent shape: dark scrim overlay (`overlay-fade`) → `linen-texture`
  panel with `dialog-pop`/`panel-slide` entrance, 2px `#a89880` border, large
  dialog shadow, card art + coin art + ware-color pips laid out the same way
  across buy/sell, resolution panels, and the zoom view.
- **`.etched-wood-border`** — a reusable bevel/border treatment (inset
  highlight + inset shadow + drop shadow) for wood-panel-style containers.
- **Turn emphasis** (`.turn-emphasis-active`/`-inactive`) — gold glow +
  border on the active player's panel, dimmed opacity on the inactive one.
- **Action tags / recap** (`.center-row-action-tag`, `.center-row-recap`) —
  pill/rounded-rect labels over the center row announcing the last action,
  gold-bordered when it's the opponent's.

## Backgrounds & Texture

- **Page background**: `wood_1.png` (a wood-grain panel photo/illustration)
  under a dark scrim (`rgba(20,10,5,0.85)` double-layered), `background-size:
  cover`, fixed to `--bg` as fallback.
- **Main menu background**: `main_menu.png` at 25% opacity behind the menu
  content, over the same dark scrim.
- **`.linen-texture`** (added this pass, see Changelog) — a 4-layer CSS
  crosshatch gradient (`0deg`/`90deg` at 0.08 alpha, `135deg`/`45deg` at 0.04
  alpha, 1–1.5px tile) over an `#e8e4df` base — the cream "card stock" finish
  used on every ware-card face and every dialog/panel body. Defined once in
  `src/index.css`; apply via `className="linen-texture"` rather than
  reconstructing the gradient inline.

## Generated Art Inventory

All illustrated art already existed in the repo before this pass (not
generated during it). For reference/continuity, the visual register is:
warm painterly illustration, African-market subject matter (people, produce,
textiles, wildlife), consistent linework and palette across all pieces.

| Path | Role |
|---|---|
| `public/assets/menu/main_menu.png` | Main menu backdrop |
| `public/assets/panels/wood_1.png` | Page background wood panel |
| `public/assets/cards/*.png` (53 files) | Per-card-design illustrations + `card_back.png` + `cards_fanned_out.png` (tutorial/menu use) |
| `public/assets/tokens/{trinkets,hides,tea,silk,fruit,salt}.png` | Ware token icons |
| `public/assets/coins/coin_{3,4,5,10,11,12,18}.png`, `coins.png` | Gold-value coin art used in buy/sell dialogs |
| `public/assets/bubble/speech_bubble.png` | AI/opponent speech bubble chrome |

## Sound

**Background music** (`useBackgroundMusic.ts`) — 5 tracks in
`public/audio/`, shuffled into a playlist, one DOM-attached `<audio>`
element (required for Chromecast compatibility), 0.15 base volume, singleton
guard against double-playback:
- `African_Village_Afternoon_Soundscape.mp3`
- `Market_Morning_Mosaic.mp3`
- `River_Paths_Village_Hearts_Voice.mp3`
- `Sun_In_Our_Hands.mp3`
- `Sun_on_the_Courtyard.mp3`

**SFX (`useAudioEvents.ts`, Cast/multiplayer mode)** — the server
(`multiplayer/server.ts:detectAudioEvent`) already maps game actions to 6
named events and broadcasts them to both the Player and TV screens, and the
client hook already has the file-path table wired:

| Event | Fires on | Expected file |
|---|---|---|
| `card-draw` | `DRAW_CARD` / `KEEP_CARD` / `DRAW_ACTION` | `/audio/sfx/card-draw.mp3` |
| `coin` | Playing a ware card | `/audio/sfx/coin.mp3` |
| `card-play` | Playing a non-ware, non-animal card | `/audio/sfx/card-play.mp3` |
| `attack` | Playing an animal card | `/audio/sfx/attack.mp3` |
| `turn-end` | `END_TURN` | `/audio/sfx/turn-end.mp3` |
| `guard` | Guard reaction played | `/audio/sfx/guard.mp3` |

**Known gap (not fixed this pass):** none of the 6 `public/audio/sfx/*.mp3`
files exist yet — the hook fails silently (`audio.play().catch(() => {})`)
so this is invisible in normal play, but Cast-mode SFX are currently no-ops.
An attempt to generate them via ElevenLabs during this pass hit the
account's credit quota (0 credits remaining) — **follow-up**: re-run the
generation (prompts and mapping above are ready to go) once quota renews, or
source 6 short clips manually into `public/audio/sfx/`.

Volume/mute are user-controlled and persisted via `audioSettings.ts`
(`localStorage`, keys `jambo.volume`/`jambo.muted`), read by both hooks
through `getEffectiveVolume()`.

## Accessibility

- **Contrast**: default theme is already high-contrast by nature (dark wood
  + cream text); a `data-contrast="high"` mode exists for further brightening.
- **Focus**: every interactive element gets a 2px gold `outline` with 2px
  offset on `:focus-visible`.
- **Reduced motion**: `prefers-reduced-motion: reduce` disables every
  decorative animation (pulses, flashes, floats, trails, action tags) via a
  single `@media` block — motion is purely additive polish, never load-bearing
  for reading game state.
- **Mute control**: `audioSettings.ts` exposes mute/volume, surfaced in the
  Settings screen.

## Asset Inventory (this pass)

| File | Role | Status |
|---|---|---|
| `public/audio/sfx/{coin,card-play,card-draw,turn-end,attack,guard}.mp3` | Cast-mode SFX | **Not generated** — ElevenLabs quota exhausted; follow-up needed |
| `design-system.html` | Static showcase page, tokens/components rendered live from `src/index.css` | Added this pass |

No new illustrated art, fonts, or background music were generated — the
existing set already covers the full identity; this pass's job was
documenting it, fixing one duplication, and identifying the SFX gap.

## Changelog

### 2026-09-24 — Initial `DESIGN.md`, showcase page, linen-texture consolidation
- Wrote this document from scratch (none existed before) by reading
  `src/index.css`, `CardFace.tsx`, `ActionButtons.tsx`, `InteractionPanel.tsx`,
  `MegaView.tsx`, the audio hooks, and the asset directories.
- **Fixed**: the "linen finish" background (crosshatch gradient over an
  `#e8e4df` base) was hand-duplicated as local `LINEN_BG`/`LINEN_BG_SIZE`/
  `LINEN_BASE` constants in 6 separate places across `CardFace.tsx`,
  `ActionButtons.tsx` (×2), `InteractionPanel.tsx` (×2), and `MegaView.tsx`.
  Consolidated into a single `.linen-texture` class in `src/index.css`;
  all 6 call sites now use `className="linen-texture"`. Purely a
  consistency/maintainability fix — no visual change.
- **Identified but not fixed**: `useAudioEvents.ts` / `server.ts` wire a
  complete SFX system end-to-end, but the 6 audio files it expects don't
  exist in the repo. Generation attempted via ElevenLabs, blocked by
  account credit quota — see Sound section for the exact prompts/mapping to
  use on retry.
- Added `design-system.html` as a static, build-step-free showcase of the
  above tokens/components, pulling real values from `src/index.css`.
