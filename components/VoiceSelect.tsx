"use client";

type VoiceOption = {
  id: string;
  label: string;
};

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
  <div className="flex flex-col gap-2 min-w-[200px]">
      <label className="text-sm font-medium text-muted-foreground">Voice</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
      >
        {voices.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
    </div>
  );
}
