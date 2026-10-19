import { ListeningFeed } from "@/features/friend-activity/ListeningFeed.tsx";

export function RightColumn() {
    return (
        <div className="flex w-1/5 flex-col border-l border-brand-hover bg-brand p-4 pb-24">
            <ListeningFeed />
        </div>
    );
}
