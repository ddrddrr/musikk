import { memo } from "react";
import { ListeningFeed } from "@/components/friend-activity/ListeningFeed.tsx";

export const RightColumn = memo(function RightColumn() {
    return <div className="w-1/5 bg-red-600 p-4 pb-24 overflow-y-auto border-l border-red-700">
        <ListeningFeed/>
    </div>;
});
