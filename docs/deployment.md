# Deployment Guide

## Environments
- Local: `.env.local` for Next.js, secrets not committed.
- Production: Vercel (frontend) + Firebase (Functions, Firestore, Storage) + Google Sheets.

## Steps Summary
1. Configure environment variables (Hume keys, consent, Sheets, retention, email recipient).
2. Deploy Next.js to Vercel (ensure build-time NEXT_PUBLIC_* vars present).
3. Set Firebase secrets: `firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEETS_ID`, optional retention.
4. Deploy security rules & indexes.
5. Deploy Functions.
6. Install Firestore Trigger Email extension (SendGrid).
7. Verify lead capture end-to-end.

## Environment Variables (Core)
See root README or `overview.md` for definitions; eventually relocate canonical list here.

## Sheets Schema
Columns A–X (timestamp through sourceCallId). Maintain alignment with `functions/src/index.ts` append order.

## Retention
`RETENTION_DAYS=-1` disables cleanup (default). When enabling, first set `RETENTION_DRY_RUN=true` and inspect logs.

## Troubleshooting
| Symptom | Likely Cause | Resolution |
|---------|--------------|-----------|
| Email not sent | Extension misconfigured | Check `mail/` docs & extension logs |
| Sheets row missing | Missing secret or append retries exhausted | Verify secrets & Cloud Logs |
| Validation 400 | Payload missing required field | Inspect client tool args & console |

## Rollback Strategy
- Revert to previous Vercel deployment (one click) if API regressions.
- Use git revert for Functions changes and redeploy.
