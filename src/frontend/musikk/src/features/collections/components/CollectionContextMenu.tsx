import { useCollectionPlayHandler } from "@/features/collections/hooks/useCollectionPlayHandler.ts";
import { Collection } from "@/features/collections/types.ts";
import { useQueueAddAPI } from "@/features/song-queue/hooks/useQueueAPI.ts";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuPortal,
    ContextMenuTrigger,
} from "@/features/ui/context-menu.tsx";
import { BetweenHorizonalStart, Play } from "lucide-react";
import { JSX } from "react";
// TODO: make a button just like the song
interface SongContextMenuProps {
    children: JSX.Element | JSX.Element[];
    collection: Collection;
}

export function CollectionContextMenu({ children, collection }: SongContextMenuProps) {
    const addToQueueMutation = useQueueAddAPI();
    const { onClick: onCollectionPlayClick } = useCollectionPlayHandler(collection);

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuPortal>
                <ContextMenuContent panel="card" className="w-48">
                    <ContextMenuItem
                        onSelect={() =>
                            addToQueueMutation.mutate({
                                type: "collection",
                                item: collection,
                                action: "add",
                            })
                        }
                    >
                        <BetweenHorizonalStart className="mr-2 h-4 w-4" />
                        Add to queue
                    </ContextMenuItem>

                    <ContextMenuItem onSelect={onCollectionPlayClick}>
                        <Play className="mr-2 h-4 w-4" />
                        Play
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenuPortal>
        </ContextMenu>
    );
}
