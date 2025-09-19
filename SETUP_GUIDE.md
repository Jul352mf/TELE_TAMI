<!-- ARCHIVED: Superseded by docs/deployment.md and docs/operations.md -->
# TELE TAMI – Local Setup & Cloud Deployment Guide (Archived)

This guide is retained for historical reference. For current deployment steps see `docs/deployment.md`.

## 1) Prerequisites
- Node.js 18+ (project uses Next.js 14; Functions pin Node 18)
- npm (or pnpm/yarn if you prefer; examples use npm)
- Firebase CLI: `npm i -g firebase-tools`
- A Google Cloud/Firebase project with owner access
- A SendGrid account (for Trigger Email)

## 2) Environment Variables
Copy example and fill values as you obtain them:

```bash
cp .env.example .env.local
```

Required values:
- `HUME_API_KEY`, `HUME_SECRET_KEY`: server-side for fetching EVI access tokens
- `NEXT_PUBLIC_HUME_API_KEY` (optional if using access tokens only)
- `NEXT_PUBLIC_HUME_CONFIG_ID` (optional, if you created a custom EVI config)
- `LEADS_EMAIL`: destination email for new lead notifications
- `CONSENT_MODE`: `required|optional|off` (defaults: optional)
- `GOOGLE_SHEETS_ID`: spreadsheet ID for appending leads
- `GOOGLE_SERVICE_ACCOUNT_JSON`: JSON string of a service account with Sheets access
- `FIREBASE_PROJECT_ID`: Firebase/GCP project ID used by Functions/Admin SDK

Tip: Use Windows PowerShell to set multiline JSON safely:
```powershell
$sa = Get-Content -Raw -Path .\service-account.json
[System.IO.File]::WriteAllText(".env.local", (Get-Content .env.local) + "`nGOOGLE_SERVICE_ACCOUNT_JSON=$sa")
```

## 3) Install & Run Locally
```powershell
npm install
npm run dev
```
Open http://localhost:3000 and use the UI. Without real Hume/Firebase credentials it runs in demo mode: API validates and logs, but does not persist.

## 4) Firebase Project Setup
1. Create project: https://console.firebase.google.com
2. Enable products:
   - Firestore (Native mode)
   - Cloud Storage
   - Cloud Functions
3. Initialize local Firebase if desired (optional): `firebase init`
4. Set default project for CLI:
```powershell
firebase use <your-project-id>
```

### 4.1 Firestore & Storage Security Rules
Deploy the provided MVP lockdown rules (server-only writes):
```powershell
firebase deploy --only firestore:rules,storage
```
Files:
- `firestore.rules` – denies all read/write for `leads/`, `calls/`, `mail/`
- `storage.rules` – denies all read/write for `audio/` and `transcripts/`

### 4.2 Firestore Indexes
```powershell
firebase deploy --only firestore:indexes
```

## 5) Cloud Functions (Sheets + Retention)
Navigate to `functions/`:
```powershell
cd functions
npm install
cd ..
```

Environment required at deploy time:
- `GOOGLE_SERVICE_ACCOUNT_JSON` (stringified JSON)
- `GOOGLE_SHEETS_ID`
- `RETENTION_DAYS` (default `-1` to disable)

You can set runtime env for Functions via Firebase CLI (recommended):
```powershell
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_JSON
# Paste JSON and save
firebase functions:config:set project.id="<your-project-id>" sheets.id="<your-sheets-id>" retention.days="-1"
```
Notes:
- This project reads from `process.env.*` in `functions/src/index.ts`. Using secrets is safer than storing in `.env`.

Deploy Functions:
```powershell
firebase deploy --only functions
```

Validate logs:
```powershell
firebase functions:log
```

## 6) Trigger Email Extension (SendGrid)
Install the official extension in your Firebase project:
```powershell
firebase ext:install firebase/firestore-send-email
```
Configure:
- Collection: `mail`
- Email service: SendGrid
- API Key: your SendGrid key
- From/Reply-To: as desired

The API route will create `mail/` docs once you uncomment the code in `app/api/lead/route.ts` after credentials are set. For now, it logs an email payload.

## 7) Google Sheets
- Create a spreadsheet with a `Leads` tab.
- Header row (A:R): Timestamp, Side, Product, Price Amount, Price Unit, Quantity, Payment Terms, Incoterm, Port, Packaging, Transport Mode, Price Validity, Availability Time, Availability Qty, Delivery Timeframe, Transcript URL, Audio URL, Notes
- Share the sheet with your service account email.
- Set `GOOGLE_SHEETS_ID` in Function secrets or env.

Incoming rows are appended by `onLeadCreate` when a document is added to `leads/`.

## 8) Enabling Persistence (Production Mode)
When ready to persist leads and send emails:
1. Ensure these envs are non-demo and present in the Next.js server environment:
   - `FIREBASE_PROJECT_ID`
   - `GOOGLE_SERVICE_ACCOUNT_JSON` (server only)
   - `LEADS_EMAIL`
2. Uncomment the Firestore write and `mail` creation in `app/api/lead/route.ts`.
3. Redeploy rules and Functions if changed.

## 9) Smoke Tests
- Local schema tests:
```powershell
npm test
```
- API validation:
```powershell
curl -X POST http://localhost:3000/api/lead `
  -H "Content-Type: application/json" `
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
Expect `{ ok: true }` and logs in the server console.

## 10) Production Hardening Checklist
- Restrict API route rate (e.g., middleware or WAF)
- Add server-side auth for any admin tools before relaxing rules
- Implement `onToolCall` wiring when SDK supports it
- Implement retention cleanup logic
- Add structured logging and alerting for Function failures
- Add CORS restrictions if exposing API publicly

That’s it. Ping me to walk you through Firebase or Sheets if you want live help.
