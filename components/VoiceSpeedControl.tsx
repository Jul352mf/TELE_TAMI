"use client";

import { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Gauge } from "lucide-react";
import { cn } from "@/utils";

interface VoiceSpeedControlProps {
  value?: number; // optional controlled value
  defaultValue?: number; // default when uncontrolled
  onChange?: (speed: number) => void;
  disabled?: boolean;
  className?: string;
}

const STORAGE_KEY = 'tami-voice-speed';

export function VoiceSpeedControl({
  value,
  defaultValue = 1.0,
  onChange,
  disabled = false,
  className
}: VoiceSpeedControlProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);

  // Load persisted value on mount (uncontrolled only)
  useEffect(() => {
    if (isControlled) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!Number.isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
          setInternal(parseFloat(parsed.toFixed(1)));
        }
      }
    } catch { /* ignore */ }
  }, [isControlled]);

  const current = isControlled ? (value as number) : internal;

  // Persist & notify
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, current.toString()); } catch { /* ignore */ }
    onChange?.(current);
  }, [current, onChange]);

  const setSpeed = useCallback((s: number) => {
    if (!isControlled) setInternal(s);
    else onChange?.(s);
  }, [isControlled, onChange]);

  const label = current < 0.8 ? 'Slow' : current > 1.2 ? 'Fast' : 'Normal';

  const handleSlider = (vals: number[]) => {
    const v = Number(vals[0].toFixed(1));
    setSpeed(v);
  };

  return (
    <div className={cn('flex flex-col gap-1 min-w-[150px] w-full', className)}>
      <label className="text-[11px] font-medium text-muted-foreground tracking-wide flex items-center gap-1">
        <Gauge className="size-3.5 opacity-70" /> Voice Speed
        <span className="ml-auto text-[10px] text-muted-foreground">{current.toFixed(1)}x {label}</span>
      </label>
      <Slider
        value={[current]}
        min={0.5}
        max={2.0}
        step={0.1}
        onValueChange={handleSlider}
        aria-label="Voice speed"
        className="mt-1"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
        <span>0.5x</span>
        <span>1.0x</span>
        <span>2.0x</span>
      </div>
    </div>
  );
}

export default VoiceSpeedControl;
