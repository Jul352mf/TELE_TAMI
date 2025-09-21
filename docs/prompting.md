# Prompting & Personas

Updated: 2025-09-21

## Overview
The system prompt is dynamically assembled by `buildSystemPrompt(persona, isOleMode, strategyMods)` from modular Markdown fragments under `prompt_parts/`. Strategy selection (see `strategy.md`) appends additional modifier snippets marked with the prefix `[[STRATEGY_MOD]]` for traceability.

## Assembly Order
1. ROLE & GOAL
2. REQUIRED FIELDS & OPTIONAL FIELDS (schema contract)
3. FLOW (phases 1–7) – acquisition cadence & confirmation guidance
4. MULTI-LEAD PROTOCOL – recap & archival rules
5. BEHAVIOR RULES – boundaries, humor, push-back triggers
6. CLOSING – closing triggers & graceful wrap phrasing
7. TIMEOUTS – inactivity / duration expectations (future automation)
8. OUTPUT CONTRACT – JSON / field expectations
9. (Conditional) INCREMENTAL MODE guidance (if incremental enabled)
10. PERSONA OVERLAY – tone & linguistic style
11. (Optional) INTERVIEW MODE (Ole) – pitch-first variant
12. Strategy Modifications – appended tail, each on its own line

## Incremental Mode
Incremental capture activates when either:
- Selected strategy config sets `incrementalEnabled = true` (strategies C, D, E), OR
- Env override `NEXT_PUBLIC_INCREMENTAL_LEADS=1` (legacy fallback)

Prompt inserts a concise directive covering:
- Use `addOrUpdateLeadField` for each new or revised field (one per turn when practical)
- Use `confirmFieldValue` sparingly when user ambiguity exists and confirmation policy = targeted
- Defer final email export until `finalizeLeadDraft` after required fields are confidently gathered
- May call `getMissingFields` or `getDraftSummary` to self-check progress (informational only)

## Tooling Contract
| Tool | Purpose | Incremental Only | Notes |
|------|---------|------------------|-------|
| recordLead | One-shot full lead submission | No | Used in non-incremental strategies (A, B) |
| addOrUpdateLeadField | Upsert single draft field | Yes | Emits fragment telemetry per call |
| confirmFieldValue | Explicit field confirmation | Yes | Only when confirmation intensity warrants |
| finalizeLeadDraft | Submit accumulated draft | Yes | Triggers finalize + unknown field preservation |
| getDraftSummary | Model self-recap of draft | Yes (optional) | Not yet surfaced to UI |
| getMissingFields | List remaining required fields | Yes (optional) | Guidance / planning |

Telemetry reference: see `telemetry.md` for event shapes (`incremental_fragment_received`, `incremental_finalized`, etc.).

## Personas
| Persona | Description |
|---------|-------------|
| professional | Warm, confident, business-focused, tasteful |
| unhinged | Energetic, witty irreverence (never profane) |
| cynical | Dry, sarcastic, sharp but respectful |

Persona overlays inject tone & register adjustments late so earlier structural instructions remain unaffected.

## Strategy Modifications
Each strategy may append succinct imperatives adjusting confirmation density, incremental emphasis, or email formatting cues. These lines are annotated for audit with `[[STRATEGY_MOD]]`. Example themes:
- Light vs targeted confirmations
- Enhanced template formatting hints
- Experimental JSON accumulation language (Strategy E)

## Ole Interview Mode
Activated when the user name "Ole" is detected (or manually forced). A front-loaded charisma & pitch block precedes normal lead collection; incremental guidance (if enabled) still appears afterward.

## Consent Handling
If `CONSENT_MODE=required`, a consent notice is inserted in the system prompt to ensure early disclosure. Roadmap enhancement: dynamic runtime injection (outside initial prompt) for adaptive compliance.

## Push-Back & Closing Cues
The prompt embeds soft boundaries and nudge patterns enabling the model to:
- Offer a gentle push-back variant when the user stalls or deflects (telemetry: `pushback_used`).
- Recognize closing signals and transition to wrap-up (telemetry: `closing_triggered`).

## Style Principles (Invariant)
- One primary field objective per turn (avoid batching unless user provides grouped data).
- Brief adaptive mirroring of user affect; maintain professional tone boundaries.
- Avoid re-confirming already confirmed fields unless the user changes them.
- Inject light, tasteful humor only when it does not delay field acquisition.
- Never fabricate unknown fields; explicitly ask or mark as pending.

## Recap & Multi-Lead Flow
Prompt instructs the model that operator may request a recap between leads. Recap is a synthetic summary (telemetry: `recap_requested` / `recap_provided`) and previous lead data is archived before starting a new one.

## Unknown Field Preservation
On finalize, any fields outside the known schema are preserved (added to notes + event `incremental_unknown_fields_preserved`). Prompt language discourages inventing arbitrary fields but allows capturing explicitly offered extra info.

## Future Enhancements (Planned)
- Dynamic consent injection during session start
- Live adaptation of confirmation intensity based on early user responsiveness
- Surfacing `getDraftSummary` output in operator UI for coaching
- Automatic recap suggestion after prolonged hesitation

---
Updated as part of Task 19 (prompting doc refresh aligned with strategy & incremental framework).
