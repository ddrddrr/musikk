import { Button } from "@/features/ui/button.tsx";
import { ArrowUp } from "lucide-react";

type LoadNewerButtonProps = {
    hasNewerPosts: boolean;
    onLoadNewer: () => void;
};

export function LoadNewerButton({ hasNewerPosts, onLoadNewer }: LoadNewerButtonProps) {
    if (!hasNewerPosts) return null;

    return (
        <Button variant="brand" onClick={onLoadNewer} className="gap-1">
            <ArrowUp className="size-4" />
            Load newer
        </Button>
    );
}
