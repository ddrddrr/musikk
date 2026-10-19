import type { UUID } from "@/api/types.ts";
import { SongUploadField } from "@/features/album-upload/components/SongUploadField.tsx";
import { SongUploadStatusBadge } from "@/features/album-upload/components/SongUploadStatusBadge.tsx";
import type { SongUploadState, SongUploadStatus } from "@/features/album-upload/types.ts";
import { Button } from "@/features/ui/button.tsx";

export function SongUploadCard(props: {
    index: number;
    operationID?: UUID;
    uploadState: SongUploadState;
    onRemove: () => void;
}) {
    const uploadInfo = props.operationID ? props.uploadState[props.operationID] : undefined;
    const status: SongUploadStatus = uploadInfo?.status ?? "unknown";
    const detail = uploadInfo?.detail;

    return (
        <div className="flex flex-col gap-4 rounded-sm border bg-background p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold">Song {props.index + 1}</div>
                    <SongUploadStatusBadge status={status} detail={detail} />
                </div>

                <Button type="button" variant="outline" onClick={props.onRemove}>
                    Remove
                </Button>
            </div>

            <SongUploadField songIndex={props.index} />
        </div>
    );
}
