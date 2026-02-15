# AI Architecture

Last reviewed: 2026-02-15

## Current Baseline

- Core AI implementation is in `src/ai/`
- Random/legal-play behavior is available for deterministic simulations and coverage
- AI interaction responses must always honor resolver contracts

## Contract Requirements

- AI only returns legal actions from current state
- AI must never return `null` for interactions that have resolver auto-resolve guards
- AI output must preserve determinism when a seeded RNG is provided

## Difficulty Direction

- Easy: legal/random with light heuristics
- Medium: heuristic scoring across short-term value
- Hard: deeper lookahead / simulation-driven policy

## Quality Metrics

- No deadlocks in resolution flow
- No illegal action selection
- Stable behavior under large AI-vs-AI matchup batches
