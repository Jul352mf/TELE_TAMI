/**
 * Incremental JSON backend for Strategy E
 * Handles partial JSON fragments and merges them gracefully
 */

import { emit } from '@/utils/telemetry';

export interface IncrementalDraft {
  id: string;
  sessionId: string;
  fragments: Record<string, any>;
  lastUpdated: number;
  totalKeys: number;
}

// In-memory storage for drafts (could be replaced with Redis/DB in production)
const drafts = new Map<string, IncrementalDraft>();

/**
 * Accept and merge a partial JSON fragment
 */
export function acceptFragment(
  draftId: string,
  sessionId: string,
  fragment: Record<string, any>
): IncrementalDraft {
  const keys = Object.keys(fragment);
  
  emit({ 
    type: 'incremental_fragment_received', 
    size: JSON.stringify(fragment).length,
    keys 
  });

  let draft = drafts.get(draftId);
  if (!draft) {
    draft = {
      id: draftId,
      sessionId,
      fragments: {},
      lastUpdated: Date.now(),
      totalKeys: 0
    };
  }

  // Shallow merge fragments
  draft.fragments = { ...draft.fragments, ...fragment };
  draft.lastUpdated = Date.now();
  draft.totalKeys = Object.keys(draft.fragments).length;

  drafts.set(draftId, draft);
  return draft;
}

/**
 * Finalize draft and convert to final schema
 */
export function finalizeDraft(draftId: string): { finalData: any; unknownFields: Record<string, any> } | null {
  const draft = drafts.get(draftId);
  if (!draft) return null;

  emit({ type: 'incremental_finalized', totalKeys: draft.totalKeys });

  // Known schema fields
  const knownFields = new Set([
    'side', 'product', 'price', 'quantity', 'paymentTerms', 'incoterm',
    'loadingLocation', 'deliveryLocation', 'loadingCountry', 'deliveryCountry',
    'packaging', 'transportMode', 'priceValidity', 'availabilityTime',
    'availabilityQty', 'deliveryTimeframe', 'summary', 'notes', 'specialNotes', 'traderName'
  ]);

  const finalData: any = {};
  const unknownFields: any = {};

  // Separate known and unknown fields
  for (const [key, value] of Object.entries(draft.fragments)) {
    if (knownFields.has(key)) {
      finalData[key] = value;
    } else {
      unknownFields[key] = value;
    }
  }

  // Clean up
  drafts.delete(draftId);

  return { finalData, unknownFields };
}

/**
 * Get current draft state
 */
export function getDraft(draftId: string): IncrementalDraft | null {
  return drafts.get(draftId) || null;
}

/**
 * List all drafts for a session
 */
export function getSessionDrafts(sessionId: string): IncrementalDraft[] {
  return Array.from(drafts.values()).filter(draft => draft.sessionId === sessionId);
}

/**
 * Clean up old drafts (call periodically)
 */
export function cleanupOldDrafts(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const cutoff = Date.now() - maxAgeMs;
  let cleaned = 0;

  for (const [id, draft] of drafts) {
    if (draft.lastUpdated < cutoff) {
      drafts.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get missing required fields from current draft
 */
export function getMissingRequiredFields(draftId: string): string[] {
  const draft = drafts.get(draftId);
  if (!draft) return [];

  const required = ['side', 'product', 'price', 'quantity', 'paymentTerms', 'incoterm'];
  const hasLocation = draft.fragments.loadingLocation || draft.fragments.deliveryLocation;
  
  const missing = required.filter(field => !draft.fragments[field]);
  
  if (!hasLocation) {
    missing.push('loadingLocation OR deliveryLocation');
  }

  return missing;
}

/**
 * Export draft as JSON for backup/analysis
 */
export function exportDraftAsJson(draftId: string): string | null {
  const draft = drafts.get(draftId);
  if (!draft) return null;

  return JSON.stringify({
    id: draft.id,
    sessionId: draft.sessionId,
    fragments: draft.fragments,
    lastUpdated: new Date(draft.lastUpdated).toISOString(),
    totalKeys: draft.totalKeys,
    missingRequired: getMissingRequiredFields(draftId)
  }, null, 2);
}

/**
 * Merge multiple drafts (for multi-lead scenarios)
 */
export function mergeDrafts(draftIds: string[]): Record<string, any>[] {
  return draftIds
    .map(id => drafts.get(id))
    .filter(Boolean)
    .map(draft => draft!.fragments);
}