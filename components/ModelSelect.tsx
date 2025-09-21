"use client";
import { Select, SelectItem } from "@/components/ui/select";

interface ModelSelectProps { value: string; onChange: (v: string) => void; disabled?: boolean }

export default function ModelSelect({ value, onChange, disabled = false }: ModelSelectProps) {
  return (
    <Select disabled={disabled} value={value} onValueChange={(v) => onChange(v)}>
      <SelectItem value="hume-evi-3">hume-evi-3 (EVI)</SelectItem>
      <SelectItem value="gpt-5">gpt-5</SelectItem>
      <SelectItem value="gpt-5-mini">gpt-5-mini</SelectItem>
      <SelectItem value="gpt-5-nano">gpt-5-nano</SelectItem>
      <SelectItem value="claude-sonnet-4-20250514">claude-sonnet-4-20250514</SelectItem>
      <SelectItem value="gpt-4.1">gpt-4.1</SelectItem>
      <SelectItem value="gemini-2.5-flash">gemini-2.5-flash</SelectItem>
      <SelectItem value="moonshotai/kimi-k2-instruct">moonshotai/kimi-k2-instruct</SelectItem>
      <SelectItem value="qwen-3-235b-a22b-instruct-2507">qwen-3-235b-a22b-instruct-2507</SelectItem>
      <SelectItem value="claude-3-7-sonnet-latest">claude-3-7-sonnet-latest</SelectItem>
      <SelectItem value="gpt-4o">gpt-4o</SelectItem>
      <SelectItem value="gpt-oss-120b">gpt-oss-120b</SelectItem>
      <SelectItem value="claude-3-5-haiku-latest">claude-3-5-haiku-latest</SelectItem>
      <SelectItem value="claude-3-haiku-20240307">claude-3-haiku-20240307</SelectItem>
      <SelectItem value="us.anthropic.claude-3-5-haiku-20241022-v1:0">anthropic haiku 20241022 (us)</SelectItem>
      <SelectItem value="us.anthropic.claude-3-haiku-20240307-v1:0">anthropic haiku 20240307 (us)</SelectItem>
      <SelectItem value="gemini-2.0-flash">gemini-2.0-flash</SelectItem>
      <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
      <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
    </Select>
  );
}
