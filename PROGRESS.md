# Execution Progress

Date: 2025-09-18

## Plan

1. Replace prompts per New_Prompts.md (base, personas, interview).
2. Add 'cynical' persona in UI and types.
3. Build, test basic integration, commit and push.
4. Implement configs in New_Configs.md.
5. Address items in New_TODOs.md.

## Status (Updated)

- Prompts: Replaced (base, personas, interview); multi-lead + closing + timers guidance added.
- Personas: `cynical` integrated end-to-end; Ole trigger switches to interview mode.
- Configs: Voice selection + model selection (hume-evi-3 default) implemented; inactivity & duration timers client-side.
- Session: Added `SessionTimers` (60s/90s inactivity, 8m/10m duration), session-scoped `sourceCallId`.
- Sheets: Retry logic + new `sourceCallId` column (A:AA) appended; mapping audited.
- Email: Upgraded HTML template (dark styled, table of fields).
- UI: Settings cluster repositioned; GitHub star removed; spacing refined; added model & voice dropdowns.
- Tests: Existing prompt tests pass; pending expanded coverage (sanitize, timers) – not yet implemented.
- Docs: Audit created (`AUDIT.md`); modular prompt builder implemented (segmented in `lib/hume.ts`); PROGRESS updated.
- Commits: Multiple feature commits pushed to `pr-1` (prompts, persona, voice/model, timers, audit).

## Next Steps

1. Ephemeral lead draft state provider (client only) – scaffold.
2. Consent line runtime injection (partially added in builder – verify env gating & first-turn behavior).
3. Optional local persistence for voice/model/persona selections.
4. Incremental lead tool set (add/update/finalize) behind feature flag.
5. Add tests: `sanitizeForHume`, timers logic, Sheets retry backoff, prompt composition snapshot.
6. Implement retention sweep logic or remove stub.

## Notes

- Profanity removed for policy compliance; closing firmness retained.
- Current approach still single-shot lead recording; resilience improvements recommended (see AUDIT.md).
