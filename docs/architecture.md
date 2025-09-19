# Architecture

## Layers

- **Client (Next.js App Router)**: UI components (call control, persona selection, message stream, timers) + Hume EVI Voice SDK provider.
- **API Route `/api/lead`**: Normalizes & validates tool payload, persists (prod mode) and creates email doc.
- **Cloud Functions**: Firestore trigger `onLeadCreate` → Sheets append; scheduled `retentionSweep` (dry-run capable) for media cleanup.
- **Data Stores**: Firestore (leads, mail), Google Sheets (analytics/ops convenience), Cloud Storage (audio/transcripts planned), localStorage (UI settings & future draft persistence).

## Data Flow (Single Lead MVP)
1. User initiates voice session → system prompt + tools provided to model.
2. Model gathers fields → calls `recordLead` with JSON argument.
3. Client POSTs JSON to `/api/lead`.
4. API validates (Ajv) → writes `leads/{id}` and `mail/{id}` (prod) or logs (demo).
5. Firestore trigger appends row to `Leads` sheet with retry.
6. Trigger Email extension sends formatted email.

## Planned Multi-Lead & Incremental (Flagged)
- Incremental tools (`addOrUpdateLeadField`, `finalizeLeadDraft`, etc.) behind `NEXT_PUBLIC_INCREMENTAL_LEADS=1`.
- Client ephemeral draft state provider (partially scaffolded) to track per-field confirmations.

## Consent Handling
- Modes: required | optional | off.
- Current: prompt describes logic; runtime injection of first-line consent pending.

## Retention
- `RETENTION_DAYS` & `RETENTION_DRY_RUN` environment vars.
- Sweep enumerates leads, parses media URLs, deletes or simulates deletion.

## Monitoring / Telemetry
- Minimal console events (session, inactivity, duration, tool calls, consent).
- Future: pluggable adapter → Firestore or external analytics.

## Sequence Diagram (Conceptual)

User ↔ Voice SDK ↔ Hume Model → (tool call) → Client → /api/lead → Firestore → (trigger) → Sheets + Email

## Reliability Mechanisms
- Sheets append exponential backoff (max 3 attempts).
- Schema validation prevents malformed writes.
- Dry-run retention avoids accidental deletion.

## Current Gaps
See `AUDIT.md` (archived) & `roadmap.md` for actionable remediation items.
