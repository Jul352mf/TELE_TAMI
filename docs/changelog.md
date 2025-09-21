# Changelog

All notable changes for the current development cycle prior to strategy unification refactor.

## [Unreleased] - 2025-09-21
### Added
- Strategy framework (A–E + RANDOM planned) with prompt modification markers `[[STRATEGY_MOD]]`.
- Incremental lead capture (fragment store, finalize, unknown field preservation + telemetry).
- Conversation intelligence: push-back generation & closing intent detection (telemetry events `pushback_used`, `closing_triggered`).
- Multi-lead recap pathway and archival model within session UI.
- Telemetry expansion: session, tool lifecycle, strategy, incremental fragments/finalize, unknown fields, recap, pushback/closing, notes, spec uploads.
- Accessibility layer: focus-visible, skip link, reduced motion respect.
- Notes panel with local draft notes + telemetry (`note_created`).
- Spec file upload placeholder component + telemetry (`spec_uploaded`).
- Live voice speed adjustment (updates existing session settings in real time).
- Feature status matrix (`FEATURE_STATUS.md`).
- Dedicated documentation: `strategy.md`, `incremental.md`, `telemetry.md`, refreshed `prompting.md`, `development.md`, `AUDIT.md` archival update, decision log automation plan.
- Integration tests: incremental finalize flow, pushback/closing paths, conversation integration.

### Changed
- System prompt assembly refactored to modular `prompt_parts/` with deterministic ordering.
- Lead capture tool interception consolidated in `TeleTami.tsx` (handles incremental vs single-shot logic).
- Email template selection prepared for strategy-driven future gating (still env based).
- Updated decision log to include strategy unification staged plan & automation pipeline.

### Fixed
- Unknown lead fields now preserved and logged (prevents silent data loss for extra info).
- Prompt consent detection emits `consent_injected` telemetry event when present.
- Model fallback logic ensures tool capability when no configId provided.

### Known Gaps
- Strategy gating not yet unified (dual env vars; incremental activation still uses legacy flag).
- Confirmation intensity & live email suppression not yet enforced by strategy harness.
- No persistent storage for in-progress incremental drafts (memory only).
- Universal sessionId not yet attached to all telemetry events.

### Removed
- None (dead code scan retained `featureFlags.ts` with future-use annotation).

### Planned (Next)
- Strategy unification (single env + RANDOM, tool/email gating, correlation ID).
- Autosave & resume for incremental drafts.
- Firestore telemetry sink & weekly aggregation script.

---
Generated as part of Task 23.
