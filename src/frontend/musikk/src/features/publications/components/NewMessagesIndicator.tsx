import { Button } from "@/features/ui/button.tsx";
import { ArrowDown } from "lucide-react";

interface NewMessagesIndicatorProps {
    visible: boolean;
    onClick: () => void;
}

export function NewMessagesIndicator({ visible, onClick }: NewMessagesIndicatorProps) {
    if (!visible) return null;

    // kinda no better way than using absolute, since this has to float over the scroll areas...
    return (
        // left-1/2 and -translate-x-1/2 center the elem
        <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2">
            <Button variant="brand" size="sm" onClick={onClick} className="gap-1 shadow-md">
                <ArrowDown className="size-4" />
                New messages
            </Button>
        </div>
    );
}
