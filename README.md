<div align="center">
  <img src="https://storage.googleapis.com/hume-public-logos/hume/hume-banner.png">
  <h1>TELE TAMI - AI Trading Lead Assistant</h1>
</div>

## Overview

TELE TAMI is an AI-powered voice agent built on Hume's Empathic Voice Interface (EVI) for capturing commodity trading leads. This MVP implementation allows users to interact with TAMI via voice to collect structured trading information.

## Deviations

*None - following blueprint exactly*

## Quick Start

1. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Fill in your Hume API keys and other required environment variables
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Application**
   Navigate to `http://localhost:3000`

## Environment Variables

Required environment variables (see `.env.example`):

- `HUME_API_KEY` - Your Hume API key
- `HUME_SECRET_KEY` - Your Hume secret key
- `NEXT_PUBLIC_HUME_API_KEY` - Public Hume API key for client
- `LEADS_EMAIL` - Email address for lead notifications
- `CONSENT_MODE` - Consent behavior (required|optional|off)
- `GOOGLE_SHEETS_ID` - Google Sheets spreadsheet ID
- `GOOGLE_SERVICE_ACCOUNT_JSON` - Service account credentials (JSON)

### Feature Flags & Extended Environment Variables

These flags control optional or experimental behavior. Unless noted as `public`, they are server-side only.

| Variable | Scope | Values / Format | Default | Purpose |
|----------|-------|-----------------|---------|---------|
| `NEXT_PUBLIC_INCREMENTAL_LEADS` | public | `1` \| unset | unset (off) | Enables incremental lead tools (add/update single field, confirm, summarize, get missing fields) instead of single final `recordLead` call only. |
| `CONSENT_MODE` | server | `required` \| `optional` \| `off` | `optional` | Governs if consent line is auto-spoken (`required`), only on user inquiry (`optional`), or entirely disabled (`off`). |
| `CONSENT_LINE` | server | Free text string | Built-in default line | Override the spoken consent sentence when `CONSENT_MODE=required`. Ignored when `off`; not auto-injected when `optional`. |
| `RETENTION_DAYS` | server | Integer (e.g. `30`, `7`, `-1`) | `-1` | Age threshold (in days) to purge media links (audio/transcripts). `-1` disables cleanup. |
| `RETENTION_DRY_RUN` | server | `true` \| `false` | `false` | When `true`, retention sweep only logs what would be deleted/updated—no storage or Firestore mutations. Safe mode for validation. |
| `HUME_MODEL` | public/server | Model identifier | Hume default | (If supported) select alternate EVI model variant. |
| `NEXT_PUBLIC_DEFAULT_VOICE_ID` | public | Voice ID | internal default | Pre-select a specific voice in the UI. |
| `LEADS_EMAIL` | server | Email address | none | Target for notification / extension triggers. |

### Behavior Notes

- Incremental mode (`NEXT_PUBLIC_INCREMENTAL_LEADS=1`) extends the tool list with per-field operations. In off mode only `recordLead` is advertised.
- In `CONSENT_MODE=optional`, the system will not auto-inject the consent line; model should surface it only if user asks about recording/privacy.
- Retention sweep executes daily at 02:00 UTC (see `functions/src/index.ts`). Use `RETENTION_DRY_RUN=true` first to verify logs before enabling destructive deletions.
- Media cleanup removes `audioUrl` / `transcriptUrl` fields and underlying Cloud Storage objects once older than `RETENTION_DAYS`.
- Setting `RETENTION_DAYS` to a small number (e.g. `1`) in combination with dry-run provides quick validation of logging output.

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

### Deployment Tips

- For Firebase Functions secrets (`GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEETS_ID`, etc.) use `firebase functions:secrets:set` rather than committing values.
- Public (`NEXT_PUBLIC_`) variables must be present at Next.js build time to affect the client bundle.
- After changing retention flags, redeploy functions to ensure environment refresh.

## Firebase Setup

1. **Create Firebase Project**
   - Enable Firestore Database
   - Enable Cloud Storage
   - Enable Cloud Functions

2. **Install Trigger Email Extension**
   ```bash
   firebase ext:install firebase/firestore-send-email
   ```
   Configure with your SendGrid API key.

3. **Deploy Functions**
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

4. **Deploy Security Rules**
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

## Google Sheets Setup

1. Create a new Google Sheets spreadsheet
2. Create a "Leads" tab with headers in row 1:
   - Timestamp, Side, Product, Price, Price Unit, Quantity, Payment Terms, Incoterm, Port, Packaging, Transport Mode, Price Validity, Availability Time, Availability Qty, Delivery Timeframe, Transcript URL, Audio URL, Notes
3. Share the spreadsheet with your service account email
4. Add the spreadsheet ID to your environment variables

## Features

### Personas
- **Professional**: Business-like, focused on accuracy
- **Seductive**: Warm, charming, but classy and business-focused  
- **Unhinged**: Sharp-tongued with profanity escalation (Spicy Mode only)

### Special Modes
- **Ole Mode**: Automatically activates when "Ole" is detected in conversation, switches to interview/sales mode
- **Spicy Mode**: Enables the "unhinged" persona with profanity escalation
- **Consent Gating**: Configurable consent behavior based on environment settings

### Data Collection
TAMI collects structured trading leads with validation for:
- Required fields: side, product, price (CHF), quantity, payment terms, Incoterm 2020, port
- Optional fields: packaging, transport, validity, availability, delivery timeframe
- Automatic email notification and Google Sheets logging

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

## Testing with Real Services

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

- **Frontend**: Next.js App Router with Hume EVI React SDK
- **Backend**: Next.js API routes for lead processing
- **Database**: Firebase Firestore with server-write-only security rules
- **Storage**: Cloud Storage for audio/transcripts
- **Email**: Firestore Trigger Email extension
- **Sheets**: Google Sheets API via Cloud Functions
- **Functions**: Firebase Cloud Functions for data processing

## Support

For issues with this TELE TAMI implementation, please create an issue in the repository.

For Hume EVI support, [reach out on Discord](https://link.hume.ai/discord).
