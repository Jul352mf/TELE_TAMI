"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";

interface PersonaToggleProps {
  value: "professional" | "seductive" | "unhinged";
  onChange: (persona: "professional" | "seductive" | "unhinged") => void;
  spicyMode: boolean;
  onSpicyModeChange: (enabled: boolean) => void;
}

export default function PersonaToggle({
  value,
  onChange,
  spicyMode,
  onSpicyModeChange,
}: PersonaToggleProps) {
  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          Persona
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as "professional" | "seductive" | "unhinged")}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
        >
          <option value="professional">Professional</option>
          <option value="seductive">Seductive</option>
          {spicyMode && <option value="unhinged">Unhinged</option>}
        </select>
      </div>
      
      <div className="flex items-center gap-2">
        <Toggle
          pressed={spicyMode}
          onPressedChange={onSpicyModeChange}
          className="text-sm"
        >
          🌶️ Spicy Mode
        </Toggle>
      </div>
    </div>
  );
}