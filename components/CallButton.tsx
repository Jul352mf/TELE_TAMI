"use client";

import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { recordLeadTool, buildSystemPrompt, detectOleMode } from "@/lib/hume";
import { emit } from "@/utils/telemetry";
import { useState, useEffect } from "react";

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
    if (name === "recordLead") {
      try {
        const payload = {
          ...args,
          persona: isOleMode ? "interview" : persona,
          traderHint: isOleMode ? "Ole detected" : null,
          sourceCallId: sessionId,
        };
        
        await onToolCall(name, payload);
      } catch (error) {
        console.error("Error in tool call handler:", error);
        toast.error("Failed to process tool call");
      }
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
                const sessionSettings = {
                  type: "session_settings" as const,
                  systemPrompt: systemPrompt,
                  tools: [
                    {
                      type: "function" as const,
                      name: recordLeadTool.name,
                      description: recordLeadTool.description,
                      parameters: JSON.stringify(recordLeadTool.parameters),
                    },
                  ],
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