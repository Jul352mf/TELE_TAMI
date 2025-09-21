import { buildEmailHtmlV1, buildEmailHtmlV2 } from '../lib/emailTemplates';
import { Lead } from '../lib/schema';

function baseLead(currency: string): Lead {
  return {
    side: 'BUY',
    product: 'Copper Cathode',
    price: { amount: 5123.45, currency: currency as any, per: 'mt' },
    quantity: { amount: 100, unit: 'mt' },
    paymentTerms: 'Net 30',
    incoterm: 'FOB',
    loadingLocation: 'Durban',
    summary: 'BUY 100mt Copper Cathode',
    specialNotes: 'Test note'
  };
}

describe('Email currency propagation', () => {
  const persona = 'professional';
  const locationsLine = 'Durban -> n/a';

  const currencies = ['USD','EUR','CHF'];

  currencies.forEach(cur => {
    test(`currency ${cur} appears unchanged in email outputs`, () => {
      const lead = baseLead(cur);
      const html1 = buildEmailHtmlV1({ lead, persona, locationsLine });
      const html2 = buildEmailHtmlV2({ lead, persona, locationsLine });
      expect(html1).toContain(`${lead.price.amount} ${cur}/mt`);
      expect(html2).toContain(`${lead.price.amount} ${cur}/mt`);
    });
  });

  test('changing currency does not alter previous leads', () => {
    const leadUsd = baseLead('USD');
    const htmlUsd = buildEmailHtmlV1({ lead: leadUsd, persona, locationsLine });
    const leadEur = baseLead('EUR');
    const htmlEur = buildEmailHtmlV1({ lead: leadEur, persona, locationsLine });
    expect(htmlUsd).toContain('USD/mt');
    expect(htmlEur).toContain('EUR/mt');
  });
});
