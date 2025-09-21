import { describe, it, expect } from '@jest/globals';
import { acceptFragment, finalizeDraft } from '@/lib/incrementalJson';

/**
 * Integration-style test: ensure sequence of fragment -> fragment -> finalize
 * preserves known vs unknown separation and cleans up.
 */

describe('Incremental end-to-end finalize flow', () => {
  const sessionId = 'sess-int-1';
  const draftId = 'draft-int-1';

  it('merges fragments then finalizes with unknown segregation', () => {
    acceptFragment(draftId, sessionId, { side: 'BUY', product: 'Wheat' });
    acceptFragment(draftId, sessionId, { price: { amount: 350, currency: 'USD' }, fancyExtra: 'valueX' });
    acceptFragment(draftId, sessionId, { anotherExtra: 42 });

    const result = finalizeDraft(draftId);
    expect(result).toBeDefined();
    expect(result!.finalData.side).toBe('BUY');
    expect(result!.finalData.product).toBe('Wheat');
    expect(result!.finalData.price).toEqual({ amount: 350, currency: 'USD' });
    expect(result!.unknownFields.fancyExtra).toBe('valueX');
    expect(result!.unknownFields.anotherExtra).toBe(42);
  });
});
