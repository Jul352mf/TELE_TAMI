"use client";
import { useEffect, useRef, useState } from 'react';
import { useVoice } from '@humeai/voice-react';
import { createConversationState, updateConversationState, getPushBackResponse, recordPushBackUsage, ConversationState } from '@/lib/conversationState';

interface UseConversationOpts {
  strategy?: 'A' | 'B' | 'C' | 'D' | 'E';
  enablePushBack?: boolean;
}

export function useConversationState(opts: UseConversationOpts = {}) {
  const { messages } = useVoice();
  const [state, setState] = useState<ConversationState>(() => createConversationState(opts.strategy));
  const lastProcessedRef = useRef<string | null>(null);
  const [pendingPushBack, setPendingPushBack] = useState<{ response: string; variantId: string } | null>(null);

  useEffect(() => {
    // Find new user messages since last processed
    const userMessages = messages.filter(m => m.type === 'user_message');
    if (!userMessages.length) return;
  const newest = userMessages[userMessages.length - 1];
  const newestKey = newest.receivedAt.toISOString();
  if (lastProcessedRef.current === newestKey) return;
  lastProcessedRef.current = newestKey;

    setState(prev => {
      const next = updateConversationState(prev, newest.message?.content || '');
      if (opts.enablePushBack && !next.closingTriggered) {
        const { response, variantId } = getPushBackResponse(next);
        if (response && variantId) {
          // Record usage and queue push-back
            const after = recordPushBackUsage(next, variantId);
            setPendingPushBack({ response, variantId });
            return after;
        }
      }
      return next;
    });
  }, [messages, opts.enablePushBack]);

  const consumePushBack = () => {
    const pb = pendingPushBack;
    setPendingPushBack(null);
    return pb;
  };

  return { state, pendingPushBack, consumePushBack };
}
