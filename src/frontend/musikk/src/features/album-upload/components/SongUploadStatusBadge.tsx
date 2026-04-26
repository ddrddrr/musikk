import { SongUploadStatus } from "../types.ts";
import { Spinner } from "@/features/ui/spinner";
import { cn } from "@/lib/utils.ts";

function statusTone(status: SongUploadStatus) {
    if (status === "ready") return "text-green-600 bg-green-50 border-green-200";
    if (status === "processing" || status === "queued")
        return "text-amber-700 bg-amber-50 border-amber-200";
    if (status === "unknown") return "text-muted-foreground bg-muted border-border";
    return "text-red-600 bg-red-50 border-red-200";
}

export function SongUploadStatusBadge({
    status,
    detail,
}: {
    status: SongUploadStatus;
    detail?: string;
}) {
    if (status === "processing") {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                <span>processing</span>
            </div>
        );
    }

    if (status === "unknown") return null;

    return (
        <div className="flex items-center gap-2">
            <div
                className={cn(
                    "inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium",
                    statusTone(status),
                )}
            >
                {status}
            </div>
            {detail ? (
                <div className="max-w-[50ch] truncate text-xs text-muted-foreground">{detail}</div>
            ) : null}
        </div>
    );
}
