# Codebase Audit (Current Branch: pr-1)

Date: 2025-09-18

## Overview

This audit catalogs stubs, inconsistencies, unfinished logic, and potential pitfalls introduced or exposed by recent changes (prompts swap, personas, voice & model selection, timers, Sheets mapping, email template, session grouping).

## Strengths / Recent Improvements

- Unified prompt strategy with multi-lead + closing guidance.
- Added persona and interview mode switching logic (Ole detection).
- Configurability: voice + model selectors plumbed through session settings.
- Session lifecycle UX: inactivity + max duration timers with toasts and hard disconnect.
- Lead grouping: `sourceCallId` now appended to Sheets.
- Resilient Sheets writes: retry with exponential backoff.
- Modern HTML email template (dark-mode friendly) prepared for production.

## Inconsistencies & Open Items

1. Prompt Structure

   - Large monolithic `baseSystemPrompt` mixes behavior, flow, compliance, and multi-lead instructions. Future: compose from structured segments (Opening, Flow, Tool Use, Closing, Style, Guardrails) to enable targeted iteration.
   - Multi-lead + closing flows described, but no dynamic runtime memory layer enforcing per-lead boundaries beyond prompt guidance.

2. Tool Invocation / Lead Lifecycle

   - Single `recordLead` call assumed at finalization; New_TODOs envisions incremental / streaming capture or richer tool set (confirm item, get open items, etc.). Not yet implemented.
   - No intermediate local state store tracking partial lead items prior to final record; risk: premature tool call or data loss if session ends unexpectedly.

3. Voice & Model Routing

   - Session settings pass `voice` and `model` objects; depends on backend acceptance. No feature flag or fallback if unsupported.
   - No persistence of chosen voice/model per user across sessions (could use localStorage).

4. Session Timers

   - Client-only enforcement; assistant messaging about timeouts is prompt-driven, not programmatic. If tab sleeps or throttles timers (background), enforcement may delay.
   - Hard-coded intervals; no env overrides.

5. Sheets Integration

   - Added `sourceCallId`, but Sheet header must be manually updated (A:AA). No migration script.
   - Some optional fields may remain empty frequently—consider trimming columns or deriving usage metrics.
   - Retention sweep stub remains; transcripts/audio references not currently inserted, so GC logic incomplete.

6. Error Handling & Observability

   - No central logging abstraction (console only). Consider tagging logs with sessionId/persona for correlation.
   - Email send path only active in production; demo mode logs HTML blob (fine) but lacks snapshot export for QA.

7. Security & Validation

   - Schema limited to CHF currency and mt/kg units; if expansion required, change implies both schema + prompt updates.
   - `sanitizeForHume` strips constraints like `minLength`; model may produce underspecified values (e.g., 1-char product names) without post-validation heuristics.

8. UI / UX

   - Settings cluster below call is improved but could benefit from subtle section labeling or compact density toggle.
   - No loading state or disabled state while connecting.
   - Micro-copy (tool failure toasts, session end messaging) minimal.

9. Retention & Compliance

   - `retentionSweep` stub risks unbounded storage growth once audio/transcripts land.
   - No consent-mode dynamic insertion beyond prompt suggestion (needs runtime branch inserting `getConsentLine()` if required).

10. Testing

- Only prompt-related tests; no unit tests for `sanitizeForHume`, Sheets append resilience, or session timers.
- No integration test script simulating tool invocation end-to-end.

11. Documentation Drift

- `PROGRESS.md` still has legacy TODO markers that are now complete.
- `DEVELOPMENT.md` references earlier separation of prompt logic that has since evolved.

12. Performance / Edge Cases

- Reverse scan on messages each second in `SessionTimers` (negligible now, but could optimize by tracking last user timestamp on mutation).
- Potential race: `sendSessionSettings` immediately after connect; if backend applies initial settings asynchronously, duplication may not be necessary.

## Quick Fix Recommendations (Short Term)

- Add local ephemeral lead state (map of field->value) before final tool call; only call `recordLead` on confirmation or session termination.
- Implement consent injection in first assistant turn when required.
- Split system prompt into composable sections exported as constants.
- Add localStorage persistence for voice/model selections.
- Add a header sync check for Sheets (log warning if column count mismatch).
- Introduce a simple logger utility (session-tagged).
- Update `PROGRESS.md` to reflect current completion; remove stale TODO markers.

## Strategic Enhancements (Mid Term)

- Expand tool schema to support granular item-level operations (add/update/confirm) if model struggles with single final JSON.
- Implement server-side session watchdog (Cloud Function or backend) for authoritative timeout enforcement.
- Add analytics hook (e.g., event bus) for tool calls, disconnect reasons, timer triggers.
- Provide A/B variants of the structured prompt to measure collection completeness.
- Begin test coverage for core utilities (schema validation, sanitize, timers logic via mocked clock).

## Risks if Unaddressed

- Data Loss: Single-shot tool call can miss partially gathered data on abrupt disconnect.
- Prompt Entropy: Monolithic prompt harder to iterate safely—risk regressions.
- Operational Cost: Lack of retention GC could inflate storage bills later.
- UX Friction: Missing consent injection could block certain deployments.

## Suggested Next Actions

1. Implement structured prompt builder (function assembling ordered segments + persona overlay).
2. Add ephemeral lead accumulator & autosave (optional local persistence) with recovery.
3. Expand tool design (scaffold, behind feature flag) for item-level operations.
4. Add consent runtime injection + test.
5. Write minimal test suite for sanitize + timers.
6. Add logger + correlation IDs.
7. Update docs & progress.

---
Generated automatically as part of the audit task.
