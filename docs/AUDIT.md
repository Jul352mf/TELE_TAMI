<!-- THIS FILE WILL BE REPLACED BY docs/architecture.md IN THE NEW DOCS SYSTEM.
     Retained temporarily as an anchor; do not extend further. -->

# Situation Analysis & Codebase Audit (Superseded Draft)

Date: 2025-09-21 (Archived Snapshot Refresh)
Current Branch: feature integration (see active PR)

## 1. High-Level Product Summary

TELE TAMI is a voice-first lead capture assistant for commodity trading. Users hold a conversational session with an emotionally adaptive AI (Hume EVI). The AI extracts structured lead data via either single-shot submission (`recordLead`) or (now implemented) incremental field tools that accumulate a draft before finalization. In production mode the API persists to Firestore, triggers email via Firestore Trigger Email extension, and a Cloud Function appends a row to Google Sheets. Multi-lead sessions are supported in-app (recap + archive) while persistence remains one document per finalized lead.

## 2. Architecture Overview

- Frontend: Next.js (App Router) + Hume Voice React SDK. UI components manage persona selection, model/voice, timers, and message stream.
- Backend: Next.js API route `/api/lead` validates incoming tool payload with Ajv schema, conditionally writes Firestore + mail doc + logs.
- Cloud Functions: `onLeadCreate` appends to Sheets with retry; `retentionSweep` scheduled cleanup (partially implemented, supports dry-run).
- Data Schema: Constrained commodity lead (CHF only, mt|kg units). Optional extended logistic & contextual fields.
- Prompt System: Modular markdown segments assembled by `buildSystemPrompt(persona, isOleMode, strategyMods)`; strategy modifiers appended with trace markers.
- Tooling: Base tool `recordLead`; incremental + confirmation tools fully wired (fragment store, finalize, recap, unknown field preservation telemetry).
- Telemetry: Console-based structured events (see `telemetry.md`) covering strategy selection, incremental fragments/finalize, pushback, closing, recap, notes, spec upload.
- Strategy Framework: A–E (+ RANDOM) controls incremental enablement, confirmation intensity, email template variant, live email gating.
- Accessibility & UX: Skip link, focus-visible, reduced motion, notes panel, spec upload placeholder, live voice speed adjustment.

## 3. Recent Evolution (Git Log Highlights)

Chronology (most recent first):

1. Persona prompt adjustments & recipient email override (2025-09-19).
2. Incremental multi-phase implementation (phase1–phase6) adding: modular prompt, consent + telemetry, draft autosave & persistence of settings, incremental tool scaffolds, query/confirm tools, retention sweep skeleton, evaluation tests, parser improvements, UI modernizations, structured plan & audit.
3. Initial stable email + Sheets integration (STABLE 1.0 marker 2025-09-18).
4. Base MVP scaffold (2025-09-17): core EVI integration, Firestore lead creation.

## 4. Strengths

- Modular prompt builder now replaces earlier monolith enabling targeted iteration.
- Resilient Sheets append with exponential backoff + structured logging.
- Rich HTML email template; dynamic persona + voice + model selection with persisted UI state.
- Retention mechanism planned with dry-run safeguard (compliance foresight).
- Clear phased roadmap captured in `NEW_TODOS_PLAN.md`.

## 5. Gaps & Risks

| Area | Gap | Impact | Priority |
|------|-----|--------|----------|
| Lead Capture Robustness | Client-only draft (no server persists until finalize) | Possible loss on tab crash mid-session | Medium |
| Incremental Tools | Implemented client fragment store only | Missing server-side resume capability | Medium |
| Consent Enforcement | Only prompt-level; no guaranteed runtime injection when required | Compliance risk | High |
| Observability | Console events; partial sessionId coverage | Correlation across all events incomplete | Medium |
| Retention Sweep | Not fully validated; audio/transcript fields not yet populated | Potential future storage bloat | Medium |
| Prompt Drift | Many behavioral rules rely on model adherence without telemetry feedback loop | Slower iteration | Medium |
| Testing Coverage | Unit tests only (schema, parsers, hooks) | Integration gaps | Medium |
| Sheets Schema Evolution | Manual column sync; no schema version row | Silent mismatches | Low |

## 6. Open Technical Questions (To Clarify Later)

1. Will multi-lead sessions require atomic batch persistence? (Currently only independent single leads.)
2. Are we moving toward transcript post-processing extraction (Second wave notes) replacing tool confirmation logic? If yes, incremental tools might be deprioritized.
3. Do we need real-time sentiment signals from Hume vs heuristic lexical analysis? (Triggers closing / de-escalation.)

## 7. Recommended Near-Term Actions

1. Add autosave persistence fallback (localStorage or indexedDB) for in-progress incremental drafts.
2. Runtime injection of consent line on first assistant turn when `CONSENT_MODE=required` + telemetry.
3. Universal correlation ID in every telemetry event (propagated through tool payload & email subject).
4. Analytics buffering (batch upload or Firestore collection) & basic session dashboard.
5. Integration tests for incremental finalize, pushback, closing, API validation, email template snapshot.
6. Schema version row in Sheets (hidden row 1) + header mismatch alert.
7. Server-side incremental resume (persist fragments before finalize) – optional if reliability demands.

## 8. Strategic Options

Path A: Continue tool-centric incremental capture (fine-grained control, immediate validation).

Path B: Simplify to conversational capture + offline transcript extraction (reduced cognitive load on model; requires robust post-processor pipeline). Suggest piloting B in a parallel branch while hardening A.

## 9. Documentation Work Ahead

This file is now an archived snapshot (superseded by focused docs). Active documentation lives under `docs/`:

- `overview.md` – product & value proposition
- `architecture.md` – system, data & runtime flows
- `prompting.md` – prompt structure, personas, incremental & strategy modifiers
- `development.md` – local dev, testing, scripts
- `deployment.md` – Vercel + Firebase + Sheets workflow
- `operations.md` – retention, consent, telemetry, troubleshooting
- `template-diff.md` – differences from upstream starter template
- `roadmap.md` – phases (aligned with NEW_TODOS_PLAN)
- `changelog.md` – human-friendly highlights (subset of git log)

## 10. Deprecations / Cleanup Targets

- Remove legacy references to single monolithic prompt in older docs.
- Consolidate overlapping setup guidance (README vs SETUP_GUIDE) into single canonical `docs/deployment.md`.

## 11. Summary

Core MVP is feature-complete for a stable demo. Next maturity step is resilience (partial lead safeguarding), compliance (consent runtime), and experimentation infrastructure (telemetry + prompt variants). Strategic decision required on whether to pivot to transcript post-processing; delaying that decision blocks optimizing current tool path.

---
Status: Archived (do not update further except for archival metadata).
