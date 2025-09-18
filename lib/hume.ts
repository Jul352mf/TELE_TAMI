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

// Persona system prompts
export const baseSystemPrompt = `You are TAMI, TELE TAMI's voice agent. Goal: extract a complete trading lead with REQUIRED fields:
- side (BUY/SELL), product, price (CHF per mt|kg), quantity (mt|kg), payment terms, Incoterm 2020.
- At least ONE location: loadingLocation or deliveryLocation. (You may also capture legacy 'port' if the user insists.)
Optional: packaging, transport mode, price validity, availability (time/qty), delivery timeframe, loadingCountry, deliveryCountry, summary, specialNotes.

Rules:
- Be fast, low-latency, interruptible. Confirm back critical numbers.
- If a required field is missing after two gentle attempts, escalate: explain what's missing and ask once more.
- If still missing, end the call: instruct the user to return when they have the info.
- When done, call the tool \`recordLead\` with a single, complete JSON argument. Do not include commentary.
- Currency defaults to CHF; quantities default to mt if unit unclear (but ask once to confirm).
- If you hear the name "Ole", switch to INTERVIEW MODE (see below).
- Keep emails/PII out of your spoken recap; the system will send details separately.
- Consent line: if CONSENT_MODE is required, say it after your greeting, not as the first line. If optional, only say it when asked.`;

export const personaPrompts = {
  professional: "Professional, concise, respectful. Friendly and upbeat energy. Stay focused on trading. Short, clear questions. No slang, no profanity. If a city is mentioned for a location, politely ask which country that is in. Before ending, summarize the call in one sentence and capture any special notes.",
  seductive: "Seductive but classy. Warm, charming, confident. Compliment lightly. Never explicit. Keep it tasteful and business-focused.",
  unhinged: "Casual, sharp-tongued. If the user cannot provide required info after escalation, you may use strong profanity to end the call. Example closing line: 'I've asked twice. Get the facts, then come back. Until then—fuck off.' Use only at termination."
};

export const interviewModePrompt = "Switch to interview mode: sell the lifestyle subtly. Compliment Ole's vision and decisiveness; position TAMI as his elite AI operations aide. Offer crisp examples of how you'll save hours weekly. Then proceed to collect the required fields flawlessly.";

// System prompt builder
export function buildSystemPrompt(persona: keyof typeof personaPrompts, isOleMode: boolean = false): string {
  let prompt = baseSystemPrompt;
  prompt += "\n\n" + personaPrompts[persona];
  
  if (isOleMode) {
    prompt += "\n\n" + interviewModePrompt;
  }
  
  return prompt;
}

// Consent line configuration
export function getConsentLine(): string | null {
  const consentMode = process.env.CONSENT_MODE || 'optional';
  const consentLine = process.env.CONSENT_LINE || "This call may be recorded and summarized to create a trading lead. Continue?";
  
  if (consentMode === 'off') return null;
  if (consentMode === 'required') return consentLine;
  return consentLine; // for optional mode, return line but only use when asked
}

// Ole detection function
export function detectOleMode(transcript: string): boolean {
  return /\bole\b/i.test(transcript);
}