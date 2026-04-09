import { CollectionCard } from "@/features/collections/components/CollectionCard.tsx";
import { ColletionCreateButton } from "@/features/collections/components/ColletionCreateButton.tsx";
import { UserCollectionsContext } from "@/features/user/providers/userCollectionsContext.ts";
import { useContext, useMemo } from "react";

export function LeftColumn() {
    const { liked_songs, history, created_collections, followed_collections } =
        useContext(UserCollectionsContext);

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
        <div className="w-1/5 overflow-y-auto bg-brand p-4 pb-40">
            <div className="mx-14 mb-4 flex items-center justify-between">
                <h2 className="text-center text-xl font-bold text-brand-foreground">Your stuff</h2>
                <ColletionCreateButton />
            </div>
            {collections.length > 0 ? (
                <ul className="flex flex-col gap-6" role="list">
                    {collections.map((collection) => (
                        <li key={collection.uuid}>
                            <CollectionCard collection={collection} size="big" />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="rounded-sm border-2 border-foreground bg-brand py-8 text-center text-brand-foreground">
                    <p>No song collections found</p>
                </div>
            )}
        </div>
    );
}
