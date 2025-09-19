import { parsePrice, parseQuantity, normalizeLeadPayload } from '../utils/parsers';

describe('parsePrice', () => {
  test('parses symbol + per unit', () => {
    expect(parsePrice('$320 / mt')).toEqual({ amount: 320, currency: 'USD', per: 'mt' });
  });
  test('parses currency code and per clause', () => {
    expect(parsePrice('EUR 455 per kg')).toEqual({ amount: 455, currency: 'EUR', per: 'kg' });
  });
  test('parses object passthrough', () => {
    expect(parsePrice({ amount: 100, currency: 'usd', per: 'kg' })).toEqual({ amount: 100, currency: 'USD', per: 'kg' });
  });
  test('returns null for invalid', () => {
    expect(parsePrice('no price here')).toBeNull();
  });
});

describe('parseQuantity', () => {
  test('parses metric tons', () => {
    expect(parseQuantity('1,250 mt')).toEqual({ amount: 1250, unit: 'mt' });
  });
  test('parses kg', () => {
    expect(parseQuantity('500 kg')).toEqual({ amount: 500, unit: 'kg' });
  });
  test('object passthrough', () => {
    expect(parseQuantity({ amount: 42, unit: 'kg' })).toEqual({ amount: 42, unit: 'kg' });
  });
});

describe('normalizeLeadPayload', () => {
  test('normalizes string fields', () => {
    const p = normalizeLeadPayload({ price: '$300 / mt', quantity: '2,000 mt' });
    expect(p.price).toEqual({ amount: 300, currency: 'USD', per: 'mt' });
    expect(p.quantity).toEqual({ amount: 2000, unit: 'mt' });
  });
});
