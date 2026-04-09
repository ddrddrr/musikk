import { Spinner } from "@/features/ui/spinner";
import { Button } from "@/features/ui/button.tsx";

type LoadOlderButtonProps = {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => Promise<unknown> | void;
};

export function LoadOlderButton({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
}: LoadOlderButtonProps) {
    if (!hasNextPage) return null;

    return (
        <Button
            variant="brand"
            onClick={() => {
                void fetchNextPage();
            }}
            disabled={isFetchingNextPage}
        >
            {isFetchingNextPage ? <Spinner /> : "Load older"}
        </Button>
    );
}
