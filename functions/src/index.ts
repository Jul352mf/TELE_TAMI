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

    // Prepare row data matching the blueprint order
    const values = [[
      new Date().toISOString(), // timestamp
      lead.side,
      lead.product,
      `${lead.price.amount}`,
      `${lead.price.currency}/${lead.price.per}`,
      `${lead.quantity.amount} ${lead.quantity.unit}`,
      lead.paymentTerms,
      lead.incoterm,
      lead.port || "",
      lead.loadingLocation || "",
      lead.loadingCountry || "",
      lead.deliveryLocation || "",
      lead.deliveryCountry || "",
      lead.packaging || "",
      lead.transportMode || "",
      lead.priceValidity || "",
      lead.availabilityTime || "",
      lead.availabilityQty || "",
      lead.deliveryTimeframe || "",
      lead.transcriptUrl || "",
      lead.audioUrl || "",
      lead.summary || "",
      lead.specialNotes || lead.notes || ""
    ]];

    // Append to Leads sheet
    console.log(`Appending lead ${event.params.leadId} to spreadsheet ${spreadsheetId} range Leads!A:Z`);
    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    let lastError: any = null;
    while (attempt < maxRetries && !success) {
      try {
        attempt++;
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Leads!A:Z",
          valueInputOption: "USER_ENTERED",
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
  
  if (retentionDays === -1) {
    console.log("Retention sweep: RETENTION_DAYS is -1, skipping cleanup");
    return;
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    console.log(`Retention sweep: Cleaning up files older than ${cutoffDate.toISOString()}`);
    
    // TODO: Implement actual cleanup logic
    // - Query Firestore for leads/calls older than cutoffDate
    // - Delete associated audio/transcript files from Cloud Storage
    // - Update documents to remove audioUrl/transcriptUrl references
    
    console.log("Retention sweep completed (stub implementation)");
    
  } catch (error) {
    console.error("Error during retention sweep:", error);
  }
});