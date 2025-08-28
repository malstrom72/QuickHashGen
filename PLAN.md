# Plan: Consolidate Shared Logic Between CLI and Web UI

## Context

QuickHashGenCore.js already encapsulates the search engine and code emission primitives. Both frontends — the Node CLI (`QuickHashGenCLI.node.js`) and the browser app (`QuickHashGenApp.js`) — duplicate several concerns around templates, scheduling, and code-patching. Unifying these reduces maintenance and keeps behavior identical across environments.

## Goals

- Share non-UI logic so both frontends rely on the same helpers.
- Keep deterministic outputs unchanged when a seed is provided.
- Avoid behavior regressions and keep the CLI and UI flags/features intact.

## Status Summary

- Core helpers implemented and exported: DONE
- CLI migrated to shared helpers and templates: DONE
- Web UI migrated to shared helpers (templates, bounds, iterations, scheduler, seed I/O, C patching): DONE
- Tests pass on POSIX suite; goldens stable: DONE
- Formatting with Prettier (tabs) applied: DONE
- Documentation updates in README: PENDING
- Optional: move STRINGS[] length and min/max guard rewrite into core: PENDING

## Opportunities for Sharing

- Templates: centralize C output templates and parameterize differences: DONE
  - zero-terminated vs non-zero-terminated
  - function name (e.g., `lookup` vs `<<findSomething>>`)
  - header string ("Built with QuickHashGen" vs "Built with QuickHashGen CLI")
  - assert line or commented alternative
  - seed comment inclusion
- Size helpers: compute `minTableSize`/`maxTableSize` from `strings.length` once. DONE
- Iteration budget: unify the per-tick/per-loop iteration count logic (e.g., `Math.max(200 / strings.length, 1)`). DONE
- Search step scheduler: a helper that, given a `QuickHashGen` instance and current `best`, chooses a complexity and runs one search step. DONE
- C code patching utilities: lift the UI’s `findInitializerRange`, `findMatchingSquare`, and C code update logic into a shared helper that can update an existing C snippet with a new table and expression. DONE (see `updateCCodeWithSolution`)
- Seed helpers: parse and emit the `// Seed: N` marker consistently. DONE

- STRINGS[] length and `if (n < .. || n > ..)` guard rewrite: OPTIONAL/PENDING (UI still handles via `updateCodeMetadata`)

## Proposed Core API Additions (Non‑Breaking)

Export the following from `QuickHashGenCore.js` (or a small adjacent utility module):

- `makeCTemplate(options) => string` — IMPLEMENTED
  - Options: `{ zeroTerminated: boolean, functionName: string, header?: string, includeAssert?: boolean, includeSeedComment?: boolean }`
  - Returns a C template string compatible with `generateCOutput`.

- `computeTableBounds(strings) => { minSize: number, maxSize: number }` — IMPLEMENTED
  - Mirrors the current pattern: `minSize` is the next power of two ≥ `strings.length`; `maxSize = minSize * 8`.

- `iterationsFor(stringsLength, base=200) => number` — IMPLEMENTED
  - Returns `Math.max(1, Math.floor(base / stringsLength))` to keep iteration “budget” uniform.

- `scheduleStep(qh, best, rng) => found | null` — IMPLEMENTED
  - Chooses `complexity = rng.nextInt(best ? best.complexity : 32) + 1` and calls `qh.search(complexity, iterationsFor(...))`.
  - Keeps the selection identical across CLI and UI without duplicating the logic.

- `updateCCodeWithSolution(code, options, solution) => string` — IMPLEMENTED
  - Wraps the UI’s code-patching flow: updates table size, table initializer, and hash expression inside existing code; updates/creates the seed comment.
  - Options include the same fields as `makeCTemplate` plus optional formatting knobs.

- `parseSeedComment(text) => number | undefined` and `formatSeedComment(seed) => string` — IMPLEMENTED

- Extra: `findInitializerRange`, `findMatchingSquare` exported for reuse — IMPLEMENTED
- Extra: `QuickHashGen#getStringsLength()` helper — IMPLEMENTED
  - Standardize seed extraction/insertion for both frontends.

Existing core methods remain unchanged:

- `search`, `getTestedCount`, `generateCExpression`, `generateJSExpression`, `generateJSEvaluator`, `generateCOutput`, `parseQuickHashGenInput`, etc.

## Adoption Plan

1. Add the new helpers to the core (or a small shared util next to it). — COMPLETED

- Include unit tests for each helper (table bounds, iterations, seed parse/format, code update roundtrip on representative snippets).

2. Switch the CLI to use shared helpers. — COMPLETED

- Replace local ZERO/NONZERO template strings with `makeCTemplate`.
- Use `computeTableBounds` and `iterationsFor` instead of inline math.
- Keep the main while-loop logic, but use `scheduleStep` to pick `complexity`/`iters` in one call.

3. Switch the web UI to use shared helpers. — COMPLETED

- Generate its template with `makeCTemplate`.
- Replace internal code-patching helpers with `updateCCodeWithSolution` while keeping DOM wiring intact.
- Use `computeTableBounds`, `iterationsFor`, and `scheduleStep` within the interval loop.

4. Keep outputs stable. — COMPLETED

- Ensure default templates render identical C code (spacing/tabs/commas) to avoid golden churn.
- Preserve the UI’s specific assert/comment toggling via options to `makeCTemplate`.

5. Document shared behavior. — PENDING

- Add a short README section describing the shared helpers so external consumers can leverage them.

6. Verify and iterate. — COMPLETED

- Run `test.sh` and (on Windows) `test.cmd`; update only intentional golden changes (e.g., header text normalization) with clear commit notes.

## Risks and Notes

- Formatting differences can cause golden churn; match existing whitespace and indentation (tabs) exactly.
- Browser environments may disallow `eval`; keep that toggle and semantics unchanged.
- Avoid introducing any heuristic changes during consolidation; preserve the current search behavior and tested-count semantics.

## Out of Scope

## Next Steps

- Add a short README section documenting the new shared helpers and migration guidance.
- Optionally extract the `STRINGS[...]` count and min/max guard rewrite from the UI into a core helper for full parity.

- Changing the cost model or search algorithm.
- Introducing new CLI flags or UI controls.
