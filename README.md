<div align="center">
  <img src="https://storage.googleapis.com/hume-public-logos/hume/hume-banner.png">
  <h1>TELE TAMI - AI Trading Lead Assistant</h1>
</div>

## Overview

TELE TAMI is an AI-powered voice agent (Hume EVI) that captures structured commodity trading leads through natural conversation. It validates lead data, persists it (Firestore + Google Sheets), and dispatches notification emails. The system supports multi-persona styles, emerging multi-lead flows, and a roadmap for incremental tool capture or transcript post-processing.

Full documentation now lives under `docs/`:
- Quick intro: `docs/overview.md`
- System design: `docs/architecture.md`
- Prompt & personas: `docs/prompting.md`
- Dev workflow: `docs/development.md`
- Deployment & ops: `docs/deployment.md`, `docs/operations.md`
- Differences from template: `docs/template-diff.md` & `docs/template-overview.md`
- Roadmap: `docs/roadmap.md`

Outdated root guides have been archived to `docs/archive/`.

## Quick Start (Condensed)

```bash
cp .env.example .env.local   # add keys
npm install
npm run dev
# open http://localhost:3000
```

For full setup (Firebase, Sheets, SendGrid) see `docs/deployment.md`.

## Environment Variables (Summary)
See `.env.example` and `docs/deployment.md` for full list.

Core: `HUME_API_KEY`, `HUME_SECRET_KEY`, `NEXT_PUBLIC_HUME_API_KEY`, `LEADS_EMAIL`, `CONSENT_MODE`, `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`.
Flags: `NEXT_PUBLIC_INCREMENTAL_LEADS=1`, `RETENTION_DAYS`, `RETENTION_DRY_RUN`, `CONSENT_LINE`.

Behavior notes & feature flags detailed in `docs/operations.md`.

### Example `.env.local` Snippet

```bash
HUME_API_KEY=...
HUME_SECRET_KEY=...
NEXT_PUBLIC_HUME_API_KEY=...
CONSENT_MODE=required
CONSENT_LINE="This call may be recorded for lead creation. Continue?"
NEXT_PUBLIC_INCREMENTAL_LEADS=1
RETENTION_DAYS=30
RETENTION_DRY_RUN=true   # flip to false after verification
GOOGLE_SHEETS_ID=...
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

Deployment specifics moved to `docs/deployment.md`.

## Firebase / Sheets / Email

See `docs/deployment.md` for step-by-step cloud setup and `docs/operations.md` for retention & consent.

## Sheets Schema
Column layout and append order documented in `docs/deployment.md`.

## Features (Brief)
Personas, Ole interview mode, incremental tooling (flagged), structured lead validation, Sheets + email pipeline. Full detail: `docs/prompting.md` & `docs/architecture.md`.

## Smoke Test

Complete end-to-end test:

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Test the Interface**
   - Navigate to `http://localhost:3000`
   - Select persona (try "Seductive" for demo)
   - Enable "🌶️ Spicy Mode" to unlock "Unhinged" option
   - Click "Call TAMI" button (will show connection UI)

3. **Test the API Directly**
   ```bash
   curl -X POST http://localhost:3000/api/lead \
     -H "Content-Type: application/json" \
     -d '{
       "side": "SELL",
       "product": "Aluminum ingots 99.7%",
       "price": {"amount": 2250, "currency": "CHF", "per": "mt"},
       "quantity": {"amount": 500, "unit": "mt"},
       "paymentTerms": "LC at sight",
       "incoterm": "FOB",
       "port": "Hamburg"
     }'
   ```

4. **Verify Results**
   - [ ] API returns `{"ok":true}`
   - [ ] Console shows validated lead structure
   - [ ] Console shows email template
   - [ ] UI components work: persona toggle, spicy mode, call button
   - [ ] Persona selection affects the recorded persona field
   - [ ] "Ole mode" detection ready (transcript monitoring)

## Production Enablement

When you have Firebase and Hume credentials:

1. **Replace demo credentials** in `.env.local`
2. **Uncomment Firebase code** in `/app/api/lead/route.ts`
3. **Deploy Firebase Functions** with `firebase deploy --only functions`
4. **Install Trigger Email extension** with SendGrid configuration
5. **Test complete flow**: Call → tool call → Firestore → email → Sheets row

## Development

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## Architecture
See `docs/architecture.md`.

## Support
Open an issue in this repository. For Hume EVI SDK matters use the Hume Discord: https://link.hume.ai/discord
