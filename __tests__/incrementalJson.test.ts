import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  acceptFragment,
  finalizeDraft,
  getDraft,
  getSessionDrafts,
  cleanupOldDrafts,
  getMissingRequiredFields,
  exportDraftAsJson,
  mergeDrafts
} from '@/lib/incrementalJson';

describe('Incremental JSON Backend', () => {
  const sessionId = 'test-session-123';
  const draftId = 'draft-456';

  beforeEach(() => {
    // Clean up any existing drafts
    cleanupOldDrafts(0);
  });

  describe('Fragment acceptance', () => {
    it('should accept and store a fragment', () => {
      const fragment = { side: 'BUY', product: 'Wheat' };
      
      const draft = acceptFragment(draftId, sessionId, fragment);
      
      expect(draft.id).toBe(draftId);
      expect(draft.sessionId).toBe(sessionId);
      expect(draft.fragments).toEqual(fragment);
      expect(draft.totalKeys).toBe(2);
    });

    it('should merge multiple fragments', () => {
      acceptFragment(draftId, sessionId, { side: 'BUY', product: 'Wheat' });
      const draft = acceptFragment(draftId, sessionId, { price: { amount: 300, currency: 'USD' } });
      
      expect(draft.fragments).toEqual({
        side: 'BUY',
        product: 'Wheat',
        price: { amount: 300, currency: 'USD' }
      });
      expect(draft.totalKeys).toBe(3);
    });

    it('should update lastUpdated timestamp', () => {
      const before = Date.now();
      const draft = acceptFragment(draftId, sessionId, { side: 'SELL' });
      const after = Date.now();
      
      expect(draft.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(draft.lastUpdated).toBeLessThanOrEqual(after);
    });
  });

  describe('Draft retrieval', () => {
    it('should retrieve draft by ID', () => {
      acceptFragment(draftId, sessionId, { side: 'BUY' });
      
      const retrieved = getDraft(draftId);
      expect(retrieved).toBeDefined();
      expect(retrieved!.fragments.side).toBe('BUY');
    });

    it('should return null for non-existent draft', () => {
      const retrieved = getDraft('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should retrieve drafts by session', () => {
      acceptFragment('draft1', sessionId, { side: 'BUY' });
      acceptFragment('draft2', sessionId, { side: 'SELL' });
      acceptFragment('draft3', 'other-session', { side: 'BUY' });
      
      const sessionDrafts = getSessionDrafts(sessionId);
      expect(sessionDrafts).toHaveLength(2);
      expect(sessionDrafts.map(d => d.id)).toContain('draft1');
      expect(sessionDrafts.map(d => d.id)).toContain('draft2');
      expect(sessionDrafts.map(d => d.id)).not.toContain('draft3');
    });
  });

  describe('Draft finalization', () => {
    it('should finalize draft with known and unknown fields', () => {
      acceptFragment(draftId, sessionId, {
        side: 'BUY',
        product: 'Wheat',
        customField: 'custom value',
        anotherCustom: 123
      });
      
      const result = finalizeDraft(draftId);
      
      expect(result).toBeDefined();
      expect(result!.finalData).toEqual({
        side: 'BUY',
        product: 'Wheat'
      });
      expect(result!.unknownFields).toEqual({
        customField: 'custom value',
        anotherCustom: 123
      });
    });

    it('should clean up draft after finalization', () => {
      acceptFragment(draftId, sessionId, { side: 'BUY' });
      
      finalizeDraft(draftId);
      
      const retrieved = getDraft(draftId);
      expect(retrieved).toBeNull();
    });

    it('should return null for non-existent draft', () => {
      const result = finalizeDraft('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('Missing required fields', () => {
    it('should identify missing required fields', () => {
      acceptFragment(draftId, sessionId, { side: 'BUY', product: 'Wheat' });
      
      const missing = getMissingRequiredFields(draftId);
      
      expect(missing).toContain('price');
      expect(missing).toContain('quantity');
      expect(missing).toContain('paymentTerms');
      expect(missing).toContain('incoterm');
      expect(missing).toContain('loadingLocation OR deliveryLocation');
    });

    it('should not require location if one is present', () => {
      acceptFragment(draftId, sessionId, {
        side: 'BUY',
        product: 'Wheat',
        loadingLocation: 'Chicago'
      });
      
      const missing = getMissingRequiredFields(draftId);
      
      expect(missing).not.toContain('loadingLocation OR deliveryLocation');
    });

    it('should return empty array for non-existent draft', () => {
      const missing = getMissingRequiredFields('non-existent');
      expect(missing).toEqual([]);
    });
  });

  describe('Draft export', () => {
    it('should export draft as JSON', () => {
      acceptFragment(draftId, sessionId, { side: 'BUY', product: 'Wheat' });
      
      const json = exportDraftAsJson(draftId);
      
      expect(json).toBeDefined();
      const parsed = JSON.parse(json!);
      expect(parsed.id).toBe(draftId);
      expect(parsed.sessionId).toBe(sessionId);
      expect(parsed.fragments).toEqual({ side: 'BUY', product: 'Wheat' });
      expect(parsed.totalKeys).toBe(2);
      expect(parsed.missingRequired).toContain('price');
    });

    it('should return null for non-existent draft', () => {
      const json = exportDraftAsJson('non-existent');
      expect(json).toBeNull();
    });
  });

  describe('Draft merging', () => {
    it('should merge multiple drafts', () => {
      acceptFragment('draft1', sessionId, { side: 'BUY', product: 'Wheat' });
      acceptFragment('draft2', sessionId, { side: 'SELL', product: 'Corn' });
      
      const merged = mergeDrafts(['draft1', 'draft2']);
      
      expect(merged).toHaveLength(2);
      expect(merged[0]).toEqual({ side: 'BUY', product: 'Wheat' });
      expect(merged[1]).toEqual({ side: 'SELL', product: 'Corn' });
    });

    it('should skip non-existent drafts', () => {
      acceptFragment('draft1', sessionId, { side: 'BUY' });
      
      const merged = mergeDrafts(['draft1', 'non-existent', 'also-missing']);
      
      expect(merged).toHaveLength(1);
      expect(merged[0]).toEqual({ side: 'BUY' });
    });
  });

  describe('Cleanup', () => {
    it('should clean up old drafts', () => {
      // Create old draft (simulate with backdated timestamp)
      const oldDraft = acceptFragment('old-draft', sessionId, { side: 'BUY' });
      oldDraft.lastUpdated = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      
      // Create recent draft
      acceptFragment('recent-draft', sessionId, { side: 'SELL' });
      
      const cleaned = cleanupOldDrafts(24 * 60 * 60 * 1000); // 24 hours
      
      expect(cleaned).toBe(1);
      expect(getDraft('old-draft')).toBeNull();
      expect(getDraft('recent-draft')).toBeDefined();
    });
  });
});