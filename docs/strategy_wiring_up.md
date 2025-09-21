What IS wired

Prompt modifiers: CallButton.tsx calls getStrategyPromptModifications() and appends [[STRATEGY_MOD]] lines.
Telemetry: A strategy_selected event is emitted (actually can be emitted twice in some flows—see below).
Incremental tool guidance in the prompt (via modifiers for C–E) if a strategy is resolved.
Documentation describes A–E accurately.
What is NOT fully wired

Incremental tools activation: CallButton.tsx still gates tool payloads with process.env.NEXT_PUBLIC_INCREMENTAL_LEADS === '1' rather than the chosen strategy’s incrementalEnabled. So choosing C/D/E alone won’t turn on incremental tools unless that legacy flag is set.
Strategy source of truth is split:
strategyHarness.ts reads NEXT_PUBLIC_LEAD_STRATEGY
strategyResolver.ts reads NEXT_PUBLIC_STRATEGY (and RANDOM)
They can drift; both can emit strategy_selected.
Email template version & live email gating in route.ts are driven by EMAIL_TEMPLATE_VERSION and manual logic, not the strategy config (so picking D vs C doesn’t currently switch template automatically; strategy E doesn’t actually suppress live email—only environment EMAIL_MODE does).
Confirmation intensity (light vs targeted) isn’t used anywhere yet (no behavioral branch that consumes it).
Live email suppression for strategy E isn’t enforced (still governed by EMAIL_MODE + production check).
Potential double emission of strategy_selected if both resolver and harness get invoked in a full flow.
Legacy incremental override flag still primary gate.
Risk / Impact

Running an experiment expecting strategies alone to control incremental mode, confirmation style, or live email behavior will yield misleading telemetry.
Documentation overstates runtime effect for email gating & confirmation intensity.
RANDOM selection only implemented in strategyResolver.ts, not in getStrategyConfig().
Recommended Unification Plan

Collapse to a single env var: NEXT_PUBLIC_LEAD_STRATEGY supporting values: A–E | RANDOM.
Merge RANDOM logic into getStrategyConfig(); deprecate strategyResolver.ts.
Extend getStrategyConfig(emitTelemetry = true) so API route can retrieve config without duplicating telemetry.
In CallButton.tsx:
Replace resolveStrategy() + legacy flag with const cfg = getStrategyConfig();
Build tools via buildHumeToolsPayload(cfg.incrementalEnabled || process.env.NEXT_PUBLIC_INCREMENTAL_LEADS === '1') (keep legacy override for now).
Use cfg.strategy for modifiers.
In route.ts:
Import config with getStrategyConfig(false) and set templateVersion = cfg.emailTemplate.
Enforce live email gating: if !cfg.liveEmailsEnabled, force emailMode = 'off' (or skip send).
(Optional) Provide a small getConfirmationIntensity() consumer hook or pass intensity into prompt builder for more nuanced confirmation instructions.
Remove strategyResolver.ts and update docs referencing NEXT_PUBLIC_STRATEGY.
Update telemetry.md to note strategy selection is client-only.
Add tests:
Strategy C enables incremental tools (tools array includes addOrUpdateLeadField).
Strategy E sets live email disabled (simulate route logic).
RANDOM returns one of A–E and only emits a single telemetry event.
Minimal Patch Footprint (summary)

strategyHarness.ts: add RANDOM handling + optional telemetry flag.
Remove strategyResolver.ts.
CallButton.tsx: switch to harness, swap incremental flag usage.
route.ts: adopt config for template + live gating.
Docs adjustments (strategy.md, development.md, prompting.md).
Tests for gating & tool presence.