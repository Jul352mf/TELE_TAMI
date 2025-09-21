import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { google } from "googleapis";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Bind required secrets and default region for all functions (Gen 2)
const GOOGLE_SERVICE_ACCOUNT_JSON = defineSecret("GOOGLE_SERVICE_ACCOUNT_JSON");
const GOOGLE_SHEETS_ID = defineSecret("GOOGLE_SHEETS_ID");
setGlobalOptions({
  region: "us-central1",
  secrets: [GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_SHEETS_ID]
});

/**
 * Cloud Function: Append lead to Google Sheets when new lead is created
 */
export const onLeadCreate = onDocumentCreated("leads/{leadId}", async (event) => {
  const lead = event.data?.data();
  if (!lead) {
    console.error("No lead data found in document");
    return;
  }

  try {
    // Parse service account credentials from environment
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      console.error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable not set");
      return;
    }

    const credentials = JSON.parse(serviceAccountJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID?.trim();

    if (!spreadsheetId) {
      console.error("GOOGLE_SHEETS_ID environment variable not set");
      return;
    }

    // --- Dynamic schema drift handling ---
    // We maintain a header row in the sheet. If new keys appear in lead documents,
    // we append new columns automatically and persist the header mapping to Firestore
    // (collection: meta/docsheetMappings, doc: leads_header_v1) for audit.
    const db = admin.firestore();
    const headerDocRef = db.collection('meta').doc('leads_header_v1');
    const defaultOrdered = [
      'timestamp','side','product','price_amount','price_currency_per','quantity_amount_unit','paymentTerms','incoterm','port','loadingLocation','loadingCountry','deliveryLocation','deliveryCountry','packaging','transportMode','priceValidity','availabilityTime','availabilityQty','deliveryTimeframe','transcriptUrl','audioUrl','summary','specialNotes_or_notes','sourceCallId'
    ];

    // Fetch existing header row from sheet (first row of Leads)
    let headerValues: string[] = [];
    try {
      const headerResp = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Leads!1:1' });
      headerValues = (headerResp.data.values && headerResp.data.values[0]) ? headerResp.data.values[0] : [];
    } catch (e) {
      console.warn('Failed to read existing header row, will initialize:', (e as any)?.message || e);
    }

    // Initialize header if empty
    if (!headerValues.length) {
      headerValues = defaultOrdered;
      console.log('Initializing header row for Leads sheet');
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Leads!1:1',
        valueInputOption: 'RAW',
        requestBody: { values: [headerValues] }
      });
      await headerDocRef.set({ header: headerValues, createdAt: new Date().toISOString() }, { merge: true });
    }

    // Map incoming lead to flat key/value pairs
    const flat: Record<string,string> = {};
    flat.timestamp = new Date().toISOString();
    flat.side = lead.side || '';
    flat.product = lead.product || '';
    if (lead.price) {
      flat.price_amount = `${lead.price.amount ?? ''}`;
      flat.price_currency_per = `${lead.price.currency || ''}/${lead.price.per || ''}`;
    } else {
      flat.price_amount = '';
      flat.price_currency_per = '/';
    }
    if (lead.quantity) {
      flat.quantity_amount_unit = `${lead.quantity.amount ?? ''} ${lead.quantity.unit || ''}`.trim();
    } else flat.quantity_amount_unit = '';
    flat.paymentTerms = lead.paymentTerms || '';
    flat.incoterm = lead.incoterm || '';
    flat.port = lead.port || '';
    flat.loadingLocation = lead.loadingLocation || '';
    flat.loadingCountry = lead.loadingCountry || '';
    flat.deliveryLocation = lead.deliveryLocation || '';
    flat.deliveryCountry = lead.deliveryCountry || '';
    flat.packaging = lead.packaging || '';
    flat.transportMode = lead.transportMode || '';
    flat.priceValidity = lead.priceValidity || '';
    flat.availabilityTime = lead.availabilityTime || '';
    flat.availabilityQty = lead.availabilityQty || '';
    flat.deliveryTimeframe = lead.deliveryTimeframe || '';
    flat.transcriptUrl = lead.transcriptUrl || '';
    flat.audioUrl = lead.audioUrl || '';
    flat.summary = lead.summary || '';
    flat.specialNotes_or_notes = lead.specialNotes || lead.notes || '';
    flat.sourceCallId = lead.sourceCallId || '';

    // Include any additional arbitrary keys (shallow only) not already covered
    for (const k of Object.keys(lead)) {
      if (typeof lead[k] === 'object') continue; // skip nested objects except price/quantity already handled
      if (k in flat) continue;
      const val = lead[k];
      flat[k] = (val === undefined || val === null) ? '' : String(val);
      if (!headerValues.includes(k)) headerValues.push(k); // mark for possible header extension
    }

    // Detect new columns to append to header row
    let headerUpdated = false;
    for (const key of Object.keys(flat)) {
      if (!headerValues.includes(key)) {
        headerValues.push(key);
        headerUpdated = true;
      }
    }
    if (headerUpdated) {
      console.log('Extending Leads header with new columns:', headerValues.join(', '));
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Leads!1:1',
        valueInputOption: 'RAW',
        requestBody: { values: [headerValues] }
      });
      await headerDocRef.set({ header: headerValues, updatedAt: new Date().toISOString() }, { merge: true });
    }

    // Build row in header order
    const row = headerValues.map(h => flat[h] ?? '');
    const values = [row];

    console.log(`Appending lead ${event.params.leadId} to spreadsheet ${spreadsheetId} dynamic range Leads!A:ZZ (columns=${headerValues.length})`);
    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    let lastError: any = null;
    while (attempt < maxRetries && !success) {
      try {
        attempt++;
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Leads!A:ZZ',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values }
        });
        success = true;
        console.log(`Sheets append success (attempt ${attempt}) for ${event.params.leadId}`);
      } catch (err) {
        lastError = err;
        const waitMs = Math.min(8000, 500 * Math.pow(2, attempt - 1));
        console.warn(`Sheets append failed (attempt ${attempt}) for ${event.params.leadId}. Retrying in ${waitMs}ms...`);
        await new Promise((res) => setTimeout(res, waitMs));
      }
    }
    if (!success) {
      console.error(`Sheets append failed after ${maxRetries} attempts for ${event.params.leadId}`);
      const errAny = lastError as any;
      if (errAny?.response) {
        console.error("Sheets API error status:", errAny.response.status);
        try {
          console.error("Sheets API error body:", JSON.stringify(errAny.response.data));
        } catch {
          console.error("Sheets API error body (raw):", errAny.response.data);
        }
      }
    }

  } catch (error) {
    console.error("Error appending to Google Sheets:", (error as any)?.message || error);
    const errAny = error as any;
    if (errAny?.response) {
      console.error("Sheets API error status:", errAny.response.status);
      try {
        console.error("Sheets API error body:", JSON.stringify(errAny.response.data));
      } catch {
        console.error("Sheets API error body (raw):", errAny.response.data);
      }
    }
    // Make failures non-fatal - log and continue
    // TODO: Implement retry with exponential backoff
  }
});

/**
 * Cloud Function: Retention sweep - delete old audio/transcripts
 * Scheduled to run daily, but will no-op if RETENTION_DAYS is -1
 */
export const retentionSweep = onSchedule("0 2 * * *", async (context) => {
  const retentionDays = parseInt(process.env.RETENTION_DAYS || "-1");
  const dryRun = (process.env.RETENTION_DRY_RUN || '').toLowerCase() === 'true';
  
  if (retentionDays === -1) {
    console.log("Retention sweep: RETENTION_DAYS is -1, skipping cleanup");
    return;
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    console.log(`Retention sweep: Cleaning up leads older than ${cutoffDate.toISOString()}`);

    const db = admin.firestore();
    const leadsRef = db.collection('leads');
    // Assuming documents have a createdAt (ISO or timestamp) or fallback to Firestore create time
    // Prefer explicit createdAt field
    const snapshot = await leadsRef.get();
    let examined = 0;
  let deletedLinks = 0;
  let updatedDocs = 0;
  let wouldDeleteLinks = 0;
  let wouldUpdateDocs = 0;
    const bucket = admin.storage().bucket();

    for (const doc of snapshot.docs) {
      examined++;
      const data: any = doc.data();
      const createdAtIso: string | undefined = data.createdAt || data.timestamp; // fallback fields
      let createdAt: Date | null = null;
      if (createdAtIso) {
        try { createdAt = new Date(createdAtIso); } catch { createdAt = null; }
      }
      if (!createdAt && doc.createTime) {
        try { createdAt = new Date(doc.createTime.toDate()); } catch { /* ignore */ }
      }
      if (!createdAt) continue;
      if (createdAt > cutoffDate) continue;

      const updates: Record<string, any> = {};
      const mediaFields: Array<{ key: string; url?: string }> = [
        { key: 'audioUrl', url: data.audioUrl },
        { key: 'transcriptUrl', url: data.transcriptUrl }
      ];
      for (const mf of mediaFields) {
        if (mf.url && typeof mf.url === 'string') {
          try {
            let path: string | null = null;
            if (mf.url.startsWith('gs://')) {
              const without = mf.url.replace('gs://', '');
              path = without.split('/').slice(1).join('/');
            } else {
              const marker = '/o/';
              const idx = mf.url.indexOf(marker);
              if (idx !== -1) {
                path = decodeURIComponent(mf.url.substring(idx + marker.length).split('?')[0]);
              }
            }
            if (path) {
              if (dryRun) {
                wouldDeleteLinks++;
                updates[mf.key] = '__DRY_RUN_DELETE__';
                console.log(`[DRY_RUN] Would delete file: ${path} for doc ${doc.id} (${mf.key})`);
              } else {
                await bucket.file(path).delete({ ignoreNotFound: true });
                deletedLinks++;
                updates[mf.key] = admin.firestore.FieldValue.delete();
              }
            }
          } catch (e) {
            console.warn(dryRun ? '[DRY_RUN] Failed simulated delete for' : 'Failed deleting media for', doc.id, mf.key, (e as any)?.message || e);
          }
        }
      }
      if (Object.keys(updates).length) {
        if (dryRun) {
          wouldUpdateDocs++;
          console.log(`[DRY_RUN] Would update doc ${doc.id} removing media fields: ${Object.keys(updates).join(', ')}`);
        } else {
          await doc.ref.update(updates);
          updatedDocs++;
        }
      }
    }
    if (dryRun) {
      console.log(`Retention sweep DRY_RUN summary: examined=${examined} mediaWouldDelete=${wouldDeleteLinks} docsWouldUpdate=${wouldUpdateDocs}`);
    } else {
      console.log(`Retention sweep summary: examined=${examined} mediaDeleted=${deletedLinks} docsUpdated=${updatedDocs}`);
    }
  } catch (error) {
    console.error("Error during retention sweep:", error);
  }
});