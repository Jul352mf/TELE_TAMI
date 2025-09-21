# Incremental Lead Capture

Updated: 2025-09-21

## Goal
Reduce cognitive load and improve data accuracy by capturing and confirming lead fields progressively instead of requiring a monolithic final JSON submission.

## Activation
Incremental mode is active when:
- Strategy C, D, or E selected (see `strategy.md`), OR
- Legacy override `NEXT_PUBLIC_INCREMENTAL_LEADS=1` is set.

## Core Concepts
| Concept | Description |
|---------|-------------|
| Fragment | A partial JSON object containing 1+ lead fields submitted via tool. |
| Draft ID | UUID used as key in the in-memory draft store (rotated after finalize). |
| Unknown Fields | Keys not in recognized schema; preserved & merged into `notes`. |
| Required Fields | Minimal set for finalize: `side`, `product`, `price`, `quantity`, `paymentTerms`, `incoterm`. |

## Tool Contract
| Tool | Purpose | Notes |
|------|---------|-------|
| `addOrUpdateLeadField` | Insert or overwrite a field value | Accepts `{ field, value }` |
| `confirmFieldValue` | (Optional) re-state confirmed field | Same shape as add/update; increments confirmation metric |
| `getMissingFields` | (Placeholder) list missing required fields | No-op currently on client side |
| `getDraftSummary` | (Placeholder) summarization of collected fields | No-op currently on client side |
| `finalizeLeadDraft` | Validate required fields & submit lead | Performs schema normalize + POST `/api/lead` |

## Draft Storage Flow
1. Model calls `addOrUpdateLeadField` or `confirmFieldValue` with a fragment containing single key/value.
2. `acceptFragment(draftId, sessionId, fragment)` merges into in-memory map.
3. Telemetry `incremental_fragment_received` logged with size + keys.
4. On finalize: `finalizeDraft(draftId)` returns `{ finalData, unknownFields }` and emits `incremental_finalized`.
5. Unknown fields appended to `notes` (prefixed `Other:`) + telemetry `incremental_unknown_fields_preserved`.
6. Lead POSTed; on success, draft archived into `completedLeads` array; `draftId` rotated.

## Data Normalization
`normalizeLeadPayload()` performs tightening of units, number coercion, trimming, and ensures canonical field naming before API submission.

## Unknown Field Policy
- All unknown keys retained for operator awareness.
- Concatenated as `key: value;` pairs. Objects/arrays JSON-stringified.
- Future: segregate into a structured `extras` object persisted separately.

## Error Handling
| Condition | Response |
|-----------|----------|
| Missing required fields on finalize | Toast error + throw `missing_required` |
| No active draft on finalize | Toast error + throw `no_active_draft` |
| API POST failure | Toast error + throw `record_error` |

## Telemetry Events (Incremental)
- `incremental_fragment_received`: `{ size, keys }`
- `incremental_finalized`: `{ totalKeys }`
- `incremental_unknown_fields_preserved`: `{ count, keys }`

## Extensibility
To replace in-memory map with Redis/DB:
1. Swap map operations in `incrementalJson.ts` with async persistence calls.
2. Provide TTL cleanup job for stale drafts (currently `cleanupOldDrafts`).
3. Add session-led concurrency guards for multi-lead parallel capture (if required).

## Model Guidance (Prompt Snippet)
Strategies enabling incremental insert a snippet instructing model to:
- Capture one field per turn where possible.
- Avoid re-soliciting already confirmed fields.
- Use finalize only after trader signals completeness.

## Security / Privacy Considerations
- Unknown field concatenation must be reviewed for possible PII leakage if notes are distributed broadly.
- Future hardening: classify & scrub sensitive values before merging.

## Roadmap Enhancements
- Real-time missing field announcement via synthetic messages.
- Draft summary tool wiring to user-facing recap.
- Multi-lead parallel capture (distinct concurrent draft IDs).

---
Generated as part of Task 17.
