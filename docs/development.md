# Development Guide

Updated: 2025-09-21

## Scripts
- `npm run dev` – Start Next.js dev server
- `npm run typecheck` – TypeScript strict validation
- `npm run lint` – ESLint
- `npm test` – Jest unit tests

## Project Structure
- `app/` – App Router pages & API route (`api/lead`)
- `components/` – UI & session components (TeleTami root, Notes, Spec upload, timers, etc.)
- `lib/` – Schema, prompting, strategy harness, Firebase admin wrapper, incremental JSON logic
- `functions/` – Cloud Functions (TS build output in `lib/`)
- `utils/` – Utilities (telemetry emitter, parsers, misc helpers)
- `prompt_parts/` – Modular markdown fragments for system prompt assembly
- `docs/` – Documentation suite (strategy, incremental, telemetry, prompting, architecture)
- `__tests__/` – Jest tests (unit + soon integration)

## Adding Dependencies
Use root `package.json` for web app deps. Functions have separate `functions/package.json`.

## Testing Focus Areas
Planned (next phase):
- Incremental finalize flow (fragments → finalize → unknown field preservation)
- Push-back trigger path (simulate conversation state conditions)
- Closing detection (signal emit & UI banner)
- `/api/lead` validation (valid vs invalid payload snapshot)
- Email template rendering snapshot (stability)
- Strategy prompt modification inclusion (snapshot diff)

## Local Firebase Emulation (Optional)
You can run Firestore emulator for local writes; current MVP depends mainly on validation unless production mode with env secrets.

## Coding Guidelines
- Keep changes minimal & focused per PR.
- Avoid leaking secrets to client.
- Use existing abstraction boundaries (`lib/hume.ts`, `lib/schema.ts`).

## Feature Flags & Strategy
- `NEXT_PUBLIC_LEAD_STRATEGY` – A | B | C | D | E | RANDOM (controls incremental, confirmation intensity, email template, live email gating)
- `NEXT_PUBLIC_INCREMENTAL_LEADS` – Legacy override to force incremental mode (will be deprecated in favor of strategies)
- `CONSENT_MODE` – required | optional | off (governs prompt consent inclusion; future runtime injection)
- `RETENTION_DRY_RUN` – Simulate deletions in retention function

## Incremental Draft Lifecycle
Client maintains in-memory fragment store (`acceptFragment`, `finalizeDraft`). Unknown (out-of-schema) fields merged into notes with telemetry emission. Future enhancement: persisted resume (localStorage or server).

Key events: `incremental_fragment_received`, `incremental_finalized`, `incremental_unknown_fields_preserved` (see `telemetry.md`).

## Strategy Framework
Strategies A–E provide controlled experimentation knobs. Prompt modifiers appended with `[[STRATEGY_MOD]]` marker enabling log inspection. See `strategy.md` for matrix and extension guidance.

## Telemetry
Structured console events only (no backend ingestion yet). Reference `telemetry.md` for catalog. Correlation ID standardization pending.

## Accessibility & UX Enhancements
- Focus-visible polyfill & skip link
- Reduced motion respect
- Notes panel & Spec file upload placeholder
- Live voice speed slider updating active session

## Pending Enhancements
- Autosave/resume for incremental drafts
- Universal correlation ID in all telemetry
- Consent runtime injection with event
- Analytics buffering & Firestore routing
- Integration test suite build-out

## Development Conventions
- Keep PRs scoped (feature or doc set)
- Avoid introducing new strategy modifiers without updating `strategy.md` & `prompting.md`
- Prefer adding telemetry at first implementation rather than retrofitting

---
Updated as part of Task 19 (dev & audit doc sync).
