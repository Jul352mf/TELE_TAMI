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
import { useConversationState } from '@/hooks/useConversationState';
import VoiceSpeedSlider from './VoiceSpeedSlider';
import NotesComponent from './NotesComponent';
import SpecFileUpload from './SpecFileUpload';
import InfoTooltip from './InfoTooltip';

function TeleTamiInner({ accessToken }: { accessToken: string }) {
  const [persona, setPersona] = useState<"professional" | "seductive" | "unhinged" | "cynical">("professional");
  const [spicyMode, setSpicyMode] = useState(false);
  const [voiceId, setVoiceId] = useState<string>("default");
  const [modelId, setModelId] = useState<string>("hume-evi-3");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [voiceSpeed, setVoiceSpeed] = useState<number | undefined>(undefined);

  // Restore persisted settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tami:settings:v1');
      if (stored) {
        const { persona, spicyMode, voiceId, modelId } = JSON.parse(stored);
        if (persona) setPersona(persona);
        if (typeof spicyMode === 'boolean') setSpicyMode(spicyMode);
        if (voiceId) setVoiceId(voiceId);
        if (modelId) setModelId(modelId);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist settings debounced
  useEffect(() => {
    const t = window.setTimeout(() => {
      try { localStorage.setItem('tami:settings:v1', JSON.stringify({ persona, spicyMode, voiceId, modelId })); } catch { /* ignore */ }
    }, 250);
    return () => window.clearTimeout(t);
  }, [persona, spicyMode, voiceId, modelId]);
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

    // Live apply voice speed when connected and slider changes
    useEffect(() => {
      if (connected && voiceSpeed && typeof voiceSpeed === 'number') {
        try {
          // Library typing may not expose partial voice updates; cast to any
          sendSessionSettings({ voice: { speed: voiceSpeed } } as any);
        } catch (e) {
          console.warn('Failed to apply live voice speed', e);
        }
      }
    }, [connected, voiceSpeed, sendSessionSettings]);

    if (!connected) {
      // Pre-call minimal centered layout: two vertical sections
      return (
        <div className="min-h-screen w-full flex items-center justify-center px-4">
          <div className="w-full max-w-3xl flex flex-col items-center gap-10">
            {/* Top section: Call button */}
            <div className="w-full flex justify-center">
              <div className="flex flex-col items-center gap-3 w-full">
                <CallButton
                  accessToken={accessToken}
                  persona={persona}
                  spicyMode={spicyMode}
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
            {/* Bottom section: horizontal settings row */}
            <div className="w-full flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <ConfigSelector />
                <InfoTooltip content="Select which backend configuration / prompt variant to use for this session." side="right" />
              </div>
              <div className="w-full flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-2">
                  <PersonaToggle
                    value={persona}
                    onChange={setPersona}
                    spicyMode={spicyMode}
                    onSpicyModeChange={setSpicyMode}
                  />
                  <InfoTooltip content="Change the persona tone. This affects wording and negotiation style." side="top" />
                </div>
                <div className="flex items-center gap-2">
                  <VoiceSelect value={voiceId} onChange={setVoiceId} />
                  <InfoTooltip content="Choose the synthesis voice used for responses." side="top" />
                </div>
                <div className="flex items-center gap-2">
                  <ModelSelect value={modelId} onChange={setModelId} />
                  <InfoTooltip content="Select the reasoning model powering the assistant." side="top" />
                </div>
                <div className="min-w-[260px] max-w-sm flex items-center gap-2">
                  <VoiceSpeedSlider onSpeedChange={setVoiceSpeed} />
                  <InfoTooltip content="Adjust real-time speech rate. Will apply on next utterance." side="top" />
                </div>
              </div>
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