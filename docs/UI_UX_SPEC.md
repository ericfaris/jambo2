# UI/UX Specification

Last reviewed: 2026-02-15

## UX Goals

- Fast readability of hand, market, gold, and actions remaining
- Clear interaction prompts during `pendingResolution`
- Reliable fallback paths when no user selection is possible

## Core UI Surfaces

- Game screen layout and turn context
- Hand display and card interaction controls
- Market displays for both players
- Interaction panel for resolver prompts

## Interaction Rules

- Every resolver type must map to a visible and actionable UI state
- Empty-option states must show explicit Continue behavior when auto-resolve applies
- UI labels should match card and ware names used by the engine

## Responsiveness

- Desktop-first with support for tablet/mobile compact layouts
- Avoid hidden state transitions; all critical turn changes should be visible
