"use client";

import { Toggle } from "@/components/ui/toggle";
import { Select, SelectItem } from "@/components/ui/select";

interface PersonaToggleProps {
  value: "professional" | "seductive" | "unhinged" | "cynical";
  onChange: (persona: "professional" | "seductive" | "unhinged" | "cynical") => void;
  spicyMode?: boolean;
  onSpicyModeChange?: (enabled: boolean) => void;
}

export default function PersonaToggle({
  value,
  onChange,
  spicyMode = false,
  onSpicyModeChange,
}: PersonaToggleProps) {
  return (
    <div className="flex items-end gap-3 w-full">
      <Select value={value} onValueChange={(v) => onChange(v as any)} containerClassName="w-full min-w-0" className="min-w-0">
        <SelectItem value="professional">Professional</SelectItem>
        <SelectItem value="seductive">Seductive</SelectItem>
        <SelectItem value="cynical">Cynical</SelectItem>
        {spicyMode && <SelectItem value="unhinged">Unhinged</SelectItem>}
      </Select>
      {onSpicyModeChange && (
        <Toggle
          pressed={spicyMode}
          onPressedChange={onSpicyModeChange}
          variant="outline"
          className="h-9 px-3 text-xs font-medium"
        >
          🌶️ Spicy
        </Toggle>
      )}
    </div>
  );
}