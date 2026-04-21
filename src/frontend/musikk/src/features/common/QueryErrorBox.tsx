import { Button } from "@/features/ui/button.tsx";

type QueryErrorBoxProps = {
    message?: string;
    onRetry?: () => void;
};

export function QueryErrorBox({ message = "Something went wrong", onRetry }: QueryErrorBoxProps) {
    return (
        <div className="rounded-sm border-2 border-foreground bg-destructive p-4 text-destructive-foreground">
            <div className="text-sm font-medium">{message}</div>
            {onRetry && (
                <Button variant="brand" size="lg" onClick={onRetry}>
                    Retry
                </Button>
            )}
        </div>
    );
}
