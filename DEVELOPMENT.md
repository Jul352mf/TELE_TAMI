# TELE TAMI – Development Notes

This document complements the README and SETUP_GUIDE with implementation-specific notes relevant for contributors.

## Repos / Branching
- Default branch: `main`
- Active PR under review: `pr-1` (fetched from GitHub PR #1)
- Use feature branches for changes; keep diffs tight and focused

## Tech Stack
- Next.js 14 App Router
- Hume EVI React SDK (`@humeai/voice-react`)
- TypeScript (strict), ESLint (Next preset), Jest + ts-jest for unit tests
- Firebase: Firestore, Storage, Functions (Node 18)
- Google Sheets API via `googleapis`

## Local Dev Commands
```powershell
npm run dev      # local Next.js dev server
npm run typecheck
npm run lint
npm test
```

## Project Structure
- `app/` – Next App Router pages, API routes under `app/api`
- `components/` – UI and voice components (Messages, Controls, CallButton, PersonaToggle, TeleTami)
- `lib/` – core logic: schema validation, Hume prompts, Firebase admin wrapper
- `functions/` – Cloud Functions (append to Sheets, retention sweep)
- `__tests__/` – unit tests (schema validation)

## Personas & Modes
- Personas: professional, seductive, unhinged (gated by Spicy Mode)
- Ole Mode: auto-detected when the transcript matches `/\bole\b/i`; augments system prompt and payload
- The SDK `onToolCall` is stubbed in `TeleTami.tsx`; the actual interception is handled within `CallButton` until SDK handlers are available

## Known Stubs / TODOs
- API `app/api/lead/route.ts` has Firestore writes and `mail/` creation commented out; enable when credentials are configured
- `functions/src/index.ts` retentionSweep is a stub; implement GC of audio/transcripts and doc updates
- `CallButton.tsx` connects without passing tools/system prompt (awaiting SDK support and config); prompts are logged for now
- `NEXT_PUBLIC_*` Hume config is optional; only required when you manage configs on Hume Dashboard

## Env Handling
- Next.js server reads `HUME_API_KEY`/`HUME_SECRET_KEY` to mint an access token. If values contain `demo`, a demo token is returned and voice features won’t fully work.
- Functions read secrets from `process.env`; prefer `firebase functions:secrets:set` over bundling JSON into code.

## Testing Strategy
- Unit tests focus on schema validation in `lib/schema.ts`
- Consider adding API route tests with supertest in a future iteration
- GitHub Actions CI runs lint, typecheck, and tests on pushes/PRs to `main`

## Release/Deploy
- Deploy rules first, then Functions
- When persisting leads, uncomment Firestore writes in API route and verify that Trigger Email extension is installed

## Code Style
- Keep edits minimal and focused
- Favor server-only access for secrets; never expose admin credentials to the client
- Avoid inline comments in code unless they convey non-obvious constraints
