import { NextRequest, NextResponse } from 'next/server';
import { validateLeadData, Lead, FirestoreLead } from '@/lib/schema';
import { buildEmailHtmlV1, buildEmailHtmlV2 } from '@/lib/emailTemplates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const normalized: any = { ...body };
    if (!normalized.loadingLocation && !normalized.deliveryLocation && normalized.port) {
      normalized.deliveryLocation = normalized.port; // backward compatibility
    }

    const lead: Lead = validateLeadData(normalized);
    const persona = typeof normalized.persona === 'string' ? normalized.persona : 'professional';
    const traderHint = typeof normalized.traderHint === 'string' ? normalized.traderHint : null;
    const now = new Date();

    const firestoreLead: FirestoreLead = {
      ...lead,
      createdAt: now,
      persona,
      traderHint,
      lang: 'en'
    };

    // Format locations line
    const locationSegments: string[] = [];
    const addLoc = (label: string, loc?: string, country?: string) => {
      if (!loc && !country) return;
      if (loc && country) locationSegments.push(`${label}: ${loc} (${country})`);
      else if (loc) locationSegments.push(`${label}: ${loc}`);
      else if (country) locationSegments.push(`${label}: ${country}`);
    };
    addLoc('Loading', lead.loadingLocation, lead.loadingCountry);
    addLoc('Delivery', lead.deliveryLocation, lead.deliveryCountry);
    if (lead.port) locationSegments.push(`Port: ${lead.port}`);
    const locationsLine = locationSegments.length ? locationSegments.join(' • ') : '-';

    const isProduction = !!process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_PROJECT_ID.includes('demo');
    const emailMode = (process.env.EMAIL_MODE || 'dry-run').toLowerCase(); // off | dry-run | live
    const templateVersion = process.env.EMAIL_TEMPLATE_VERSION === 'v2' ? 'v2' : 'v1';

    // Decide recipient: explicit recipientEmail (validated contains @) else fallback env
    const explicitRecipient = typeof normalized.recipientEmail === 'string' && normalized.recipientEmail.includes('@') ? normalized.recipientEmail : undefined;
    const fallbackRecipient = process.env.LEADS_EMAIL;
    const toAddress = explicitRecipient || fallbackRecipient;

    // Firestore save always (lead record) regardless of email gating
    if (isProduction) {
      const { firestore } = await import('@/lib/firebase');
      const db = firestore();
      await db.collection('leads').add({ ...firestoreLead });
    } else {
      console.log('[demo] lead would be saved', firestoreLead);
    }

    // Email gating
    if (emailMode !== 'off' && toAddress) {
      const subject = `New Lead: ${lead.side} ${lead.product} @ ${lead.price.amount} ${lead.price.currency}/${lead.price.per}`;
      const html = templateVersion === 'v2'
        ? buildEmailHtmlV2({ lead, persona, locationsLine })
        : buildEmailHtmlV1({ lead, persona, locationsLine });

      if (emailMode === 'live' && isProduction) {
        const { firestore } = await import('@/lib/firebase');
        const db = firestore();
        const mailDoc = { to: toAddress, message: { subject, html } };
        await db.collection('mail').add(mailDoc);
      } else {
        console.log(`[email:${emailMode}] Would send`, { to: toAddress, subject, templateVersion });
      }
    } else {
      console.log(`[email:skip] mode=${emailMode} recipient=${toAddress}`);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing lead:', error);
    if (error instanceof Error && error.message.includes('Invalid lead data')) {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}