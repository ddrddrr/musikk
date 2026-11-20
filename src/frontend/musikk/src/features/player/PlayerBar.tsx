import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { useCalculateSongPosMs } from "@/features/playback/hooks/useCalculateSongPosMs.ts";
import { usePlayback } from "@/features/playback/hooks/usePlayback.ts";
import { usePlayerController } from "@/features/playback/hooks/usePlayerController.ts";
import { ChangeActiveDeviceDropdown } from "@/features/player/ChangeActiveDeviceDropdown.tsx";
import { useVolume } from "@/features/player/hooks/useVolume.ts";
import { PlayerPlayButton } from "@/features/player/PlayerPlayButton.tsx";
import { useQueueNext, useQueuePrev } from "@/features/song-queue/api/mutations.ts";
import { useNavigateToSongAlbum } from "@/features/songs/hooks/useNavigateToSongAlbum.ts";
import { Button } from "@/features/ui/button.tsx";
import { Slider } from "@/features/ui/slider.tsx";
import { IconTooltip, OverflowTooltip } from "@/features/ui/tooltip.tsx";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";
import { formatDuration } from "@/utils/formatDuration.ts";
import { ListMusic, MessageCircle, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

interface PlayerBarProps {
    onToggleQueue: () => void;
    isMutedFallback: boolean;
    onUnmute: () => void;
}
export function PlayerBar({ onToggleQueue, isMutedFallback, onUnmute }: PlayerBarProps) {
    const { playbackState } = usePlayback();
    const controller = usePlayerController();
    const playingCollectionSong = playbackState?.collectionSong;
    const { volume, setVolume, handleVolumeCommit, handleMuteToggle } = useVolume();
    const [seekDraftMs, setSeekDraftMs] = useState<number | null>(null);
    const nextMutation = useQueueNext();
    const prevMutation = useQueuePrev();
    const navigateToAlbum = useNavigateToSongAlbum();

    const calculateSongPosMs = useCalculateSongPosMs(playbackState);
    const displayMs = seekDraftMs ?? calculateSongPosMs;

    const handleSeek = useCallback((value: number[]) => setSeekDraftMs(value[0] * 1000), []);

    const handleSeekCommit = useCallback(
        (value: number[]) => {
            controller.applyUserSeek(value[0] * 1000);
            setSeekDraftMs(null);
        },
        [controller],
    );

    const playingSong = playingCollectionSong?.song;
    // be has 0 as duration when ffprobe fails to find out the real one
    const durationMs = playingSong?.duration_ms ?? 0;
    const hasDuration = durationMs > 0;

    return (
        <div className="flex h-20 items-center border-t border-foreground bg-card px-4 py-2">
            <div className="flex w-full items-center justify-between gap-4">
                {playingSong && (
                    <div className="flex min-w-0 items-center gap-3">
                        <MediaThumbnail
                            src={playingSong.image}
                            alt={playingSong.title}
                            className="size-14 shrink-0 border-2 border-foreground"
                        />
                        <div className="flex min-w-0 flex-col">
                            <OverflowTooltip label={playingSong.title}>
                                <button
                                    type="button"
                                    onClick={() => void navigateToAlbum(playingSong.uuid)}
                                    className="cursor-pointer truncate bg-transparent p-0 text-left text-sm font-bold hover:underline"
                                >
                                    {playingSong.title}
                                </button>
                            </OverflowTooltip>
                            <AuthorLinks
                                authors={playingCollectionSong.song.authors}
                                className="text-xs text-muted-foreground"
                            />
                        </div>
                    </div>
                )}

                <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
                    {playingCollectionSong && (
                        <div className="flex max-w-[350px] min-w-0 basis-1/2 items-center gap-1">
                            <span className="text-right text-xs">{formatDuration(displayMs)}</span>
                            {hasDuration && (
                                <>
                                    <Slider
                                        value={[displayMs / 1000]}
                                        min={0}
                                        max={durationMs / 1000}
                                        step={1}
                                        onValueChange={handleSeek}
                                        onValueCommit={handleSeekCommit}
                                        className="flex-1 cursor-pointer"
                                    />
                                    <span className="text-xs">{formatDuration(durationMs)}</span>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        <Button
                            onClick={() => prevMutation.mutate()}
                            variant="ghost"
                            size="icon"
                            aria-label="Previous"
                        >
                            <SkipBack className="size-5" strokeWidth="2" />
                        </Button>
                        <PlayerPlayButton />
                        <Button
                            onClick={() => nextMutation.mutate()}
                            variant="ghost"
                            size="icon"
                            aria-label="Next"
                        >
                            <SkipForward className="size-5" strokeWidth="2" />
                        </Button>
                        {isMutedFallback && (
                            // shown when audio is forced muted because no user gesture was
                            // available when playback started
                            // the unmute click is the fallback builds the AudioContext
                            <Button
                                onClick={onUnmute}
                                variant="ghost"
                                size="icon"
                                title="Tap to unmute on this device"
                                className="bg-highlight"
                            >
                                <VolumeX className="size-5" strokeWidth="2" />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={volume === 0 ? "Unmute" : "Mute"}
                            onClick={handleMuteToggle}
                            className="shrink-0"
                        >
                            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </Button>
                        <Slider
                            value={[volume]}
                            min={0}
                            max={100}
                            step={1}
                            // slider always passes an array (one entry per slider dot, we have 1)
                            onValueChange={(value) => setVolume(value[0])}
                            onValueCommit={handleVolumeCommit}
                            className="w-30 cursor-pointer"
                        />
                    </div>

                    {playingSong && (
                        <IconTooltip label="Show Comments" side="top">
                            <Button variant="ghost" size="icon" aria-label="Show Comments" asChild>
                                <Link to={`/songs/${playingSong.uuid}/comments`}>
                                    <MessageCircle />
                                </Link>
                            </Button>
                        </IconTooltip>
                    )}

                    <IconTooltip label="Queue" side="top">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Queue"
                            onClick={onToggleQueue}
                        >
                            <ListMusic />
                        </Button>
                    </IconTooltip>

                    <ChangeActiveDeviceDropdown />
                </div>
            </div>
        </div>
    );
}
