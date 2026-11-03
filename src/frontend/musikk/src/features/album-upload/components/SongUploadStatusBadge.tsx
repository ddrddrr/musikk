import { TrackStatus } from "@/features/album-upload/types.ts";
import { Spinner } from "@/features/ui/spinner.tsx";
import { cn } from "@/lib/utils.ts";

type InProgressStatus = Extract<TrackStatus, "queued" | "processing">;

// a Record, so a new backend status is a type error until it gets a style here
const FINISHED_STATUS_STYLES: Record<Exclude<TrackStatus, InProgressStatus>, string> = {
    ready: "text-success bg-success/10 border-success/30",
    failed: "text-destructive bg-destructive/10 border-destructive/30",
};

function isInProgress(status: TrackStatus): status is InProgressStatus {
    return status === "queued" || status === "processing";
}

export function SongUploadProgress({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            <span>{label}</span>
        </div>
    );
}

export function SongUploadStatusBadge({
    status,
    detail,
}: {
    status: TrackStatus;
    detail?: string;
}) {
    if (isInProgress(status)) {
        return <SongUploadProgress label={status} />;
    }

    return (
        <div className="flex items-center gap-2">
            <div
                className={cn(
                    "inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium",
                    FINISHED_STATUS_STYLES[status],
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
