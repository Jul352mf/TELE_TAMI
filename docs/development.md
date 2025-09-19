# Development Guide

## Scripts
- `npm run dev` – Start Next.js dev server
- `npm run typecheck` – TypeScript strict validation
- `npm run lint` – ESLint
- `npm test` – Jest unit tests

## Project Structure
- `app/` – Pages & API route (`api/lead`)
- `components/` – UI & session components
- `lib/` – Schema, prompting, firebase admin wrapper
- `functions/` – Cloud Functions (TS → JS build)
- `utils/` – Utilities (telemetry, parsers, logging)
- `__tests__/` – Jest tests

## Adding Dependencies
Use root `package.json` for web app deps. Functions have separate `functions/package.json`.

## Testing Focus Areas
Planned additions:
- Integration tests for `/api/lead` (valid/invalid payloads)
- Prompt builder snapshot (structured segmentation)
- Retention sweep dry-run logic (simulated dataset)

## Local Firebase Emulation (Optional)
You can run Firestore emulator for local writes; current MVP depends mainly on validation unless production mode with env secrets.

## Coding Guidelines
- Keep changes minimal & focused per PR.
- Avoid leaking secrets to client.
- Use existing abstraction boundaries (`lib/hume.ts`, `lib/schema.ts`).

## Feature Flags
- `NEXT_PUBLIC_INCREMENTAL_LEADS` – Enables incremental tool instructions.
- `CONSENT_MODE` – required | optional | off.
- `RETENTION_DRY_RUN` – Simulate deletions.

## Draft State (Planned)
A React context provider will manage ephemeral lead drafts & autosave; see roadmap for implementation phases.
