import { UUID } from "@/api/types.ts";
import { fetchCollections } from "@/features/collections/api/queries.ts";
import { collectionKeys } from "@/features/collections/api/queryKeys.ts";
import { CollectionCard } from "@/features/collections/components/CollectionCard.tsx";
import type { CollectionType } from "@/features/collections/types.ts";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { Spinner } from "@/features/ui/spinner";
import { useQuery } from "@tanstack/react-query";

type UserCollectionsGridProps = {
    userUUID: UUID;
    type: CollectionType;
};

export function UserCollectionsGrid({ userUUID, type }: UserCollectionsGridProps) {
    const { data, error, isPending, refetch } = useQuery({
        queryKey: collectionKeys.byAuthor(userUUID, type),
        queryFn: () => fetchCollections({ author: userUUID, type }),
    });

    if (isPending) {
        return (
            <div className="flex items-center justify-center p-8">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (error) {
        return <QueryErrorBox message={`Failed to load ${type}s`} onRetry={() => void refetch()} />;
    }

    const collections = data?.results ?? [];

    if (collections.length === 0) {
        return (
            <Card className="border border-foreground">
                <CardContent className="py-6 text-center text-muted-foreground">
                    No {type}s yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="flex flex-wrap justify-center gap-2">
            {collections.map((collection) => (
                <CollectionCard key={collection.uuid} collection={collection} />
            ))}
        </div>
    );
}
