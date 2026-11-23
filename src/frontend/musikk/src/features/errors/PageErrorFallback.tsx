import { Button } from "@/features/ui/button.tsx";
import { Link } from "react-router-dom";

export function PageErrorFallback() {
    return (
        <div className="flex flex-1 items-center justify-center px-4">
            <div className="max-w-md rounded-2xl bg-card p-10 text-center shadow-lg">
                <h2 className="mb-4 text-2xl font-bold text-foreground">Something went wrong</h2>
                <p className="mb-6 text-muted-foreground">This page failed to load.</p>
                <Button asChild>
                    <Link to="/">Go Home</Link>
                </Button>
            </div>
        </div>
    );
}
