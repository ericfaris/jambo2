# AI Telemetry Plan

This document defines why AI telemetry exists, what we log, and how we use game data to improve AI quality over time.

## Purpose

AI tuning is currently driven by hand-authored heuristics and soak tests. Telemetry adds real decision data so we can:

- find where Hard AI loses value (reaction timing, interaction choices, combo setup),
- tune weights using observed outcomes instead of intuition only,
- prevent regressions with measurable before/after comparisons.

## Scope

Telemetry targets AI decisions in solo games (`mode = ai`) and records:

- decision context (gold, hand, market, utility deltas, phase, pending interaction type),
- legal candidate actions at decision time,
- chosen action,
- game-level outcome summary (winner, gold totals, turns, seed, difficulty).

This data is for tuning and evaluation, not gameplay logic.

## Data Model (Mongo)

### Collection: `ai_decisions`

- `_id`: `${gameId}:${turnIndex}`
- `gameId`, `roomCode`
- `aiDifficulty`, `aiPlayerSlot`
- `turnIndex`
- `features` (turn feature vector)
- `candidates` (legal actions)
- `chosen` (selected action)
- `schemaVersion`, `aiVersion`, `engineVersion`
- `createdAt`

### Collection: `ai_games`

- `_id`: `gameId`
- `gameId`, `roomCode`
- `aiDifficulty`, `aiPlayerSlot`
- `winner`
- `aiGold`, `opponentGold`
- `turnCount`, `rngSeed`
- `schemaVersion`, `aiVersion`, `engineVersion`
- `startedAt`, `completedAt`, `createdAt`

## Guardrails

- Telemetry is behind env flags:
  - `AI_TELEMETRY_ENABLED`
  - `AI_TELEMETRY_SAMPLE_RATE` (default `0.2`)
- Writes are async and must not block turn processing.
- If Mongo is unavailable, game flow must continue.
- No OAuth/session secrets or PII are included in AI decision payloads.

## Plan: Using Game Data to Improve AI

1. Instrument and collect
- Run telemetry in sampled production/staging games.
- Capture enough volume across `easy`, `medium`, `hard` with version tags.

2. Analyze failure clusters
- Slice by pending interaction type, card design, and game phase.
- Identify decisions that correlate with losses or gold swings.

3. Build tuning dataset
- Export from Mongo by `aiVersion` and time window.
- Join `ai_decisions` with `ai_games` outcome labels.

4. Fit/tune decision weights
- Start by tuning heuristic weights in Hard AI.
- Optimize for better action ranking against observed outcomes.

5. Validate offline
- Re-run fixed-seed soak matrix.
- Gate on win-rate targets, zero-stall requirement, and regression tests.

6. Shadow + rollout
- Optionally run candidate policy in shadow mode first.
- Roll out gradually with versioned telemetry and compare live metrics.

7. Repeat
- Keep a weekly tuning loop with versioned datasets and reproducible reports.

## Success Metrics

- Hard vs Medium win rate stays in target band and improves sustainably.
- No increase in stall rate.
- Reduced tactical mistakes in known weak spots (reactions, interaction responses, combo sequencing).
- Faster iteration cycle for AI balance changes with lower regression risk.

