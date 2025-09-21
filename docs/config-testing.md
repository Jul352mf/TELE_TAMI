# Config & System Prompt Layering Test Guide

## Matrix
| Hume Config Dropdown | Code System Prompt | Expected Behavior |
|----------------------|--------------------|-------------------|
| Default (Env)        | Include            | Uses `NEXT_PUBLIC_HUME_DEFAULT_CONFIG_ID` + code prompt |
| Default (Env)        | None               | Uses default config only (no code prompt) |
| None (Global)        | Include            | No `configId` sent; code prompt appended after base |
| None (Global)        | None               | Pure Hume global default (baseline internal prompt only) |
| Jules Clone          | Include            | Jules config + code prompt layered |
| Jules Clone          | None               | Jules config only |
| Custom (UUID)        | Include            | Custom config + code prompt |
| Custom (UUID)        | None               | Custom config only |

## Steps
1. Run `npm run dev`.
2. Open app, set selections, start a session each scenario.
3. Inspect Hume chat history first two system blocks:
   - Voice/style block should match chosen config (or default baseline / global None).
   - `<user_prompt>` block present only when Code System Prompt = Include.
4. Check browser console logs:
   - Should show `configId: <uuid>` when provided.
   - Log system prompt content only when included.
5. For None/None confirm no custom prompt content appears after internal block.

## Troubleshooting
- If config change not applied: ensure page reload after editing `.env.local` for defaults.
- If system prompt appears when set to None: verify localStorage cleared (`tami:uiSettings:v1`).
- If custom UUID rejected: validate correct Hume config ID.
- Error: `language model ('ellm') does not support tool use` → Occurs when no config AND provider default falls back to a non tool-capable model. Fix: supply a config with tools enabled or ensure code forces a tool-capable model (we now auto-fallback to `hume-evi-3` when `configId` is absent).

## Telemetry Hooks (future)
Consider emitting an event on connect summarizing resolved parameters for analytics.
