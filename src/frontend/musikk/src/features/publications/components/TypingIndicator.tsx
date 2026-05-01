import { Typer } from "@/features/publications/hooks/useTypingIndicator.ts";
import { cn } from "@/lib/utils.ts";

interface TypingIndicatorProps {
    typers: Typer[];
    className?: string;
}

const NAMED_LIMIT = 3;

function formatTypers(typers: Typer[]): string {
    if (typers.length > NAMED_LIMIT) {
        return `${typers.length} people are typing...`;
    }

    const names = typers.map((t) => t.displayName);
    if (names.length === 1) {
        return `${names[0]} is typing...`;
    }
    if (names.length === 2) {
        return `${names[0]} and ${names[1]} are typing...`;
    }
    return `${names[0]}, ${names[1]}, and ${names[2]} are typing...`;
}

export function TypingIndicator({ typers, className }: TypingIndicatorProps) {
    if (typers.length === 0) return null;

    return (
        <div className={cn("px-4 py-1 text-xs text-muted-foreground italic", className)}>
            {formatTypers(typers)}
        </div>
    );
}
