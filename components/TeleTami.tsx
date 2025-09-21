"use client";

import { VoiceProvider, useVoice } from "@humeai/voice-react";
import { useState, ComponentRef, useRef, useEffect } from "react";
import { toast } from "sonner";
import PersonaToggle from "./PersonaToggle";
import CallButton from "./CallButton";
import Controls from "./Controls";
import Messages from "./Messages";
import { recordLeadTool, detectOleMode, getPromptVersionId, buildSystemPrompt } from "@/lib/hume";
import { toolSuccess, toolError } from "@/lib/toolRegistry";
import { useLeadDraft } from "@/components/LeadDraftProvider";
import { normalizeLeadPayload } from '@/utils/parsers';
import { inc as incMetric } from '@/utils/metrics';
import { emit, withToolTelemetry } from '@/utils/telemetry';
import VoiceSelect from "./VoiceSelect";
import SessionTimers from "./SessionTimers";
import ModelSelect from "./ModelSelect";

export default function TeleTami({ accessToken }: { accessToken: string }) {
  const [persona, setPersona] = useState<"professional" | "seductive" | "unhinged" | "cynical">("professional");
  const [spicyMode, setSpicyMode] = useState(false);
  const [voiceId, setVoiceId] = useState<string>("default");
  const [modelId, setModelId] = useState<string>("hume-evi-3");
  const [recipientEmail, setRecipientEmail] = useState<string>("");

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
  const configId = process.env['NEXT_PUBLIC_HUME_CONFIG_ID'];

  const { draft, patchDraft, startNewDraft, clearDraft } = useLeadDraft();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isOleMode, setIsOleMode] = useState(false);
  const incremental = process.env.NEXT_PUBLIC_INCREMENTAL_LEADS === '1';

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
        if (name === 'addOrUpdateLeadField') {
          const { field, value } = args || {};
            if (!draft) { startNewDraft(); incMetric('leadsStarted'); }
            patchDraft({ [field]: value });
          return;
        }
        if (name === 'confirmFieldValue') {
          const { field, value } = args || {};
          if (!draft) startNewDraft();
          patchDraft({ [field]: value });
          incMetric('confirmations');
          return;
        }
        if (name === 'getMissingFields') return;
        if (name === 'getDraftSummary') return;
        if (name === 'finalizeLeadDraft') {
          const missing = required.filter(f => !(draft as any)?.[f]);
          if (missing.length) {
            toast.error(`Cannot finalize, missing: ${missing.join(', ')}`);
            throw new Error('missing_required');
          }
          const rawPayload = {
            side: (draft as any)?.side,
            product: (draft as any)?.product,
            price: (draft as any)?.price,
            quantity: (draft as any)?.quantity,
            paymentTerms: (draft as any)?.paymentTerms,
            incoterm: (draft as any)?.incoterm,
            loadingLocation: (draft as any)?.loadingLocation,
            deliveryLocation: (draft as any)?.deliveryLocation,
            loadingCountry: (draft as any)?.loadingCountry,
            deliveryCountry: (draft as any)?.deliveryCountry,
            packaging: (draft as any)?.packaging,
            transportMode: (draft as any)?.transportMode,
            priceValidity: (draft as any)?.priceValidity,
            availabilityTime: (draft as any)?.availabilityTime,
            availabilityQty: (draft as any)?.availabilityQty,
            deliveryTimeframe: (draft as any)?.deliveryTimeframe,
            summary: (draft as any)?.summary,
            notes: (draft as any)?.notes,
            specialNotes: (draft as any)?.specialNotes,
            traderName: (draft as any)?.traderName,
          };
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
            clearDraft();
            emit({ type: 'lead_tool_called' });
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
    const { status } = useVoice();
    const connected = status.value === 'connected';

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
                  modelId={modelId}
                  onToolCall={handleToolCall}
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
            <div className="w-full flex flex-wrap justify-center gap-6">
              <PersonaToggle
                value={persona}
                onChange={setPersona}
                spicyMode={spicyMode}
                onSpicyModeChange={setSpicyMode}
              />
              <VoiceSelect value={voiceId} onChange={setVoiceId} />
              <ModelSelect value={modelId} onChange={setModelId} />
            </div>
          </div>
        </div>
      );
    }

    // Connected session view
    return (
      <div className="flex flex-col h-screen w-full">
        <SessionTimers />
        <div className="flex-1 min-h-0 px-4 py-4 max-w-5xl w-full mx-auto flex flex-col">
          <Messages ref={ref} />
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