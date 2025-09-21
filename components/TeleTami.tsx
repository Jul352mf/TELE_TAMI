"use client";

import { VoiceProvider, useVoice } from "@humeai/voice-react";
import { useState, ComponentRef, useRef, useEffect } from "react";
import { toast } from "sonner";
import PersonaToggle from "./PersonaToggle";
import CallButton from "./CallButton";
import Controls from "./Controls";
import Messages from "./Messages";
import { getPromptVersionId, buildSystemPrompt } from "@/lib/hume";
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
import { useConversationState } from '@/hooks/useConversationState';
// Legacy slider kept for potential reuse; not used in new dropdown UX
// import VoiceSpeedSlider from './VoiceSpeedSlider';
import NotesComponent from './NotesComponent';
import SpecFileUpload from './SpecFileUpload';
import InfoTooltip from './InfoTooltip';
import { Slider } from './ui/slider';

function TeleTamiInner({ accessToken }: { accessToken: string }) {
  const [persona, setPersona] = useState<"professional" | "unhinged" | "cynical">("professional");
  const [voiceId, setVoiceId] = useState<string>("default");
  const [modelId, setModelId] = useState<string>("hume-evi-3");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);

  // Voice speed dropdown expanding slider
  const VoiceSpeedDropdown: React.FC<{ current: number; onChange: (v: number) => void }> = ({ current, onChange }) => {
    const [open, setOpen] = useState(false);
    const panelId = 'voice-speed-panel';
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return; 
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
      const onClick = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
      };
      window.addEventListener('keydown', onKey);
      window.addEventListener('mousedown', onClick);
      return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClick); };
    }, [open]);

    return ( 
  <div className="flex flex-col gap-1" ref={wrapperRef}>
        <button
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(o => !o)}
          className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground flex items-center justify-between hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
        >
            <span className="sr-only">Voice Speed</span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {current.toFixed(1)}x
            <svg aria-hidden="true" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </button>
        {open && (
          <div
            id={panelId}
            className="rounded-md border border-border bg-popover p-4 flex flex-col gap-4 shadow-lg animate-in fade-in"
          >
            {/* Radix slider alternative: simple custom track for now replaced soon */}
            <div className="flex items-center gap-3 select-none">
              <Slider
                min={0.5}
                max={2.0}
                step={0.1}
                value={[current]}
                onValueChange={(v) => onChange(v[0])}
                aria-label="Voice speed"
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>0.5x</span>
              <span>{current.toFixed(1)}x</span>
              <span>2.0x</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const AdvancedSessionConfig: React.FC<{ label: string }> = ({ label }) => {
    const [open, setOpen] = useState(false);
    return (
  <div className="border border-border rounded-md bg-card transition-colors">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-foreground/80 bg-card hover:bg-accent/60 focus:outline-none focus:ring-2 focus:ring-ring rounded-md transition-colors"
        >
          <span>{label}</span>
          <span className="text-xs text-neutral-500">{open ? 'Hide' : 'Show'}</span>
        </button>
        {open && (
          <div className="px-4 pb-4 pt-2 flex flex-col gap-3 text-sm">
            <ConfigSelector />
            <p className="text-[11px] text-muted-foreground leading-relaxed">Select or layer configuration options. More tuning controls (sampling, prompt variants) will appear here later.</p>
          </div>
        )}
      </div>
    );
  };

  // Restore persisted settings (legacy spicyMode ignored)
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

    // Connect-time lock: no dynamic reapplication of persona/model/voice/voiceSpeed post-connect

    if (!connected) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background px-6 transition-colors">
          <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-8">
            {/* Call Button */}
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
            {/* Settings Grid (match reference: grid sm:2 cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <div className="flex flex-col gap-0">
                <label className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">Persona<InfoTooltip content="Tone & negotiation style." side="top" /></label>
                <div className="w-full opacity-100">
                  <PersonaToggle value={persona} onChange={setPersona} disabled={status.value === 'connecting' || status.value === 'connected'} />
                </div>
              </div>
              <div className="flex flex-col gap-0">
                <label className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">Model<InfoTooltip content="Reasoning model." side="top" /></label>
                <div className="w-full">
                  <ModelSelect value={modelId} onChange={setModelId} disabled={status.value === 'connecting' || status.value === 'connected'} />
                </div>
              </div>
              <div className="flex flex-col gap-0">
                <label className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">Voice<InfoTooltip content="Synthesis voice." side="top" /></label>
                <div className="w-full">
                  <VoiceSelect value={voiceId} onChange={setVoiceId} disabled={status.value === 'connecting' || status.value === 'connected'} />
                </div>
              </div>
              <div className="flex flex-col gap-0">
                <label className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">Voice Speed<InfoTooltip content="Adjust spoken rate" side="top" /></label>
                <div className={status.value === 'connected' ? 'opacity-60 pointer-events-none' : ''}>
                  <VoiceSpeedDropdown current={voiceSpeed} onChange={setVoiceSpeed} />
                </div>
              </div>
            </div>
            {/* Session Configuration */}
            <div className="w-full mt-2">
              <AdvancedSessionConfig label="Session Configuration" />
            </div>
            {/* Email Field (moved below session config) */}
            <div className="w-full flex flex-col items-center gap-2">
              <input
                type="email"
                placeholder="Email to receive lead (optional)"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-input px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground leading-tight">We’ll send captured lead details to this address (optional).</p>
            </div>
          </div>
        </div>
      );
    }

    // Connected session view
    return (
      <div className="flex flex-col h-screen w-full bg-background text-foreground transition-colors">
        <SessionTimers />
        <div className="flex-1 min-h-0 px-4 py-4 max-w-5xl w-full mx-auto flex flex-col gap-3">
          {convState.closingTriggered && (
            <div className="text-sm rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-300 px-3 py-2 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200">
              Closing intent detected. You can wrap up or finalize the lead.
            </div>
          )}
          {localSyntheticMessages.map((m, i) => (
            <div key={i} className="text-xs rounded bg-muted px-2 py-1 self-center max-w-md text-center text-muted-foreground/90">{m}</div>
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
                className="text-xs px-2 py-1 rounded bg-secondary border border-border hover:bg-secondary/80 transition-colors"
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