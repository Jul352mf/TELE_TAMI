# Strategy & Experiment Framework

Updated: 2025-09-21

## Overview
The platform supports multiple lead capture strategies (A–E) selectable at runtime via environment configuration. Strategies govern:
- Incremental capture enablement
- Confirmation intensity (light vs targeted)
- Email template variant (v1/v2)
- Live email dispatch behavior
- Prompt modification snippets appended to the base system prompt

## Selecting a Strategy
Set `NEXT_PUBLIC_LEAD_STRATEGY` to one of: `A`, `B`, `C`, `D`, `E`.
If the value is `RANDOM`, one of A–E is chosen uniformly on session connect.

Fallback: If unset or invalid, defaults to `A`.

## Runtime Resolution Flow
1. User initiates call (click CallButton).  
2. `resolveStrategy()` returns explicit or randomized choice (emits `strategy_selected`).  
3. `getStrategyPromptModifications(strategy)` produces an array of modifier strings.  
4. Modifiers are appended to `systemPrompt` with marker prefix `[[STRATEGY_MOD]]` (for inspection / analysis).  
5. Strategy config influences incremental mode via `shouldUseIncrementalMode()` which gates tool flow & fragment store usage.

## Strategy Definitions
| Strategy | Incremental | Confirmation | Email Template | Live Emails | Focus |
|----------|-------------|--------------|----------------|-------------|-------|
| A | No | targeted | v1 | Yes | Baseline single-shot |
| B | No | light | v2 | Yes | Lighter confirmation & improved template |
| C | Yes | light | v1 | Yes | Introduce incremental capture + lighter confirmations |
| D | Yes | targeted | v2 | Yes | Full incremental + richer template formatting |
| E | Yes | light | v2 | No  | Experimental JSON fragment accumulation; suppress live email |

## Telemetry Events
- `strategy_selected` (always on session start)  
- Incremental-related: `incremental_fragment_received`, `incremental_finalized`, `incremental_unknown_fields_preserved`  
- Tool lifecycle: `tool_call_start`, `tool_call_success`, `tool_call_error` (carry `incremental` flag)  

## Incremental Mode Interaction
`shouldUseIncrementalMode()` returns true if:
- Strategy config sets `incrementalEnabled = true`, OR
- Env override `NEXT_PUBLIC_INCREMENTAL_LEADS=1` (legacy flag)

When true, model is expected to use these tools:
- `addOrUpdateLeadField` (capture / revise)
- `confirmFieldValue` (explicit confirmation path)
- `finalizeLeadDraft` (submission)
- (Optionally) `getDraftSummary`, `getMissingFields` (currently no-op UI side)

## Prompt Modification Examples
| Strategy | Modifier Snippet Examples |
|----------|---------------------------|
| B | Lighter confirmation phrasing instruction |
| C | INCREMENTAL_MODE guidance + light confirmation directive |
| D | INCREMENTAL_MODE + enhanced email template note |
| E | EXPERIMENTAL JSON accumulation + snippet export hints |

## Email Behavior
- For strategy E, `liveEmailsEnabled = false` (future enforcement: skip direct email dispatch & queue for batch).
- Notes & spec uploads remain local enhancements and are not yet strategy-specific.

## Extending Strategies
Add to `LeadStrategy` union in `strategyHarness.ts` and provide config in switch. For each new strategy:
1. Define config block (incremental, confirmation, template, email).  
2. Add prompt modification strings (concise, imperative).  
3. Update matrix (this doc + `FEATURE_STATUS.md`).  
4. Add/adjust tests (e.g., enabling incremental mode expectation).  
5. Consider new telemetry fields if behavior diverges materially.

## Experiment Evaluation (Future)
Planned metrics (persisted later):
- Time-to-first-field
- Fields per minute
- Confirmation ratio (confirmations / unique fields)
- Drop-off before finalize
- Unknown fields ratio (unknown / total) for incremental strategies

Current placeholder: in-memory `recordExperimentMetric()` / `finalizeExperimentMetrics()` APIs.

## Migration Notes
Older environment flag `NEXT_PUBLIC_INCREMENTAL_LEADS` remains as a global override; prefer strategy-driven enablement for clarity and attribution.

---
Generated as part of Task 16.
