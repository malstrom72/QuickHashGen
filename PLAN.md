# Plan: Consolidate Shared Logic Between CLI and Web UI (Final)

## Outcome

Shared non‑UI logic has been consolidated into `QuickHashGenCore.js`, and both frontends now use the same helpers for templates, scheduling, bounds, and code patching. Behavior remains stable and deterministic under fixed seeds.

## Delivered

- Shared helpers shipped and exported: `makeCTemplate`, `computeTableBounds`, `iterationsFor`, `scheduleStep`, seed helpers, bracket/initializer helpers, `updateCCodeWithSolution`, and `updateCCodeMetadata`.
- CLI and Web UI migrated to shared helpers; UI DEBUG gating for eval controls added (default off).
- Documentation updated (CLI flags, fuzz loop, Shared Helpers section).
- Tests added for helper exports and code‑patching round‑trips; full test suite passes.
- Prettier config added (tabs, `printWidth: 140`) and applied.

## Verification

- POSIX: `./test.sh` runs all tests (including `tests/helpers.test.js`) — all passing.
- Windows: `test.cmd` exercises CLI workflow (unchanged by consolidation).

## Notes

- The new `updateCCodeMetadata` centralizes STRINGS size and guard updates; the Web UI now uses this helper.
- No changes to the core search algorithm or cost model.

## Future (optional)

- Expand helper tests if new helpers are added.
- Any algorithmic or UX changes should be tracked in a separate plan.
