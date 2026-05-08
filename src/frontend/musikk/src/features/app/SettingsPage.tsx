import { BackButton } from "@/features/common/BackButton.tsx";
import { LoudnessPresetSelector } from "@/features/player/LoudnessPresetSelector.tsx";
import { LoudnessPresetContext } from "@/features/player/providers/loudnessPresetContext.ts";
import { Button } from "@/features/ui/button";
import { useAuth } from "@/hooks/useAuth.ts";
import { useContext } from "react";

export function SettingsPage() {
    const { logout } = useAuth();
    const { preset, setPreset } = useContext(LoudnessPresetContext);

    return (
        <div className="flex flex-1 flex-col items-center gap-8 bg-brand p-8">
            <BackButton />
            <h1 className="text-2xl font-bold">Settings</h1>

            <div className="flex w-full max-w-md flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-base font-medium">Keep songs at the same volume</span>
                        <span className="text-xs text-brand-foreground">
                            Songs can originally have different volume level. This makes them sound
                            the same, so you don't have to readjust the volume manually
                        </span>
                    </div>
                    <LoudnessPresetSelector value={preset} onChange={setPreset} />
                </div>

                <Button
                    onClick={logout}
                    variant="ghost"
                    size="lg"
                    className="border-2 border-foreground text-lg"
                >
                    Logout
                </Button>
            </div>
        </div>
    );
}
