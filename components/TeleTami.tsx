"use client";

import { VoiceProvider } from "@humeai/voice-react";
import { useState, ComponentRef, useRef, useEffect } from "react";
import { toast } from "sonner";
import PersonaToggle from "./PersonaToggle";
import CallButton from "./CallButton";
import Controls from "./Controls";
import Messages from "./Messages";
import { recordLeadTool } from "@/lib/hume";
import VoiceSelect from "./VoiceSelect";
import SessionTimers from "./SessionTimers";
import ModelSelect from "./ModelSelect";

export default function TeleTami({
  accessToken,
}: {
  accessToken: string;
}) {
  const [persona, setPersona] = useState<"professional" | "seductive" | "unhinged" | "cynical">("professional");
  const [spicyMode, setSpicyMode] = useState(false);
  const [voiceId, setVoiceId] = useState<string>("default");
  const [modelId, setModelId] = useState<string>("hume-evi-3");

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

  // Handle tool calls from EVI
  const handleToolCall = async (name: string, args: any) => {
    if (name === "recordLead") {
      try {
        const payload = {
          ...args,
          persona: persona,
          traderHint: null, // Will be set by Ole detection logic
        };
        
        const response = await fetch("/api/lead", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        
        if (response.ok) {
          toast.success("Lead captured & emailed!");
        } else {
          const error = await response.json();
          toast.error(`Failed to capture lead: ${error.error}`);
        }
      } catch (error) {
        console.error("Error submitting lead:", error);
        toast.error("Failed to submit lead");
      }
    }
  };

  return (
    <div className="relative grow flex flex-col mx-auto w-full overflow-hidden h-[0px]">
      <VoiceProvider
        onMessage={() => {
          if (timeout.current) {
            window.clearTimeout(timeout.current);
          }

          timeout.current = window.setTimeout(() => {
            if (ref.current) {
              const scrollHeight = ref.current.scrollHeight;

              ref.current.scrollTo({
                top: scrollHeight,
                behavior: "smooth",
              });
            }
          }, 200);
        }}
        onError={(error) => {
          toast.error(error.message);
        }}
        onToolCall={async (message, send) => {
          try {
            const name = message.name;
            let args: any = {};
            try {
              args = message.parameters ? JSON.parse(message.parameters as unknown as string) : {};
            } catch {
              args = {};
            }
            await handleToolCall(name, args);
            return send.success(JSON.stringify({ ok: true }));
          } catch (e: any) {
            console.error("Tool call handler error:", e);
            return send.error({
              error: "tool_error",
              code: "LEAD_CAPTURE_FAILED",
              level: "warn",
              content: e?.message || "failed",
            });
          }
        }}
      >
        <SessionTimers />
  <div className="pt-6 md:pt-10" />
  <Messages ref={ref} />
        <Controls />
        {/* Settings cluster below call area: horizontal on md+, vertical on mobile */}
        <div className="w-full flex justify-center py-4 mt-2 md:mt-0">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch md:items-center max-w-4xl mx-auto px-4">
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
        <CallButton
          accessToken={accessToken}
          persona={persona}
          spicyMode={spicyMode}
          voiceId={voiceId}
          modelId={modelId}
          onToolCall={handleToolCall}
        />
      </VoiceProvider>
    </div>
  );
}