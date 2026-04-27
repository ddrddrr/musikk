import { EmptyState } from "@/features/common/EmptyState.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { useFriendsListeningQuery } from "@/features/friend-activity/queries.ts";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { ScrollArea } from "@/features/ui/scroll-area.tsx";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";

export function ListeningFeed() {
    const { data: userSongs, error, refetch } = useFriendsListeningQuery();
    const isEmpty = !userSongs || userSongs.length === 0;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <h2 className="mb-4 text-center text-xl font-bold text-brand-foreground">
                Friend activity
            </h2>
            {error && (
                <QueryErrorBox
                    message="Failed to load friend activity"
                    onRetry={() => void refetch()}
                />
            )}
            {!error && isEmpty && (
                <EmptyState
                    variant="inline"
                    message="No friend activity yet"
                    className="text-brand-foreground"
                />
            )}
            {!error && !isEmpty && (
                <ScrollArea className="min-h-0 flex-1 pr-2">
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
                </ScrollArea>
            )}
        </div>
    );
}
