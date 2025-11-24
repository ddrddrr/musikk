import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { performSearch } from "@/modules/search/queries";
import { Card, CardContent } from "@/modules/ui/card";
import { Input } from "@/modules/ui/input";

import { IAttachment } from "@/modules/publications/types.ts";
import { SongCollectionCard } from "@/modules/song-collections/SongCollectionCard";
import { ISongCollection } from "@/modules/song-collections/types.ts";
import { SongCard } from "@/modules/songs/SongCard.tsx";
import { SongContainer } from "@/modules/songs/SongContainer.tsx";
import { UserCard } from "@/modules/user/UserCard.tsx";
import { IUserBaseProfile } from "@/modules/user/types.ts";

const QUERY_TIMEOUT = 300;

interface SearchWindowProps {
    onItemSelect?: (obj: IAttachment) => void;
    songMode?: "container" | "card";
}

export function SearchWindow({ onItemSelect, songMode = "card" }: SearchWindowProps) {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedQuery(query), QUERY_TIMEOUT);
        return () => clearTimeout(handler);
    }, [query]);

    const { isPending, isSuccess, error, data } = useQuery({
        queryKey: ["search", debouncedQuery],
        queryFn: () => performSearch(debouncedQuery),
        enabled: !!debouncedQuery.trim(),
    });

    const shouldShowResults = debouncedQuery.trim().length > 0 && isSuccess;

    const renderSongs = () => {
        if (!data?.songs?.length) return null;

        const containerClass = songMode === "card" ? "grid grid-cols-2 gap-2" : "space-y-2";

        return (
            <div>
                <h3 className="text-sm font-semibold mb-2">Songs</h3>
                <div className={containerClass}>
                    {data.songs.map((song) => {
                        const onClick = onItemSelect
                            ? () =>
                                  onItemSelect({
                                      objType: "song",
                                      objUUID: song.uuid,
                                      repr: song.song.title,
                                      image: song.song.image,
                                  })
                            : undefined;

                        return songMode === "container" ? (
                            <SongContainer
                                key={song.uuid}
                                collectionSong={song}
                                size="compact"
                                className={onClick ? "cursor-pointer" : ""}
                            />
                        ) : (
                            <SongCard
                                key={song.uuid}
                                collectionSong={song}
                                size="small"
                                onClick={onClick}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderCollections = (label: string, items: ISongCollection[]) => {
        if (!items?.length) return null;

        return (
            <div>
                <h3 className="text-sm font-semibold mb-2">{label}</h3>
                <div className="grid grid-cols-2 gap-2">
                    {items.map((collection) => (
                        <SongCollectionCard
                            key={collection.uuid}
                            collection={collection}
                            size="small"
                            onClick={
                                onItemSelect
                                    ? () =>
                                          onItemSelect({
                                              objType: "collection",
                                              objUUID: collection.uuid,
                                              repr: collection.title,
                                              image: collection.image,
                                          })
                                    : undefined
                            }
                        />
                    ))}
                </div>
            </div>
        );
    };

    const renderUsers = (label: string, items: IUserBaseProfile[]) => {
        if (!items?.length) return null;

        return (
            <div>
                <h3 className="text-sm font-semibold mb-2">{label}</h3>
                <div className="grid grid-cols-2 gap-2">
                    {items.map((user) => (
                        <UserCard
                            key={user.uuid}
                            user={user}
                            onClick={
                                onItemSelect
                                    ? () =>
                                          onItemSelect({
                                              objType: "user",
                                              objUUID: user.uuid,
                                              repr: user.display_name,
                                              image: user.avatar,
                                          })
                                    : undefined
                            }
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full space-y-4">
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full"
                autoFocus
            />

            <div className="results-container min-h-[200px]">
                {error && (
                    <Card>
                        <CardContent className="p-4 text-red-500">
                            Something went wrong.
                        </CardContent>
                    </Card>
                )}

                {isPending && (
                    <div className="py-2 text-center text-sm text-gray-500">Loading...</div>
                )}

                {shouldShowResults && data && (
                    <div className="space-y-4">
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
                                <div className="py-2 text-center text-sm text-gray-500">
                                    No results found
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
