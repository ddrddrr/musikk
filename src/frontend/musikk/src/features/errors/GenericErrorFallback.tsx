import { Button } from "@/features/ui/button.tsx";

export function GenericErrorFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="max-w-md rounded-2xl bg-card p-10 text-center shadow-lg">
                <h1 className="mb-4 text-3xl font-bold text-foreground">Something went wrong</h1>
                <p className="mb-6 text-muted-foreground">An unexpected error occurred.</p>
                <Button asChild>
                    <a href="/">Go Home</a>
                </Button>
            </div>
        </div>
    );
}
