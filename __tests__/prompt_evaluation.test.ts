import { buildSystemPrompt } from '@/lib/hume';

describe('prompt evaluation scaffold', () => {
  it('includes incremental guidance when flag set', () => {
    const prev = process.env.NEXT_PUBLIC_INCREMENTAL_LEADS;
    process.env.NEXT_PUBLIC_INCREMENTAL_LEADS = '1';
    const prompt = buildSystemPrompt('professional');
    expect(prompt).toMatch(/INCREMENTAL MODE/);
    expect(prompt).toMatch(/QUERY & CONFIRM/);
    process.env.NEXT_PUBLIC_INCREMENTAL_LEADS = prev;
  });

  it('omits incremental guidance when flag off', () => {
    const prev = process.env.NEXT_PUBLIC_INCREMENTAL_LEADS;
    delete process.env.NEXT_PUBLIC_INCREMENTAL_LEADS;
    const prompt = buildSystemPrompt('professional');
    expect(prompt).not.toMatch(/INCREMENTAL MODE/);
    process.env.NEXT_PUBLIC_INCREMENTAL_LEADS = prev;
  });
});
