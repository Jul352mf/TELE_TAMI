# Feature Status Matrix

Updated: 2025-09-21

## Legend
- ACTIVE: Fully wired in runtime & telemetry present
- EXPERIMENTAL: Implemented but guarded by strategy/env or missing tests
- PLANNED: Not yet implemented
- DEPRECATED: Present but slated for removal / superseded

## Core Conversation & Lead Capture
| Feature | Status | Notes |
|---------|--------|-------|
| Strategy Selection (A-E + RANDOM) | ACTIVE | `resolveStrategy` + prompt modifications via `CallButton` / `strategyHarness`. Telemetry: `strategy_selected`. |
| Incremental Lead Capture Backend | ACTIVE | Uses `acceptFragment` / `finalizeDraft`. Telemetry: `incremental_fragment_received`, `incremental_finalized`, `incremental_unknown_fields_preserved`. |
| Unknown Field Preservation | ACTIVE | Merged into `notes` field during finalize; telemetry event emitted. |
| Push-back Injection | ACTIVE | Via `useConversationState` + synthetic message; telemetry `pushback_used`. |
| Closing Intent Detection | ACTIVE | Conversation state sets `closingTriggered`; UI banner + telemetry `closing_triggered`. |
| Recap (Multi-lead) | ACTIVE | Recap button composes from draft + completed leads; telemetry `recap_requested` / `recap_provided`. |
| Multi-lead Draft Archiving | ACTIVE | `LeadDraftProvider` stores `completedLeads`. |
| Live Voice Speed Adjust | ACTIVE | Slider + `sendSessionSettings` partial update. |
| Notes Panel (Session Notes) | ACTIVE | Local storage + optional email attempt (placeholder endpoint). Telemetry: `note_created`. |
| Spec File Upload | ACTIVE | Simulated upload + telemetry `spec_uploaded`. |
| Accessibility Enhancements | ACTIVE | Global enhancer + skip link + contrast/motion support. |
| Info Tooltips | ACTIVE | Added to key pre-call controls. |
| Email Dispatch (Lead finalize) | ACTIVE | `/api/lead` POST on finalize; strategy E can disable via liveEmails flag (future). |
| Ole Mode Detection | ACTIVE | Basic transcript check toggling mode (affects persona prompt). |

## Prompt & Tooling
| Feature | Status | Notes |
|---------|--------|-------|
| System Prompt Assembly | ACTIVE | `buildSystemPrompt` + strategy modifications appended. |
| Tool Telemetry Wrapper | ACTIVE | `withToolTelemetry` around tool calls. |
| Consent Line Injection Telemetry | ACTIVE | Emits `consent_injected` if line present. |
| Telemetry Event Bus | ACTIVE | `emit()` logs all structured events (console debug target). |
| Strategy Prompt Modifiers | ACTIVE | Harness returns modification strings tagged `[[STRATEGY_MOD]]`. |

## Documentation & Observability
| Feature | Status | Notes |
|---------|--------|-------|
| Feature Status Doc | ACTIVE | This file. |
| Strategy Documentation | PLANNED | Will cover configuration & experiment rationale. |
| Incremental JSON Doc | PLANNED | Will explain fragment lifecycle & finalize requirements. |
| Telemetry Schema Doc | PLANNED | Enumerate all events / fields. |
| Updated Prompting Guide | PLANNED | Needs to reflect strategy mods & recap. |
| Decision Log Automation | PLANNED | Extend append script to include strategy distribution metrics. |

## Testing & Quality
| Feature | Status | Notes |
|---------|--------|-------|
| Jest Path Alias Fix | ACTIVE | `moduleNameMapper` corrected. |
| Strategy Harness Tests | ACTIVE | Existing tests pass for `shouldUseIncrementalMode`. |
| Integration Tests (Pushback/Closing/Incremental Finalize) | PLANNED | To be added. |
| Dead Code Audit | PLANNED | After final doc tasks. |

## Experimental / Guarded
| Feature | Status | Notes |
|---------|--------|-------|
| Strategy E (No live emails) | EXPERIMENTAL | Logic placeholder; live email gating not fully enforced everywhere. |
| Email Mode Toggle (Notes) | EXPERIMENTAL | Controlled via `NEXT_PUBLIC_EMAIL_MODE`; no server validation yet. |

## Planned / Backlog
| Feature | Status | Notes |
|---------|--------|-------|
| Changelog Automation | PLANNED | Manual entry planned first. |
| Advanced Spec Processing | PLANNED | Current upload is mock; future parse & integrate into prompt. |
| Redis/DB-backed Incremental Drafts | PLANNED | Replace in-memory Map for multi-instance scaling. |

## Deprecated / Superseded
| Feature | Status | Notes |
|---------|--------|-------|
| Local-only Draft Mutation | DEPRECATED | Replaced by incremental backend when strategy incremental enabled. |

## Telemetry Event Inventory (Snapshot)
List: session_connected, inactivity_warning, inactivity_disconnected, duration_warning, duration_disconnected, lead_tool_called, consent_injected, prompt_version, tool_call_start, tool_call_success, tool_call_error, closing_triggered, recap_requested, recap_provided, pushback_used, strategy_selected, incremental_fragment_received, incremental_finalized, incremental_unknown_fields_preserved, note_created, spec_uploaded.

## Acceptance Criteria Traceability
- All ACTIVE features have runtime wiring + at least console telemetry.
- Experimental features behind environment or strategy defaults.
- Planned docs & tests enumerated for subsequent tasks (15–19, 20).

---
Generated as part of Task 15. Update date when modifying.
