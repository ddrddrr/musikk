import { CollectionAddToLikedButton } from "@/features/collections/components/CollectionAddToLikedButton.tsx";
import { CollectionAddToQueueButton } from "@/features/collections/components/CollectionAddToQueueButton.tsx";
import { CollectionPlayButton } from "@/features/collections/components/CollectionPlayButton.tsx";
import { CollectionDetailed } from "@/features/collections/types.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { Button } from "@/features/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
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
    showComments,
    onDeleteClick,
}: {
    showComments: boolean;
    onDeleteClick?: () => void;
}) {
    return (
        <DropdownMenu>
            <IconTooltip label="More Actions">
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="muted"
                        size="icon"
                        aria-label="More Actions"
                        className={showComments ? "size-8" : "size-12"}
                    >
                        <EllipsisVertical size={20} />
                    </Button>
                </DropdownMenuTrigger>
            </IconTooltip>
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
            <div className="flex items-center gap-4 rounded-sm border-2 border-foreground bg-card p-6">
                <MediaThumbnail
                    src={collection.image}
                    alt={collection.title}
                    className={cn(
                        "rounded-sm border-2 border-foreground",
                        showComments ? "size-20" : "size-32",
                    )}
                />

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
                                    <PlaylistMenuDropdown
                                        showComments={showComments}
                                        onDeleteClick={onDeleteClick}
                                    />
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
                                    <PlaylistMenuDropdown
                                        showComments={showComments}
                                        onDeleteClick={onDeleteClick}
                                    />
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
