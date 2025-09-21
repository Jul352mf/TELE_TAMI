"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { UiSettingsState, initialUiSettings, TriOption } from '@/lib/settings';

interface SettingsContextValue {
  settings: UiSettingsState;
  setConfigId: (opt: TriOption<string>) => void;
  setCodeSystemPrompt: (opt: TriOption<string>) => void;
  setCustomConfigInput: (value: string) => void;
  applyCustomConfig: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UiSettingsState>(initialUiSettings);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tami:uiSettings:v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings(s => ({ ...s, ...parsed }));
      }
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    try { localStorage.setItem('tami:uiSettings:v1', JSON.stringify(settings)); } catch {}
  }, [settings]);

  return (
    <SettingsContext.Provider value={{
      settings,
      setConfigId: (opt) => setSettings(s => ({ ...s, configId: opt })),
      setCodeSystemPrompt: (opt) => setSettings(s => ({ ...s, codeSystemPrompt: opt })),
      setCustomConfigInput: (value) => setSettings(s => ({ ...s, customConfigInput: value })),
      applyCustomConfig: () => setSettings(s => s.customConfigInput ? ({ ...s, configId: { mode: 'CUSTOM', value: s.customConfigInput } }) : s),
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
