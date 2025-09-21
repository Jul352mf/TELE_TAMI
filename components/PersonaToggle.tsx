"use client";

import { Toggle } from "@/components/ui/toggle";
import { Select, SelectItem } from "@/components/ui/select";

interface PersonaToggleProps {
  value: "professional" | "seductive" | "unhinged" | "cynical";
  onChange: (persona: "professional" | "seductive" | "unhinged" | "cynical") => void;
}

export default function PersonaToggle({ value, onChange }: PersonaToggleProps) {
  return (
    <div className="flex items-end gap-3">
      <Select label="Persona" value={value} onValueChange={(v) => onChange(v as any)}>
        <SelectItem value="professional">Professional</SelectItem>
        <SelectItem value="seductive">Seductive</SelectItem>
        <SelectItem value="cynical">Cynical</SelectItem>
        <SelectItem value="unhinged">Unhinged</SelectItem>
      </Select>
    </div>
  );
}