# Roadmap

Last reviewed: 2026-03-01

## Now

- Expand multiplayer robustness and reconnect behavior
- Improve UX clarity for complex interaction prompts

## Done (this cycle)

- **Harden docs** — CARD_REFERENCE.md, CLAUDE.md, and CardDatabase.ts fully cross-checked; all three sources consistent
- **Rules audit** — every card's gold values, ware counts, and interaction timing verified; Traveling Merchant corrected to match digital implementation
- **Stall prevention test coverage** — resolver guards and validation gates covered for all 22 resolution types (278 tests total, 0 failures)
- **AI difficulty balancing** — Expert AI reaches 70% combined win rate vs Hard (target was 65-70%); Expert P1 improved from 54% → 69% via deeper MC rollouts (depth 16, interaction rollouts 16)

## Next

- Tighten persistence compatibility and migration coverage
- Deeper AI strategy tiers (endgame awareness, smarter Expert rollout policy)

## Later

- Additional polish for visuals/audio/accessibility
- Optional analytics and telemetry for balancing workflows
