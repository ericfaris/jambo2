# Asset Pipeline

_Last reviewed: 2026-02-15_

## Scope

This document defines practical asset preparation and integration for cards, tokens, backgrounds, and audio.

## Card Assets

- 51 unique card face designs plus 1 card back
- Naming follows design IDs used by engine/UI mappings
- Store card image assets under `public/assets/cards/`

## Token and Coin Assets

- Ware tokens live under `public/assets/tokens/`
- Coin overlays live under `public/assets/coins/`
- Naming must stay consistent with UI lookup conventions

## Background and Audio

- Backgrounds under `public/assets/backgrounds/`
- Optional SFX under `public/audio/`

## Pipeline Requirements

- Keep file names deterministic and code-aligned
- Prefer web-friendly compressed formats and bounded file sizes
- Validate missing assets with graceful fallback behavior in UI

For detailed preparation checklists and dimensions, see legacy reference in `docs/archive/ASSET_PREPARATION_GUIDE.md`.
