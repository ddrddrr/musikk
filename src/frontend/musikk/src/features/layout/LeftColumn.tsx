import { CollectionCard } from "@/features/collections/components/CollectionCard.tsx";
import { ColletionCreateButton } from "@/features/collections/components/ColletionCreateButton.tsx";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { usePersonalCollections } from "@/features/user/hooks/usePersonalCollections.ts";
import { useMemo } from "react";

export function LeftColumn() {
    const { data } = usePersonalCollections();
    const { liked_songs, history, created_collections, followed_collections } = data ?? {};

    const collections = useMemo(() => {
        const created = Array.isArray(created_collections) ? created_collections : [];
        const followed = Array.isArray(followed_collections) ? followed_collections : [];
        let all = [...created, ...followed];

        if (history != null) {
            all = [history, ...all];
        }
        if (liked_songs != null) {
            all = [liked_songs, ...all];
        }

        return all;
    }, [liked_songs, history, created_collections, followed_collections]);

    return (
        <div className="flex w-1/5 flex-col overflow-y-auto bg-brand p-4 pb-40">
            <div className="mb-4 flex items-center justify-center gap-3">
                <h2 className="text-xl font-bold text-brand-foreground">Your stuff</h2>
                <ColletionCreateButton />
            </div>
            {collections.length === 0 && (
                <div className="flex flex-1 items-center justify-center">
                    <EmptyState
                        message="No collections yet"
                        className="bg-brand text-brand-foreground"
                    />
                </div>
            )}
            {collections.length > 0 && (
                <ul className="flex flex-col items-center gap-6" role="list">
                    {collections.map((collection) => (
                        <li key={collection.uuid}>
                            <CollectionCard collection={collection} size="big" />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
