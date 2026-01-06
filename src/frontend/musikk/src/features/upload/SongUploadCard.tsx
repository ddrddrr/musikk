import type { UUID } from "@/api/types";
import { Button } from "@/features/ui/button";
import { SongField } from "@/features/upload/SongField";
import type { CreateState, StatusByUUId } from "@/features/upload/ws/eventHooks";
import { getSongUploadStatus } from "./songUploadStatus.ts";

export function SongUploadCard(props: {
    index: number;
    fieldId: string;
    uuid?: UUID;
    statusByUUID: StatusByUUId;
    songsStateByFieldId: CreateState;
    onRemove: () => void;
}) {
    const { status, detail } = getSongUploadStatus({
        uuid: props.uuid,
        fieldId: props.fieldId,
        statusByUUID: props.statusByUUID,
        songsStateByFieldId: props.songsStateByFieldId,
    });

    return (
        <div className="space-y-4 rounded-xl border bg-background p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold">Song {props.index + 1}</div>
                    <SongField.StatusBadge status={status} detail={detail} />
                </div>

                <Button type="button" variant="outline" onClick={props.onRemove}>
                    Remove
                </Button>
            </div>

            <SongField songIndex={props.index} />
        </div>
    );
}
