"use client";
import React from 'react';
import { useSettings } from './SettingsContext';

// Pre-known configs provided by user
const KNOWN_CONFIGS: { id: string; label: string }[] = [
  { id: 'c66f0c67-bb61-43b8-bd96-87aae94a6060', label: 'TAMI Default' },
  { id: 'a14277d3-8b04-490c-bb80-a352ef5d2cc1', label: 'Jules Clone' },
];

export const ConfigSelector: React.FC = () => {
  const { settings, setConfigId, setCodeSystemPrompt, setCustomConfigInput, applyCustomConfig } = useSettings();

  const currentConfigValue = settings.configId.mode === 'CUSTOM' ? settings.configId.value : settings.configId.mode;
  const systemPromptValue = settings.codeSystemPrompt.mode; // DEFAULT | NONE

  return (
    <div className="w-full max-w-3xl mx-auto border border-border rounded-md p-4 text-sm space-y-4 bg-card/80 backdrop-blur-sm transition-colors">
      <h3 className="font-medium text-foreground">Session Configuration</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs uppercase tracking-wide">Hume Config</span>
          <select
            className="bg-input border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
            value={currentConfigValue}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'DEFAULT') return setConfigId({ mode: 'DEFAULT' });
              if (v === 'NONE') return setConfigId({ mode: 'NONE' });
              if (v === 'CUSTOM') return; // handled by custom field
              setConfigId({ mode: 'CUSTOM', value: v });
            }}
          >
            <option value="DEFAULT">Default (Env)</option>
            <option value="NONE">None (Global)</option>
            {KNOWN_CONFIGS.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
            <option value="CUSTOM">(Custom...)</option>
          </select>
          {currentConfigValue === 'CUSTOM' && (
            <div className="flex gap-2 mt-1">
              <input
                placeholder="Paste config UUID"
                value={settings.customConfigInput || ''}
                onChange={(e) => setCustomConfigInput(e.target.value)}
                className="flex-1 bg-input border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                onClick={() => applyCustomConfig()}
              >Apply</button>
            </div>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs uppercase tracking-wide">Code System Prompt</span>
          <select
            className="bg-input border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
            value={systemPromptValue}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'NONE') return setCodeSystemPrompt({ mode: 'NONE' });
              setCodeSystemPrompt({ mode: 'DEFAULT' });
            }}
          >
            <option value="DEFAULT">Default (Include)</option>
            <option value="NONE">None (Omit)</option>
          </select>
        </label>
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Strategy: Select a baseline config and optionally layer the code system prompt. Choose None + Custom config to experiment with entirely prompt-in-config. Default (Env) uses <code>NEXT_PUBLIC_HUME_DEFAULT_CONFIG_ID</code> if set.
      </p>
    </div>
  );
};

export default ConfigSelector;
