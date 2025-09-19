# Operations & Compliance

## Consent
- Modes: required | optional | off (env: `CONSENT_MODE`).
- Pending runtime injection improvement; currently handled in prompt assembly only.

## Retention
- Controlled via `RETENTION_DAYS` and `RETENTION_DRY_RUN`.
- Sweep deletes media references & Storage objects older than threshold; dry-run annotates planned deletions.

## Telemetry (Current)
- Console events for session connect, inactivity/duration warnings, tool calls.
- Future: structured event pipeline with sampling & storage.

## Error Handling
- API produces 400 for validation failures; 500 for internal errors.
- Functions retry Sheets append manually (3 attempts exponential backoff).

## Security Posture
- Firestore rules lock down sensitive collections (server-only writes).
- No client credential exposure (admin only server side).

## Incident Response (Planned)
- Add correlation IDs to email subjects & log lines.
- Introduce structured JSON logs for ingestion into monitoring stack.

## Checklist Before Scale
- [ ] Runtime consent injection
- [ ] Correlation IDs
- [ ] Partial lead fallback
- [ ] Sentiment heuristic for closing triggers
- [ ] Retention sweep validated on sample data
