"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export interface LeadDraft {
  id: string; // uuid per active draft
  side?: string;
  product?: string;
  price?: string; // free-form until parsed
  quantity?: string;
  paymentTerms?: string;
  incoterm?: string;
  loadingLocation?: string;
  deliveryLocation?: string;
  loadingCountry?: string;
  deliveryCountry?: string;
  packaging?: string;
  transportMode?: string;
  priceValidity?: string;
  availabilityTime?: string;
  availabilityQty?: string;
  deliveryTimeframe?: string;
  summary?: string;
  notes?: string;
  specialNotes?: string;
  traderName?: string;
  reasonCodes?: string[]; // tracking missing/blocked field codes
  // meta
  updatedAt: number;
}

interface LeadDraftContextValue {
  draft: LeadDraft | null;
  startNewDraft: () => void;
  patchDraft: (partial: Partial<LeadDraft>) => void;
  clearDraft: () => void;
  addReasonCode: (code: string) => void;
  removeReasonCode: (code: string) => void;
}

const LeadDraftContext = createContext<LeadDraftContextValue | undefined>(undefined);

function uuid() {
  return globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
}

export const LeadDraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<LeadDraft | null>(null);
  const saveTimer = useRef<number | null>(null);

  // Restore on mount
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('leadDraft:v1') : null;
      if (raw) {
        const parsed = JSON.parse(raw) as LeadDraft;
        setDraft(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Debounced autosave
  useEffect(() => {
    if (!draft) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem('leadDraft:v1', JSON.stringify(draft));
      } catch { /* ignore */ }
    }, 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [draft]);

  const startNewDraft = useCallback(() => {
    setDraft({ id: uuid(), updatedAt: Date.now() });
  }, []);

  const patchDraft = useCallback((partial: Partial<LeadDraft>) => {
    setDraft(prev => {
      if (!prev) return { id: uuid(), updatedAt: Date.now(), ...partial } as LeadDraft;
      return { ...prev, ...partial, updatedAt: Date.now() };
    });
  }, []);

  const clearDraft = useCallback(() => {
    setDraft(null);
    try { localStorage.removeItem('leadDraft:v1'); } catch { /* ignore */ }
  }, []);

  const addReasonCode = useCallback((code: string) => {
    setDraft(prev => {
      if (!prev) return prev;
      const set = new Set(prev.reasonCodes || []);
      set.add(code);
      return { ...prev, reasonCodes: Array.from(set), updatedAt: Date.now() };
    });
  }, []);

  const removeReasonCode = useCallback((code: string) => {
    setDraft(prev => {
      if (!prev || !prev.reasonCodes) return prev;
      const next = prev.reasonCodes.filter(c => c !== code);
      return { ...prev, reasonCodes: next, updatedAt: Date.now() };
    });
  }, []);

  return (
    <LeadDraftContext.Provider value={{ draft, startNewDraft, patchDraft, clearDraft, addReasonCode, removeReasonCode }}>
      {children}
    </LeadDraftContext.Provider>
  );
};

export function useLeadDraft() {
  const ctx = useContext(LeadDraftContext);
  if (!ctx) throw new Error('useLeadDraft must be used within LeadDraftProvider');
  return ctx;
}
