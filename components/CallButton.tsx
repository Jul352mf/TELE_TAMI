"use client";

import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { buildSystemPrompt, detectOleMode, getPromptVersionId } from "@/lib/hume";
import { resolveStrategy } from '@/lib/strategyResolver';
import { getStrategyPromptModifications } from '@/lib/strategyHarness';
import { TriOption, resolveConfigId } from '@/lib/settings';
import { buildHumeToolsPayload } from "@/lib/toolRegistry";
import { normalizeModelId, ensureToolCapable } from "@/lib/models";
import { emit } from "@/utils/telemetry";
import { useState, useEffect } from "react";
// Draft handling moved to parent (TeleTami) for unified tool interception

interface CallButtonProps {
  accessToken: string;
  persona: "professional" | "seductive" | "unhinged" | "cynical";
  spicyMode: boolean;
  voiceId?: string;
  voiceSpeed?: number; // multiplier e.g. 0.5 - 2.0
  modelId?: string;
  onToolCall: (name: string, args: any) => Promise<void>;
  configIdOption?: TriOption<string>;
  includeCodeSystemPrompt?: boolean;
}

export default function CallButton({
  accessToken,
  persona,
  spicyMode,
  voiceId,
  voiceSpeed,
  onToolCall,
  modelId,
  configIdOption,
  includeCodeSystemPrompt = true,
}: CallButtonProps) {
  const { status, connect, messages, sendSessionSettings } = useVoice();
  const [isOleMode, setIsOleMode] = useState(false);

  // Monitor transcript for "Ole" detection
  useEffect(() => {
    const transcript = messages
      .filter(msg => msg.type === 'user_message')
      .map(msg => msg.message?.content || '')
      .join(' ');
    if (detectOleMode(transcript) && !isOleMode) {
      setIsOleMode(true);
      console.log('Ole mode activated!');
    }
  }, [messages, isOleMode]);

  const effectivePersona = spicyMode && persona === 'unhinged' ? 'unhinged' : persona;
  const chosenStrategy = resolveStrategy();
  const basePrompt = includeCodeSystemPrompt ? buildSystemPrompt(effectivePersona, isOleMode) : undefined;
  const strategyMods = chosenStrategy ? getStrategyPromptModifications(chosenStrategy) : [];
  const systemPrompt = basePrompt && strategyMods.length
    ? basePrompt + '\n\n' + strategyMods.map(m => `[[STRATEGY_MOD]] ${m}`).join('\n')
    : basePrompt;
  const resolvedEnvDefaults = process.env.NEXT_PUBLIC_HUME_CONFIG_ID || undefined;
  const configId = configIdOption ? resolveConfigId(configIdOption) : resolvedEnvDefaults;

  const handleConnect = () => {
    const tools = buildHumeToolsPayload(process.env.NEXT_PUBLIC_INCREMENTAL_LEADS === '1');
    const { id: resolvedModel, changed } = normalizeModelId(modelId);
    const { id: finalModel, forced } = !configId ? ensureToolCapable(resolvedModel) : { id: resolvedModel, forced: false };

    const sessionSettings = {
      type: 'session_settings' as const,
      systemPrompt: systemPrompt,
      tools,
      voice: (voiceId && voiceId !== 'default') || voiceSpeed ? {
        ...(voiceId && voiceId !== 'default' ? { id: voiceId } : {}),
        ...(voiceSpeed ? { speed: voiceSpeed } : {}),
      } : undefined,
      model: finalModel !== 'hume-evi-3' ? { id: finalModel } : undefined,
    };

    connect({
      auth: { type: 'accessToken', value: accessToken },
      configId,
      sessionSettings,
    })
      .then(() => {
        console.log('Connected with persona:', effectivePersona);
        console.log('Config ID:', configId || '(none)');
        console.log('Requested Model:', resolvedModel);
        console.log('Final Model Used:', finalModel, forced ? '(forced tool-capable fallback)' : '');
        console.log('System prompt length:', systemPrompt ? systemPrompt.length : 0);
        const pvid = getPromptVersionId();
        if (pvid) emit({ type: 'prompt_version', id: pvid });
  emit({ type: 'session_connected', model: finalModel, voice: voiceId || 'default' });
        if (changed) {
          console.warn(`Unsupported model '${modelId}' selected; fell back to 'hume-evi-3'`);
        }
        if (forced) {
          console.warn('Forced tool-capable model because no configId was supplied.');
        }
        if (systemPrompt && systemPrompt.includes('CONSENT LINE:')) emit({ type: 'consent_injected' });
        // Ensure settings apply early
        sendSessionSettings(sessionSettings);
      })
      .catch((err) => {
        console.error('Connect error', err);
        toast.error('Unable to start call');
      });
  };

  return (
    <div className="w-full flex justify-center py-4">
      {status.value !== 'connected' ? (
        <Button
          className="flex items-center gap-1.5 rounded-full px-8 py-4 text-lg shadow-md"
          onClick={handleConnect}
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