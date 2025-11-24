import { useAuth } from "@/hooks/useAuth.ts";
import { Button } from "@/modules/ui/button";

export function SettingsPage() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-red-600 flex items-center justify-center p-8">
            <Button
                onClick={logout}
                variant="ghost"
                size="lg"
                className="text-lg border-2 border-black"
            >
                Logout
            </Button>
        </div>
    );
}
