import { SongUploadStatusBadge } from "@/features/album-upload/components/SongUploadStatusBadge.tsx";
import { AlbumTrack } from "@/features/album-upload/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { OverflowTooltip } from "@/features/ui/tooltip.tsx";

export function AlbumTrackCard(props: {
    track: AlbumTrack;
    trackNumber?: number;
    disabled: boolean;
    onRemove: () => void;
    onRetry: () => void;
}) {
    const { track } = props;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border bg-background p-4 shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
                <div className="text-sm font-semibold">Song {props.trackNumber}</div>
                <OverflowTooltip label={track.title}>
                    <div className="min-w-0 truncate text-sm">{track.title}</div>
                </OverflowTooltip>
                <SongUploadStatusBadge status={track.status} detail={track.status_detail} />
            </div>

            <div className="flex gap-2">
                {track.status === "failed" && (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={props.disabled}
                        onClick={props.onRetry}
                    >
                        Retry
                    </Button>
                )}
                <Button
                    type="button"
                    variant="outline"
                    disabled={props.disabled}
                    onClick={props.onRemove}
                >
                    Remove
                </Button>
            </div>
        </div>
    );
}
