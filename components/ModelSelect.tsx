"use client";
import { cn } from "@/utils";

interface ModelSelectProps {
  value: string;
  onChange: (v: string) => void;
}

export default function ModelSelect({ value, onChange }: ModelSelectProps) {
  return (
    <div className={cn("flex items-center gap-2 p-2 border rounded-full bg-card/50") }>
      <label className="text-sm opacity-70">Model</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none text-sm"
      >
        <option value="hume-evi-3">hume-evi-3</option>
        <option value="gpt-4o">gpt-4o</option>
        <option value="claude-3.5-sonnet">claude-3.5-sonnet</option>
        <option value="gemini-1.5-pro">gemini-1.5-pro</option>
      </select>
    </div>
  );
}
