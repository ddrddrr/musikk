import { type LoudnessPreset } from "@/features/player/providers/loudnessPresetContext.ts";
import { Button } from "@/features/ui/button";
import { cn } from "@/lib/utils";

interface LoudnessPresetSelectorProps {
    value: LoudnessPreset;
    onChange: (preset: LoudnessPreset) => void;
    className?: string;
}

const PRESETS: { value: LoudnessPreset; label: string }[] = [
    { value: "quiet", label: "Q" },
    { value: "normal", label: "N" },
    { value: "loud", label: "L" },
];

export function LoudnessPresetSelector({ value, onChange, className }: LoudnessPresetSelectorProps) {
    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {PRESETS.map((p) => (
                <Button
                    key={p.value}
                    variant={value === p.value ? "default" : "ghost"}
                    size="icon"
                    className="size-7 text-xs"
                    onClick={() => onChange(p.value)}
                >
                    {p.label}
                </Button>
            ))}
        </div>
    );
}
