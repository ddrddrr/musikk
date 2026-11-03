import { SongUploadField } from "@/features/album-upload/components/SongUploadField.tsx";
import { SongUploadStatusBadge } from "@/features/album-upload/components/SongUploadStatusBadge.tsx";
import { Button } from "@/features/ui/button.tsx";

export function SongUploadCard(props: {
    index: number;
    trackNumber?: number;
    uploading: boolean;
    locked: boolean;
    onRemove: () => void;
}) {
    return (
        <fieldset
            disabled={props.locked || props.uploading}
            className="flex flex-col gap-4 rounded-sm border bg-background p-4 shadow-sm"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold">Song {props.trackNumber}</div>
                    {props.uploading && <SongUploadStatusBadge status="uploading" />}
                </div>

                <Button type="button" variant="outline" onClick={props.onRemove}>
                    Remove
                </Button>
            </div>

            <SongUploadField songIndex={props.index} />
        </fieldset>
    );
}
