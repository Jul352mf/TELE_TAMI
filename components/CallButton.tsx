"use client";

import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { buildSystemPrompt, detectOleMode, getPromptVersionId } from "@/lib/hume";
import { buildHumeToolsPayload } from "@/lib/toolRegistry";
import { normalizeModelId } from "@/lib/models";
import { emit } from "@/utils/telemetry";
import { useState, useEffect } from "react";
// Draft handling moved to parent (TeleTami) for unified tool interception

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
  // Session & draft now managed upstream
  
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

  const effectivePersona = spicyMode && persona === "unhinged" ? "unhinged" : persona;
  const systemPrompt = buildSystemPrompt(effectivePersona, isOleMode);
  const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID;

  return (
    <div className="w-full flex justify-center py-4">
      {status.value !== 'connected' ? (
        <Button
          className="flex items-center gap-1.5 rounded-full px-8 py-4 text-lg shadow-md"
          onClick={() => {
                const tools = buildHumeToolsPayload(process.env.NEXT_PUBLIC_INCREMENTAL_LEADS === '1');
                const { id: resolvedModel, changed } = normalizeModelId(modelId);

                const sessionSettings = {
                  type: "session_settings" as const,
                  systemPrompt: systemPrompt,
                  tools,
                  // If Hume supports setting voice via session settings, include it here
                  // This will be ignored by the backend if unsupported
                  voice: voiceId && voiceId !== "default" ? { id: voiceId } : undefined,
                  model: resolvedModel !== 'hume-evi-3' ? { id: resolvedModel } : undefined,
                };

                connect({
                  auth: { type: "accessToken", value: accessToken },
                  configId,
                  sessionSettings,
                })
                  .then(() => {
                    console.log("Connected with persona:", effectivePersona);
                    console.log("System prompt:", systemPrompt);
                    const pvid = getPromptVersionId();
                    if (pvid) {
                      console.log('Prompt version id:', pvid);
                      emit({ type: 'prompt_version', id: pvid });
                    }
                    console.log("Voice ID:", voiceId || "(default)");
                    if (changed) {
                      console.warn(`Unsupported model '${modelId}' selected; falling back to 'hume-evi-3'`);
                    }
                    console.log("Model ID:", resolvedModel);
                    emit({ type: 'session_connected', model: resolvedModel, voice: voiceId || 'default' });
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
          <Phone className="size-5 opacity-50 fill-current" strokeWidth={0} />
          <span>Call TAMI</span>
        </Button>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-green-500 animate-pulse" />
          Live session active
        </div>
      )}
    </div>
  );
}