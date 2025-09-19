# Prompting & Personas

## Structure
The system prompt is assembled via `buildSystemPrompt(persona, isOleMode)` using modular segments:
- ROLE & GOAL
- REQUIRED FIELDS & OPTIONAL FIELDS
- FLOW (phases 1–7)
- MULTI-LEAD PROTOCOL
- BEHAVIOR RULES
- CLOSING
- TIMEOUTS
- OUTPUT CONTRACT
- (Conditional) INCREMENTAL MODE guidance
- PERSONA OVERLAY
- (Optional) INTERVIEW MODE (Ole)

## Incremental Mode
Enabled when `NEXT_PUBLIC_INCREMENTAL_LEADS=1` adding guidance for per-field tool calls and draft summaries.

## Personas
| Persona | Description |
|---------|-------------|
| professional | Warm, confident, business-focused, tasteful. |
| seductive | Upbeat, controlled energy, mildly sassy; professional boundaries. |
| unhinged | Chaotic tempo, witty irreverence (no profanity). |
| cynical | Dry, sarcastic, sharp but respectful. |

## Ole Interview Mode
Activated when name "Ole" detected or manually flagged; injects charismatic pitch persona before switching to lead collection.

## Consent
Consent line included automatically in prompt only when `CONSENT_MODE=required`. Runtime insertion enhancement is pending (see roadmap).

## Tooling Contract
Primary tool: `recordLead`. Incremental (flagged) tools: `addOrUpdateLeadField`, `finalizeLeadDraft`, `getDraftSummary`, `getMissingFields`, `confirmFieldValue`.

## Style Principles
- One field per conversational turn.
- Brief, adaptive mirroring of trader mood.
- Avoid re-confirming already confirmed fields unless user alters them.
- Light humor; avoid explicit language.
