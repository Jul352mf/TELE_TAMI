# Decision Log

Record of prompt / strategy / UX experiment decisions.

| Date (UTC) | Area | Hypothesis | Variant(s) | Metric(s) | Result | Decision | Follow-up |
|-----------|------|------------|-----------|-----------|--------|----------|-----------|
| 2025-09-21 | scaffolding | File-based prompt parts will increase iteration speed | inline vs file (hash c8af7442e5) | cycle time (qual) | pending | adopt file parts flag | add prompt lint tests |
| 2025-09-21 | strategy wiring | Single unified strategy harness (env + RANDOM + gating) will reduce drift & duplicate telemetry | current dual (NEXT_PUBLIC_STRATEGY + NEXT_PUBLIC_LEAD_STRATEGY) vs unified harness | config drift occurrences, incremental adoption rate | pending | defer unify (staged plan logged) | phase 1: tool gating via harness; phase 2: email gating; phase 3: remove legacy flag |

## How To Use
- Append new rows; never delete (preserve history).
- Variants: list labels (A, B, etc.) referencing config flags or hashes.
- Metrics: define quantitative where possible (e.g., avg confirmations/lead, lead completion rate, session drop rate).
- Result: concise summary after evaluation window.
- Decision: keep, revert, modify.
- Follow-up: next experiment or action.

## Automation Plan (Strategy Distribution & Incremental Capture)

Goal: Generate a lightweight weekly snapshot of strategy usage & incremental capture performance to inform experiment tuning.

Planned Phases:
1. Client Buffer (Phase 0 – current): Console telemetry only.
2. Collection (Phase 1): Add ephemeral in-memory ring buffer exporter (JSON blob) downloadable via dev console command `window.__tamiDump()`; contains events: `strategy_selected`, `incremental_fragment_received`, `incremental_finalized`, `incremental_unknown_fields_preserved`, `closing_triggered`, `pushback_used`.
3. Firestore Sink (Phase 2): Batch write summarized session object on disconnect `{ sessionId, strategy, incremental: bool, fragments: count, finalize: bool, unknownFieldCount, pushbacks, closed }`.
4. Aggregation Script (Phase 3): Scheduled (GitHub Action or local script) queries last 7 days and appends a CSV/Markdown row to `decision-log.md` under a new "Weekly Metrics" section.
5. Dashboard (Phase 4 – optional): Minimal web page pulling aggregated documents for quick visual ratio (incremental adoption %, unknown field ratio, average fragments per finalized lead).

Key Metrics (initial set):
- Strategy distribution (% of sessions A–E)
- Incremental adoption (% sessions with incrementalEnabled true)
- Avg fragments per incremental session
- Unknown field ratio (unknown / total keys at finalize)
- Push-back usage rate (sessions with ≥1 pushback / total)
- Closing intent detection rate

Telemetry Gaps To Fill Before Phase 2:
- Universal `sessionId` in all events
- Single-source strategy emission (avoid double `strategy_selected`)

Risk Mitigation:
- Keep per-session record <2KB JSON to minimize Firestore cost.
- Defer real-time streaming until signal value confirmed.

Status: Planning logged; implementation deferred until after staged strategy harness unification.
