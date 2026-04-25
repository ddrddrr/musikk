import { CollectionAddToLikedButton } from "@/features/collections/components/CollectionAddToLikedButton.tsx";
import { CollectionAddToQueueButton } from "@/features/collections/components/CollectionAddToQueueButton.tsx";
import { CollectionPlayButton } from "@/features/collections/components/CollectionPlayButton.tsx";
import { CollectionDetailed } from "@/features/collections/types.ts";
import { Button } from "@/features/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";
import { cn } from "@/lib/utils.ts";
import { EllipsisVertical, Trash2 } from "lucide-react";
import { memo } from "react";

interface SongCollectionHeaderProps {
    collection: CollectionDetailed;
    showComments: boolean;
    toggleComments: () => void;
    songsCount: number;
    renderAddToLikedButton: boolean;
    renderCommentsButton: boolean;
    isAuthorPlaylist?: boolean;
    onDeleteClick?: () => void;
}

function PlaylistMenuDropdown({
    size,
    onDeleteClick,
}: {
    size?: "sm" | "icon";
    onDeleteClick?: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={size ?? "icon"}>
                    <EllipsisVertical size={size === "sm" ? 16 : 20} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem variant="destructive" onSelect={onDeleteClick}>
                    <Trash2 />
                    Delete playlist
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const CollectionHeader = memo(function SongCollectionHeader({
    collection,
    showComments,
    toggleComments,
    songsCount,
    renderAddToLikedButton,
    renderCommentsButton,
    isAuthorPlaylist,
    onDeleteClick,
}: SongCollectionHeaderProps) {
    return (
        <>
            <div className="flex gap-4 rounded-sm border-2 border-foreground bg-card p-6">
                {collection.image ? (
                    <img
                        src={collection.image}
                        alt="♫"
                        className={cn(
                            "rounded-sm border-2 border-foreground object-cover",
                            showComments ? "size-20" : "size-32",
                        )}
                    />
                ) : (
                    <div>♫</div>
                )}

                <div className="min-w-0 flex-1">
                    {showComments ? (
                        <div className="mb-2">
                            <p className="truncate text-sm font-bold">{collection.title}</p>
                            <div className="mt-2 flex gap-3">
                                {songsCount > 0 && (
                                    <CollectionPlayButton
                                        collection={collection}
                                        showComments={showComments}
                                    />
                                )}
                                {renderAddToLikedButton && (
                                    <CollectionAddToLikedButton
                                        collection={collection}
                                        showComments={showComments}
                                    />
                                )}
                                <CollectionAddToQueueButton
                                    collection={collection}
                                    showComments={showComments}
                                />
                                {isAuthorPlaylist && (
                                    <PlaylistMenuDropdown size="sm" onDeleteClick={onDeleteClick} />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-xl font-bold">{collection.title}</p>
                                <AuthorLinks
                                    authors={collection.authors}
                                    className="text-sm text-muted-foreground"
                                />
                                {collection.description && (
                                    <p className="mt-2 line-clamp-2 text-base text-muted-foreground">
                                        {collection.description}
                                    </p>
                                )}
                            </div>
                            <div className="ml-2 flex flex-shrink-0 gap-2">
                                {songsCount > 0 && (
                                    <CollectionPlayButton
                                        collection={collection}
                                        showComments={showComments}
                                    />
                                )}
                                {renderAddToLikedButton && (
                                    <CollectionAddToLikedButton
                                        collection={collection}
                                        showComments={showComments}
                                    />
                                )}
                                <CollectionAddToQueueButton
                                    collection={collection}
                                    showComments={showComments}
                                />
                                {isAuthorPlaylist && (
                                    <PlaylistMenuDropdown onDeleteClick={onDeleteClick} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h3
                    className={cn(
                        "p-1 font-bold text-foreground",
                        showComments ? "text-sm" : "text-lg",
                    )}
                >
                    Songs • {songsCount}
                </h3>
                {renderCommentsButton && (
                    <Button
                        onClick={toggleComments}
                        variant="accent"
                        size={showComments ? "sm" : "lg"}
                    >
                        {showComments ? "Hide Comments" : "Show Comments"}
                    </Button>
                )}
            </div>
        </>
    );
});
