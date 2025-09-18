"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

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
  // meta
  updatedAt: number;
}

interface LeadDraftContextValue {
  draft: LeadDraft | null;
  startNewDraft: () => void;
  patchDraft: (partial: Partial<LeadDraft>) => void;
  clearDraft: () => void;
}

const LeadDraftContext = createContext<LeadDraftContextValue | undefined>(undefined);

function uuid() {
  return globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
}

export const LeadDraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<LeadDraft | null>(null);

  const startNewDraft = useCallback(() => {
    setDraft({ id: uuid(), updatedAt: Date.now() });
  }, []);

  const patchDraft = useCallback((partial: Partial<LeadDraft>) => {
    setDraft(prev => {
      if (!prev) return { id: uuid(), updatedAt: Date.now(), ...partial } as LeadDraft;
      return { ...prev, ...partial, updatedAt: Date.now() };
    });
  }, []);

  const clearDraft = useCallback(() => setDraft(null), []);

  return (
    <LeadDraftContext.Provider value={{ draft, startNewDraft, patchDraft, clearDraft }}>
      {children}
    </LeadDraftContext.Provider>
  );
};

export function useLeadDraft() {
  const ctx = useContext(LeadDraftContext);
  if (!ctx) throw new Error('useLeadDraft must be used within LeadDraftProvider');
  return ctx;
}
