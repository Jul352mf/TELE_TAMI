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
          html: `<p>New lead captured.</p>
<p><b>${lead.side}</b> ${lead.product}</p>
<p>Price: ${lead.price.amount} ${lead.price.currency}/${lead.price.per}</p>
<p>Qty: ${lead.quantity.amount} ${lead.quantity.unit}</p>
<p>Terms: ${lead.paymentTerms}, ${lead.incoterm}</p>
<p>Locations: loading=${lead.loadingLocation||"-"} (${lead.loadingCountry||"-"}), delivery=${lead.deliveryLocation||"-"} (${lead.deliveryCountry||"-"}), port=${lead.port||"-"}</p>
<p>More: packaging=${lead.packaging||"-"}, transport=${lead.transportMode||"-"}, validity=${lead.priceValidity||"-"}, availTime=${lead.availabilityTime||"-"}, availQty=${lead.availabilityQty||"-"}, delivery=${lead.deliveryTimeframe||"-"}</p>
<p>Summary: ${lead.summary||"-"}</p>
<p>Special Notes: ${lead.specialNotes||lead.notes||"-"}</p>
<p><a href="https://console.firebase.google.com/">Open Console</a></p>`
        }
      };

      await db.collection('mail').add(mailDoc);
    }
    
    // Create email document structure (for logging/demo)
    const emailDoc = {
      to: process.env.LEADS_EMAIL,
      message: {
        subject: `New Lead: ${lead.side} ${lead.product} @ ${lead.price.amount} ${lead.price.currency}/${lead.price.per}`,
        html: `<p>New lead captured.</p>
<p><b>${lead.side}</b> ${lead.product}</p>
<p>Price: ${lead.price.amount} ${lead.price.currency}/${lead.price.per}</p>
<p>Qty: ${lead.quantity.amount} ${lead.quantity.unit}</p>
<p>Terms: ${lead.paymentTerms}, ${lead.incoterm}</p>
<p>Locations: loading=${lead.loadingLocation||"-"} (${lead.loadingCountry||"-"}), delivery=${lead.deliveryLocation||"-"} (${lead.deliveryCountry||"-"}), port=${lead.port||"-"}</p>
<p>More: packaging=${lead.packaging||"-"}, transport=${lead.transportMode||"-"}, validity=${lead.priceValidity||"-"}, availTime=${lead.availabilityTime||"-"}, availQty=${lead.availabilityQty||"-"}, delivery=${lead.deliveryTimeframe||"-"}</p>
<p>Summary: ${lead.summary||"-"}</p>
<p>Special Notes: ${lead.specialNotes||lead.notes||"-"}</p>
<p><a href="https://console.firebase.google.com/">Open Console</a></p>`
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