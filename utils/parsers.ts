export interface ParsedPrice { amount: number; currency: string; per: string }
export interface ParsedQuantity { amount: number; unit: string }

const CURRENCY_REGEX = /\b(USD|EUR|GBP|CHF|JPY|CNY|AUD|CAD|INR|AED|SAR|ZAR)\b/i;
const CURRENCY_SYMBOL_MAP: Record<string,string> = {
  '$':'USD','€':'EUR','£':'GBP','¥':'JPY'
};
const UNIT_REGEX = /\b(mt|metric ton|tonnes|tons|kg|kilograms?)\b/i;

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g,'');
  const m = cleaned.match(/\d+(?:\.\d+)?/);
  if (!m) return null;
  return Number(m[0]);
}

export function parsePrice(raw: any): ParsedPrice | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && typeof raw.amount === 'number' && raw.currency) {
    return { amount: raw.amount, currency: String(raw.currency).toUpperCase(), per: raw.per || 'mt' };
  }
  const text = String(raw).trim();
  if (!text) return null;
  let currency: string | null = null;
  const sym = text.match(/[€$£¥]/);
  if (sym) currency = CURRENCY_SYMBOL_MAP[sym[0]];
  if (!currency) {
    const c = text.match(CURRENCY_REGEX);
    if (c) currency = c[1].toUpperCase();
  }
  const amount = parseNumber(text);
  const perMatch = text.match(/\/\s*(mt|kg)\b/i) || text.match(/per\s*(mt|kg)\b/i);
  const per = perMatch ? (perMatch[1].toLowerCase()) : 'mt';
  if (amount == null || !currency) return null;
  return { amount, currency, per };
}

export function parseQuantity(raw: any): ParsedQuantity | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && typeof raw.amount === 'number') {
    return { amount: raw.amount, unit: (raw.unit || 'mt').toLowerCase() };
  }
  const text = String(raw).trim();
  if (!text) return null;
  const amount = parseNumber(text);
  const unitMatch = text.match(UNIT_REGEX);
  const unitNorm = unitMatch ? unitMatch[0].toLowerCase() : 'mt';
  const unit = unitNorm.startsWith('kg') ? 'kg' : 'mt';
  if (amount == null) return null;
  return { amount, unit };
}

export function normalizeLeadPayload(payload: any) {
  if (!payload) return payload;
  const price = parsePrice(payload.price ?? payload.priceRaw ?? payload.rawPrice ?? '');
  const quantity = parseQuantity(payload.quantity ?? payload.qty ?? payload.rawQuantity ?? '');
  if (price) payload.price = price;
  if (quantity) payload.quantity = quantity;
  return payload;
}
