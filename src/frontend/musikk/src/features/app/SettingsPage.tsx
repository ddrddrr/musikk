import { getErrorDetail } from "@/api/errorUtils.ts";
import { useAuth } from "@/features/auth/hooks/useAuth.ts";
import { BackButton } from "@/features/common/BackButton.tsx";
import { Button } from "@/features/ui/button.tsx";
import { Switch } from "@/features/ui/switch.tsx";
import { useMeUpdateMutation } from "@/features/user/api/mutations.ts";
import { EditProfileDialog } from "@/features/user/components/EditProfileDialog.tsx";
import { toast } from "sonner";

export function SettingsPage() {
    const { logout, user } = useAuth();
    const { mutate: updateMe } = useMeUpdateMutation();

    // the toast lives here and not in the hook, because the profile form shows its errors inline
    const setLoudnessNormalization = (isEnabled: boolean) => {
        updateMe(
            { loudness_normalization: isEnabled },
            {
                onError: (error) => {
                    toast.error(getErrorDetail(error, "Failed to save the setting"));
                },
            },
        );
    };

    return (
        <div className="flex flex-1 flex-col items-center gap-8 p-8">
            <BackButton />
            <h1 className="text-2xl font-bold">Settings</h1>

            <div className="flex w-full max-w-md flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span id="loudness-normalization-label" className="text-base font-medium">
                            Keep songs at the same volume
                        </span>
                        <span
                            id="loudness-normalization-description"
                            className="text-xs text-muted-foreground"
                        >
                            Songs can originally have different volume level. This makes them sound
                            the same, so you don&apos;t have to readjust the volume manually
                        </span>
                    </div>
                    <Switch
                        aria-labelledby="loudness-normalization-label"
                        aria-describedby="loudness-normalization-description"
                        checked={user?.loudness_normalization ?? true}
                        onCheckedChange={setLoudnessNormalization}
                    />
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
                    onClick={() => void logout()}
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
