# Serialization and Validation

Last reviewed: 2026-02-15

## Goals

- Persist game state safely
- Detect and reject invalid/corrupt states
- Preserve compatibility through schema/version changes

## Requirements

- Serialization must capture logical game state, not UI rendering state
- Deserialization must validate structural and rules-level constraints
- Invalid saves must fail safely without crashing the app

## Validation Layers

- Schema validation
- Domain checks (actions, limits, card counts, ownership)
- Invariant checks before loaded state is accepted

## Determinism

- RNG and state serialization should support reproducible simulation/testing workflows
