import { fetchCollectionList } from "@/components/song-collection/queries.ts";
import { SongCollectionCard } from "@/components/song-collection/SongCollectionCard";
import { useQuery } from "@tanstack/react-query";

export function LeftColumn() {
    const { isPending, error, data } = useQuery({
        queryKey: ["collectionList"],
        queryFn: fetchCollectionList,
    });
    const collections = data;
    if (isPending) return <div className="flex items-center justify-center h-screen bg-gray-200">Loading...</div>;
    if (error)
        return (
            <div className="flex items-center justify-center h-screen bg-gray-200">
                An error has occurred: {error.message}
            </div>
        );

    return (
        <div className="w-1/5 bg-red-600 p-4 overflow-y-auto border-r border-red-700">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Collections</h2>
            {collections && collections.length > 0 ? (
                <ul className="space-y-6" role="list">
                    {collections.map((collection) => (
                        <li key={collection.uuid}>
                            <SongCollectionCard collection={collection} />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8 text-white bg-red-500 rounded-md border-2 border-black">
                    <p>No song collections found</p>
                </div>
            )}
        </div>
    );
}
