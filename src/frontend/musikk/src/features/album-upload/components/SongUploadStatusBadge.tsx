import { Spinner } from "@/features/ui/spinner";
import { cn } from "@/lib/utils.ts";
import { SongUploadStatus } from "../types.ts";

function inProgressLabel(status: SongUploadStatus) {
    if (status === "pending") return "waiting";
    if (status === "uploading") return "uploading";
    if (status === "queued") return "queued";
    if (status === "processing") return "processing";
    return null;
}

function statusStyle(status: SongUploadStatus) {
    if (status === "ready") return "text-success bg-success/10 border-success/30";
    return "text-destructive bg-destructive/10 border-destructive/30";
}

export function SongUploadStatusBadge({
    status,
    detail,
}: {
    status: SongUploadStatus;
    detail?: string;
}) {
    if (status === "unknown") return null;

    const label = inProgressLabel(status);
    if (label !== null) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                <span>{label}</span>
                {detail && (
                    <div className="max-w-[50ch] truncate text-xs text-muted-foreground">
                        {detail}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div
                className={cn(
                    "inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium",
                    statusStyle(status),
                )}
            >
                {status}
            </div>
            {detail && (
                <div className="max-w-[50ch] truncate text-xs text-muted-foreground">{detail}</div>
            )}
        </div>
    );
}
