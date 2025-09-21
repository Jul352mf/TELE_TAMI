import { validateLeadData, Lead } from '../lib/schema';

describe('Lead Schema Validation', () => {
  const validLead: Lead = {
    side: 'SELL',
    product: 'Aluminum ingots 99.7%',
    price: {
      amount: 2250,
      currency: 'CHF',
      per: 'mt'
    },
    quantity: {
      amount: 500,
      unit: 'mt'
    },
    paymentTerms: 'LC at sight',
    incoterm: 'FOB',
    port: 'Hamburg',
    loadingLocation: 'Rotterdam'
  };

  test('validates a complete valid lead', () => {
    expect(() => validateLeadData(validLead)).not.toThrow();
    const result = validateLeadData(validLead);
    expect(result).toEqual(validLead);
  });

  test('validates lead with optional fields', () => {
    const leadWithOptionals = {
      ...validLead,
      packaging: 'Bulk bags',
      transportMode: 'Truck',
      priceValidity: '30 days',
      availabilityTime: 'Q1 2024',
      availabilityQty: '1000 mt available',
      deliveryTimeframe: '2-3 weeks',
      notes: 'Premium quality'
    };
    
    expect(() => validateLeadData(leadWithOptionals)).not.toThrow();
  });

  test('rejects lead with invalid side', () => {
    const invalidLead = { ...validLead, side: 'INVALID' };
    expect(() => validateLeadData(invalidLead)).toThrow('Invalid lead data');
  });

  test('rejects lead with invalid currency', () => {
    const invalidLead = { 
      ...validLead, 
      price: { ...validLead.price, currency: 'USD' }
    };
    expect(() => validateLeadData(invalidLead)).toThrow('Invalid lead data');
  });

  test('rejects lead with invalid incoterm', () => {
    const invalidLead = { ...validLead, incoterm: 'INVALID' };
    expect(() => validateLeadData(invalidLead)).toThrow('Invalid lead data');
  });

  test('rejects lead missing required fields', () => {
    const base = { ...validLead };
    const cases = [
      { ...base, side: undefined },
      { ...base, product: undefined },
      { ...base, price: undefined },
      { ...base, quantity: undefined },
      { ...base, paymentTerms: undefined },
      { ...base, incoterm: undefined },
      // Remove both loading and delivery locations to violate anyOf
      { ...base, loadingLocation: undefined, deliveryLocation: undefined }
    ];
    cases.forEach(c => {
      expect(() => validateLeadData(c)).toThrow('Invalid lead data');
    });
  });

  test('rejects lead with too short product name', () => {
    const invalidLead = { ...validLead, product: 'A' };
    expect(() => validateLeadData(invalidLead)).toThrow('Invalid lead data');
  });

  test('rejects lead with invalid price amount', () => {
    const invalidLead = { 
      ...validLead, 
      price: { ...validLead.price, amount: 'not-a-number' as any }
    };
    expect(() => validateLeadData(invalidLead)).toThrow('Invalid lead data');
  });

  test('accepts both mt and kg units', () => {
    const leadWithKg = {
      ...validLead,
      price: { amount: 2.25, currency: 'CHF', per: 'kg' },
      quantity: { amount: 500000, unit: 'kg' }
    };
    
    expect(() => validateLeadData(leadWithKg)).not.toThrow();
  });

  test('validates all valid Incoterms 2020', () => {
    const validIncoterms = ['EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'];
    
    validIncoterms.forEach(incoterm => {
      const leadWithIncoterm = { ...validLead, incoterm: incoterm as any };
      expect(() => validateLeadData(leadWithIncoterm)).not.toThrow();
    });
  });
});