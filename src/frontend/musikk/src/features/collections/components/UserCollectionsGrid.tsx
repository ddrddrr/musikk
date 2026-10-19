import { UUID } from "@/api/types.ts";
import { useCollectionsByAuthorQuery } from "@/features/collections/api/queries.ts";
import { CollectionCard } from "@/features/collections/components/CollectionCard.tsx";
import type { CollectionType } from "@/features/collections/types.ts";
import { CenteredSpinner } from "@/features/common/CenteredSpinner.tsx";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";

type UserCollectionsGridProps = {
    userUUID: UUID;
    type: CollectionType;
};

export function UserCollectionsGrid({ userUUID, type }: UserCollectionsGridProps) {
    const { data, error, isPending, refetch } = useCollectionsByAuthorQuery(userUUID, type);

    if (isPending) {
        return <CenteredSpinner />;
    }

    if (error) {
        return <QueryErrorBox message={`Failed to load ${type}s`} onRetry={() => void refetch()} />;
    }

    const collections = data?.results ?? [];

    if (collections.length === 0) {
        return <EmptyState message={`No ${type}s yet`} />;
    }

    return (
        <div className="flex flex-wrap justify-center gap-2">
            {collections.map((collection) => (
                <CollectionCard key={collection.uuid} collection={collection} />
            ))}
        </div>
    );
}
