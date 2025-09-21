"use client";
import { Select, SelectItem } from "@/components/ui/select";

interface ModelSelectProps { value: string; onChange: (v: string) => void }

export default function ModelSelect({ value, onChange }: ModelSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v)}>
      <SelectItem value="hume-evi-3">hume-evi-3</SelectItem>
      <SelectItem value="gpt-4o">gpt-4o</SelectItem>
  <SelectItem value="gpt-5">gpt-5</SelectItem>
      <SelectItem value="claude-3.5-sonnet">claude-3.5-sonnet</SelectItem>
      <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
    </Select>
  );
}
