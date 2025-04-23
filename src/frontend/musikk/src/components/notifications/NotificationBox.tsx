import { NotificationOverlay } from "@/components/notifications/NotificationOverlay.tsx";
import { fetchReplyNotificationList } from "@/components/notifications/queries.ts";
import { Button } from "@/components/ui/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { UUID } from "@/config/types.ts";
import { useQuery } from "@tanstack/react-query";
import { Sparkle } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";

interface NotificationBoxProps {
    isUserReady: boolean;
}

export const NotificationBox = memo(function NotificationBox({ isUserReady }: NotificationBoxProps) {
    const [notReadUUIDs, setNotReadUUIDs] = useState<UUID[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const { isPending, error, data } = useQuery({
        queryKey: ["replyNotifications"],
        queryFn: fetchReplyNotificationList,
        enabled: isUserReady,
    });

    const unreadUUIDs = useMemo(() => {
        if (!data) return [];
        return data.filter((n) => !n.is_read).map((n) => n.uuid);
    }, [data]);

    useEffect(() => {
        setNotReadUUIDs(unreadUUIDs);
    }, [unreadUUIDs]);

    if (isPending) return <div className="text-center text-sm p-4">Loading...</div>;
    if (error) return <div className="text-center text-sm text-red-500 p-4">Error: {error.message}</div>;
    if (!isUserReady) return <div className="p-4 text-sm text-gray-500">User not loaded</div>;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="relative">
                    <Button variant="ghost" className="text-white">
                        <Sparkle className="w-5 h-5" />
                    </Button>
                    {notReadUUIDs.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {notReadUUIDs.length}
                        </span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0">
                <NotificationOverlay
                    notifications={data}
                    notReadUUIDs={notReadUUIDs}
                    setNotReadUUIDs={setNotReadUUIDs}
                    isOpen={isOpen}
                />
            </PopoverContent>
        </Popover>
    );
});
