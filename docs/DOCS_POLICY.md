# Documentation Policy

Last reviewed: 2026-02-15

## Purpose

Keep documentation accurate, minimal, and maintainable by enforcing a canonical set and archival workflow.

## Canonical Set

Active documentation is limited to files linked in `docs/INDEX.md`.
Any topic not represented there is non-authoritative.

## Required Metadata

Each canonical document should include:

- A clear title
- `Last reviewed` date
- Explicit scope boundary
- Links to adjacent canonical docs when relevant

## Update Rules

- Update docs in the same PR as behavior changes whenever feasible
- Prefer modifying existing canonical docs over creating new one-off files
- Do not introduce version-suffixed duplicates like `(1)`, `(2)`, `(3)`

## Archival Rules

Move superseded or historical docs to `docs/archive/` when:

- Content is no longer authoritative
- Assumptions conflict with current code/rules
- Material is planning-only and time-bound

## Review Cadence

- Lightweight review monthly or at major rule/system changes
- Full documentation audit before major release milestones
