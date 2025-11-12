import { useCollectionPlayHandler } from "@/components/song-collections/hooks/useCollectionPlayHandler.tsx";
import { ISongCollection } from "@/components/song-collections/types.ts";
import { useQueueAddAPI } from "@/components/song-queue/hooks/useQueueAPI.ts";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuPortal,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { BetweenHorizonalStart, Play } from "lucide-react";
import { JSX } from "react";

interface SongContextMenuProps {
    children: JSX.Element | JSX.Element[];
    collection: ISongCollection;
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
                        <BetweenHorizonalStart className="w-4 h-4 mr-2" />
                        Add to queue
                    </ContextMenuItem>

                    <ContextMenuItem onSelect={onCollectionPlayClick}>
                        <Play className="w-4 h-4 mr-2" />
                        Play
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenuPortal>
        </ContextMenu>
    );
}
