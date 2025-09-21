import { Lead } from './schema';

export interface EmailBuildContext {
  lead: Lead;
  persona: string;
  locationsLine: string;
}

export function buildEmailHtmlV1(ctx: EmailBuildContext): string {
  const { lead, persona, locationsLine } = ctx;
  return `<!DOCTYPE html><html><body style="font-family:Inter,system-ui,-apple-system,sans-serif;background:#0b0b0b;color:#eaeaea;padding:24px;">
  <div style="max-width:720px;margin:0 auto;background:#111;border:1px solid #222;border-radius:12px;overflow:hidden;">
    <div style="padding:20px 24px;border-bottom:1px solid #222;">
      <h2 style="margin:0;font-size:18px;">New Trading Lead</h2>
      <p style="margin:4px 0 0;color:#aaa;">Captured by TAMI · Persona: ${persona}</p>
    </div>
    <div style="padding:16px 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          <tr><td style="padding:6px 0;color:#999;">Side</td><td style="padding:6px 0;">${lead.side}</td></tr>
          <tr><td style="padding:6px 0;color:#999;">Product</td><td style="padding:6px 0;">${lead.product}</td></tr>
          <tr><td style="padding:6px 0;color:#999;">Price</td><td style="padding:6px 0;">${lead.price.amount} ${lead.price.currency}/${lead.price.per}</td></tr>
          <tr><td style="padding:6px 0;color:#999;">Quantity</td><td style="padding:6px 0;">${lead.quantity.amount} ${lead.quantity.unit}</td></tr>
          <tr><td style="padding:6px 0;color:#999;">Terms</td><td style="padding:6px 0;">${lead.paymentTerms}, ${lead.incoterm}</td></tr>
          <tr><td style="padding:6px 0;color:#999;">Locations</td><td style="padding:6px 0;">${locationsLine}</td></tr>
          <tr><td style="padding:6px 0;color:#999;">Packaging</td><td style="padding:6px 0;">${lead.packaging||'-'}</td></tr>
          <tr><td style="padding:6px 0;color:#999;">Transport</td><td style="padding:6px 0;">${lead.transportMode||'-'}</td></tr>
          <tr><td style="padding:6px 0;color:#999;">Validity</td><td style="padding:6px 0;">${lead.priceValidity||'-'}</td></tr>
          <tr><td style="padding:6px 0;color:#999;">Availability</td><td style="padding:6px 0;">${lead.availabilityTime||'-'} / ${lead.availabilityQty||'-'}</td></tr>
          <tr><td style="padding:6px 0;color:#999;">Delivery</td><td style="padding:6px 0;">${lead.deliveryTimeframe||'-'}</td></tr>
          <tr><td style="padding:6px 0;color:#999;">Summary</td><td style="padding:6px 0;">${lead.summary||'-'}</td></tr>
          <tr><td style="padding:6px 0;color:#999;">Notes</td><td style="padding:6px 0;">${lead.specialNotes||lead.notes||'-'}</td></tr>
        </tbody>
      </table>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #222;color:#999;font-size:12px;">
      <p style="margin:0;">Prompt Version: ${(globalThis as any).__PROMPT_VERSION_ID || 'n/a'} · Source: ${lead.sourceCallId || 'n/a'}</p>
      <p style="margin:8px 0 0;">TAMI · TELE TAMI</p>
    </div>
  </div>
</body></html>`;
}

export function buildEmailHtmlV2(ctx: EmailBuildContext): string {
  const { lead, persona, locationsLine } = ctx;
  return `<div style="font-family:Inter,system-ui,-apple-system;max-width:760px;margin:0 auto;padding:24px;background:#0d0d0d;color:#e2e2e2;">
  <h1 style="margin:0 0 16px;font-size:20px;">Lead: ${lead.side} ${lead.product}</h1>
  <p style="margin:0 0 24px;color:#9aa;">Captured by TAMI • Persona: ${persona}</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">${[
    ['Price', `${lead.price.amount} ${lead.price.currency}/${lead.price.per}`],
    ['Quantity', `${lead.quantity.amount} ${lead.quantity.unit}`],
    ['Terms', `${lead.paymentTerms}, ${lead.incoterm}`],
    ['Locations', locationsLine],
    ['Packaging', lead.packaging||'-'],
    ['Transport', lead.transportMode||'-'],
    ['Validity', lead.priceValidity||'-'],
    ['Availability', `${lead.availabilityTime||'-'} / ${lead.availabilityQty||'-'}`],
    ['Delivery', lead.deliveryTimeframe||'-'],
    ['Summary', lead.summary||'-'],
    ['Notes', lead.specialNotes||lead.notes||'-']
  ].map(r=>`<tr><td style=\"padding:6px 4px;color:#8a8f98;vertical-align:top;width:120px;\">${r[0]}</td><td style=\"padding:6px 4px;\">${r[1]}</td></tr>`).join('')}</table>
  <div style="margin-top:28px;font-size:12px;color:#666;">Prompt Version: ${(globalThis as any).__PROMPT_VERSION_ID || 'n/a'} · Source: ${lead.sourceCallId || 'n/a'}</div>
  <div style="margin-top:16px;font-size:12px;color:#555;">TAMI · TELE TAMI</div>
</div>`;
}
