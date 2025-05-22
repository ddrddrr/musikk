import { useCollectionPlayHandler } from "@/components/song-collections/hooks/useCollectionPlayHandler.tsx";
import { ISongCollection } from "@/components/song-collections/types.ts";
import { useQueueAddAPI } from "@/components/song-queue/hooks/useQueueAPI.ts";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuPortal,
    ContextMenuTrigger,
} from "@radix-ui/react-context-menu";
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
                <ContextMenuContent className="w-48 bg-white rounded-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-1">
                    <ContextMenuItem
                        className="flex items-center px-3 py-2 text-sm text-black hover:bg-gray-100 transition-colors"
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

                    <ContextMenuItem
                        className="flex items-center px-3 py-2 text-sm text-black hover:bg-gray-100 transition-colors"
                        onSelect={onCollectionPlayClick}
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Play
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenuPortal>
        </ContextMenu>
    );
}
