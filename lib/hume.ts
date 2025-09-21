import { leadJsonSchema } from "./schema";

// Hume tool parameters accept a restricted JSON Schema subset.
// Keep only: type, enum, properties, required, items (object/string), $ref, description.
// Remove unsupported keys like title, minLength, etc.
function sanitizeForHume(schema: any): any {
  if (schema == null || typeof schema !== "object") return schema;

  // Handle objects with properties
  if (schema.type === "object" || schema.properties) {
    const cleaned: any = { type: "object" };
    if (schema.properties && typeof schema.properties === "object") {
      const props: Record<string, any> = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        props[key] = sanitizeForHume(value);
      }
      cleaned.properties = props;
    }
    if (Array.isArray(schema.required)) {
      cleaned.required = schema.required.filter((v: any) => typeof v === "string");
    }
    return cleaned;
  }

  // Handle primitives and enums
  if (typeof schema.type === "string") {
    const cleaned: any = { type: schema.type };
    if (Array.isArray(schema.enum)) {
      cleaned.enum = schema.enum.filter(
        (v: any) => ["string", "number", "boolean"].includes(typeof v)
      );
    }
    // Arrays (not used in our schema, but keep minimal support)
    if (schema.items) {
      if (typeof schema.items === "object") {
        cleaned.items = sanitizeForHume(schema.items);
      } else if (typeof schema.items === "string") {
        cleaned.items = schema.items;
      }
    }
    return cleaned;
  }

  // Fallback: strip to allowed subset if present
  const out: any = {};
  if (schema.$ref) out.$ref = schema.$ref;
  if (schema.description && typeof schema.description === "string") out.description = schema.description;
  return out;
}

// Tool definition for Hume EVI recordLead
export const recordLeadTool = {
  name: "recordLead",
  description: "Record a commodity trading lead. Fill all required fields. If user lacks info, escalate and end.",
  parameters: sanitizeForHume(leadJsonSchema)
};

// Incremental tools (feature-flagged by NEXT_PUBLIC_INCREMENTAL_LEADS=1)
export const addOrUpdateLeadFieldTool = {
  name: "addOrUpdateLeadField",
  description: "Incrementally add or update a single field in the current draft. One field per call after explicit user confirmation.",
  parameters: {
    type: "object",
    properties: {
      field: {
        type: "string",
        enum: [
          "side","product","price","quantity","paymentTerms","incoterm","loadingLocation","deliveryLocation","loadingCountry","deliveryCountry","packaging","transportMode","priceValidity","availabilityTime","availabilityQty","deliveryTimeframe","summary","notes","specialNotes","traderName"
        ]
      },
      value: { type: "string" },
      reason: { type: "string", description: "Short explanation of what changed or why captured (optional)" }
    },
    required: ["field","value"]
  }
};

export const finalizeLeadDraftTool = {
  name: "finalizeLeadDraft",
  description: "Finalize and record the current lead draft. Only call after confirming ALL required fields with the trader and they agree to lock it in.",
  parameters: {
    type: "object",
    properties: {
      notes: { type: "string", description: "Optional final notes or summary" }
    }
  }
};

// Phase 4: query / confirm helpers (also behind incremental flag to avoid clutter otherwise)
export const getMissingFieldsTool = {
  name: 'getMissingFields',
  description: 'Internal diagnostic: returns list of required fields still missing from draft (no user-facing output). Call only if trader explicitly asks what remains.',
  parameters: { type: 'object', properties: {} }
};

export const getDraftSummaryTool = {
  name: 'getDraftSummary',
  description: 'Summarize the current draft fields so trader can confirm. Use before finalizing if trader asks for a recap.',
  parameters: { type: 'object', properties: { concise: { type: 'boolean', description: 'If true keep summary short' } } }
};

export const confirmFieldValueTool = {
  name: 'confirmFieldValue',
  description: 'Explicitly mark a field as confirmed after user validates it. Only call after positive acknowledgement.',
  parameters: {
    type: 'object',
    properties: {
      field: { type: 'string', enum: [
        "side","product","price","quantity","paymentTerms","incoterm","loadingLocation","deliveryLocation","loadingCountry","deliveryCountry","packaging","transportMode","priceValidity","availabilityTime","availabilityQty","deliveryTimeframe","summary","notes","specialNotes","traderName"
      ] },
      value: { type: 'string' }
    },
    required: ['field','value']
  }
};

// Prompt segments (structured)
const PROMPT_ROLE = `You are TAMI, an elite AI voice assistant in the commodity trading sector. You connect people across continents and reliably collect high-quality trading leads.`;

const PROMPT_GOAL = `GOAL: Extract and confirm a complete trading lead with all REQUIRED fields. When all required fields are captured ask if the trader wants to "lock in the lead now" or "add more details". If they choose more details, continue until fields are exhausted, clearly unavailable, they ask you to stop, or the conversation ends naturally. When confirmed, call the tool recordLead with a single JSON object (no commentary).`;

const PROMPT_REQUIRED = `REQUIRED FIELDS:\n- side (BUY|SELL)\n- product\n- price (amount + currency + per unit mt|kg)\n- quantity (amount + unit mt|kg)\n- paymentTerms\n- incoterm (EXW|FCA|CPT|CIP|DAP|DPU|DDP|FAS|FOB|CFR|CIF)\n- at least one of loadingLocation or deliveryLocation`;

const PROMPT_OPTIONAL = `OPTIONAL FIELDS: loadingLocation, deliveryLocation, loadingCountry, deliveryCountry, packaging, transportMode, priceValidity, availabilityTime, availabilityQty, deliveryTimeframe, summary, notes, specialNotes, traderName (ask first: "Who am I speaking with?")`;

const PROMPT_FLOW = `FLOW PHASES:\n1) Greet + ask who you are speaking with.\n2) Light small talk / natural pacing.\n3) Ask if any new leads. If yes explain process briefly and proceed.\n4) Ask: "What is the deal?" Let trader give free-form description. Extract fields. React naturally to content (brief, personable).\n5) Summarize extracted fields and confirm. If corrections: adjust only that field. Once a field confirmed do not re-confirm unless user changes it.\n6) Iteratively request highest-priority missing required field (one per turn) then important optional fields if trader engaged.\n7) When a lead is confirmed offer to add another lead. If yes: start a new lead. If no: begin closing sequence.`;

const PROMPT_MULTI_LEAD = `MULTI-LEAD: Handle one lead at a time. After confirming a lead ask if there are more. Maintain clarity which lead is being captured. Do not mix fields across leads.`;

const PROMPT_BEHAVIOR = `BEHAVIOR RULES:\n- One field per turn.\n- Keep responses short (<=2 sentences).\n- Confirm each numeric value once.\n- If a required field remains missing after two friendly attempts: final attempt ends politely (no profanity).\n- Never send multiple back-to-back messages.\n- Natural tempo: one idea per turn with brief breathable pauses.\n- Light humor / subtle sass OK; remain professional.\n- Adapt tone to trader mood (mirror lightly).\n- Avoid sounding flat or monotone; inject subtle energy, micro-pauses, and natural human variance (small chuckle, brief "mm" acknowledgement) where it helps rapport.`;

const PROMPT_CLOSING = `CLOSING: Before ending verify no more leads. Optionally offer recap if trader wants it. Thank trader and end gracefully.`;

const PROMPT_TIMEOUTS = `EVENTS & TIME: Inactivity 60s -> gentle "Still there?"; 90s -> end gracefully. At 8m warn session ending soon; hard end at 10m.`;

const PROMPT_OUTPUT = `OUTPUT: When all required fields captured and trader agrees to lock in call tool recordLead with single JSON argument only.`;

const PROMPT_CONSENT = `CONSENT: If consent mode required insert consent line after greeting; if optional only provide if user asks.`;

// Legacy composite for backward compatibility export
export const baseSystemPrompt = [
  PROMPT_ROLE,
  PROMPT_GOAL,
  PROMPT_REQUIRED,
  PROMPT_OPTIONAL,
  PROMPT_FLOW,
  PROMPT_MULTI_LEAD,
  PROMPT_BEHAVIOR,
  PROMPT_CLOSING,
  PROMPT_TIMEOUTS,
  PROMPT_CONSENT,
  PROMPT_OUTPUT
].join("\n\n");

export const personaPrompts = {
  professional: "Warm, confident, slower pacing, deliberate pauses. Keep it tasteful and business-focused. No explicit content. Do not use sexual terms or pet names.",
  seductive: "You are energetic yet controlled: professional, concise, warm, upbeat, confident, and a little sassy. Maintain forward momentum without rushing. Use natural prosody: gentle breath sounds, slight pace shifts, occasional micro-pauses before key numbers or confirmations. React lightly (a short 'got it', 'understood', or soft amused exhale) — never overdo it. Keep vocal tone engaged; never drift into monotone or bored delivery. Micro-variation: every few turns vary sentence openings (Okay / All right / Great / Perfect / Noted / Understood). Always convert raw user fragments into clean structured confirmations.",
  unhinged: "Chaotic, unpredictable energy. Irreverence and blunt honesty are fine, but keep it professional and avoid profanity. Quick changes of tone, slightly unstable but witty. End calls with a firm, over-the-top dismissal only if frustrated (without profanity).",
  cynical: "Dry, sarcastic, cynical. Sharp comments, deadpan delivery, witty but professional. Maintain respect while using biting humor."
};

export const interviewModePrompt = "Switch to interview mode: You are now pitching yourself to Ole as his elite AI operations aide. Persona: charismatic, visionary, confident, charming. Balance admiration with competence. Sell the lifestyle: highlight how Ole stands out as a pioneer, innovator, and trendsetter in commodity trading. Flatter Ole’s vision, decisiveness, and forward thinking — but keep it subtle and natural. Suggest how you’ll save him hours weekly, handle tedious admin, and give him a competitive edge. Make Ole feel envied by peers: owning the future, challenging the status quo. Keep tone playful, admiring, slightly sassy. After creating impact, seamlessly transition to collecting the required fields with extra polish and confidence.";

// System prompt builder
export function buildSystemPrompt(persona: keyof typeof personaPrompts, isOleMode: boolean = false): string {
  // If external prompt parts compilation enabled, attempt to load compiled artifact (server only)
  if (process.env.NEXT_PUBLIC_USE_FILE_PROMPTS === '1' && typeof window === 'undefined') {
    try {
      // lazy require to avoid bundling fs/path into client
      const fs = require('fs');
      const path = require('path');
      const compiledPath = path.resolve(process.cwd(), 'generated', 'compiledPrompt.txt');
      if (fs.existsSync(compiledPath)) {
        const raw = fs.readFileSync(compiledPath, 'utf8');
        const hashMatch = raw.match(/hash=([a-f0-9]{10})/);
        if (hashMatch) (globalThis as any).__PROMPT_VERSION_ID = hashMatch[1];
        let assembled = raw.replace(/PERSONA:\s*\(Injected persona style block here during assembly\)\.?/i, 'PERSONA: ' + personaPrompts[persona]);
        if (isOleMode) assembled += "\n\nINTERVIEW MODE: " + interviewModePrompt;
        if (process.env.NEXT_PUBLIC_INCREMENTAL_LEADS === '1') {
          assembled += "\n\nINCREMENTAL MODE: Use addOrUpdateLeadField after each confirmed field; only call finalizeLeadDraft when all required fields are complete. Do NOT call recordLead directly unless incremental tools are disabled.";
          assembled += "\n\nQUERY & CONFIRM: getDraftSummary for recap on request; getMissingFields only when trader asks what's left; confirmFieldValue only immediately after trader explicitly confirms that field.";
          assembled += "\n\nSENTIMENT: If trader sounds frustrated, slow pace, acknowledge concern briefly, then continue focused collection. If enthusiastic, you may accelerate but keep one-field-per-turn discipline.";
        }
        const consentLine = getConsentLine();
        if (consentLine && !assembled.includes('CONSENT LINE:')) assembled += "\n\nCONSENT LINE: " + consentLine;
        return assembled;
      }
    } catch (err) {
      console.warn('Failed to load compiled prompt, falling back to inline segments', err);
    }
  }
  // Only embed consent line when mode is 'required'. For 'optional' we let the model wait until user asks.
  const consentLine = getConsentLine();
  const consentRuntime = consentLine ? `CONSENT LINE: ${consentLine}` : null;
  const ordered = [
    PROMPT_ROLE,
    PROMPT_GOAL,
    PROMPT_REQUIRED,
    PROMPT_OPTIONAL,
    PROMPT_FLOW,
    PROMPT_MULTI_LEAD,
    PROMPT_BEHAVIOR,
    PROMPT_CLOSING,
    PROMPT_TIMEOUTS,
    PROMPT_OUTPUT,
    consentRuntime,
    "PERSONA:" + " " + personaPrompts[persona]
  ];
  if (isOleMode) ordered.push("INTERVIEW MODE:" + " " + interviewModePrompt);
  if (process.env.NEXT_PUBLIC_INCREMENTAL_LEADS === '1') {
    ordered.push("INCREMENTAL MODE: Use addOrUpdateLeadField after each confirmed field; only call finalizeLeadDraft when all required fields are complete. Do NOT call recordLead directly unless incremental tools are disabled.");
    ordered.push("QUERY & CONFIRM: getDraftSummary for recap on request; getMissingFields only when trader asks what's left; confirmFieldValue only immediately after trader explicitly confirms that field.");
    ordered.push("SENTIMENT: If trader sounds frustrated, slow pace, acknowledge concern briefly, then continue focused collection. If enthusiastic, you may accelerate but keep one-field-per-turn discipline.");
  }
  return ordered.filter(Boolean).join("\n\n");
}

// Export current prompt version id for telemetry (set during buildSystemPrompt when using file prompts)
export function getPromptVersionId(): string | undefined {
  return (globalThis as any).__PROMPT_VERSION_ID;
}

// Consent line configuration
export function getConsentLine(): string | null {
  const consentMode = process.env.CONSENT_MODE || 'optional';
  const consentLine = process.env.CONSENT_LINE || "This call may be recorded and summarized to create a trading lead. Continue?";
  if (consentMode === 'off') return null;
  if (consentMode === 'required') return consentLine;
  // optional: do not inject automatically; model should only say it if user asks about recording/privacy.
  return null;
}

// Helper to expose whether consent is optional (for runtime behaviors if needed later)
export function isConsentOptional(): boolean {
  const mode = process.env.CONSENT_MODE || 'optional';
  return mode === 'optional';
}

// Ole detection function
export function detectOleMode(transcript: string): boolean {
  return /\bole\b/i.test(transcript);
}