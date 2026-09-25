# Lessons Learned

## 2026-09-25 — Hard/Expert AI was reading hidden opponent state

Context: an Opus-model review of the AI difficulty tiers (spawned via a
model-overridden subagent) found Hard/Expert scored candidate moves by
running `processAction`/`evaluateBoard` against the true `GameState`, which
includes the opponent's real hand and real deck order. This let them "know"
whether a Guard/Rain Maker would cancel a move, and let Expert's Monte Carlo
rollouts play out real future draws — a genuine information-leak advantage,
not skill.

Fix: `src/ai/determinize.ts` reshuffles what the acting player can't see
(opponent hand + deck, counts preserved) before scoring, on branch
`ai-fair-information`.

**Gotcha**: the first version shuffled `[...opponentHand, ...state.deck]`
directly. Fisher-Yates shuffle output depends on the *input array's order*,
not just its contents — so two states with an identical set of unseen cards
but a different true hand/deck split could still shuffle to different
results, quietly re-leaking a smaller signal correlated with the true
arrangement. Any "reshuffle the unseen cards" fix needs to sort/canonicalize
the pool *before* shuffling, or the fix is incomplete. Caught this by
writing a regression test that builds two states with the same card pool
but a swapped hand/deck split and asserting the AI's chosen move is
identical between them — then verified the test actually fails without the
`.sort()` by temporarily reverting it.

**Balance impact**: Expert vs Hard combined win rate dropped from 70.5% to
58.5% once the leak was closed — most of Expert's prior edge over Hard was
exploiting hidden information, not deeper search. Worth remembering before
assuming any AI benchmark swing is a bug: check whether the "stronger" tier
was cheating first.
