import { type LoudnessPreset } from "@/features/player/providers/loudnessPresetContext.ts";
import { Button } from "@/features/ui/button";
import { cn } from "@/lib/utils";

// TODO: move? kinda a player concern but from now on used only in settings
interface LoudnessPresetSelectorProps {
    value: LoudnessPreset;
    onChange: (preset: LoudnessPreset) => void;
    className?: string;
}

const PRESETS: { value: LoudnessPreset; label: string }[] = [
    { value: "off", label: "Off" },
    { value: "quiet", label: "Quiet" },
    { value: "normal", label: "Normal" },
    { value: "loud", label: "Loud" },
];

export function LoudnessPresetSelector({
    value,
    onChange,
    className,
}: LoudnessPresetSelectorProps) {
    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {PRESETS.map((p) => (
                <Button
                    key={p.value}
                    variant={value === p.value ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => onChange(p.value)}
                >
                    {p.label}
                </Button>
            ))}
        </div>
    );
}
