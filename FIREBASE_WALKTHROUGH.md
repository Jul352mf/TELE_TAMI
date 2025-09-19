# Firebase Walkthrough (Archived)

<!-- ARCHIVED: Use docs/deployment.md for current instructions. -->

Follow these steps to stand up Firebase for TELE TAMI. All commands are ready for Windows PowerShell.

## 0) Install & Login (Historical)
```powershell
npm i -g firebase-tools
firebase login
```

## 1) Select Project (Historical)
Pick your target project ID once created in the Firebase console.
```powershell
$PROJECT_ID = "your-project-id"
firebase use $PROJECT_ID
```

## 2) Deploy Security Rules & Indexes (Historical)
This enforces server-only access for MVP.
```powershell
cd C:\Dev\Projects\TELE_TAMI
firebase deploy --only firestore:rules,storage
firebase deploy --only firestore:indexes
```

## 3) Prepare Google Sheets Access (Service Account) (Historical)
- In Google Cloud Console (same project), create a Service Account with role "Editor" (or scoped to Sheets usage).
- Create a JSON key and download it as `service-account.json`.
- Share your target Google Sheet with the service account email (it ends with `iam.gserviceaccount.com`).
- Get your Sheet ID (the long ID in the sheet URL) and save it.

Store the creds as a Functions secret (safer than .env):
```powershell
cd functions
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_JSON
# Paste the contents of service-account.json, then ENTER to save
cd ..
```

Optionally also store sheet ID as a secret or config:
```powershell
firebase functions:secrets:set GOOGLE_SHEETS_ID
# Paste your Sheet ID
```

Or keep `GOOGLE_SHEETS_ID` in `.env.local` for local reference and set it as a secret later.

## 4) Configure Retention (Optional) (Historical)
Keep cleanup disabled until implemented:
```powershell
firebase functions:secrets:set RETENTION_DAYS
# Enter: -1
```

## 5) Deploy Functions (Historical)
```powershell
cd functions
npm install
cd ..
firebase deploy --only functions
```

Check logs:
```powershell
firebase functions:log
```

## 6) Install Trigger Email (SendGrid) (Historical)
Installs the official extension that watches the `mail/` collection.
```powershell
firebase ext:install firebase/firestore-send-email
```
During setup set:
- Collection path: `mail`
- Email service: SendGrid
- API Key: your SendGrid API key
- From / Reply-To: choose appropriate addresses

## 7) Enable API Persistence (Historical)
By default, the API only validates and logs. Once you’re ready to persist:
- Ensure the server has these envs:
  - `FIREBASE_PROJECT_ID=$PROJECT_ID`
  - `LEADS_EMAIL=<destination@yourdomain>`
- Uncomment the Firestore write and `mail` creation in `app/api/lead/route.ts`.
- Redeploy rules/functions if needed.

## 8) End-to-End Smoke (Historical)
- Start the app:
```powershell
npm run dev
```
- Post a valid lead to the API:
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
- With persistence enabled, a `leads/` doc will write, the Function will append to your `Leads` sheet, and a `mail/` doc will trigger an email.

## 9) Troubleshooting (Historical)
- Missing Sheets envs in Functions: `onLeadCreate` logs warnings and no-ops.
- Extension not sending email: verify SendGrid key and `mail` docs exist.
- Rules blocking access: By design, client cannot read/write `leads/`, `calls/`, `mail/`.
- CI failing on `npm ci`: add `package-lock.json` or change CI to `npm install`.
