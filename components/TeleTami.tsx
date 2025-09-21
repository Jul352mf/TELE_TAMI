"use client";

import { VoiceProvider, useVoice } from "@humeai/voice-react";
import { useState, ComponentRef, useRef, useEffect } from "react";
import { toast } from "sonner";
import PersonaToggle from "./PersonaToggle";
import CallButton from "./CallButton";
import Controls from "./Controls";
import Messages from "./Messages";
import { recordLeadTool, detectOleMode, getPromptVersionId, buildSystemPrompt } from "@/lib/hume";
import { generateRecapContent } from '@/lib/conversationState';
import { toolSuccess, toolError } from "@/lib/toolRegistry";
import { useLeadDraft } from "@/components/LeadDraftProvider";
import { normalizeLeadPayload } from '@/utils/parsers';
import { inc as incMetric } from '@/utils/metrics';
import { emit, withToolTelemetry } from '@/utils/telemetry';
import { shouldUseIncrementalMode } from '@/lib/strategyHarness';
import { acceptFragment, finalizeDraft } from '@/lib/incrementalJson';
import VoiceSelect from "./VoiceSelect";
import SessionTimers from "./SessionTimers";
import ModelSelect from "./ModelSelect";
import { SettingsProvider, useSettings } from './SettingsContext';
import ConfigSelector from './ConfigSelector';
import { ChevronDown } from 'lucide-react';
import { useConversationState } from '@/hooks/useConversationState';
import VoiceSpeedControl from './VoiceSpeedControl';
import NotesComponent from './NotesComponent';
import SpecFileUpload from './SpecFileUpload';
import InfoTooltip from './InfoTooltip';
import { useCallback } from 'react';
import { cn } from '@/utils';

function TeleTamiInner({ accessToken }: { accessToken: string }) {
  const [persona, setPersona] = useState<"professional" | "seductive" | "unhinged" | "cynical">("professional");
  const [voiceId, setVoiceId] = useState<string>("default");
  const [modelId, setModelId] = useState<string>("hume-evi-3");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [voiceSpeed, setVoiceSpeed] = useState<number | undefined>(undefined);

  // Restore persisted settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tami:settings:v1');
      if (stored) {
  const { persona, voiceId, modelId } = JSON.parse(stored);
        if (persona) setPersona(persona);
        if (voiceId) setVoiceId(voiceId);
        if (modelId) setModelId(modelId);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist settings debounced
  useEffect(() => {
    const t = window.setTimeout(() => {
  try { localStorage.setItem('tami:settings:v1', JSON.stringify({ persona, voiceId, modelId })); } catch { /* ignore */ }
    }, 250);
    return () => window.clearTimeout(t);
  }, [persona, voiceId, modelId]);
  const timeout = useRef<number | null>(null);
  const ref = useRef<ComponentRef<typeof Messages> | null>(null);

  // Optional: use configId from environment variable
  // Config handled via settings now
  const { settings } = useSettings();

  const { draft, patchDraft, startNewDraft, clearDraft, completedLeads, addCompletedLead } = useLeadDraft();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isOleMode, setIsOleMode] = useState(false);
  const incremental = shouldUseIncrementalMode();
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());

  // Build system prompt for telemetry correlation (reuse logic)
  const systemPrompt = buildSystemPrompt(persona, isOleMode);
  // Baselines for drift detection
  const baselinePersonaRef = useRef(persona);
  const baselineVoiceRef = useRef<string | undefined>(undefined);
  if (baselineVoiceRef.current === undefined) baselineVoiceRef.current = voiceId;

  // Drift detection: watch for persona changes post-connect (UI-side state changes are user-driven, we only warn on assistant-side indicators)
  useEffect(() => {
    if (persona !== baselinePersonaRef.current) {
      emit({ type: 'persona_changed_runtime', from: baselinePersonaRef.current, to: persona });
      baselinePersonaRef.current = persona; // update so we don't spam; future improvement: gate on connection state
    }
  }, [persona]);

  // Handle tool calls from EVI with telemetry & metrics
  const handleToolCall = async (name: string, args: any) => {
    const promptVersionId = getPromptVersionId() || undefined;
    const basePersona = isOleMode ? 'interview' : persona;
    const required = ['side','product','price','quantity','paymentTerms','incoterm'];
    const draftFieldCount = draft ? Object.keys(draft as any).length : 0;
    return withToolTelemetry(sessionId, name, basePersona, incremental, promptVersionId, draftFieldCount, undefined, async () => {
      if (name === 'recordLead') {
        const payload = {
          ...args,
          persona: basePersona,
          traderHint: isOleMode ? 'Ole detected' : null,
          sourceCallId: sessionId,
          promptVersionId,
          recipientEmail: recipientEmail?.trim() || undefined,
        };
        const response = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          toast.success('Lead captured & emailed!');
          emit({ type: 'lead_tool_called' });
        } else {
          const error = await response.json();
          toast.error(`Failed to capture lead: ${error.error}`);
        }
        return;
      }
      if (incremental) {
        if (name === 'addOrUpdateLeadField' || name === 'confirmFieldValue') {
          const { field, value } = args || {};
          if (!draft) { startNewDraft(); incMetric('leadsStarted'); }
          // Accept fragment into backend incremental store
          acceptFragment(draftId, sessionId, { [field]: value });
          // Keep local draft (UI/recap)
          patchDraft({ [field]: value });
          if (name === 'confirmFieldValue') incMetric('confirmations');
          return;
        }
        if (name === 'getMissingFields' || name === 'getDraftSummary') {
          // Future: could surface incrementalJson state; noop for now
          return;
        }
        if (name === 'finalizeLeadDraft') {
          const result = finalizeDraft(draftId);
          if (!result) {
            toast.error('No active draft to finalize');
            throw new Error('no_active_draft');
          }
            const { finalData, unknownFields } = result;
          if (unknownFields && Object.keys(unknownFields).length) {
            emit({
              type: 'incremental_unknown_fields_preserved',
              count: Object.keys(unknownFields).length,
              keys: Object.keys(unknownFields)
            });
          }
          // Merge unknown fields into notes for preservation
          if (Object.keys(unknownFields).length) {
            const unknownNote = Object.entries(unknownFields)
              .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
              .join('; ');
            finalData.notes = finalData.notes ? `${finalData.notes}\nOther: ${unknownNote}` : `Other: ${unknownNote}`;
          }
          const missing = required.filter(f => !(finalData as any)?.[f]);
          if (missing.length) {
            toast.error(`Cannot finalize, missing: ${missing.join(', ')}`);
            throw new Error('missing_required');
          }
          const rawPayload = { ...finalData };
          const payload = {
            ...normalizeLeadPayload(rawPayload),
            promptVersionId,
            sourceCallId: sessionId,
            persona: basePersona
          };
          const response = await fetch('/api/lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (response.ok) {
            toast.success('Lead captured & emailed!');
            incMetric('leadsCompleted');
            if (draft) addCompletedLead(draft as any);
            clearDraft();
            emit({ type: 'lead_tool_called' });
            // Rotate draft id for next lead
            setDraftId(crypto.randomUUID());
          } else {
            const error = await response.json();
            toast.error(`Failed to capture lead: ${error.error}`);
            throw new Error('record_error');
          }
          return;
        }
      }
    });
  };

  // Inner component consuming voice status (must be inside provider)
  function SessionUI() {
    const { status, sendSessionSettings } = useVoice();
    const connected = status.value === 'connected';
    const { state: convState, pendingPushBack, consumePushBack } = useConversationState({ enablePushBack: true });
    const [localSyntheticMessages, setLocalSyntheticMessages] = useState<string[]>([]);

    useEffect(() => {
      if (pendingPushBack) {
        const pb = consumePushBack();
        if (pb) {
          setLocalSyntheticMessages(msgs => [...msgs, pb.response]);
        }
      }
    }, [pendingPushBack, consumePushBack]);

    // Track latest voice settings in refs to satisfy lint rules while allowing reactive updates
  const latestVoiceId = useRef(voiceId);
  latestVoiceId.current = voiceId;
  const latestVoiceSpeed = useRef(voiceSpeed);
  latestVoiceSpeed.current = voiceSpeed;

    // Live apply voice speed when connected and slider changes (preserve selected voice id)
    useEffect(() => {
      if (!connected) return;
      const speed = latestVoiceSpeed.current;
      if (speed && typeof speed === 'number') {
        try {
          const vid = latestVoiceId.current;
          const voicePayload: any = { speed };
            if (vid && vid !== 'default') voicePayload.id = vid;
          sendSessionSettings({ voice: voicePayload } as any);
        } catch (e) {
          console.warn('Failed to apply live voice speed', e);
        }
      }
    }, [connected, sendSessionSettings]);

    // Apply voice change mid-call (include current speed if set)
    useEffect(() => {
      if (!connected) return;
      try {
        const vid = latestVoiceId.current;
        if (vid && vid !== 'default') {
          const speed = latestVoiceSpeed.current;
          const voicePayload: any = { id: vid };
          if (speed && typeof speed === 'number') voicePayload.speed = speed;
          sendSessionSettings({ voice: voicePayload } as any);
        }
      } catch (e) {
        console.warn('Failed to apply voice id change', e);
      }
    }, [connected, sendSessionSettings]);

    // Voice drift detection: if runtime selected voice diverges from baseline (initial) emit telemetry once
    useEffect(() => {
      if (!connected) return; // only care during active session
      if (baselineVoiceRef.current && latestVoiceId.current && baselineVoiceRef.current !== latestVoiceId.current) {
        emit({ type: 'voice_changed_runtime', from: baselineVoiceRef.current, to: latestVoiceId.current });
        baselineVoiceRef.current = latestVoiceId.current; // advance baseline to avoid repeat spam
      }
  }, [connected]);

    if (!connected) {
      // Mobile-first layout: scrollable settings, sticky bottom action bar
      return (
        <div className="min-h-screen w-full flex flex-col lg:items-center lg:justify-start px-4">
          {/* Desktop call area */}
          <div className="hidden lg:block w-full max-w-3xl mx-auto pt-10">
            <div className="flex items-start gap-4">
              <div className="flex flex-col gap-3">
                <CallButton
                  accessToken={accessToken}
                  persona={persona}
                  voiceId={voiceId}
                  voiceSpeed={voiceSpeed}
                  modelId={modelId}
                  onToolCall={handleToolCall}
                  configIdOption={settings.configId}
                  includeCodeSystemPrompt={settings.codeSystemPrompt.mode !== 'NONE'}
                />
                <input
                  type="email"
                  placeholder="Email to receive lead (optional)"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full max-w-sm rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          <div className="flex-1 w-full max-w-3xl mx-auto pt-6 pb-28 lg:pb-16 flex flex-col gap-6 overflow-y-auto">
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <PersonaToggle value={persona} onChange={setPersona} />
                  <InfoTooltip content="Change the persona tone / negotiation style." side="top" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <ModelSelect value={modelId} onChange={setModelId} />
                  <InfoTooltip content="Reasoning model backing the assistant." side="top" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <VoiceSelect value={voiceId} onChange={setVoiceId} />
                  <InfoTooltip content="Synthesis voice for responses." side="top" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <VoiceSpeedControl onChange={setVoiceSpeed} />
                  <InfoTooltip content="Speech rate for audio output." side="top" />
                </div>
              </div>
            </div>
            <AdvancedSessionConfig />
          </div>
          {/* Sticky mobile action bar */}
          <div className="fixed lg:hidden bottom-0 left-0 right-0 z-20 bg-neutral-950/85 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/70 border-t border-neutral-800">
            <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col items-center gap-3">
              <CallButton
                accessToken={accessToken}
                persona={persona}
                voiceId={voiceId}
                voiceSpeed={voiceSpeed}
                modelId={modelId}
                onToolCall={handleToolCall}
                configIdOption={settings.configId}
                includeCodeSystemPrompt={settings.codeSystemPrompt.mode !== 'NONE'}
              />
              <input
                type="email"
                placeholder="Email to receive lead (optional)"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full max-w-sm rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      );
    }

    // Connected session view
    return (
      <div className="flex flex-col h-screen w-full">
        <SessionTimers />
  <div className="flex-1 min-h-0 px-4 py-4 max-w-5xl w-full mx-auto flex flex-col gap-3">
          {convState.closingTriggered && (
            <div className="text-sm rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-300 px-3 py-2">
              Closing intent detected. You can wrap up or finalize the lead.
            </div>
          )}
          {localSyntheticMessages.map((m, i) => (
            <div key={i} className="text-xs rounded bg-muted/30 px-2 py-1 self-center max-w-md text-center">
              {m}
            </div>
          ))}
          <div className="flex justify-end gap-2 pr-2">
            {completedLeads.length > 0 && (
              <button
                onClick={() => {
                  emit({ type: 'recap_requested' });
                  const recap = generateRecapContent([...completedLeads, ...(draft ? [draft] : [])]);
                  setLocalSyntheticMessages(msgs => [...msgs, recap]);
                  emit({ type: 'recap_provided' });
                }}
                className="text-xs px-2 py-1 rounded bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 transition"
              >Recap Leads</button>
            )}
          </div>
          <div id="main-content" className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
            <div className="lg:col-span-2 min-h-0 flex flex-col">
              <Messages ref={ref} />
            </div>
            <div className="min-h-0 flex flex-col gap-4 overflow-y-auto pb-2">
              <NotesComponent callId={sessionId} />
              <SpecFileUpload />
            </div>
          </div>
        </div>
        <div className="border-t border-muted/20" />
        <Controls />
      </div>
    );
  }

  return (
    <VoiceProvider
      onMessage={() => {
        if (timeout.current) {
          window.clearTimeout(timeout.current);
        }
        timeout.current = window.setTimeout(() => {
          if (ref.current) {
            const scrollHeight = ref.current.scrollHeight;
            ref.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
          }
        }, 200);
      }}
      onError={(error) => {
        toast.error(error.message);
      }}
      onToolCall={async (message, send) => {
        const name = message.name;
        let args: any = {};
        try { args = message.parameters ? JSON.parse(message.parameters as unknown as string) : {}; } catch { args = {}; }
        try {
          await handleToolCall(name, args);
          return send.success(toolSuccess(name));
        } catch (e: any) {
          console.error('Tool call handler error:', e);
          return send.error({
            error: 'tool_error',
            code: 'LEAD_CAPTURE_FAILED',
            level: 'warn',
            content: toolError(name, e?.message || 'failed', 'LEAD_CAPTURE_FAILED'),
          });
        }
      }}
    >
      <SessionUI />
    </VoiceProvider>
  );
}

export default function TeleTami(props: { accessToken: string }) {
  return (
    <SettingsProvider>
      <TeleTamiInner {...props} />
    </SettingsProvider>
  );
}

// Collapsible advanced session configuration panel
function AdvancedSessionConfig() {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('tami:advPanel') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('tami:advPanel', open ? '1' : '0'); } catch { /* ignore */ }
  }, [open]);
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="group w-full flex items-center justify-between rounded-md border border-neutral-700/60 bg-neutral-900/70 dark:border-neutral-700 dark:bg-neutral-900 px-3 py-2 text-sm font-medium hover:bg-neutral-800/70 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-expanded={open}
        aria-controls="advanced-config-panel"
      >
        <span className="flex items-center gap-2">
          <ChevronDown className={cn('size-4 transition-transform', open ? 'rotate-180' : '')} />
          Session Config
        </span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{open ? 'Hide' : 'Show'}</span>
      </button>
      <div
        id="advanced-config-panel"
        className={cn('overflow-hidden transition-all', open ? 'mt-3 max-h-[600px] opacity-100' : 'max-h-0 opacity-0')}
        aria-hidden={!open}
      >
        <div className="rounded-md border border-neutral-700/60 dark:border-neutral-700 bg-neutral-900/60 dark:bg-neutral-900 p-4 flex flex-col gap-4 text-sm">
          <div className="flex items-center gap-2">
            <ConfigSelector />
            <InfoTooltip content="Select which backend configuration / prompt variant to use for this session." side="right" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configuration determines tool availability, model constraints, and certain prompt scaffolding features. Adjust only if you know which experimental profile to use.
          </p>
        </div>
      </div>
    </div>
  );
}