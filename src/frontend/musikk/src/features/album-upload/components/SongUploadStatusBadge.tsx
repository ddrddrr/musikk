import { TrackStatus } from "@/features/album-upload/types.ts";
import { Spinner } from "@/features/ui/spinner.tsx";
import { cn } from "@/lib/utils.ts";

function isInProgress(status: TrackStatus): boolean {
    return status === "uploading" || status === "queued" || status === "processing";
}

function statusStyle(status: TrackStatus) {
    if (status === "ready") return "text-success bg-success/10 border-success/30";
    return "text-destructive bg-destructive/10 border-destructive/30";
}

export function SongUploadStatusBadge({
    status,
    detail,
}: {
    status: TrackStatus;
    detail?: string;
}) {
    if (isInProgress(status)) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                <span>{status}</span>
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
