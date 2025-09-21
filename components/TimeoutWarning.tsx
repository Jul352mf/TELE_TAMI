"use client";

import { useState, useEffect } from "react";
import { useVoice } from "@humeai/voice-react";
import { motion, AnimatePresence } from "motion/react";

interface TimeoutWarningProps {
  connectedAt: number | null;
  lastUserMsgAt: number | null;
}

export default function TimeoutWarning({ connectedAt, lastUserMsgAt }: TimeoutWarningProps) {
  const { status } = useVoice();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [warningType, setWarningType] = useState<'inactivity' | 'duration' | null>(null);

  useEffect(() => {
    if (status.value !== "connected") {
      setTimeLeft(null);
      setWarningType(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      
      // Check inactivity warning (show 30s before 90s cutoff)
      if (lastUserMsgAt) {
        const idleMs = now - lastUserMsgAt;
        const inactivityWarningThreshold = 60_000; // Show warning at 60s
        const inactivityCutoff = 90_000; // End at 90s
        
        if (idleMs >= inactivityWarningThreshold && idleMs < inactivityCutoff) {
          const remaining = Math.ceil((inactivityCutoff - idleMs) / 1000);
          setTimeLeft(remaining);
          setWarningType('inactivity');
          return;
        }
      }

      // Check duration warning (show 60s before 10min cutoff)  
      if (connectedAt) {
        const elapsed = now - connectedAt;
        const durationWarningThreshold = 9 * 60_000; // Show warning at 9min
        const durationCutoff = 10 * 60_000; // End at 10min
        
        if (elapsed >= durationWarningThreshold && elapsed < durationCutoff) {
          const remaining = Math.ceil((durationCutoff - elapsed) / 1000);
          setTimeLeft(remaining);
          setWarningType('duration');
          return;
        }
      }

      // No warning needed
      setTimeLeft(null);
      setWarningType(null);
    }, 1000);

    return () => clearInterval(interval);
  }, [status.value, connectedAt, lastUserMsgAt]);

  if (!timeLeft || !warningType) return null;

  const getMessage = () => {
    if (warningType === 'inactivity') {
      return {
        title: "Still there?",
        subtitle: "Call will end due to inactivity in",
        color: "text-amber-600 dark:text-amber-400"
      };
    } else {
      return {
        title: "Session ending soon",
        subtitle: "Call will end in",
        color: "text-red-600 dark:text-red-400"
      };
    }
  };

  const message = getMessage();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className={`
          bg-white dark:bg-gray-800 border-2 border-current rounded-lg shadow-lg
          px-4 py-3 flex items-center space-x-3 min-w-72
          ${message.color}
        `}>
          <div className="flex-shrink-0">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-current rounded-full"
            />
          </div>
          
          <div className="flex-1">
            <p className="font-semibold text-sm">{message.title}</p>
            <p className="text-xs opacity-80">{message.subtitle}</p>
          </div>
          
          <div className="flex-shrink-0">
            <motion.div
              key={timeLeft}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold"
            >
              {timeLeft}s
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}