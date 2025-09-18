import { NextRequest, NextResponse } from 'next/server';
import { validateLeadData, Lead, FirestoreLead } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const normalized = { ...body };
    if (!normalized.loadingLocation && !normalized.deliveryLocation && normalized.port) {
      normalized.deliveryLocation = normalized.port;
    }
    
    // Validate the lead data against the JSON Schema
  const lead: Lead = validateLeadData(normalized);
    
    // Extract additional metadata
  const persona = normalized.persona || 'professional';
  const traderHint = normalized.traderHint || null;
    const now = new Date();
    
    // Create Firestore lead document structure
    const firestoreLead: FirestoreLead = {
      ...lead,
      createdAt: now,
      persona,
      traderHint,
      lang: 'en'
    };
    
    // Check if we're in production mode with real Firebase credentials
    const isProduction = process.env.FIREBASE_PROJECT_ID && 
                        !process.env.FIREBASE_PROJECT_ID.includes('demo');
    
    if (isProduction) {
      const { firestore } = await import('@/lib/firebase');
      const db = firestore();
      const leadRef = db.collection('leads').doc();
      await leadRef.set(firestoreLead);

      // Create mail document for Firestore Trigger Email extension
      const mailDoc = {
        to: process.env.LEADS_EMAIL,
        message: {
          subject: `New Lead: ${lead.side} ${lead.product} @ ${lead.price.amount} ${lead.price.currency}/${lead.price.per}`,
          html: `
<div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#0b0b0b; color:#eaeaea; padding:24px;">
  <div style="max-width:720px; margin:0 auto; background:#111; border:1px solid #222; border-radius:12px; overflow:hidden;">
    <div style="padding:20px 24px; border-bottom:1px solid #222;">
      <h2 style="margin:0; font-size:18px;">New Trading Lead</h2>
      <p style="margin:4px 0 0 0; color:#aaa;">Captured by TAMI</p>
    </div>
    <div style="padding:16px 24px;">
      <table style="width:100%; border-collapse: collapse;">
        <tbody>
          <tr><td style="padding:8px 0; color:#999;">Side</td><td style="padding:8px 0;">${lead.side}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Product</td><td style="padding:8px 0;">${lead.product}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Price</td><td style="padding:8px 0;">${lead.price.amount} ${lead.price.currency}/${lead.price.per}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Quantity</td><td style="padding:8px 0;">${lead.quantity.amount} ${lead.quantity.unit}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Terms</td><td style="padding:8px 0;">${lead.paymentTerms}, ${lead.incoterm}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Locations</td><td style="padding:8px 0;">loading=${lead.loadingLocation||"-"} (${lead.loadingCountry||"-"}), delivery=${lead.deliveryLocation||"-"} (${lead.deliveryCountry||"-"}), port=${lead.port||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Packaging</td><td style="padding:8px 0;">${lead.packaging||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Transport</td><td style="padding:8px 0;">${lead.transportMode||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Validity</td><td style="padding:8px 0;">${lead.priceValidity||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Availability</td><td style="padding:8px 0;">${lead.availabilityTime||"-"} / ${lead.availabilityQty||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Delivery</td><td style="padding:8px 0;">${lead.deliveryTimeframe||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Summary</td><td style="padding:8px 0;">${lead.summary||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Notes</td><td style="padding:8px 0;">${lead.specialNotes||lead.notes||"-"}</td></tr>
        </tbody>
      </table>
    </div>
    <div style="padding:16px 24px; border-top:1px solid #222; color:#999;">
      <p style="margin:0;">Regards,<br/>TAMI · TELE TAMI</p>
      <p style="margin:8px 0 0 0;"><a href="https://console.firebase.google.com/" style="color:#6dd5ff; text-decoration:none;">Open Firebase Console</a></p>
    </div>
  </div>
</div>`
        }
      };

      await db.collection('mail').add(mailDoc);
    }
    
    // Create email document structure (for logging/demo)
    const emailDoc = {
      to: process.env.LEADS_EMAIL,
      message: {
        subject: `New Lead: ${lead.side} ${lead.product} @ ${lead.price.amount} ${lead.price.currency}/${lead.price.per}`,
        html: `
<div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#0b0b0b; color:#eaeaea; padding:24px;">
  <div style="max-width:720px; margin:0 auto; background:#111; border:1px solid #222; border-radius:12px; overflow:hidden;">
    <div style="padding:20px 24px; border-bottom:1px solid #222;">
      <h2 style="margin:0; font-size:18px;">New Trading Lead</h2>
      <p style="margin:4px 0 0 0; color:#aaa;">Captured by TAMI</p>
    </div>
    <div style="padding:16px 24px;">
      <table style="width:100%; border-collapse: collapse;">
        <tbody>
          <tr><td style="padding:8px 0; color:#999;">Side</td><td style="padding:8px 0;">${lead.side}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Product</td><td style="padding:8px 0;">${lead.product}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Price</td><td style="padding:8px 0;">${lead.price.amount} ${lead.price.currency}/${lead.price.per}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Quantity</td><td style="padding:8px 0;">${lead.quantity.amount} ${lead.quantity.unit}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Terms</td><td style="padding:8px 0;">${lead.paymentTerms}, ${lead.incoterm}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Locations</td><td style="padding:8px 0;">loading=${lead.loadingLocation||"-"} (${lead.loadingCountry||"-"}), delivery=${lead.deliveryLocation||"-"} (${lead.deliveryCountry||"-"}), port=${lead.port||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Packaging</td><td style="padding:8px 0;">${lead.packaging||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Transport</td><td style="padding:8px 0;">${lead.transportMode||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Validity</td><td style="padding:8px 0;">${lead.priceValidity||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Availability</td><td style="padding:8px 0;">${lead.availabilityTime||"-"} / ${lead.availabilityQty||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Delivery</td><td style="padding:8px 0;">${lead.deliveryTimeframe||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Summary</td><td style="padding:8px 0;">${lead.summary||"-"}</td></tr>
          <tr><td style="padding:8px 0; color:#999;">Notes</td><td style="padding:8px 0;">${lead.specialNotes||lead.notes||"-"}</td></tr>
        </tbody>
      </table>
    </div>
    <div style="padding:16px 24px; border-top:1px solid #222; color:#999;">
      <p style="margin:0;">Regards,<br/>TAMI · TELE TAMI</p>
      <p style="margin:8px 0 0 0;"><a href="https://console.firebase.google.com/" style="color:#6dd5ff; text-decoration:none;">Open Firebase Console</a></p>
    </div>
  </div>
</div>`
      }
    };
    
    if (!isProduction) {
      console.log('Lead validated (demo mode):', firestoreLead);
      console.log('Email that would be sent (demo mode):', emailDoc);
    }
    
    return NextResponse.json({ ok: true }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing lead:', error);
    
    if (error instanceof Error && error.message.includes('Invalid lead data')) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}