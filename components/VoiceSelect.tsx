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
    { id: "default", label: "Default" },
    // Add your Hume voice IDs/names here if available
    // { id: "voice_ava", label: "Ava" },
    // { id: "voice_liam", label: "Liam" },
  ];

  return (
    <div className="flex flex-col gap-2">
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
