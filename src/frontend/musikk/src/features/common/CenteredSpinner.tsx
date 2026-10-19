import { Spinner } from "@/features/ui/spinner.tsx";
import { cn } from "@/lib/utils.ts";

export function CenteredSpinner({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center justify-center p-8", className)}>
            <Spinner className="size-8" />
        </div>
    );
}
