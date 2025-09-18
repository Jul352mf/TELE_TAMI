"use client";

import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { recordLeadTool, buildSystemPrompt, detectOleMode, addOrUpdateLeadFieldTool, finalizeLeadDraftTool, getMissingFieldsTool, getDraftSummaryTool, confirmFieldValueTool } from "@/lib/hume";
import { emit } from "@/utils/telemetry";
import { useState, useEffect } from "react";
import { useLeadDraft } from "@/components/LeadDraftProvider";

interface CallButtonProps {
  accessToken: string;
  persona: "professional" | "seductive" | "unhinged" | "cynical";
  spicyMode: boolean;
  voiceId?: string;
  modelId?: string;
  onToolCall: (name: string, args: any) => Promise<void>;
}

export default function CallButton({
  accessToken,
  persona,
  spicyMode,
  voiceId,
  onToolCall,
  modelId,
}: CallButtonProps) {
  const { status, connect, messages, sendSessionSettings } = useVoice();
  const [isOleMode, setIsOleMode] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const { draft, patchDraft, startNewDraft, clearDraft } = useLeadDraft();
  
  // Monitor transcript for "Ole" detection
  useEffect(() => {
    const transcript = messages
      .filter(msg => msg.type === "user_message")
      .map(msg => msg.message?.content || "")
      .join(" ");
    
    if (detectOleMode(transcript) && !isOleMode) {
      setIsOleMode(true);
      console.log("Ole mode activated!");
    }
  }, [messages, isOleMode]);

  const handleToolCall = async (name: string, args: any) => {
    try {
      if (name === "recordLead") {
        const payload = {
          ...args,
          persona: isOleMode ? "interview" : persona,
          traderHint: isOleMode ? "Ole detected" : null,
          sourceCallId: sessionId,
        };
        await onToolCall(name, payload);
        return;
      }
      if (process.env.NEXT_PUBLIC_INCREMENTAL_LEADS === '1') {
        if (name === 'addOrUpdateLeadField') {
          const { field, value } = args || {};
            if (!draft) startNewDraft();
            patchDraft({ [field]: value });
          return;
        }
        if (name === 'confirmFieldValue') {
          // Currently same as update; could mark confirmation metadata later
          const { field, value } = args || {};
          if (!draft) startNewDraft();
          patchDraft({ [field]: value });
          return;
        }
        if (name === 'getMissingFields') {
          // No-op: logic resolved in model; could send tool response later
          return;
        }
        if (name === 'getDraftSummary') {
          return; // summarization handled by model conversationally
        }
        if (name === 'finalizeLeadDraft') {
          // Validate required fields present before calling recordLead
          const required = ['side','product','price','quantity','paymentTerms','incoterm'];
          const missing = required.filter(f => !(draft as any)?.[f]);
          if (missing.length) {
            toast.error(`Cannot finalize, missing: ${missing.join(', ')}`);
            return;
          }
          // Synthesize payload shaped like recordLead expects (best-effort)
          const payload = {
            side: (draft as any)?.side,
            product: (draft as any)?.product,
            price: { amount: (draft as any)?.price?.amount || (draft as any)?.price, currency: 'USD', per: 'mt' },
            quantity: { amount: (draft as any)?.quantity?.amount || (draft as any)?.quantity, unit: 'mt' },
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
          await onToolCall('recordLead', payload);
          clearDraft();
          return;
        }
      }
    } catch (error) {
      console.error("Error in tool call handler:", error);
      toast.error("Failed to process tool call");
    }
  };

  const effectivePersona = spicyMode && persona === "unhinged" ? "unhinged" : persona;
  const systemPrompt = buildSystemPrompt(effectivePersona, isOleMode);
  const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID;

  return (
    <AnimatePresence>
      {status.value !== "connected" ? (
        <motion.div
          className="fixed inset-0 p-4 flex items-center justify-center bg-background"
          initial="initial"
          animate="enter"
          exit="exit"
          variants={{
            initial: { opacity: 0 },
            enter: { opacity: 1 },
            exit: { opacity: 0 },
          }}
        >
          <motion.div
            variants={{
              initial: { scale: 0.5 },
              enter: { scale: 1 },
              exit: { scale: 0.5 },
            }}
          >
            <Button
              className="z-50 flex items-center gap-1.5 rounded-full px-8 py-4 text-lg shadow-lg"
              onClick={() => {
                const tools: any[] = [
                  {
                    type: "function" as const,
                    name: recordLeadTool.name,
                    description: recordLeadTool.description,
                    parameters: JSON.stringify(recordLeadTool.parameters),
                  },
                ];
                if (process.env.NEXT_PUBLIC_INCREMENTAL_LEADS === '1') {
                  tools.push(
                    {
                      type: 'function',
                      name: addOrUpdateLeadFieldTool.name,
                      description: addOrUpdateLeadFieldTool.description,
                      parameters: JSON.stringify(addOrUpdateLeadFieldTool.parameters)
                    },
                    {
                      type: 'function',
                      name: finalizeLeadDraftTool.name,
                      description: finalizeLeadDraftTool.description,
                      parameters: JSON.stringify(finalizeLeadDraftTool.parameters)
                    },
                    {
                      type: 'function',
                      name: getMissingFieldsTool.name,
                      description: getMissingFieldsTool.description,
                      parameters: JSON.stringify(getMissingFieldsTool.parameters)
                    },
                    {
                      type: 'function',
                      name: getDraftSummaryTool.name,
                      description: getDraftSummaryTool.description,
                      parameters: JSON.stringify(getDraftSummaryTool.parameters)
                    },
                    {
                      type: 'function',
                      name: confirmFieldValueTool.name,
                      description: confirmFieldValueTool.description,
                      parameters: JSON.stringify(confirmFieldValueTool.parameters)
                    }
                  );
                }

                const sessionSettings = {
                  type: "session_settings" as const,
                  systemPrompt: systemPrompt,
                  tools,
                  // If Hume supports setting voice via session settings, include it here
                  // This will be ignored by the backend if unsupported
                  voice: voiceId && voiceId !== "default" ? { id: voiceId } : undefined,
                  model: modelId && modelId !== "hume-evi-3" ? { id: modelId } : undefined,
                };

                connect({
                  auth: { type: "accessToken", value: accessToken },
                  configId,
                  sessionSettings,
                })
                  .then(() => {
                    console.log("Connected with persona:", effectivePersona);
                    console.log("System prompt:", systemPrompt);
                    console.log("Voice ID:", voiceId || "(default)");
                    console.log("Model ID:", modelId || "hume-evi-3");
                    emit({ type: 'session_connected', model: modelId || 'hume-evi-3', voice: voiceId || 'default' });
                    if (systemPrompt.includes('CONSENT LINE:')) {
                      emit({ type: 'consent_injected' });
                    }
                    // Re-send session settings to ensure they apply before any initial response
                    sendSessionSettings(sessionSettings);
                  })
                  .catch(() => {
                    toast.error("Unable to start call");
                  });
              }}
            >
              <Phone
                className="size-5 opacity-50 fill-current"
                strokeWidth={0}
              />
              <span>Call TAMI</span>
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}