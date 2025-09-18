"use client";

import { VoiceProvider } from "@humeai/voice-react";
import { useState, ComponentRef, useRef } from "react";
import { toast } from "sonner";
import PersonaToggle from "./PersonaToggle";
import CallButton from "./CallButton";
import Controls from "./Controls";
import Messages from "./Messages";
import { recordLeadTool } from "@/lib/hume";

export default function TeleTami({
  accessToken,
}: {
  accessToken: string;
}) {
  const [persona, setPersona] = useState<"professional" | "seductive" | "unhinged" | "cynical">("professional");
  const [spicyMode, setSpicyMode] = useState(false);
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
        {/* Header with persona controls */}
        <div className="absolute top-4 right-4 z-10">
          <PersonaToggle
            value={persona}
            onChange={setPersona}
            spicyMode={spicyMode}
            onSpicyModeChange={setSpicyMode}
          />
        </div>

        <Messages ref={ref} />
        <Controls />
        <CallButton
          accessToken={accessToken}
          persona={persona}
          spicyMode={spicyMode}
          onToolCall={handleToolCall}
        />
      </VoiceProvider>
    </div>
  );
}