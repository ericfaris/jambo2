# Asset Pipeline

Last reviewed: 2026-02-15

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
- Use URL-safe audio file names only: lowercase/uppercase letters, numbers, and underscores.
- Do not use spaces or punctuation in audio file names for Cast playback paths.

## Pipeline Requirements

- Keep file names deterministic and code-aligned
- Prefer web-friendly compressed formats and bounded file sizes
- Validate missing assets with graceful fallback behavior in UI
- Chromecast troubleshooting note:
  - If TV logs show `NotSupportedError: The element has no supported sources` plus `DEMUXER_ERROR_COULD_NOT_OPEN`, verify the audio file path first.
  - Space-containing file names can be URL-encoded and miss static-file lookup in production, returning HTML/404 instead of audio.

For detailed preparation checklists and dimensions, see legacy reference in `docs/archive/ASSET_PREPARATION_GUIDE.md`.
