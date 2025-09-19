# Template Diff

This project began from `hume-evi-next-js-starter` and diverged in several areas.

## Added
- Multi-persona & Ole interview mode prompt layers.
- Modular prompt builder with incremental tool guidance (flagged).
- Session timers (inactivity + max duration) with toasts.
- Google Sheets append Cloud Function with retry.
- HTML email templating + Firestore Trigger Email integration.
- Retention sweep scheduled Function (dry-run capable).
- Recipient email override input.

## Modified
- Lead schema expanded (locations split, availability, delivery timeframe, meta fields).
- Tool definition sanitized subset for Hume constraints.
- UI layout (pre-call settings cluster, persona toggle, model/voice selectors).

## Removed / Deferred
- Any complex backend orchestration beyond single final tool call (incremental path gated).

## Pending Decisions
- Whether to proceed with incremental tools vs transcript post-processing pipeline.
