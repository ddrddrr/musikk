import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "use-debounce";

import { EmptyState } from "@/features/common/EmptyState.tsx";
import { Spinner } from "@/features/ui/spinner";

import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { performSearch } from "@/features/search/queries";
import { searchKeys } from "@/features/search/queryKeys.ts";
import { Input } from "@/features/ui/input";

import { CollectionCard } from "@/features/collections/components/CollectionCard.tsx";
import { Collection } from "@/features/collections/types.ts";
import { SearchItem } from "@/features/search/types.ts";
import { SongCard } from "@/features/songs/components/SongCard.tsx";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { UserCard } from "@/features/user/components/UserCard.tsx";
import { BaseUser } from "@/features/user/types.ts";

const QUERY_TIMEOUT = 300; // ms

interface SearchWindowProps {
    onItemSelect?: (obj: SearchItem) => void;
    songMode?: "container" | "card";
}

export function SearchWindow({ onItemSelect, songMode = "card" }: SearchWindowProps) {
    const [query, setQuery] = useState("");
    const [debouncedQuery] = useDebounce(query, QUERY_TIMEOUT);

    const { isSuccess, error, data, refetch, isPlaceholderData } = useQuery({
        queryKey: searchKeys.result(debouncedQuery),
        queryFn: () => performSearch(debouncedQuery),
        enabled: !!debouncedQuery.trim(),
        placeholderData: keepPreviousData,
    });

    const shouldShowResults = debouncedQuery.trim().length > 0 && isSuccess;

    const renderSongs = () => {
        if (!data?.songs?.length) return null;

        const containerClass =
            songMode === "card" ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2";

        return (
            <div>
                <h3 className="mb-2 text-sm font-semibold">Songs</h3>
                <div className={containerClass}>
                    {data.songs.map((song) => {
                        return songMode === "container" ? (
                            <SongContainer
                                key={song.uuid}
                                collectionSong={song}
                                size="compact"
                                className={onItemSelect ? "cursor-pointer" : undefined}
                            />
                        ) : (
                            <SongCard
                                key={song.uuid}
                                collectionSong={song}
                                onClick={onItemSelect}
                                size={"small"}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderCollections = (label: string, items: Collection[]) => {
        if (!items?.length) return null;

        return (
            <div>
                <h3 className="mb-2 text-sm font-semibold">{label}</h3>
                <div className="grid grid-cols-2 gap-2">
                    {items.map((collection) => (
                        <CollectionCard
                            key={collection.uuid}
                            collection={collection}
                            size="small"
                            onClick={onItemSelect}
                        />
                    ))}
                </div>
            </div>
        );
    };

    const renderUsers = (label: string, items: BaseUser[]) => {
        if (!items?.length) return null;

        return (
            <div>
                <h3 className="mb-2 text-sm font-semibold">{label}</h3>
                <div className="grid grid-cols-2 gap-2">
                    {items.map((user) => (
                        <UserCard key={user.uuid} user={user} size="small" onClick={onItemSelect} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex w-full flex-col">
            <div className="flex-shrink-0">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full"
                />
            </div>

            <div className="results-container min-h-[200px] flex-1 overflow-y-auto pt-4">
                {error && <QueryErrorBox message="Search failed" onRetry={() => void refetch()} />}

                {isPlaceholderData && (
                    <div className="flex items-center justify-center py-2">
                        <Spinner />
                    </div>
                )}

                {shouldShowResults && data && (
                    <div className="flex flex-col gap-4">
                        {renderSongs()}
                        {renderCollections("Albums", data.albums)}
                        {renderCollections("Playlists", data.playlists)}
                        {renderUsers("Artists", data.artists)}
                        {renderUsers("Users", data.users)}

                        {!data.songs?.length &&
                            !data.playlists?.length &&
                            !data.albums?.length &&
                            !data.artists?.length &&
                            !data.users?.length && (
                                <EmptyState
                                    variant="inline"
                                    message="No results found"
                                    className="py-2"
                                />
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
