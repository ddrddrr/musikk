import { performSearch } from "@/components/search/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { IAttachment } from "@/components/publications/types.ts";
import { SongCollectionCard } from "@/components/song-collections/SongCollectionCard";
import { SongContainer } from "@/components/songs/SongContainer.tsx";
import { UserCard } from "@/components/user/UserCard.tsx";

const QUERY_TIMEOUT = 300;

interface SearchWindowProps {
    onItemSelect?: (obj: IAttachment) => void;
}

export function SearchWindow({ onItemSelect = undefined }: SearchWindowProps) {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, QUERY_TIMEOUT);
        return () => clearTimeout(handler);
    }, [query]);

    const { isPending, isSuccess, error, data } = useQuery({
        queryKey: ["search", debouncedQuery],
        queryFn: () => performSearch(debouncedQuery),
        enabled: !!debouncedQuery.trim(),
    });

    const shouldShowResults = debouncedQuery.trim().length > 0 && isSuccess;

    return (
        <div className="w-full space-y-4">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full" autoFocus />

            <div className="results-container min-h-[200px]">
                {error && (
                    <Card>
                        <CardContent className="p-4 text-red-500">Something went wrong.</CardContent>
                    </Card>
                )}

                {isPending && <div className="py-2 text-center text-sm text-gray-500">Loading...</div>}

                {shouldShowResults && data && (
                    <div className="space-y-4">
                        {data.songs?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Songs</h3>
                                <div className="space-y-2">
                                    {data.songs.map((song) => (
                                        <div
                                            key={song.uuid}
                                            onClick={() =>
                                                onItemSelect?.({
                                                    objType: "song",
                                                    objUUID: song.uuid,
                                                    repr: song.song.title,
                                                    image: song.song.image,
                                                })
                                            }
                                            className="cursor-pointer"
                                        >
                                            <SongContainer collectionSong={song} buttonSize={30} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.albums?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Albums</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {data.albums.map((collection) => (
                                        <div
                                            key={collection.uuid}
                                            onClick={() =>
                                                onItemSelect?.({
                                                    objType: "collection",
                                                    objUUID: collection.uuid,
                                                    repr: collection.title,
                                                    image: collection.image,
                                                })
                                            }
                                            className="cursor-pointer"
                                        >
                                            <SongCollectionCard
                                                collection={collection}
                                                size="small"
                                                enableOnClick={false}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.playlists?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Playlists</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {data.playlists.map((collection) => (
                                        <div
                                            key={collection.uuid}
                                            onClick={() =>
                                                onItemSelect?.({
                                                    objType: "collection",
                                                    objUUID: collection.uuid,
                                                    repr: collection.title,
                                                    image: collection.image,
                                                })
                                            }
                                            className="cursor-pointer"
                                        >
                                            <SongCollectionCard collection={collection} size="small" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.artists?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Artists</h3>
                                <div className="space-y-2">
                                    {data.artists.map((artist) => (
                                        <div
                                            key={artist.uuid}
                                            onClick={() =>
                                                onItemSelect?.({
                                                    objType: "user",
                                                    objUUID: artist.uuid,
                                                    repr: artist.display_name,
                                                    image: artist.avatar,
                                                })
                                            }
                                            className="cursor-pointer"
                                        >
                                            <UserCard user={artist} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.users?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Users</h3>
                                <div className="space-y-2">
                                    {data.users.map((user) => (
                                        <div
                                            key={user.uuid}
                                            onClick={() =>
                                                onItemSelect?.({
                                                    objType: "user",
                                                    objUUID: user.uuid,
                                                    repr: user.display_name,
                                                    image: user.avatar,
                                                })
                                            }
                                            className="cursor-pointer"
                                        >
                                            <UserCard user={user} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!data.songs?.length &&
                            !data.playlists?.length &&
                            !data.albums?.length &&
                            !data.artists?.length &&
                            !data.users?.length && (
                                <div className="py-2 text-center text-sm text-gray-500">No results found</div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
