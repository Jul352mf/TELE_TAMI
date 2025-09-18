"use client";

import { Select, SelectItem } from "@/components/ui/select";

type VoiceOption = { id: string; label: string };

export default function VoiceSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (voiceId: string) => void;
}) {
  const voices: VoiceOption[] = [
    { id: "default", label: "Current Default" },
    { id: "ee96fb5f-ec1a-4f41-a9ba-6d119e64c8fd", label: "Vince Douglas" },
    { id: "5bb7de05-c8fe-426a-8fcc-ba4fc4ce9f9c", label: "Ava Song" },
    { id: "96ee3964-5f3f-4a5a-be09-393e833aaf0e", label: "Imani Carter" },
    { id: "2c0e2c10-ac19-4aac-93d0-29c385d7364e", label: "Ghost (Unfinished Biz)" },
  ];

  return (
    <Select label="Voice" value={value} onValueChange={(v) => onChange(v)}>
      {voices.map(v => (
        <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
      ))}
    </Select>
  );
}
