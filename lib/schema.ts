import Ajv from "ajv";

// Lead JSON Schema as defined in the blueprint
export const leadJsonSchema = {
  "title": "Lead",
  "type": "object",
  "properties": {
    "side": { "type": "string", "enum": ["BUY", "SELL"] },
    "product": { "type": "string", "minLength": 2 },
    "price": {
      "type": "object",
      "properties": {
        "amount": { "type": "number" },
        "currency": { "type": "string", "enum": ["USD","EUR","GBP","CHF","JPY","CNY","AUD","CAD","INR","AED","SAR","ZAR"] },
        "per": { "type": "string", "enum": ["mt", "kg"] }
      },
      "required": ["amount", "currency", "per"]
    },
    "quantity": {
      "type": "object",
      "properties": {
        "amount": { "type": "number" },
        "unit": { "type": "string", "enum": ["mt", "kg"] }
      },
      "required": ["amount", "unit"]
    },
    "paymentTerms": { "type": "string", "minLength": 2 },
    "incoterm": {
      "type": "string",
      "enum": ["EXW","FCA","CPT","CIP","DAP","DPU","DDP","FAS","FOB","CFR","CIF"]
    },
    // Legacy field; keep optional for backward compatibility
    "port": { "type": "string", "minLength": 2 },
    // New location fields: at least one of loading or delivery is required
    "loadingLocation": { "type": "string", "minLength": 2 },
    "deliveryLocation": { "type": "string", "minLength": 2 },
    "loadingCountry": { "type": "string", "minLength": 2 },
    "deliveryCountry": { "type": "string", "minLength": 2 },
    "packaging": { "type": "string" },
    "transportMode": { "type": "string" },
    "priceValidity": { "type": "string" },
    "availabilityTime": { "type": "string" },
    "availabilityQty": { "type": "string" },
    "deliveryTimeframe": { "type": "string" },
    "sourceCallId": { "type": "string" },
    "transcriptUrl": { "type": "string" },
    "audioUrl": { "type": "string" },
    "notes": { "type": "string" },
    "summary": { "type": "string" },
    "specialNotes": { "type": "string" }
  },
  // Required core fields; port is no longer required. Enforce locations via anyOf below.
  "required": ["side","product","price","quantity","paymentTerms","incoterm"],
  "anyOf": [
    { "required": ["loadingLocation"] },
    { "required": ["deliveryLocation"] }
  ]
} as const;

// TypeScript interface for Lead
export interface Lead {
  side: "BUY" | "SELL";
  product: string;
  price: {
    amount: number;
    currency: "USD"|"EUR"|"GBP"|"CHF"|"JPY"|"CNY"|"AUD"|"CAD"|"INR"|"AED"|"SAR"|"ZAR";
    per: "mt" | "kg";
  };
  quantity: {
    amount: number;
    unit: "mt" | "kg";
  };
  paymentTerms: string;
  incoterm: "EXW"|"FCA"|"CPT"|"CIP"|"DAP"|"DPU"|"DDP"|"FAS"|"FOB"|"CFR"|"CIF";
  port?: string;
  loadingLocation?: string;
  deliveryLocation?: string;
  loadingCountry?: string;
  deliveryCountry?: string;
  packaging?: string;
  transportMode?: string;
  priceValidity?: string;
  availabilityTime?: string;
  availabilityQty?: string;
  deliveryTimeframe?: string;
  sourceCallId?: string;
  transcriptUrl?: string;
  audioUrl?: string;
  notes?: string;
  summary?: string;
  specialNotes?: string;
}

// Extended Lead interface for Firestore
export interface FirestoreLead extends Lead {
  createdAt: Date;
  persona: string;
  traderHint?: string | null;
  lang?: string;
}

// Create Ajv instance and compile schema
const ajv = new Ajv();
const validateLead = ajv.compile(leadJsonSchema);

export { validateLead };

// Validation function with error handling
export function validateLeadData(data: unknown): Lead {
  if (!validateLead(data)) {
    const errors = validateLead.errors;
    throw new Error(`Invalid lead data: ${JSON.stringify(errors)}`);
  }
  return data;
}