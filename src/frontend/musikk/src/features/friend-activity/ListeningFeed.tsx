import { useFriendsListeningQuery } from "@/features/friend-activity/queries.ts";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";

export function ListeningFeed() {
    const { data: userSongs } = useFriendsListeningQuery();

    return (
        <>
            <h2 className="mb-4 text-center text-xl font-bold text-brand-foreground">
                Friend activity
            </h2>
            {userSongs && !!userSongs.length && (
                <div className="flex flex-col gap-4">
                    {userSongs.map(({ user, song }) => (
                        <div
                            key={`${user.uuid}-${song.uuid}`}
                            className="rounded border border-border bg-card p-3 shadow-sm"
                        >
                            <UserIdentifier user={user} />
                            <div className="mt-2">
                                <SongContainer
                                    collectionSong={song}
                                    size="compact"
                                    showImage={false}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
