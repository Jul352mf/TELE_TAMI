import { NextRequest, NextResponse } from 'next/server';
import { validateLeadData, Lead, FirestoreLead } from '@/lib/schema';

// Note: Firebase admin initialization would go here in production
// For now, we'll create a mock implementation that validates the structure

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the lead data against the JSON Schema
    const lead: Lead = validateLeadData(body);
    
    // Extract additional metadata
    const persona = body.persona || 'professional';
    const traderHint = body.traderHint || null;
    const now = new Date();
    
    // Create Firestore lead document structure
    const firestoreLead: FirestoreLead = {
      ...lead,
      createdAt: now,
      persona,
      traderHint,
      lang: 'en'
    };
    
    // TODO: Write to Firestore leads collection
    // const leadRef = firestore().collection('leads').doc();
    // await leadRef.set(firestoreLead);
    
    // TODO: Create mail document for Trigger Email
    const emailDoc = {
      to: process.env.LEADS_EMAIL,
      message: {
        subject: `New Lead: ${lead.side} ${lead.product} @ ${lead.price.amount} ${lead.price.currency}/${lead.price.per}`,
        html: `<p>New lead captured.</p>
<p><b>${lead.side}</b> ${lead.product}</p>
<p>Price: ${lead.price.amount} ${lead.price.currency}/${lead.price.per}</p>
<p>Qty: ${lead.quantity.amount} ${lead.quantity.unit}</p>
<p>Terms: ${lead.paymentTerms}, ${lead.incoterm}, Port: ${lead.port}</p>
<p>More: packaging=${lead.packaging||"-"}, transport=${lead.transportMode||"-"}, validity=${lead.priceValidity||"-"}, availTime=${lead.availabilityTime||"-"}, availQty=${lead.availabilityQty||"-"}, delivery=${lead.deliveryTimeframe||"-"}</p>
<p><a href="https://console.firebase.google.com/">Open Console</a></p>`
      }
    };
    
    // TODO: Write to mail collection for Trigger Email
    // await firestore().collection('mail').add(emailDoc);
    
    console.log('Lead validated and would be saved:', firestoreLead);
    console.log('Email that would be sent:', emailDoc);
    
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