# Structured Implementation Plan for Updated New_TODOs.md

Date: 2025-09-18

## Source Scope

Derived from `New_TODOs.md` (latest) including: refined conversation flow, multi-lead handling verification, incremental lead capture strategies, closing behavior triggers, behavioral guardrails, prompt structuring, and potential escalation to richer tool operations.

## Organized Domains

1. Conversation Flow & Lead Collection
2. Multi-Lead Lifecycle & State Management
3. Prompt Engineering & Structure
4. Tooling Strategy (Progressive Enhancement)
5. Closing Behavior & Triggers
6. Behavioral Guardrails (Do / Don’t)
7. Data Capture & Robustness
8. Email Formatting (Deferred)
9. Sheets Verification & Data Quality
10. Technical UX & Observability
11. Safety, Compliance, Tone
12. Iteration & Experimentation Framework

---
## 1. Conversation Flow & Lead Collection

### Target Flow (Refined)

1. Warm Introduction + Small Talk + Emotional mirroring.
2. Ask if trader has new leads.
3. If yes: explain process, answer questions, confirm readiness.
4. Initial free-form lead narrative (“What’s the deal?”) → extract structured fields → natural reaction → summarize & confirm.
5. Iterative slot fill: ask for highest-priority missing required field, confirm, record; then optional fields if trader interested.
6. Offer adding more leads; if yes, restart from step 4.
7. Transition to closing sequence if no more leads or closing trigger met.

### Implementation Notes

- Introduce ephemeral lead store capturing partial fields before final commit.
- One confirmation pass only per numeric value unless user changes it.
- Summarization step acts as a pivot: after first free-form explanation.

### Risks

- Overly rigid summarization might feel robotic—inject persona style.
- Free-form extraction requires robust LLM reliability; consider mild redundancy (ask clarifications if confidence low).

---
## 2. Multi-Lead Lifecycle & State Management

### Requirements

- Handle N leads sequentially; only one active at a time.
- After confirming one lead: ask if more; if yes, reset ephemeral state for next lead.
- Tag each final lead with `sourceCallId + sequenceIndex` or nested array.

### Design

- Maintain `sessionState = { activeLeadIndex, leads: LeadDraft[] }` in client memory.
- Each `LeadDraft` tracks: fieldValues, confirmedFlags, status (collecting|ready|finalized|aborted).
- On final confirmation → tool call (MVP single-shot) OR incremental streaming (advanced mode).

### Extension

- Add feature flag `INCREMENTAL_LEADS=true` to enable per-item tool actions.

---
## 3. Prompt Engineering & Structure

### Modular Sections
- ROLE & CONTEXT
- GOAL & DEFINITIONS
- FLOW SCRIPT (phases 1–7 compressed, imperative form)
- MULTI-LEAD PROTOCOL
- SLOT FILLING LOGIC (priority ordering, confirmation rules)
- CLOSING BEHAVIOR
- TONE & PERSONA OVERLAY (persona appended last)
- GUARDRAILS (refusals / boundaries / escalate conditions)
- OUTPUT RULES (tool invocation contract)
- ADAPTIVITY (respond to mood, emotional mirroring examples)
- EXAMPLE FLOW (annotated, but emphasize dynamic wording)

### Action
- Replace monolith with builder: `buildPrompt({ persona, flags })` assembling ordered blocks.

---
## 4. Tooling Strategy (Progressive)

| Stage | Tools | Description |
|-------|-------|-------------|
| A | recordLead (final JSON) | Current MVP |
| B | + addOrUpdateItem(field, value) | Ephemeral accumulation server-side |
| C | + confirmItem(field) / getOpenItems() / getConfirmedItems() | Granular control & agent self-check |
| D | + finalizeLead(status) | Explicit completion / abort semantics |

### Migration
- Introduce new tools behind feature flags; collect telemetry on accuracy.

---
## 5. Closing Behavior & Triggers

### Triggers
- User signals completion / farewell
- Trader uncollaborative (X attempts w/o progress)
- Emotional degradation: 3 consecutive negative sentiment messages
- Time-based (near 10m limit)

### Sequence
1. Offer optional recap.
2. Mark lead success/failure (required fields present?).
3. Personal closing remark referencing earlier context.
4. Ask for feedback.
5. Thank & goodbye.

### Instrumentation
- Track reason code: `completed|timeout|inactivity|frustration|user_exit`.

---
## 6. Behavioral Guardrails (Do / Don’t)

### Do
- Use natural, concise turns (<=2 sentences typical).
- Mirror tone with mild variation (never escalate beyond trader unless guardrail triggers).
- React emotionally (light sigh, amused chuckle) sparingly.
- Clarify ambiguous numeric or location inputs once.

### Don’t
- Re-list already confirmed fields unless changed.
- Ask two required fields in one turn.
- Over-apologize more than once per frustration sequence.
- Use explicit sexual or abusive language.

---
## 7. Data Capture & Robustness
- Ephemeral state resilience: autosave draft in local storage every turn.
- On disconnect: if draft has required subset → fallback email with partial lead flagged `partial=true`.
- Confidence heuristic: require explicit confirmation for any inferred price or quantity parsed from free-form text.

---
## 8. Email Formatting (Deferred)
- Strategy discussion required before implementation (branding, theming, signature blocks, escalation tags).

---
## 9. Sheets Verification & Data Quality
- Add header checksum or version row (e.g., hidden row 1 with schema version).
- Log % of optional fields filled per lead for optimization.
- Add derived columns server-side (e.g., unit price normalization, country mismatch flags).

---
## 10. Technical UX & Observability
- Add connect transition UI (disable button + spinner).
- Telemetry events: `lead_draft_updated`, `lead_finalized`, `timeout_warning`, `closing_triggered`.
- Central logger with session + lead index context.
- Developer overlay (debug panel) toggle to inspect ephemeral state.

---
## 11. Safety, Compliance, Tone
- Central tone rules separate from persona specifics.
- Escalation script for abusive language (firm but professional).
- Consent runtime insertion if required flag present.

---
## 12. Iteration & Experimentation Framework
- AB test: Monolithic vs Structured prompt.
- Metrics: time to first required field, total turns to completion, abandonment rate.
- Rollout: feature flags via environment variables.

---
## Phased Implementation Plan

### Phase 1 (Foundation)
- Structured prompt builder (no semantic changes beyond reorganization).
- Local ephemeral lead state (client only) + graceful final tool call.
- Consent insertion.
- Basic telemetry event emitters (console stub).

### Phase 2 (Resilience + Insights)
- Autosave draft + partial fallback email.
- Add model & voice persistence (localStorage).
- Sheets header version check + warnings.
- Logger abstraction + reason codes on disconnect.

### Phase 3 (Granular Tools)
- Implement Stage B tools (`addOrUpdateItem`, `finalizeLead` alias of record).
- Hidden feature flag to compare success metrics.
- Analytics collector for tool usage patterns.

### Phase 4 (Advanced Orchestration)
- Introduce confirmation/query tools (Stage C).
- Negative sentiment detection (basic lexicon) for closing triggers.
- Structured recap script variants (AB test).

### Phase 5 (Optimization & Cleanup)
- Retention sweep implementation (GC logic).
- Prompt variant scoring harness (automated regression evaluator against synthetic dialogues).
- Expand schema currencies/units if business need emerges.

---
## Critical Feedback
- Current single-shot tool model is fragile; incremental accumulation will materially reduce data loss risk.
- Monolithic prompt discourages safe iterative refinement; modularization is a prerequisite for experimentation.
- Without telemetry, future tuning will be guesswork—instrument early.
- Emotional trigger detection is unspecified; define minimal heuristic or integrate sentiment scores if available from Hume models.
- Sheets structure may be over-provisioned; measuring actual optional field utilization can drive column pruning for clarity.
- Retention and consent flows remain partially conceptual; address before scale to avoid compliance debt.

---
## Immediate Next Candidates
1. Modular prompt builder + ephemeral lead draft (unlocks subsequent work).
2. Consent runtime injection.
3. Telemetry scaffold (console → pluggable adapter).
4. Autosave + partial fallback strategy draft.

---
Generated plan; ready for refinement or approval.
