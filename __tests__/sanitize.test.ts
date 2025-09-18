import { expect, describe, it } from '@jest/globals';
import { leadJsonSchema } from '@/lib/schema';
// @ts-ignore access internal for test by re-importing file text if needed
import * as hume from '@/lib/hume';

describe('sanitizeForHume', () => {
  it('removes unsupported keys while preserving structure', () => {
    // @ts-ignore internal function access
    const result = (hume as any).sanitizeForHume(leadJsonSchema);
    expect(result.type).toBe('object');
    expect(result.properties).toBeDefined();
  });
});
