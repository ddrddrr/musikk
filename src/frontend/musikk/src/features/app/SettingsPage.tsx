import { Button } from "@/features/ui/button";
import { useAuth } from "@/hooks/useAuth.ts";

export function SettingsPage() {
    const { logout } = useAuth();

    return (
        <div className="flex min-h-screen items-center justify-center bg-brand p-8">
            <Button
                onClick={logout}
                variant="ghost"
                size="lg"
                className="border-2 border-foreground text-lg"
            >
                Logout
            </Button>
        </div>
    );
}
