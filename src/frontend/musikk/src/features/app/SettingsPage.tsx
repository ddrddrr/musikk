import { useAuth } from "@/features/auth/hooks/useAuth.ts";
import { BackButton } from "@/features/common/BackButton.tsx";
import { useLoudnessPreset } from "@/features/player/hooks/useLoudnessPreset.ts";
import { LoudnessPresetSelector } from "@/features/player/LoudnessPresetSelector.tsx";
import { Button } from "@/features/ui/button.tsx";
import { EditProfileDialog } from "@/features/user/components/EditProfileDialog.tsx";

export function SettingsPage() {
    const { logout } = useAuth();
    const { preset, setPreset } = useLoudnessPreset();

    return (
        <div className="flex flex-1 flex-col items-center gap-8 p-8">
            <BackButton />
            <h1 className="text-2xl font-bold">Settings</h1>

            <div className="flex w-full max-w-md flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-base font-medium">Keep songs at the same volume</span>
                        <span className="text-xs text-muted-foreground">
                            Songs can originally have different volume level. This makes them sound
                            the same, so you don't have to readjust the volume manually
                        </span>
                    </div>
                    <LoudnessPresetSelector value={preset} onChange={setPreset} />
                </div>

                <EditProfileDialog
                    trigger={
                        <Button
                            variant="ghost"
                            size="lg"
                            className="border-2 border-foreground text-lg"
                        >
                            Edit profile
                        </Button>
                    }
                />

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
