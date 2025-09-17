"use client";

import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { recordLeadTool, buildSystemPrompt, detectOleMode } from "@/lib/hume";
import { useState, useEffect } from "react";

interface CallButtonProps {
  accessToken: string;
  persona: "professional" | "seductive" | "unhinged";
  spicyMode: boolean;
}

export default function CallButton({
  accessToken,
  persona,
  spicyMode,
}: CallButtonProps) {
  const { status, connect, messages } = useVoice();
  const [isOleMode, setIsOleMode] = useState(false);
  
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

  const effectivePersona = spicyMode && persona === "unhinged" ? "unhinged" : persona;
  const systemPrompt = buildSystemPrompt(effectivePersona, isOleMode);

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
                connect({
                  auth: { type: "accessToken", value: accessToken },
                  // Add system prompt and tools configuration here when implementing
                  // For now, we'll use the basic connection
                })
                  .then(() => {
                    console.log("Connected with persona:", effectivePersona);
                    console.log("System prompt:", systemPrompt);
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