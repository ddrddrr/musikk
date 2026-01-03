import { useFriendsListeningQuery } from "@/features/friend-activity/queries.ts";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";

export function ListeningFeed() {
    const { data: userSongs } = useFriendsListeningQuery();

    return (
        <>
            <h2 className="text-xl font-bold text-white mb-4 text-center">Friend activity</h2>
            {userSongs && !!userSongs.length && (
                <div className="space-y-4">
                    {userSongs.map(({ user, song }) => (
                        <div
                            key={`${user.uuid}-${song.uuid}`}
                            className="p-3 bg-white rounded border border-gray-200 shadow-sm"
                        >
                            <UserIdentifier user={user} />
                            <div className="mt-2">
                                <SongContainer
                                    collectionSong={song}
                                    size="compact"
                                    renderItems={{ image: false }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
