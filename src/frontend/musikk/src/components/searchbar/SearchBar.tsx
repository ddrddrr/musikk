import { performSearch } from "@/components/searchbar/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { SongCollectionCard } from "@/components/song-collection/SongCollectionCard";
import { SongCard } from "@/components/song/SongCard";
import { UserCard } from "@/components/user/UserCard";

const QUERY_TIMEOUT = 300;

export function SearchBar() {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, QUERY_TIMEOUT);
        return () => clearTimeout(handler);
    }, [query]);

    const { isPending, isSuccess, error, data } = useQuery({
        queryKey: ["searchbar", debouncedQuery],
        queryFn: () => performSearch(debouncedQuery),
        enabled: !!debouncedQuery.trim(), // don't make a request for an empty query
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
                        {data.songs.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Songs</h3>
                                <div className="space-y-2">
                                    {data.songs.map((song) => (
                                        <SongCard key={song.uuid} song={song} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.collections.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Collections</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {data.collections.map((collection) => (
                                        <SongCollectionCard
                                            key={collection.uuid}
                                            collection={collection}
                                            size="small"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.users.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Users</h3>
                                <div className="space-y-2">
                                    {data.users.map((user) => (
                                        <UserCard key={user.uuid} user={user} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {!data.songs.length && !data.collections.length && !data.users.length && (
                            <div className="py-2 text-center text-sm text-gray-500">No results found</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
