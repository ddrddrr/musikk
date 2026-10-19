import { useLatestCollections } from "@/features/collections/api/queries.ts";
import { CollectionCarousel } from "@/features/collections/components/CollectionCarousel.tsx";
import { CollectionListParams } from "@/features/collections/types.ts";
import { CenteredSpinner } from "@/features/common/CenteredSpinner.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";

interface MusicFeedSection {
    title: string;
    params: CollectionListParams;
}

const SECTIONS: MusicFeedSection[] = [
    { title: "New Playlists", params: { type: "playlist" } },
    { title: "New Albums", params: { type: "album" } },
    { title: "Latest Added by Followed Users", params: { connection: "followed" } },
    { title: "Latest Added by Friends", params: { connection: "friends" } },
];

export function MusicFeed() {
    return (
        <div className="flex flex-col gap-8">
            {SECTIONS.map((section) => (
                <LatestCollectionsSection key={section.title} {...section} />
            ))}
        </div>
    );
}

function LatestCollectionsSection({ title, params }: MusicFeedSection) {
    const { data: collections, isPending, error, refetch } = useLatestCollections(params);

    if (isPending) return <CenteredSpinner />;
    if (error) {
        return (
            <QueryErrorBox message={`Failed to load "${title}"`} onRetry={() => void refetch()} />
        );
    }

    return <CollectionCarousel collections={collections} title={title} />;
}
