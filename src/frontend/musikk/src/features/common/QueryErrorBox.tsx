import { Button } from "@/features/ui/button.tsx";

type QueryErrorBoxProps = {
    message?: string;
    onRetry?: () => void;
};

export function QueryErrorBox({
    message = "Something went wrong",
    onRetry,
}: QueryErrorBoxProps) {
    return (
        <div className="rounded-sm border-2 border-black bg-red-600 p-4 text-white">
            <div className="text-sm font-medium">{message}</div>
            {onRetry && (
                <Button variant="brand" size="lg" onClick={onRetry}>
                    Retry
                </Button>
            )}
        </div>
    );
}
