import { ListeningFeed } from "@/features/friend-activity/ListeningFeed.tsx";
import { memo } from "react";

export const RightColumn = memo(function RightColumn() {
    return (
        <div className="w-1/5 overflow-y-auto border-l border-brand-hover bg-brand p-4 pb-24">
            {/*<ListeningFeed/>*/}
        </div>
    );
});
