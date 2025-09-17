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
  const [persona, setPersona] = useState<"professional" | "seductive" | "unhinged">("professional");
  const [spicyMode, setSpicyMode] = useState(false);
  const timeout = useRef<number | null>(null);
  const ref = useRef<ComponentRef<typeof Messages> | null>(null);

  // Optional: use configId from environment variable
  const configId = process.env['NEXT_PUBLIC_HUME_CONFIG_ID'];

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
        />
      </VoiceProvider>
    </div>
  );
}