"use client";

import { useEffect, useMemo, useRef } from "react";
import { useVoice } from "@humeai/voice-react";
import { toast } from "sonner";
import { emit } from "@/utils/telemetry";

export default function SessionTimers() {
  const { status, messages, disconnect } = useVoice();
  const connectedAtRef = useRef<number | null>(null);
  const warnedAt8Ref = useRef<boolean>(false);
  const inactivityWarnedRef = useRef<boolean>(false);

  const lastUserMsgAt = useMemo(() => {
    const last = [...messages]
      .reverse()
      .find((m) => m.type === "user_message");
    return last ? last.receivedAt.getTime() : null;
  }, [messages]);

  useEffect(() => {
    if (status.value === "connected") {
      if (!connectedAtRef.current) connectedAtRef.current = Date.now();
    } else {
      connectedAtRef.current = null;
      warnedAt8Ref.current = false;
      inactivityWarnedRef.current = false;
    }
  }, [status.value]);

  useEffect(() => {
    if (status.value !== "connected") return;
    const t = setInterval(() => {
      // Inactivity: 60s warn, 90s end
      if (lastUserMsgAt) {
        const idleMs = Date.now() - lastUserMsgAt;
        if (idleMs > 60_000 && !inactivityWarnedRef.current) {
          inactivityWarnedRef.current = true;
          toast.message("Still there?", { description: "No response for 60s." });
          emit({ type: 'inactivity_warning' });
        }
        if (idleMs > 90_000) {
          toast.warning("Ending call due to inactivity");
          emit({ type: 'inactivity_disconnected' });
          disconnect();
        }
      }

      // Duration: 8min warn, 10min end
      if (connectedAtRef.current) {
        const elapsed = Date.now() - connectedAtRef.current;
        if (elapsed > 8 * 60_000 && !warnedAt8Ref.current) {
          warnedAt8Ref.current = true;
          toast.message("Heads up", { description: "Approaching 10-minute limit." });
          emit({ type: 'duration_warning' });
        }
        if (elapsed > 10 * 60_000) {
          toast.warning("Session limit reached. Ending call.");
          emit({ type: 'duration_disconnected' });
          disconnect();
        }
      }
    }, 1000);
    return () => clearInterval(t);
  }, [status.value, lastUserMsgAt, disconnect]);

  return null;
}
