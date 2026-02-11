# Jambo Digital - Asset Preparation Guide

This document is the step-by-step workflow for preparing all game assets before integration into the codebase. Follow each section in order.

---

## Quick Reference: Standards

| Asset Type | Source Dimensions | Display Size | Format | Max File Size |
|---|---|---|---|---|
| Card illustrations | 360x480px | 90x120 / 60x80 | PNG, transparent bg | 150KB |
| Card back | 360x480px | 90x120 / 60x80 | PNG | 100KB |
| Ware tokens | 128x128px | 32x32 | PNG, transparent bg | 30KB |
| Backgrounds | 2400x1600px | CSS cover | JPG, 80% quality | 300KB |
| Audio SFX | n/a | n/a | MP3 (128kbps) or OGG | 100KB |

**Why these sizes?** Source files are 4x the largest display size (90x120), giving sharp rendering on 2x/retina displays with room for zoom effects. The UI never renders cards larger than 90x120px.

---

## 1. Card Illustrations (51 unique designs)

### 1.1 What You Need

Cards share the same art across all copies of a design. You need **one illustration per unique design**, not per physical card.

**Ware Cards (19 designs):**

| Design ID | Card Name | Wares | Copies |
|---|---|---|---|
| `ware_6all` | Grand Market | K+H+T+L+F+S | 4 |
| `ware_3k` | 3 Trinkets | K+K+K | 2 |
| `ware_3h` | 3 Hides | H+H+H | 2 |
| `ware_3t` | 3 Tea | T+T+T | 2 |
| `ware_3l` | 3 Silk | L+L+L | 2 |
| `ware_3f` | 3 Fruit | F+F+F | 2 |
| `ware_3s` | 3 Salt | S+S+S | 2 |
| `ware_2k1f` | 2 Trinkets + Fruit | K+K+F | 2 |
| `ware_2l1s` | 2 Silk + Salt | L+L+S | 2 |
| `ware_2t1l` | 2 Tea + Silk | T+T+L | 2 |
| `ware_2s1k` | 2 Salt + Trinkets | S+S+K | 2 |
| `ware_2f1h` | 2 Fruit + Hides | F+F+H | 2 |
| `ware_2h1t` | 2 Hides + Tea | H+H+T | 2 |
| `ware_slk` | Salt+Silk+Trinkets | S+L+K | 2 |
| `ware_khl` | Trinkets+Hides+Silk | K+H+L | 2 |
| `ware_skf` | Salt+Trinkets+Fruit | S+K+F | 2 |
| `ware_fht` | Fruit+Hides+Tea | F+H+T | 2 |
| `ware_tsf` | Tea+Salt+Fruit | T+S+F | 2 |
| `ware_lht` | Silk+Hides+Tea | L+H+T | 2 |

**People Cards (13 designs):**

| Design ID | Card Name | Copies |
|---|---|---|
| `guard` | Guard | 6 |
| `rain_maker` | Rain Maker | 3 |
| `shaman` | Shaman | 2 |
| `psychic` | Psychic | 2 |
| `tribal_elder` | Tribal Elder | 2 |
| `wise_man` | Wise Man from Afar | 2 |
| `portuguese` | Portuguese | 2 |
| `basket_maker` | Basket Maker | 2 |
| `traveling_merchant` | Traveling Merchant | 2 |
| `arabian_merchant` | Arabian Merchant | 2 |
| `dancer` | Dancer | 2 |
| `carrier` | Carrier | 1 |
| `drummer` | Drummer | 1 |

**Animal Cards (8 designs):**

| Design ID | Card Name | Copies |
|---|---|---|
| `crocodile` | Crocodile | 5 |
| `parrot` | Parrot | 2 |
| `hyena` | Hyena | 2 |
| `snake` | Snake | 1 |
| `elephant` | Elephant | 1 |
| `ape` | Ape | 1 |
| `lion` | Lion | 1 |
| `cheetah` | Cheetah | 1 |

**Utility Cards (10 designs):**

| Design ID | Card Name | Copies |
|---|---|---|
| `well` | Well | 3 |
| `drums` | Drums | 3 |
| `throne` | Throne | 2 |
| `boat` | Boat | 2 |
| `scale` | Scale | 2 |
| `mask_of_transformation` | Mask of Transformation | 2 |
| `supplies` | Supplies | 2 |
| `kettle` | Kettle | 2 |
| `leopard_statue` | Leopard Statue | 2 |
| `weapons` | Weapons | 2 |

**Other (1 design):**

| Design ID | Card Name | Copies |
|---|---|---|
| `small_market_stand` | Small Market Stand | 5 |

**Plus 1 card back** (shared by all cards).

**Total: 52 image files** (51 card faces + 1 card back)

### 1.2 Card Art Specifications

```
Source file: 360 x 480 px (3:4 aspect ratio)
Color mode:  sRGB
Background:  Transparent PNG
Bit depth:   8-bit (24-bit color + 8-bit alpha)
DPI:         72 (web only, DPI doesn't matter — pixel dimensions do)
```

**Illustration area within the card:**
The code renders a type-colored header bar at the top (~20px at display size) and a ware info strip at the bottom for ware cards (~30px at display size). Your illustration should be the central area — roughly the middle 70% of the card height. However, since the code composites the header/footer programmatically over the image, you have two options:

- **Option A (recommended):** Provide just the illustration portion (360x340px for regular cards, 360x280px for ware cards). The code will place it in the card body area.
- **Option B:** Provide full 360x480px card images with all text/borders baked in. The code will use the image as-is and skip the programmatic header/footer.

Choose one approach and be consistent across all cards.

### 1.3 Naming Convention

Files must match the design ID exactly:

```
public/assets/cards/
  ware_6all.png
  ware_3k.png
  ware_3h.png
  ...
  guard.png
  rain_maker.png
  ...
  crocodile.png
  parrot.png
  ...
  well.png
  drums.png
  ...
  small_market_stand.png
  card_back.png
```

---

## 2. Ware Tokens (6 icons)

These appear in the market display as 32x32px squares.

| File Name | Ware Type | Current Placeholder Color |
|---|---|---|
| `trinkets.png` | Trinkets (K) | #87CEEB (sky blue) |
| `hides.png` | Hides (H) | #CD5C5C (indian red) |
| `tea.png` | Tea (T) | #90EE90 (light green) |
| `silk.png` | Silk (L) | #DDA0DD (plum) |
| `fruit.png` | Fruit (F) | #FFA500 (orange) |
| `salt.png` | Salt (S) | #E0E0E0 (light gray) |

**Specs:**
```
Source file: 128 x 128 px
Background:  Transparent PNG
Style:       Iconic, easily recognizable at 32px
             Must be distinct from each other at small size
             Should complement the existing color palette
```

**Destination:** `public/assets/wares/`

---

## 3. Card Back (1 image)

Displayed when opponent's cards are face-down and during deck display.

**Specs:**
```
Source file: 360 x 480 px (same as card face)
Background:  Opaque (no transparency)
Style:       African/market theme, should look like a decorative card back
             Current placeholder is a blue gradient with "?" text
```

**Destination:** `public/assets/cards/card_back.png`

---

## 4. Backgrounds (optional, 1-2 images)

The game board background. Currently solid `#1a1a2e` (dark navy).

**Specs:**
```
Source file: 2400 x 1600 px (3:2 landscape)
Format:      JPG at 80% quality (not PNG — too large for photos)
Style:       Muted/dark African marketplace, must not compete with cards
             Should work well under white and gold text
```

**Destination:** `public/assets/backgrounds/`

---

## 5. Audio (optional)

No audio is integrated yet. If you want to prepare SFX:

| Sound | Trigger | Max Duration |
|---|---|---|
| `card_draw.mp3` | Drawing a card | 0.5s |
| `card_play.mp3` | Playing a card from hand | 0.5s |
| `card_discard.mp3` | Discarding a card | 0.3s |
| `coin.mp3` | Gold gained/spent | 0.3s |
| `buy.mp3` | Buying wares | 0.5s |
| `sell.mp3` | Selling wares | 0.5s |
| `turn_end.mp3` | Turn ends | 0.5s |
| `victory.mp3` | Game won | 2-3s |
| `defeat.mp3` | Game lost | 2-3s |

**Specs:**
```
Format:      MP3 (128kbps) or OGG (q5)
Sample rate: 44100 Hz
Channels:    Mono (saves 50% size, SFX don't need stereo)
Normalize:   -3dB peak
```

**Destination:** `public/audio/`

---

## 6. Asset Processing Workflow Checklist

Work through this checklist for each batch of assets.

### Phase 1: Inventory

- [ ] List all raw asset files received/created
- [ ] Confirm 51 unique card face illustrations are present (19 ware + 13 people + 8 animal + 10 utility + 1 stand)
- [ ] Confirm 1 card back illustration is present
- [ ] Confirm 6 ware token icons are present
- [ ] Confirm all file names match design IDs exactly (see Section 1.3)
- [ ] Check for any missing designs against the tables in Section 1.1

### Phase 2: Dimensions & Format

For each image file:

- [ ] Verify card illustrations are 360x480px (or 360x340/280px if Option A)
- [ ] Verify ware tokens are 128x128px
- [ ] Verify backgrounds are 2400x1600px
- [ ] Verify all cards/tokens are PNG with transparency
- [ ] Verify backgrounds are JPG
- [ ] Verify audio files are MP3 or OGG

**Resize if needed.** Always scale down, never up. If source art is larger, scale to target dimensions preserving aspect ratio. If source art is smaller than target, go back to source — upscaling produces blurry results.

Quick batch check (requires ImageMagick):
```bash
# Check all card dimensions at once
identify public/assets/cards/*.png

# Resize any oversized cards to 360x480
mogrify -resize 360x480! public/assets/cards/*.png
```

### Phase 3: Optimization

- [ ] Run all PNGs through an optimizer (pngquant, TinyPNG, or squoosh)
- [ ] Target: cards under 150KB each, tokens under 30KB each
- [ ] Run JPGs through mozjpeg or squoosh at 80% quality
- [ ] Target: backgrounds under 300KB each
- [ ] Verify audio files are under 100KB each

```bash
# Batch optimize PNGs with pngquant (lossy, excellent quality)
pngquant --quality=65-90 --ext .png --force public/assets/cards/*.png
pngquant --quality=65-90 --ext .png --force public/assets/wares/*.png
```

### Phase 4: Visual QA

Open each asset and check:

- [ ] Card illustrations are not clipped or cropped incorrectly
- [ ] Card illustrations have consistent style across all 51 designs
- [ ] Ware token icons are easily distinguishable at 32x32px display size
- [ ] Ware token icons work on both light and dark backgrounds
- [ ] Card back looks good at 90x120px and 60x80px display size
- [ ] Background doesn't make text unreadable (check contrast)
- [ ] No visible compression artifacts on any asset
- [ ] Transparency is clean (no white halos or fringing on edges)

Quick check: open the game with `npm run dev` and compare each card side-by-side with the text-only placeholder to make sure nothing is misaligned.

### Phase 5: File Placement

- [ ] Copy card faces to `public/assets/cards/`
- [ ] Copy card back to `public/assets/cards/card_back.png`
- [ ] Copy ware tokens to `public/assets/wares/`
- [ ] Copy backgrounds to `public/assets/backgrounds/`
- [ ] Copy audio to `public/audio/`
- [ ] Verify directory structure matches:

```
public/
  assets/
    cards/
      ware_6all.png
      ware_3k.png
      ...all 51 card faces...
      card_back.png
    wares/
      trinkets.png
      hides.png
      tea.png
      silk.png
      fruit.png
      salt.png
    backgrounds/
      main.jpg
    components/       (reserved for future UI chrome)
    tokens/           (reserved for future gold tokens)
  audio/
    card_draw.mp3
    card_play.mp3
    ...etc...
```

### Phase 6: Final Validation

- [ ] Total card face files: 51
- [ ] Total ware token files: 6
- [ ] Total card back files: 1
- [ ] No files larger than 300KB
- [ ] No PNG files without transparency (except card back)
- [ ] All file names are lowercase with underscores (no spaces, no capitals)
- [ ] Run `npm run dev` and verify assets load without 404 errors (check browser console)
- [ ] Spot-check 5+ cards at both normal (90x120) and small (60x80) sizes
- [ ] Verify ware tokens render correctly in market grid

---

## Summary: File Count

| Category | Files | Location |
|---|---|---|
| Card faces | 51 | `public/assets/cards/` |
| Card back | 1 | `public/assets/cards/` |
| Ware tokens | 6 | `public/assets/wares/` |
| Backgrounds | 1-2 | `public/assets/backgrounds/` |
| Audio SFX | 0-9 | `public/audio/` |
| **Total** | **59-69** | |
