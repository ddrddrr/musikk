import { CollectionAddToLikedButton } from "@/features/collections/components/CollectionAddToLikedButton.tsx";
import { CollectionAddToQueueButton } from "@/features/collections/components/CollectionAddToQueueButton.tsx";
import { CollectionPlayButton } from "@/features/collections/components/CollectionPlayButton.tsx";
import { CollectionDetailed } from "@/features/collections/types.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { ActionButtonSize } from "@/features/common/types.ts";
import { Button } from "@/features/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { IconTooltip, OverflowTooltip } from "@/features/ui/tooltip.tsx";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";
import { cn } from "@/lib/utils.ts";
import { EllipsisVertical, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface SongCollectionHeaderProps {
    collection: CollectionDetailed;
    compact: boolean;
    isCommentsOpen: boolean;
    commentsToggleTo: string;
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
    size: ActionButtonSize;
    onDeleteClick?: () => void;
}) {
    return (
        <DropdownMenu>
            <IconTooltip label="More Actions">
                <DropdownMenuTrigger asChild>
                    <Button variant="muted" size={`icon-${size}`} aria-label="More Actions">
                        <EllipsisVertical />
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

export function CollectionHeader({
    collection,
    compact,
    isCommentsOpen,
    commentsToggleTo,
    songsCount,
    renderAddToLikedButton,
    renderCommentsButton,
    isAuthorPlaylist,
    onDeleteClick,
}: SongCollectionHeaderProps) {
    const buttonSize = compact ? "sm" : "md";
    const commentsButtonLabel = isCommentsOpen ? "Hide Comments" : "Show Comments";
    const actionButtons = (
        <>
            {songsCount > 0 && <CollectionPlayButton collection={collection} size={buttonSize} />}
            {renderAddToLikedButton && (
                <CollectionAddToLikedButton collection={collection} size={buttonSize} />
            )}
            <CollectionAddToQueueButton collection={collection} size={buttonSize} />
            {isAuthorPlaylist && (
                <PlaylistMenuDropdown size={buttonSize} onDeleteClick={onDeleteClick} />
            )}
        </>
    );
    const infoAndActions = compact ? (
        <div className="mb-2">
            <OverflowTooltip label={collection.title}>
                <p className="truncate text-sm font-bold">{collection.title}</p>
            </OverflowTooltip>
            <div className="mt-2 flex gap-3">{actionButtons}</div>
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
                    <OverflowTooltip label={collection.description}>
                        <p className="mt-2 line-clamp-2 text-base text-muted-foreground">
                            {collection.description}
                        </p>
                    </OverflowTooltip>
                )}
            </div>
            <div className="ml-2 flex flex-shrink-0 gap-2">{actionButtons}</div>
        </div>
    );

    return (
        <>
            <div className="flex items-center gap-4 rounded-sm border-2 border-foreground bg-card p-6">
                <MediaThumbnail
                    src={collection.image}
                    alt={collection.title}
                    className={cn(
                        "rounded-sm border-2 border-foreground",
                        compact ? "size-20" : "size-32",
                    )}
                />

                <div className="min-w-0 flex-1">{infoAndActions}</div>
            </div>

            <div className="flex items-center justify-between">
                <h3
                    className={cn("p-1 font-bold text-foreground", compact ? "text-sm" : "text-lg")}
                >
                    Songs • {songsCount}
                </h3>
                {renderCommentsButton && (
                    <Button variant="accent" size={compact ? "sm" : "lg"} asChild>
                        <Link to={commentsToggleTo}>{commentsButtonLabel}</Link>
                    </Button>
                )}
            </div>
        </>
    );
}
